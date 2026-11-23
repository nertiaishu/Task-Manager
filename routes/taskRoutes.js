const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  getEmployees,
  assignTask,
  createTask,
  getMyTasks,
  getDelegatedTasks,
  acceptTask,
  rejectTask,
  delegateTaskToEmployee,
  updateTaskStatus
} = require("../controllers/taskController");


router.get("/employees", authMiddleware, getEmployees);


router.post("/assign", authMiddleware, assignTask);
router.post("/create", authMiddleware, createTask);

router.get("/my-tasks", authMiddleware, getMyTasks);
router.get("/delegated", authMiddleware, getDelegatedTasks);

router.patch("/:id/accept", authMiddleware, acceptTask);
router.patch("/:id/reject", authMiddleware, rejectTask);

router.patch("/:id/delegate", authMiddleware, delegateTaskToEmployee);

router.patch("/:id/status", authMiddleware, updateTaskStatus);

module.exports = router;