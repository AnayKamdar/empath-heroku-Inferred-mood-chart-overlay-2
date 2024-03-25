const express = require('express');
const router = express.Router();

const sendPasswordResetEmailController = require('../../controllers/performPasswordReset/performPasswordReset');

router.post('/sendPasswordResetEmail', sendPasswordResetEmailController.sendPasswordResetEmail);
router.get('/performPasswordReset/:userId/:token', sendPasswordResetEmailController.validatePasswordResetToken);
router.post('/performPasswordReset/:userId/:token', sendPasswordResetEmailController.performPasswordReset);


module.exports = router;

