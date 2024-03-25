const pool = require("../../db");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const saltRounds = 10;
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const AWS = require("aws-sdk");
require("dotenv").config();
const { defaultLogger, createLogger } = require('../../logging/logger');
const passwordResetLogger = createLogger('PerformPasswordReset');

const transporter = nodemailer.createTransport({
  SES: new AWS.SES({
    region: "us-west-1",
    accessKeyId: process.env.AWS_SES_KEY,
    secretAccessKey: process.env.AWS_SES_SECRET,
  }),
});

const generateUniqueUserSecret = () => {
  const secret = crypto.randomBytes(32).toString("hex");
  return secret;
};

const SECRET = generateUniqueUserSecret();

const sendPasswordResetEmail = async (req, res) => {
  const { email } = req.body;

  try {
    const userResult = await new Promise((resolve, reject) => {
      pool.query(
        "SELECT id FROM users WHERE email = ?",
        [email],
        (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results);
          }
        }
      );
    });

    passwordResetLogger.info("user result: ", userResult);

    if (userResult.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userId = userResult[0].id;
    passwordResetLogger.info("user id: ", userId);

    const token = crypto.randomBytes(20).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await new Promise((resolve, reject) => {
      pool.query(
        "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
        [userId, token, expiresAt],
        (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results);
          }
        }
      );
    });

    const resetLink = `${process.env.FRONT_END_URL}/reset-password/${userId}/${token}`;

    const mailOptions = {
      from: process.env.SES_EMAIL,
      to: email,
      subject: "Password Reset",
      html: `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset</title>
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
                <h2>Password Reset Request</h2>
                <p>Hello,</p>
                <p>You are receiving this email because we received a password reset request for your account. If you did not request a password reset, please ignore this email.</p>
                <div class="button-container">
                    <a href="${resetLink}" class="button">Reset Password</a>
                </div>
                <p>If you're having trouble with the button above, copy and paste the URL below into your web browser:</p>
                <p><a href="${resetLink}">${resetLink}</a></p>
                <div class="footer">
                    <p>Best regards,<br>Empath</p>
                </div>
            </div>
        </body>
        </html>`,
    };

    // Use a promise to wait for the email to be sent
    await new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          reject(error);
        } else {
          passwordResetLogger.info("Email sent: ", info.response);
          resolve(info);
        }
      });
    });

    // If everything went fine, send a successful response
    return res.status(200).json({ link: resetLink});
  } catch (error) {
    passwordResetLogger.error("Error in sendPasswordResetEmail: ", error);
    return res.status(500).json({
      message: "Error processing forgot password request",
      error: error.message,
    });
  }
};

const validatePasswordResetToken = async (req, res) => {
  const { userId, token } = req.params;

  try {
    const tokenResult = await pool.query(
      "SELECT * FROM password_reset_tokens WHERE user_id = ? AND token = ? AND used = 0 AND expires_at > NOW()",
      [userId, token]
    );
    if (tokenResult.length === 0) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    res.redirect(
      `${process.env.FRONT_END_URL}/reset-password/${userId}/${token}`
    );
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error verifying token", error: error.message });
  }
};

const performPasswordReset = async (req, res) => {
  const { userId, token } = req.params;
  const { password, confirmPassword } = req.body;

  try {
    const tokenResult = await pool.query(
      "SELECT * FROM password_reset_tokens WHERE user_id = ? AND token = ? AND used = 0 AND expires_at > NOW()",
      [userId, token]
    );
    if (tokenResult.length === 0) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [
      hashedPassword,
      userId,
    ]);

    await pool.query(
      "UPDATE password_reset_tokens SET used = 1 WHERE user_id = ? AND token = ?",
      [userId, token]
    );

    return res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    passwordResetLogger.error("Error resetting password: ", error);
    return res
      .status(500)
      .json({ message: "Error resetting password", error: error.message });
  }
};

module.exports = {
  sendPasswordResetEmail,
  validatePasswordResetToken,
  performPasswordReset,
};
