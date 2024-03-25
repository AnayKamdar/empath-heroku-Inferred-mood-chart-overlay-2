const pool = require("../../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const saltRounds = 15;
const axios = require("axios");
const { dataEncryption, dataDecryption } = require('../../middleware/Auth/Encryption/encrypt');
const crypto = require('crypto');
const { exec } = require("child_process");
const path = require("path");
const { v4: uuidv4 } = require('uuid');
const { defaultLogger, createLogger } = require('../../logging/logger');
const therapistLogger = createLogger('UsersController');

let loginStartTime = 0;
let dashboardAccessStartTime = 0;

changeUserPassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  // Use therapistId from JWT token to identify the user
  const therapistId = req.therapistId;

  //get userId
  const userId = req.userId;

  //confirm user is a therapist 
  if (!therapistId) {
    return res.status(403).json({ message: "Unauthorized: Not a therapist" });
  }

  try {
    //query to find users with the id
    pool.query("SELECT * FROM users WHERE id = ?", [userId],
    //results
    async(error, results) =>{
      //error check for if the query result is empty
      if(results.length === 0){
        return res.status(404).json({ message: "Therapist user not found" });
      }

      //compare the currentPassword input with the users current password 
      const match = await bcrypt.compare(currentPassword, results[0].password_hash);
      //error check for if passwords do not match
      if (!match) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      //hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      //update the users password to the new one
      await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [hashedNewPassword, results[0].id]);
    
    res.json({ message: "Password successfully updated" });
    }
    );
  } catch (error) {
    therapistLogger.error("Error changing password:", error);
    res.status(500).json({ message: "Internal server error" });
  }
  
};

unlinkClientFromTherapist = async (req, res) => {
  const userId = req.body.userId;
  const therapistId = req.therapistId;

  pool.query(
    "UPDATE clients SET therapist_id = NULL WHERE user_id = ? AND therapist_id = ?",
    [userId, therapistId],
    (error, results) => {
      if (error) {
        return res.status(500).json({ message: "Error unlinking client from therapist", error });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ message: "Client not found for the specified therapist" });
      }

      res.status(200).json({ message: "Client unlinked from therapist successfully" });
    }
  );
};


fetchAllUsers = (req, res) => {
  pool.query("SELECT * FROM users", (error, results) => {
    if (error) {
      return res.status(500).json({ message: "Error fetching users", error });
    }
    res.json(results);
  });
};

fetchUserDetailsById = (req, res) => {
  const userId = req.params.id;
  pool.query("SELECT * FROM users WHERE id = ?", [userId], (error, results) => {
    if (error) {
      return res.status(500).json({ message: "Error fetching user", error });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(results[0]);
  });
};

registerNewUser = async (req, res) => {
  try {
    therapistLogger.info("Created user called");
    therapistLogger.info(req.body);

    pool.query(
      "SELECT * FROM users WHERE email = ?",
      [req.body.email],
      async (error, results) => {
        if (error) {
          return res
            .status(500)
            .json({ message: "Error checking email", error });
        }

        if (results.length > 0) {
          therapistLogger.info("Email already in use");
          return res.status(409).json({ message: "Email already in use" });
        }

        const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
        const rand = crypto.randomBytes(16); 
        iv = rand.toString('hex')
        const newUserId = uuidv4();
        const userData = {
          id: newUserId,
          name: req.body.name,
          email: req.body.email,
          age: req.body.age,
          password_hash: hashedPassword,
          IV: iv,
        };

        pool.query(
          "INSERT INTO users SET ?",
          userData,
          async (insertError, insertResults) => {
            if (insertError) {
              return res
                .status(500)
                .json({ message: "Error creating user", insertError });
            }

            const token = jwt.sign(
              { userId: newUserId },
              process.env.JSON_WEB_TOKEN_SECRET
            );

            res.status(200).json({
              message: "User created successfully",
              userId: newUserId,
              token: token,
            });
          }
        );
      }
    );
  } catch (error) {
    therapistLogger.error("Error during user creation:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

registerNewUserForClients = async (req, res) => {
  try {
    therapistLogger.info("Creating user for client called");
    therapistLogger.info(req.body);
    const { email, token } = req.body;

    pool.query(
      "SELECT * FROM sign_up_client_tokens WHERE token = ? AND email = ? AND used = 0 AND expires_at > NOW()",
      [token, email],
      async (tokenError, tokenResults) => {
        if (tokenError) {
          return res
            .status(500)
            .json({ message: "Error checking token", tokenError });
        }

        if (tokenResults.length === 0) {
          therapistLogger.info("Invalid or expired token");
          return res.status(401).json({ message: "Invalid or expired token" });
        }

        pool.query(
          "SELECT * FROM users WHERE email = ?",
          [req.body.email],
          async (emailError, emailResults) => {
            if (emailError) {
              return res
                .status(500)
                .json({ message: "Error checking email", emailError });
            }

            if (emailResults.length > 0) {
              therapistLogger.info("Email already in use");
              return res.status(409).json({ message: "Email already in use" });
            }

            const hashedPassword = await bcrypt.hash(
              req.body.password,
              saltRounds
            );
            
            const rand = crypto.randomBytes(16); 
            iv = rand.toString('hex')
            const newUserId = uuidv4();
            const userData = {
              id: newUserId,
              name: req.body.name,
              email: req.body.email,
              age: req.body.age,
              password_hash: hashedPassword,
              IV: iv,
            };
            pool.query(
              "INSERT INTO users SET ?",
              userData,
              async (insertError, insertResults) => {
                if (insertError) {
                  return res
                    .status(500)
                    .json({ message: "Error creating user", insertError });
                }

                pool.query(
                  "UPDATE sign_up_client_tokens SET used = 1 WHERE token = ?",
                  [req.headers.authorization],
                  (updateError, updateResults) => {
                    if (updateError) {
                      therapistLogger.info(
                        "Error updating token used status:",
                        updateError
                      );
                    }
                  }
                );

                const token = jwt.sign(
                  { userId: newUserId },
                  process.env.JSON_WEB_TOKEN_SECRET
                );

                res.status(200).json({
                  message: "User created successfully for client",
                  userId: newUserId,
                  token: token,
                });
              }
            );
          }
        );
      }
    );
  } catch (error) {
    therapistLogger.error("Error during client user creation:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

authenticateUserLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    therapistLogger.info("authenticateUserLogin called", email, password);

    pool.query(
      "SELECT * FROM users WHERE email = ?",
      [email],
      async (error, results) => {
        if (error) {
          return res.status(500).json({ message: "Error logging in", error });
        }

        if (results.length === 0) {
          return res.status(404).json({ message: "User not found" });
        }

        const user = results[0];
        const match = await bcrypt.compare(password, user.password_hash);

        if (!match) {
          return res.status(401).json({ message: "Invalid email or password" });
        }

        pool.query(
          "SELECT client_id FROM clients WHERE user_id = ?",
          [user.id],
          (error, clientResults) => {
            if (error) {
              return res
                .status(500)
                .json({ message: "Error fetching client info", error });
            }

            if (clientResults.length === 0) {
              return res
                .status(404)
                .json({ message: "Client not found for user" });
            }

            const clientId = clientResults[0].client_id;

            const token = jwt.sign(
              { userId: user.id, clientId: clientId },
              process.env.JSON_WEB_TOKEN_SECRET
            );

            // Right after successful authentication and before sending the login success response
            loginStartTime = Date.now();
            defaultLogger.info(`User logged in at ${new Date(loginStartTime).toISOString()}`);

            res.status(200).json({
              message: "Logged in successfully",
              token: token,
            });
          }
        );
      }
    );
  } catch (error) {
    therapistLogger.error("Error during user login:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

authenticateDashboardAccess = async (req, res) => {
  try {
    const { email, password } = req.body;
    const jwtExpirySeconds = 3600 * 2;
    therapistLogger.info("authenticateDashboardAccess called", email, password);

    pool.query(
      "SELECT * FROM users WHERE email = ?",
      [email],
      async (error, results) => {
        if (error) {
          return res.status(500).json({ message: "Error logging in", error });
        }

        if (results.length === 0) {
          return res.status(404).json({ message: "User not found" });
        }

        const user = results[0];
        const match = await bcrypt.compare(password, user.password_hash);

        if (!match) {
          return res.status(401).json({ message: "Invalid email or password" });
        }

        pool.query(
          "SELECT therapist_id FROM therapists WHERE user_id = ?",
          [user.id],
          (error, therapistResults) => {
            if (error) {
              return res
                .status(500)
                .json({ message: "Error fetching therapist info", error });
            }

            let therapistId = null;
            if (therapistResults.length > 0) {
              therapistId = therapistResults[0].therapist_id;
            }

            // Check if the user is a therapist
            if (!therapistId) {
              return res
                .status(403)
                .json({ message: "Access denied: Not a therapist" });
            }

            // User is a therapist, proceed with token generation
            const token = jwt.sign(
              {
                userId: user.id,
                therapistId: therapistId,
              },
              process.env.JSON_WEB_TOKEN_SECRET,
              { expiresIn: jwtExpirySeconds }
            );

            res.cookie("token", token, {
              maxAge: jwtExpirySeconds * 1000,
              httpOnly: true,
            });

            // Right after verifying the therapist and before sending the success response
            dashboardAccessStartTime = Date.now();
            therapistLogger.info(`Therapist accessed the dashboard at ${new Date(dashboardAccessStartTime).toISOString()}`);
            res.json({
              message: "Logged in successfully",
              token: token,
            });
          }
        );
      }
    );
  } catch (error) {
    therapistLogger.error("Error during user login:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

fetchTherapistClients = async (req, res) => {
  try {
    const therapistId = req.therapistId;

    therapistLogger.info("fetchTherapistClients called", therapistId);

    const query = `
      SELECT u.id, u.name, u.age, u.email, u.profile_picture, c.notes, c.last_visited
      FROM users u
      JOIN clients c ON u.id = c.user_id
      WHERE c.therapist_id = ?
    `;

    pool.query(query, [therapistId], (error, results) => {
      if (error) {
        return res
          .status(500)
          .json({ message: "Error fetching client info", error });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "Client not found for user" });
      }

      res.status(200).json(results);
    });
  } catch (error) {
    therapistLogger.error("Error during user login:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

retrieveClientJournalEntries = async (req, res) => {
  const { userId, startDate, endDate } = req.body;
  const therapistId = req.therapistId;

  pool.query(
    "SELECT * FROM clients WHERE user_id = ? AND therapist_id = ?",
    [userId, therapistId],
    (error, clientResults) => {
      if (error) {
        return res
          .status(500)
          .json({ message: "Error checking client association", error });
      }

      if (clientResults.length === 0) {
        return res
          .status(403)
          .json({ message: "User is not associated with this therapist." });
      }
      const clientId = clientResults[0].client_id;
      pool.query(
        "SELECT IV FROM EmPath.users WHERE id = ?",
        [userId],
        (error, returned) => {
          if (error) {
            return res
              .status(500)
              .json({ message: "Error fetching IV from user", error });
          }
          if (!returned[0]) {
            return res.status(404).json({ message: "User not found" });
          }

          const IV = returned[0].IV;
          if (IV !== null && IV !== undefined && IV !== "") {
            pool.query(
              "SELECT * FROM journals WHERE client_id = ? AND (DATE(created_at) >= ? AND DATE(created_at) <= ?) AND isShared = 1",
              [clientId, startDate, endDate],
              (error, journalResults) => {
                if (error) {
                  return res
                    .status(500)
                    .json({
                      message: "Error fetching journals for client",
                      error,
                    });
                }
                if (journalResults.length === 0) {
                  return res
                    .status(404)
                    .json({ message: "No journals found for this client" });
                }
                therapistLogger.info("journalResults", journalResults);
                for (let i = 0; i < journalResults.length; i++) {
                  decryptedJ = dataDecryption(
                    journalResults[i].EncryptedJournal,
                    IV
                  );
                  const [
                    text,
                    title,
                    mood_trigger,
                    feelingString,
                    intensityString,
                    approach_withdrawalString, 
                    platform,
                    voice_journal_path,
                  ] = decryptedJ;
                  const feeling = parseFloat(feelingString);
                  const intensity = parseFloat(intensityString);
                  const approach_withdrawal = parseFloat(approach_withdrawalString); 
                  journalResults[i] = {
                    journal_id: journalResults[i].journal_id,
                    client_id: journalResults[i].client_id,
                    title: title,
                    text: text,
                    feeling: feeling,
                    intensity: intensity,
                    approach_withdrawal: approach_withdrawal, 
                    mood_trigger: mood_trigger,
                    platform: platform,
                    voice_journal_path: voice_journal_path,
                    created_at: journalResults[i].created_at,
                    updated_at: journalResults[i].updated_at,
                    entry_date: journalResults[i].entry_date,
                    isShared: journalResults[i].isShared,
                  };
                }
                res.status(200).json(journalResults);
              }
            );
          }
        }
      );
    }
  );
};

generateClientJournalSummary = async (req, res) => {
  const { userId, startDate, endDate } = req.body;
  const therapistId = req.therapistId;

  pool.query(
    "SELECT * FROM clients WHERE user_id = ? AND therapist_id = ?",
    [userId, therapistId],
    async (error, clientResults) => {
      if (error) {
        return res
          .status(500)
          .json({ message: "Error checking client association", error });
      }

      if (clientResults.length === 0) {
        return res
          .status(403)
          .json({ message: "User is not associated with this therapist." });
      }

      const clientId = clientResults[0].client_id;

      pool.query(
        "SELECT prompt FROM therapists WHERE therapist_id = ?",
        [therapistId],
        async (error, therapistResults) => {
          if (error) {
            therapistLogger.error(error);
            return res
              .status(500)
              .json({ message: "Error fetching therapist prompt", error });
          }

          if (therapistResults.length === 0) {
            return res
              .status(404)
              .json({ message: "No therapist found with the given ID." });
          }

          const prompt = therapistResults[0].prompt;

          pool.query(
            "SELECT IV FROM EmPath.users WHERE id = ?",
            [userId],
            (error, returned) => {
              if (error) {
                return res
                  .status(500)
                  .json({ message: "Error fetching IV from user", error });
              }
              if (!returned[0]) {
                return res.status(404).json({ message: "User not found" });
              }

              const IV = returned[0].IV;
              if (IV !== null && IV !== undefined && IV !== "") {
                pool.query(
                  "SELECT * FROM journals WHERE client_id = ? AND (DATE(created_at) >= ? AND DATE(created_at) <= ?) AND isShared = 1",
                  [clientId, startDate, endDate],
                  async (error, journalResults) => {
                    if (error) {
                      return res.status(500).json({
                        message: "Error fetching journals for summary",
                        error,
                      });
                    }
                    if (journalResults.length === 0) {
                      return res
                        .status(404)
                        .json({ message: "No journals found" });
                    }
                    for (let i = 0; i < journalResults.length; i++) {
                      decryptedJ = dataDecryption(
                        journalResults[i].EncryptedJournal,
                        IV
                      );
                      const [
                        text,
                        title,
                        mood_trigger,
                        feelingString,
                        intensityString,
                        platform,
                        voice_journal_path,
                      ] = decryptedJ;
                      const feeling = parseFloat(feelingString);
                      const intensity = parseFloat(intensityString);
                      journalResults[i] = {
                        journal_id: journalResults[i].journal_id,
                        client_id: journalResults[i].client_id,
                        title: title,
                        text: text,
                        feeling: feeling,
                        intensity: intensity,
                        mood_trigger: mood_trigger,
                        platform: platform,
                        voice_journal_path: voice_journal_path,
                        created_at: journalResults[i].created_at,
                        updated_at: journalResults[i].updated_at,
                        entry_date: journalResults[i].entry_date,
                        isShared: journalResults[i].isShared,
                      };
                    }

                    let combinedJournals = "";
let counter = 1; // Initialize the counter to start from 1
let journalIdMap = {}; // Map to hold new IDs to original journal IDs

for (let journal of journalResults) {
  if ((combinedJournals + journal.text).length < 500000) {
    combinedJournals +=
      "Journal id: " +
      counter + // Use the counter as the journal ID in the output
      "\n" +
      journal.text +
      "\n\n";
    journalIdMap[counter] = journal.journal_id; // Map the counter to the original journal_id
    counter++; // Increment the counter for the next journal
  } else {
    break;
  }
}



                    therapistLogger.info(
                      "combinedJournals",
                      `${prompt} ${combinedJournals}`
                    );
                    therapistLogger.info(
                      "combinedJournals length",
                      combinedJournals.length
                    );
                    therapistLogger.info("making request to OpenAI API");

                    try {
                      const response = await axios.post(
                        "https://api.groq.com/openai/v1/chat/completions",
                        {
                          model: "mixtral-8x7b-32768",
                          messages: [
                            {
                              role: "user",
                              content: `${prompt}:\n${combinedJournals}`,
                            },
                          ],
                          temperature: 0.7,
                        },
                        {
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                          },
                        }
                      );

                      const messages = response.data.choices[0].message.content;
                      const bulletPoints = messages.split('\n- ').filter(point => point.trim() !== '');
                      res.json({ 
                        summary: bulletPoints,
                        journalIdMap: journalIdMap // Include the journalIdMap in the response
                      });
                    } catch (apiError) {
                      therapistLogger.error(
                        "Error fetching summary from OpenAI:",
                        apiError
                      );
                      res
                        .status(500)
                        .json({ message: "Internal Server Error" });
                    }
                  }
                );
              }
            }
          );
        }
      );
    }
  );
};

generateTopicWords = async (req, res) => {
  const { userId, startDate, endDate } = req.body;
  const therapistId = req.therapistId;

  pool.query(
    "SELECT * FROM clients WHERE user_id = ? AND therapist_id = ?",
    [userId, therapistId],
    async (error, clientResults) => {
      if (error) {
        return res
          .status(500)
          .json({ message: "Error checking client association", error });
      }

      if (clientResults.length === 0) {
        return res
          .status(403)
          .json({ message: "User is not associated with this therapist." });
      }

      const clientId = clientResults[0].client_id;

      pool.query(
        "SELECT IV FROM EmPath.users WHERE id = ?",
        [userId],
        (error, returned) => {
          if (error) {
            return res
              .status(500)
              .json({ message: "Error fetching IV from user", error });
          }
          if (!returned[0]) {
            return res.status(404).json({ message: "User not found" });
          }

          const IV = returned[0].IV;
          if (IV !== null && IV !== undefined && IV !== "") {
            pool.query(
              "SELECT * FROM journals WHERE client_id = ? AND (created_at BETWEEN ? AND ?) AND isShared = 1 ORDER BY entry_date DESC",
              [clientId, startDate, endDate],
              async (error, journalResults) => {
                if (error) {
                  return res.status(500).json({
                    message: "Error fetching journals for summary",
                    error,
                  });
                }
                if (journalResults.length === 0) {
                  return res
                    .status(404)
                    .json({ message: "No journals found for this client" });
                }
                for (let i = 0; i < journalResults.length; i++) {
                  decryptedJ = dataDecryption(
                    journalResults[i].EncryptedJournal,
                    IV
                  );
                  const [
                    text,
                    title,
                    mood_trigger,
                    feelingString,
                    intensityString,
                    platform,
                    voice_journal_path,
                  ] = decryptedJ;
                  const feeling = parseFloat(feelingString);
                  const intensity = parseFloat(intensityString);
                  journalResults[i] = {
                    journal_id: journalResults[i].journal_id,
                    client_id: journalResults[i].client_id,
                    title: title,
                    text: text,
                    feeling: feeling,
                    intensity: intensity,
                    mood_trigger: mood_trigger,
                    platform: platform,
                    voice_journal_path: voice_journal_path,
                    created_at: journalResults[i].created_at,
                    updated_at: journalResults[i].updated_at,
                    entry_date: journalResults[i].entry_date,
                    isShared: journalResults[i].isShared,
                  };
                }

                const journalText = journalResults.map((entry) => entry.text);
                const jsonInput = JSON.stringify(journalText);
                const ldaPath = "TopicWords";
                const lda = path.join(ldaPath, "testLDA.py");
                const pythonVersion = "3.11";
                const command = `python${pythonVersion} ${lda}`;

                const child = exec(command, (error, stdout, stderr) => {
                  if (error) {
                    therapistLogger.error(`Error: ${error.message}`);
                    res.status(500).json({ error: "Internal Server Error" });
                    return;
                  }

                  const topicsJournal = JSON.parse(stdout);

                  res.status(200).json({ topicsJournal });
                });

                child.stdin.write(jsonInput);
                child.stdin.end();
              }
            );
          }
        }
      );
    }
  );
};

generate_Feeling_Mood = async (req, res) => {
  const { userId, startDate, endDate } = req.body;
  const therapistId = req.therapistId;

  pool.query(
    "SELECT * FROM clients WHERE user_id = ? AND therapist_id = ?",
    [userId, therapistId],
    async (error, clientResults) => {
      if (error) {
        return res
          .status(500)
          .json({ message: "Error checking client association", error });
      }

      if (clientResults.length === 0) {
        return res
          .status(403)
          .json({ message: "User is not associated with this therapist." });
      }

      const clientId = clientResults[0].client_id;

      pool.query(
        "SELECT IV FROM EmPath.users WHERE id = ?",
        [userId],
        (error, returned) => {
          if (error) {
            return res
              .status(500)
              .json({ message: "Error fetching IV from user", error });
          }
          if (!returned[0]) {
            return res.status(404).json({ message: "User not found" });
          }

          const IV = returned[0].IV;
          if (IV !== null && IV !== undefined && IV !== "") {
            pool.query(
              "SELECT * FROM journals WHERE client_id = ? AND (created_at BETWEEN ? AND ?) AND isShared = 1 ORDER BY entry_date DESC",
              [clientId, startDate, endDate],
              async (error, journalResults) => {
                if (error) {
                  return res.status(500).json({
                    message: "Error fetching journals for summary",
                    error,
                  });
                }
                if (journalResults.length === 0) {
                  return res
                    .status(404)
                    .json({ message: "No journals found for this client" });
                }

                for (let i = 0; i < journalResults.length; i++) {
                  const decryptedJ = dataDecryption(
                    journalResults[i].EncryptedJournal,
                    IV
                  );
                  const [
                    text,
                    title,
                    mood_trigger,
                    feelingString,
                    intensityString,
                    platform,
                    voice_journal_path,
                  ] = decryptedJ;

                  const feeling = parseFloat(feelingString);
                  const intensity = parseFloat(intensityString);

                  // Log the feeling and intensity values here
                  // console.log(`Journal ID: ${journalResults[i].journal_id}, Feeling: ${feeling}, Intensity: ${intensity}`);

                  journalResults[i] = {
                    journal_id: journalResults[i].journal_id,
                    client_id: journalResults[i].client_id,
                    title: title,
                    text: text,
                    feeling: feeling,
                    intensity: intensity,
                    mood_trigger: mood_trigger,
                    platform: platform,
                    voice_journal_path: voice_journal_path,
                    created_at: journalResults[i].created_at,
                    updated_at: journalResults[i].updated_at,
                    entry_date: journalResults[i].entry_date,
                    isShared: journalResults[i].isShared,
                  };
                }

                const journalText = journalResults.map((entry) => entry.text);
                const jsonInput = JSON.stringify(journalText);
                const ldaPath = "Feeling-Mood-NLP"; // Adjust your path accordingly
                const lda = path.join(ldaPath, "vaderScr.py");
                const pythonVersion = "3.11"; // Use your actual Python version
                const command = `python${pythonVersion} ${lda}`;

                const child = exec(command, (error, stdout, stderr) => {
                  if (error) {
                    therapistLogger.error(`Error: ${error.message}`);
                    res.status(500).json({ error: "Internal Server Error" });
                    return;
                  }

                  const topicsJournal = JSON.parse(stdout);

                  res.status(200).json({ topicsJournal });
                });

                child.stdin.write(jsonInput);
                child.stdin.end();
              }
              );
            } else {
              // Handle the case where IV is null, undefined, or empty
              return res.status(400).json({ message: "Invalid IV for user decryption." });
            }
          }
        );
      }
    );
  };
    
processUserLogout = async (req, res) => {
  try {
    if (loginStartTime !== 0) {
      const logoutTime = Date.now();
      const totalTimeSpent = logoutTime - loginStartTime;
      defaultLogger.info(`Total session time: ${totalTimeSpent} ms`);
      loginStartTime = 0; // Resetting for next session
    }

    if (dashboardAccessStartTime !== 0) {
      const logoutTime = Date.now();
      const totalDashboardTimeSpent = logoutTime - dashboardAccessStartTime;
      therapistLogger.info(`Total dashboard session time: ${totalDashboardTimeSpent} ms`);
      dashboardAccessStartTime = 0; // Resetting for next session
    }

    res.clearCookie("token");
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    therapistLogger.error("Error during user processUserLogout:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  fetchAllUsers,
  fetchUserDetailsById,
  registerNewUser,
  registerNewUserForClients,
  authenticateUserLogin,
  authenticateDashboardAccess,
  fetchTherapistClients,
  retrieveClientJournalEntries,
  generateClientJournalSummary,
  processUserLogout,
  generateTopicWords,
  generate_Feeling_Mood,
  changeUserPassword,
  unlinkClientFromTherapist,
};
