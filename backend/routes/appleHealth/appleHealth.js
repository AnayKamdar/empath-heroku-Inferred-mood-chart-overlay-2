const express = require('express');
const router = express.Router();
const verifyToken = require('../../middleware/Auth/verifyToken');
const saveAppleHealth = require('../../controllers/appleHealth/appleHealthController')

router.post('/saveAppleHealth', verifyToken, saveAppleHealth.saveAppleHealth);
router.post('/getAppleHealthData', verifyToken,saveAppleHealth.getAppleHealthData);



module.exports = router;