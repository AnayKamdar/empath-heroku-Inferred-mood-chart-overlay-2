const { verify } = require('crypto');
const express = require('express');
const router = express.Router();
const therapistsController = require('../../controllers/therapists/therapistsController');
const verifyToken = require('../../middleware/Auth/verifyToken');

router.get('/retrieveTherapistDetails', verifyToken, therapistsController.retrieveTherapistDetails)
router.get('/retrieveTherapistPreferences', verifyToken, therapistsController.retrieveTherapistPreferences)
router.get('/fetchTherapistSignUpCode', verifyToken, therapistsController.fetchTherapistSignUpCode);
router.get('/getTheripistIdBySignupCode/:signUpCode', verifyToken, therapistsController.getTheripistIdBySignupCode);
router.put('/changeTherapistProfilePicture', verifyToken, therapistsController.changeTherapistProfilePicture);
router.put('/modifyTherapistProfile', verifyToken, therapistsController.modifyTherapistProfile);
router.post('/registerTherapists', therapistsController.registerTherapist);
router.post('/updateClientNotes', verifyToken, therapistsController.updateClientNotes);
router.post('/generateProfilePictureUploadUrl', verifyToken, therapistsController.generateProfilePictureUploadUrl);
router.post('/storeTherapistPreferences', verifyToken, therapistsController.storeTherapistPreferences)
router.post('/sendClientInviteLink', verifyToken, therapistsController.sendClientInviteLink);
router.post('/validateAccessKey', therapistsController.validateAccessKey);
router.post('/client-limit', therapistsController.updateClientLimit);
router.get('/retrieveTherapistClientLimit', verifyToken, therapistsController.retrieveTherapistClientLimit);
router.post('/createTherapistSubscription', therapistsController.createTherapistSubscription);

module.exports = router;