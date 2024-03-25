const express = require('express');
const router = express.Router();
const FeedbackController = require('../../controllers/summaryFeedback/feedbackController');
const verifyToken = require('../../middleware/Auth/verifyToken');

router.post('/add', verifyToken, FeedbackController.addFeedback);

module.exports = router;
