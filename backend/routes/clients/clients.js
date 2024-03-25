const express = require('express');
const router = express.Router();
const clientController = require('../../controllers/clients/clientsController');
const verifyToken = require('../../middleware/Auth/verifyToken');

router.post('/associateClientWithTherapist', verifyToken, clientController.associateClientWithTherapist);
router.post('/updateLastVisitedForClient', verifyToken, clientController.updateLastVisitedForClient);
router.post('/addFeeleings', verifyToken, clientController.addFeeleings);
router.post('/retrieveFeelings', verifyToken, clientController.retrieveFeelings);
router.post('/existingClientLoginForLinking', verifyToken, clientController.existingClientLoginForLinking);
router.post('/associateExistingClientWithTherapist', verifyToken, clientController.associateExistingClientWithTherapist);

module.exports = router;