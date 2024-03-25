const pool = require("../../db");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const AWS = require("aws-sdk");
require("dotenv").config();
const { v4: uuidv4 } = require("uuid");

const { defaultLogger, createLogger } = require('../../logging/logger');
const therapistControllerLogger = createLogger('TherapistController');

const transporter = nodemailer.createTransport({
  SES: new AWS.SES({
    region: "us-west-1",
    accessKeyId: process.env.AWS_SES_KEY,
    secretAccessKey: process.env.AWS_SES_SECRET,
  }),
});

registerTherapist = (req, res) => {
  const { user_id, prompt } = req.body;
  const sign_up_token = uuidv4().replace(/-/g, '');
  therapistControllerLogger.info("body: ", req.body);
  const newTherapistId = uuidv4();
  pool.query(
    "INSERT INTO therapists (therapist_id, user_id, prompt, sign_up_token) VALUES (?, ?, ?, ?)",
    [newTherapistId, user_id, prompt, sign_up_token],
    (error, results) => {
      if (error) {
        return res
          .status(500)
          .json({ message: "Error creating therapist entry", error });
      }
      res.status(200).json({
        message: "therapist entry created",
        therapist_id: newTherapistId,
      });
    }
  );
};

updateClientLimit = (req, res) => {
  const stripeInfo = req.body.data.object;
  const customerEmail = stripeInfo.customer_details.email;
  const amountTotal = stripeInfo.amount_total;
  const therapistId = stripeInfo.client_reference_id;

  therapistControllerLogger.info('Therapist Id:', therapistId);
  therapistControllerLogger.info('Customer Email:', customerEmail);
  therapistControllerLogger.info('Amount Total:', amountTotal);

  if (!therapistId) {
    return res.status(400).send('Client reference ID not provided');
  }
  
  let clientLimit = 0;
  
  if (amountTotal >= 12000) {
    clientLimit = 999;
  } else if (amountTotal >= 10000) {
    clientLimit = 7;
  } else if (amountTotal >= 6600) {
    clientLimit = 5;
  } else if (amountTotal >= 2500) {
    clientLimit = 3;
  }
  
  pool.query(
    "UPDATE therapists SET client_limit = ? WHERE therapist_id = ?",
    [clientLimit, therapistId],
    (error, results) => {
      if (error) {
        return res.status(500).send('Server error');
      }
  
      therapistControllerLogger.info('Client Limit updated to:', clientLimit);
    }
  );
  
  res.send();
};

retrieveTherapistClientLimit = async (req, res) => {
  const therapistId = req.therapistId;
  try {
    const clientCountResult = await new Promise((resolve, reject) => {
      pool.query(
        "SELECT COUNT(*) AS clientCount FROM clients WHERE therapist_id = ?",
        [therapistId],
        (error, results) => {
          if (error) {
            reject(new Error(`Error fetching client count: ${error.message}`));
          } else {
            resolve(results[0].clientCount);
          }
        }
      );
    });

    pool.query(
      "SELECT client_limit FROM therapists WHERE therapist_id = ?",
      [therapistId],
      (error, results) => {
        if (error) {
          return res.status(500).send("Error fetching therapist client limit");
        }
        res.status(200).json({
          client_limit: results[0].client_limit,
          client_count: clientCountResult
        });
      }
    );
  } catch (error) {
    return res.status(500).send(`Error: ${error.message}`);
  }
};

createTherapistSubscription = (req, res) => {
  const stripeInfo = req.body.data.object;
  const therapistId = stripeInfo.client_reference_id;
  const customerId = stripeInfo.customer;
  const customerName = stripeInfo.customer_details.name;
  const amountTotal = stripeInfo.amount_total;
  const subscriptionId = stripeInfo.subscription;

  pool.query(
    'INSERT INTO subscriptions (therapist_id, customer_id, name, amount, subscription_id) VALUES (?, ?, ?, ?, ?)',
    [therapistId, customerId, customerName, amountTotal, subscriptionId],
    (error, results) => {
      if (error) {
        therapistControllerLogger.error('Error adding subscription:', error);
        return res.status(500).send('Server error');
      }
      therapistControllerLogger.info('Subscription successfully added');
    }
  );

  res.send();
  
}

updateClientNotes = (req, res) => {
  const { userId, notes } = req.body;

  therapistControllerLogger.info(
    `UPDATE clients SET notes = ${notes} WHERE user_id = ${userId} AND therapist_id = ${req.therapistId}`
  );

  pool.query(
    "UPDATE clients SET notes = ? WHERE user_id = ? AND therapist_id = ?",
    [notes, userId, req.therapistId],
    (error, results) => {
      if (error) {
        return res
          .status(500)
          .json({ message: "Error updating client notes", error });
      }
      res.status(200).json({ message: "client notes updated" });
    }
  );
};

retrieveTherapistDetails = (req, res) => {
  const therapistId = req.therapistId;

  therapistControllerLogger.info("therapistId: ", therapistId);

  pool.query(
    `SELECT therapists.therapist_id, therapists.prompt, therapists.sign_up_token, users.name, users.email, users.age, users.profile_picture FROM therapists
    JOIN users ON therapists.user_id = users.id
    WHERE therapists.therapist_id = ?`,
    [therapistId],
    (error, results) => {
      if (error) {
        return res.status(500).json({ error: error.message });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "Therapist not found" });
      }

      res.status(200).json(results[0]);
    }
  );
};

generateProfilePictureUploadUrl = (req, res) => {
  const { fileType } = req.body;

  const fileName = `ProfilePictures/${req.therapistId}Therapist`;

  const s3Params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: fileName,
    Expires: 60,
    ContentType: fileType,
  };

  s3.generateProfilePictureUploadUrl(
    "putObject",
    s3Params,
    (err, signedUrl) => {
      if (err) {
        therapistControllerLogger.info(err);
        return res.status(500).send("Cannot create S3 signed URL");
      }

      res.status(200).json({ signedUrl });
    }
  );
};

changeTherapistProfilePicture = (req, res) => {
  const { profile_picture } = req.body;
  const therapistId = req.therapistId;

  therapistControllerLogger.info("profilePicture: ", profile_picture);

  pool.query(
    `UPDATE users SET profile_picture = ? WHERE id = (SELECT user_id FROM therapists WHERE therapist_id = ?)`,
    [profile_picture, therapistId],
    (error, results) => {
      if (error) {
        return res.status(500).json({ error: error.message });
      }

      res.status(200).json({ message: "Profile picture updated" });
    }
  );
};

modifyTherapistProfile = (req, res) => {
  const { name, email, prompt } = req.body;
  const therapistId = req.therapistId;

  pool.query(
    `UPDATE users SET name = ?, email = ? WHERE id = (SELECT user_id FROM therapists WHERE therapist_id = ?)`,
    [name, email, therapistId],
    (error, results) => {
      if (error) {
        return res.status(500).json({ error: error.message });
      }

      pool.query(
        `UPDATE therapists SET prompt = ? WHERE therapist_id = ?`,
        [prompt, therapistId],
        (error, results) => {
          if (error) {
            return res.status(500).json({ error: error.message });
          }

          res.status(200).json({ message: "Profile updated" });
        }
      );
    }
  );
};

retrieveTherapistPreferences = (req, res) => {
  const therapistId = req.therapistId;
  pool.query(
    "SELECT * FROM settings WHERE therapist_id = ?",
    [therapistId],
    (error, results) => {
      if (error) {
        return res.status(500).send("Error fetching therapist settings");
      }
      res.status(200).json(results[0]);
    }
  );
};

function generatePrompt(data) {
  // Check if therapeutic_approach is empty and replace it with "No single therapeutic"
const approach = data.therapeutic_approach === "" ? "mixed" : data.therapeutic_approach;

return `I am a therapist with a ${approach} approach. 

As my AI assistant, your role is to prepare me for upcoming sessions by summarizing my clients' recent journal entries. Your job is to generate a tailored to align with the principles and objectives of the ${approach} approach I practice. Please emphasize themes and insights that resonate with this approach, aiding me in understanding my client's life experiences and emotional journey comprehensively.

Given your familiarity with my therapeutic preferences, I trust you to determine the most relevant aspects of my client's experiences to highlight. This means selecting details that I, given my approach and values, would find most significant in supporting my client's therapeutic progress.

Avoid saying anything other than details of the summary. Avoid temporal references that could cause confusion, such as 'today.' Instead, use 'During this period' to denote the timeframe of the journal entries. If any part of your summary directly references these entries, please indicate so with in-text citations in the format [id, id, id], ensuring I can trace insights back to specific journal contributions.

Please provide the summary in a bullet point format, with each bullet point representing a key theme, insight or aspect of the summary. Seperate bullet points using '\\n' Ensure that the bullet points are concise yet informative, allowing me to quickly grasp the main points without losing essential context.

Here are my client's recent journal entries:`;
}

storeTherapistPreferences = (req, res) => {
  const therapistId = req.therapistId;
  const data = req.body;
  const prompt = generatePrompt(data);

  therapistControllerLogger.info("prompt: ", prompt);

  pool.query(
    "SELECT * FROM settings WHERE therapist_id = ?",
    [therapistId],
    (error, results) => {
      if (error) {
        return res.status(500).send("Error checking existing settings");
      }

      let query;
      let params;
      if (results.length > 0) {
        query = "UPDATE settings SET ? WHERE therapist_id = ?";
        params = [data, therapistId];
      } else {
        query = "INSERT INTO settings SET ?";
        params = {
          ...data,
          therapist_id: therapistId,
        };
      }

      pool.query(query, params, (error, results) => {
        if (error) {
          return res.status(500).send("Error updating therapist settings");
        }

        pool.query(
          "UPDATE therapists SET prompt = ? WHERE therapist_id = ?",
          [prompt, therapistId],
          (error, results) => {
            if (error) {
              return res.status(500).send("Error updating therapist prompt");
            }
            res.status(200).send("Settings and prompt updated successfully");
          }
        );
      });
    }
  );
};

fetchTherapistSignUpCode = (req, res) => {
  const therapistId = req.therapistId;

  therapistControllerLogger.info("therapistId: ", therapistId);

  pool.query(
    "SELECT sign_up_token FROM therapists WHERE therapist_id = ?",
    [therapistId],
    (error, results) => {
      if (error) {
        return res
          .status(500)
          .json({ message: "Error finding therapist", error });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "Therapist not found" });
      }

      res.status(200).json({
        message: "Therapist found",
        fetchTherapistSignUpCode: results[0].sign_up_token,
      });
    }
  );
};

sendClientInviteLink = async (req, res) => {
  const therapistId = req.therapistId;
  const { email } = req.body;

  try {
    // Check current client count
    const clientCountResult = await new Promise((resolve, reject) => {
      pool.query(
        "SELECT COUNT(*) AS clientCount FROM clients WHERE therapist_id = ?",
        [therapistId],
        (error, results) => {
          if (error) {
            reject(new Error(`Error fetching client count: ${error.message}`));
          } else {
            resolve(results[0].clientCount);
          }
        }
      );
    });

    therapistControllerLogger.info(`Client count for therapist ${therapistId}: ${clientCountResult}`);

    // Fetch the client limit
    const clientLimitResult = await new Promise((resolve, reject) => {
      pool.query(
        "SELECT client_limit FROM therapists WHERE therapist_id = ?",
        [therapistId],
        (error, results) => {
          if (error) {
            reject(new Error(`Error fetching client limit: ${error.message}`));
          } else if (results.length === 0) {
            reject(new Error("Therapist not found"));
          } else {
            resolve(results[0].client_limit);
          }
        }
      );
    });

    therapistControllerLogger.info(`Client limit for therapist ${therapistId}: ${clientLimitResult}`);

    // Check if client count exceeds the limit
    if (clientCountResult >= clientLimitResult) {
      return res.status(400).json({ message: `You've reached the client limit on the free plan. <a href='https://buy.stripe.com/3cs00U1h7a3H8Ks8wB' target='_blank' rel='noopener noreferrer'>Click here</a> to add more seats! Hurry! As an early adopter, you will choose what you pay per seat!` });
  }
  

    // Query to get therapist's details
    const therapistResult = await new Promise((resolve, reject) => {
      pool.query(
        "SELECT t.sign_up_token, u.name AS therapist_name FROM therapists t JOIN users u ON t.user_id = u.id WHERE t.therapist_id = ?",
        [therapistId],
        (error, results) => {
          if (error) {
            reject(new Error(`Error fetching therapist's details: ${error.message}`));
          } else {
            resolve(results);
          }
        }
      );
    });

    if (therapistResult.length === 0) {
      return res.status(404).json({ message: "Therapist not found" });
    }

    therapistControllerLogger.info("therapistResult: ", therapistResult[0]);
    const signUpToken = therapistResult[0].sign_up_token;
    const therapistName = therapistResult[0].therapist_name;

    const token = crypto.randomBytes(20).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await new Promise((resolve, reject) => {
      pool.query(
        "INSERT INTO sign_up_client_tokens (therapist_id, token, expires_at, email) VALUES (?, ?, ?, ?)",
        [therapistId, token, expiresAt, email],
        (error, results) => {
          if (error) {
            reject(new Error(`Error inserting sign-up token: ${error.message}`));
          } else {
            resolve(results);
          }
        }
      );
    });

    const inviteLink = `${process.env.FRONT_END_URL}/sign-up-client/${signUpToken}/${token}`;

    const mailOptions = {
      from: process.env.SES_EMAIL,
      to: email,
      subject: `Congratulations! ${therapistName} has invited you to Empath!`,
      html: `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to Empath!</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    color: #333;
                }
                .container {
                    width: 100%;
                    max-width: 600px;
                    margin: 20px auto;
                    padding: 20px;
                    background-color: #f8f8f8;
                    border: 1px solid #eee;
                    border-radius: 5px;
                }
                .button-container {
                    text-align: center;
                }
                a.button {
                    display: inline-block;
                    padding: 10px 20px;
                    margin: 20px 0;
                    color: #fff;
                    background-color: #007bff;
                    border-radius: 5px;
                    text-decoration: none;
                    font-weight: bold;
                }
                .footer {
                    margin-top: 20px;
                    text-align: center;
                    font-size: 0.9em;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>Welcome to Empath!</h2>
                <p>Hello!</p>
                <p>${therapistName} has personally invited you to join Empath to elevate your therapeutic journey. We are thrilled to welcome you to Empath!</p>
                <div class="button-container">
                    <a href="${inviteLink}" class="button">Sign up now</a>
                </div>
                <div class="footer">
                    <p>Looking forward to your journey with us,<br>Empath Team</p>
                </div>
            </div>
        </body>
        </html>`,
    };

    await new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          reject(error);
        } else {
          therapistControllerLogger.info("Email sent: ", info.response);
          resolve(info);
        }
      });
    });

    res
      .status(200)
      .json({ message: "Invite link sent successfully", link: inviteLink });

    } catch (error) {
      therapistControllerLogger.error("Error in sendClientInviteLink: ", error);
      res.status(500).json({
        message: "Error processing invite link request",
        error: error.message,
      });
  }
};

getTheripistIdBySignupCode = async (req, res) => {
  const signUpCode = req.params.signUpCode;

  pool.query(
    "SELECT therapist_id FROM therapists WHERE sign_up_token = ?",
    [signUpCode],
    (error, results) => {
      if (error) {
        return res.status(500).send('Server error');
      }

      if (results.length === 0) {
        return res.status(404).send('Therapist not found');
      }

      const therapistId = results[0].therapist_id;
      res.json({ therapist_id: therapistId });
    }
  );
};

validateAccessKey = async (req, res) => {
  try {
    const { accessKey } = req.body;

    const isValid = process.env.ACCESS_KEY === accessKey;

    if (isValid) {
      res.status(200).json({ message: "Access key is valid" });
    } else {
      res.status(401).json({ message: "Access key is invalid" });
    }
  } catch (error) {
    therapistControllerLogger.error("Error validating access key: ", error);
    res.status(500).json({
      message: "Error validating access key",
      error: error.message,
    });
  }
};

module.exports = {
  registerTherapist,
  updateClientNotes,
  retrieveTherapistDetails,
  generateProfilePictureUploadUrl,
  changeTherapistProfilePicture,
  modifyTherapistProfile,
  retrieveTherapistPreferences,
  storeTherapistPreferences,
  associateClientWithTherapist,
  fetchTherapistSignUpCode,
  sendClientInviteLink,
  getTheripistIdBySignupCode,
  updateClientLimit, 
  validateAccessKey,
  retrieveTherapistClientLimit,
  createTherapistSubscription,
};
