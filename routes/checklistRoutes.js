const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const checklistController = require("../controllers/checklistController");

router.use(authMiddleware);

router.get("/employees", checklistController.getEmployees);

router.post("/", checklistController.createChecklist);

router.get("/my-checklists", checklistController.getMyChecklists);

router.get("/today", checklistController.getTodayChecklists);
router.get("/delayed", checklistController.getDelayedChecklists);
router.get("/completed", checklistController.getCompletedChecklists);
router.get("/upcoming", checklistController.getUpcomingChecklists);
router.get("/delegated", checklistController.getDelegatedChecklists);

router.get("/holidays", checklistController.getHolidays);

router.patch(
  "/occurrences/:id/complete",
  checklistController.markChecklistAsCompleted
);

router.patch("/:id/delegate", checklistController.delegateChecklist);

router.patch(
  "/delegations/:id/accept",
  checklistController.acceptDelegation
);

router.patch(
  "/delegations/:id/reject",
  checklistController.rejectDelegation
);


module.exports = router;
