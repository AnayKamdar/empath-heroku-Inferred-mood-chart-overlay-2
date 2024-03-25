const express = require("express");
const router = express.Router();
const usersController = require("../../controllers/users/usersController");
const verifyToken = require("../../middleware/Auth/verifyToken");

router.get("/fetchAllUsers", usersController.fetchAllUsers);
router.get("/fetchUserDetailsById/:id", usersController.fetchUserDetailsById);
router.get(
  "/fetchTherapistClients",
  verifyToken,
  usersController.fetchTherapistClients
);
router.post("/registerNewUser", usersController.registerNewUser);
router.post(
  "/registerNewUserForClients",
  usersController.registerNewUserForClients
);
router.post("/login", usersController.authenticateUserLogin);
router.post(
  "/authenticateDashboardAccess",
  usersController.authenticateDashboardAccess
);
router.post(
  "/retrieveClientJournalEntries",
  verifyToken,
  usersController.retrieveClientJournalEntries
);
router.post(
  "/generateClientJournalSummary",
  verifyToken,
  usersController.generateClientJournalSummary
);
router.post(
  "/processUserLogout",
  verifyToken,
  usersController.processUserLogout
);
router.post("/unlinkClientFromTherapist", verifyToken, usersController.unlinkClientFromTherapist);

router.post(
  "/generateTopicWords",
  verifyToken,
  usersController.generateTopicWords
);

router.post(
  "/generate_Feeling_Mood",
  verifyToken,
  usersController.generate_Feeling_Mood
);

router.post("/changeUserPassword", verifyToken, usersController.changeUserPassword);

module.exports = router;
