const Feedback = require('../../models/feedback');
const nodemailer = require('nodemailer');
const AWS = require('aws-sdk');
const { defaultLogger, createLogger } = require('../../logging/logger');
const feedbackLogger = createLogger('FeedbackController');

const transporter = nodemailer.createTransport({
    SES: new AWS.SES({
      region: "us-west-1",
      accessKeyId: process.env.AWS_SES_KEY,
      secretAccessKey: process.env.AWS_SES_SECRET,
    }),
  });

  exports.addFeedback = (req, res, next) => {
    feedbackLogger.info("Therapist ID: ", req.therapistId); // Debugging log
  
    const { feedbackText, feedbackRating, summary_id } = req.body;
    const therapist_id = req.therapistId; // Extract therapist_id from the request
  
    Feedback.create({ feedbackText, feedbackRating, therapist_id, summary_id }, async (error, feedbackId) => {
      if (error) {
        feedbackLogger.error("Error in addFeedback controller:", error.message);
        return next(error);
      }
      
      // Assuming feedbackId is the ID of the newly created feedback entry
      // Send notification email after feedback is successfully created
      try {
        await sendFeedbackNotificationEmail({ feedbackText, feedbackRating });
        feedbackLogger.info('Feedback notification email sent successfully.');
      } catch (emailError) {
        feedbackLogger.error('Failed to send feedback notification email:', emailError);
        // Consider how you want to handle email sending failures. For example, you might want to log this issue without affecting the response to the client.
      }
  
      res.status(201).json({ feedbackId: feedbackId, message: 'Feedback successfully created' });
    });
  };
  
  async function sendFeedbackNotificationEmail(feedback) {
    const mailOptions = {
      from: process.env.SES_EMAIL,
  to: process.env.FEEDBACK_EMAIL_RECIPIENT,
      subject: `New Feedback Received`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Feedback Notification</title>
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
                .footer {
                    margin-top: 20px;
                    text-align: center;
                    font-size: 0.9em;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>New Feedback Received</h2>
                <p>A new feedback has been submitted with the following details:</p>
                <ul>
                  <li>Feedback Text: ${feedback.feedbackText}</li>
                  <li>Feedback Rating: ${feedback.feedbackRating}</li>
                </ul>
                <div class="footer">
                    <p>Thank you,<br>Empath Team</p>
                </div>
            </div>
        </body>
        </html>`,
    };
  
    return new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          reject(error);
        } else {
          resolve(info);
        }
      });
    });
  }
  