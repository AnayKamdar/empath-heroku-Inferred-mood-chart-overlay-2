const express = require('express');
const router = express.Router();
const verifyToken = require('../../middleware/Auth/verifyToken');
const journalsController = require('../../controllers/journals/journalsController');

router.post('/createJournalEntry', verifyToken, journalsController.createJournalEntry);
router.post('/getJournalsForClient', verifyToken, journalsController.fetchJournalEntriesByClient);
router.get('/fetchAllJournalEntries', verifyToken, journalsController.fetchAllJournalEntries);
router.get('/journals/:id', verifyToken, journalsController.fetchJournalEntryById);
router.get('/getRandomJournalPrompt', verifyToken, journalsController.getRandomJournalPrompt);
router.put('/journals/:id', verifyToken, journalsController.updateJournalEntryById);
router.put('/journalAttribute/:id', verifyToken, journalsController.updateJournalAttributeById);
router.delete('/journals/:id', verifyToken, journalsController.deleteJournalEntryById);

module.exports = router;
