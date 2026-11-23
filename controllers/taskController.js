const pool = require("../config/db");

async function getEmployees(req, res) {
  try {
    const [employees] = await pool.execute(
      `SELECT id, full_name, email
       FROM users
       ORDER BY full_name`
    );

    res.json(employees);
  } catch (error) {
    console.error("Get employees error:", error.message);
    res.status(500).json({ message: "Failed to get employees" });
  }
}

async function assignTask(req, res) {
  try {
    const { title, user_id, planned_date } = req.body;

    if (!title || !user_id || !planned_date) {
      return res.status(400).json({
        message: "Task name, employee and planned date are required"
      });
    }

    const isSelfAssigned = Number(user_id) === Number(req.user.id);

    await pool.execute(
      `INSERT INTO tasks
       (title, user_id, assigned_by, planned_date, status, acceptance_status, last_delegated_by)
       VALUES (?, ?, ?, ?, 'Pending', ?, ?)`,
      [
        title.trim(),
        user_id,
        req.user.id,
        planned_date,
        isSelfAssigned ? "Accepted" : "AwaitingAcceptance",
        req.user.id
      ]
    );

    res.status(201).json({
      message: isSelfAssigned
        ? "Task created successfully"
        : "Task assigned successfully"
    });
  } catch (error) {
    console.error("Assign task error:", error.message);
    res.status(500).json({ message: "Failed to assign task" });
  }
}

async function createTask(req, res) {
  try {
    const { title, planned_date } = req.body;

    if (!title || !planned_date) {
      return res.status(400).json({
        message: "Task name and planned date are required"
      });
    }

    await pool.execute(
      `INSERT INTO tasks
       (title, user_id, assigned_by, planned_date, status, acceptance_status, last_delegated_by)
       VALUES (?, ?, ?, ?, 'Pending', 'Accepted', ?)`,
      [title.trim(), req.user.id, req.user.id, planned_date, req.user.id]
    );

    res.status(201).json({ message: "Task created successfully" });
  } catch (error) {
    console.error("Create task error:", error.message);
    res.status(500).json({ message: "Failed to create task" });
  }
}

async function getMyTasks(req, res) {
  try {
    const [tasks] = await pool.execute(
      `SELECT
          t.id,
          t.title,
          t.status,
          CAST(t.planned_date AS CHAR) AS planned_date,
          t.completed_date,
          t.acceptance_status,
          t.user_id,
          t.assigned_by,
          t.last_delegated_by,
          assigner.full_name AS assigned_by_name,
          delegator.full_name AS delegated_by_name,
          employee.full_name AS assigned_to_name
       FROM tasks t
       LEFT JOIN users assigner ON t.assigned_by = assigner.id
       LEFT JOIN users delegator ON t.last_delegated_by = delegator.id
       LEFT JOIN users employee ON t.user_id = employee.id
       WHERE t.user_id = ?
       ORDER BY t.id DESC`,
      [req.user.id]
    );

    res.json(tasks);
  } catch (error) {
    console.error("Get my tasks error:", error.message);
    res.status(500).json({ message: "Failed to get tasks" });
  }
}

async function getDelegatedTasks(req, res) {
  try {
    const [tasks] = await pool.execute(
      `SELECT
          t.id,
          t.title,
          t.status,
          CAST(t.planned_date AS CHAR) AS planned_date,
          t.completed_date,
          t.acceptance_status,
          t.user_id,
          t.assigned_by,
          t.last_delegated_by,
          assigner.full_name AS assigned_by_name,
          delegator.full_name AS delegated_by_name,
          employee.full_name AS assigned_to_name
       FROM tasks t
       LEFT JOIN users assigner ON t.assigned_by = assigner.id
       LEFT JOIN users delegator ON t.last_delegated_by = delegator.id
       LEFT JOIN users employee ON t.user_id = employee.id
       WHERE t.user_id = ?
         AND LOWER(t.acceptance_status) IN ('awaitingacceptance', 'delegatedpending')
       ORDER BY t.id DESC`,
      [req.user.id]
    );

    res.json(tasks);
  } catch (error) {
    console.error("Get delegated tasks error:", error.message);
    res.status(500).json({ message: "Failed to get delegated tasks" });
  }
}

async function acceptTask(req, res) {
  try {
    const taskId = req.params.id;

    const [tasks] = await pool.execute(
      `SELECT id, user_id, acceptance_status FROM tasks WHERE id = ?`,
      [taskId]
    );

    if (tasks.length === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    const [result] = await pool.execute(
      `UPDATE tasks
       SET acceptance_status = 'Accepted'
       WHERE id = ?`,
      [taskId]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({
        message: "Task could not be accepted"
      });
    }

    res.json({ message: "Task accepted successfully" });
  } catch (error) {
    console.error("Accept task error:", error.message);
    res.status(500).json({ message: "Failed to accept task" });
  }
}

async function rejectTask(req, res) {
  try {
    const taskId = req.params.id;

    const [tasks] = await pool.execute(
      `SELECT id, assigned_by, last_delegated_by, acceptance_status
       FROM tasks
       WHERE id = ?`,
      [taskId]
    );

    if (tasks.length === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    const task = tasks[0];
    const returnTo = task.last_delegated_by || task.assigned_by;

    if (!returnTo) {
      return res.status(400).json({
        message: "The person who assigned this task could not be found"
      });
    }

    const [result] = await pool.execute(
      `UPDATE tasks
       SET user_id = ?,
           acceptance_status = 'Accepted'
       WHERE id = ?`,
      [returnTo, taskId]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({
        message: "Task could not be returned"
      });
    }

    res.json({ message: "Task rejected and returned successfully" });
  } catch (error) {
    console.error("Reject task error:", error.message);
    res.status(500).json({ message: "Failed to reject task" });
  }
}

async function delegateTaskToEmployee(req, res) {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        message: "Please select an employee"
      });
    }

    if (Number(user_id) === Number(req.user.id)) {
      return res.status(400).json({
        message: "You cannot delegate a task to yourself"
      });
    }

    const [tasks] = await pool.execute(
      `SELECT id
       FROM tasks
       WHERE id = ?
         AND status != 'Completed'`,
      [req.params.id]
    );

    if (tasks.length === 0) {
      return res.status(404).json({
        message: "Task not found or cannot be delegated"
      });
    }

    const [employees] = await pool.execute(
      `SELECT id FROM users WHERE id = ?`,
      [user_id]
    );

    if (employees.length === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    await pool.execute(
      `UPDATE tasks
       SET user_id = ?,
           last_delegated_by = ?,
           acceptance_status = 'DelegatedPending'
       WHERE id = ?`,
      [user_id, req.user.id, req.params.id]
    );

    res.json({ message: "Task delegated successfully" });
  } catch (error) {
    console.error("Delegate task error:", error.message);
    res.status(500).json({ message: "Failed to delegate task" });
  }
}

async function updateTaskStatus(req, res) {
  try {
    const { status } = req.body;

    if (status !== "Completed") {
      return res.status(400).json({ message: "Invalid task status" });
    }

    const [result] = await pool.execute(
      `UPDATE tasks
       SET status = 'Completed',
           completed_date = CURDATE()
       WHERE id = ?`,
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Task not found or cannot be completed"
      });
    }

    res.json({ message: "Task completed successfully" });
  } catch (error) {
    console.error("Update task status error:", error.message);
    res.status(500).json({ message: "Failed to update task status" });
  }
}

module.exports = {
  getEmployees,
  assignTask,
  createTask,
  getMyTasks,
  getDelegatedTasks,
  acceptTask,
  rejectTask,
  delegateTaskToEmployee,
  updateTaskStatus
};