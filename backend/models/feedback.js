// models/feedback.js
const pool = require('../db'); 
const { defaultLogger, createLogger } = require('../logging/logger');
const feedbackLogger = createLogger('Feedback(Model)');

const Feedback = {
    create(feedbackData, callback) {
        const { feedbackText, feedbackRating, therapist_id, summary_id } = feedbackData;
        feedbackLogger.info("Creating feedback with therapist_id:", therapist_id); // Debugging log

        const query = 'INSERT INTO feedback (feedbackText, feedbackRating, therapist_id, summary_id) VALUES (?, ?, ?, ?)';
        pool.query(query, [feedbackText, feedbackRating, therapist_id, summary_id], function(error, results, fields) {
            if (error) {
                feedbackLogger.error("Database error in Feedback.create:", error.message);
                feedbackLogger.error("Error details:", error);
                return callback(error, null);
              }
            return callback(null, results.insertId); // Assuming AUTO_INCREMENT is used for feedback_id
        });
    }
};

module.exports = Feedback;
