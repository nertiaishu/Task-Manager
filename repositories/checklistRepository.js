
const pool = require("../config/db");


const getEmployees = async () => {
  const [rows] = await pool.query(`
    SELECT id, full_name, email
    FROM users
    ORDER BY full_name
  `);

  return rows;
};


const employeeExists = async (employeeId) => {
  const [rows] = await pool.query(
    "SELECT id FROM users WHERE id = ?",
    [employeeId]
  );

  return rows.length > 0;
};


const getSelectedHolidays = async (dates) => {
  if (!dates.length) return [];

  const [rows] = await pool.query(`
    SELECT DATE_FORMAT(holiday_date, '%Y-%m-%d') AS holiday_date
    FROM holidays
    WHERE holiday_date IN (?)
  `, [dates]);

  return rows.map(row => row.holiday_date);
};


const getHolidays = async () => {
  const [rows] = await pool.query(`
    SELECT id, holiday_name,
    DATE_FORMAT(holiday_date, '%Y-%m-%d') AS holiday_date
    FROM holidays
    ORDER BY holiday_date ASC
  `);

  return rows;
};

// Save checklist, occurrences and delegation.
const createChecklist = async (data) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const {
      checklistName,
      frequency,
      startDate,
      endDate,
      employeeId,
      currentUserId,
      recurrencePattern,
      weekOff,
      occurrenceDates,
      isDelegating
    } = data;

    const assignedUserId = isDelegating
      ? currentUserId
      : employeeId;

    const [result] = await connection.query(`
      INSERT INTO checklists (
        checklist_name,
        frequency,
        start_date,
        end_date,
        user_id,
        created_by,
        delegated_to,
        recurrence_pattern,
        week_off
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      checklistName,
      frequency,
      startDate,
      endDate,
      assignedUserId,
      currentUserId,
      isDelegating ? employeeId : null,
      recurrencePattern,
      JSON.stringify(weekOff)
    ]);

    const checklistId = result.insertId;

    const occurrenceValues = occurrenceDates.map(date => [
      checklistId,
      date,
      "pending"
    ]);

    await connection.query(`
      INSERT INTO checklist_occurrences
      (checklist_id, occurrence_date, status)
      VALUES ?
    `, [occurrenceValues]);

    if (isDelegating) {
      await connection.query(`
        INSERT INTO checklist_delegations
        (checklist_id, delegated_by, delegated_to, status)
        VALUES (?, ?, ?, 'pending')
      `, [
        checklistId,
        currentUserId,
        employeeId
      ]);
    }

    await connection.commit();

    return {
      checklistId,
      occurrenceCount: occurrenceDates.length,
      isDelegating
    };

  } catch (error) {
    await connection.rollback();
    throw error;

  } finally {
    connection.release();
  }
};

const checklistSelect = `
  SELECT
    o.id AS id,
    o.id AS occurrence_id,
    c.id AS checklist_id,
    c.checklist_name,
    c.frequency,
    DATE_FORMAT(c.start_date, '%Y-%m-%d') AS start_date,
    DATE_FORMAT(c.end_date, '%Y-%m-%d') AS end_date,
    DATE_FORMAT(o.occurrence_date, '%Y-%m-%d') AS occurrence_date,
    o.status,
    o.completed_at,
    o.completed_by,
    c.user_id,
    c.created_by,
    c.delegated_to,
    COALESCE(delegated.full_name, assigned.full_name)
      AS assigned_to_name,
    creator.full_name AS assigned_by_name,
    completer.full_name AS completed_by_name
  FROM checklist_occurrences o
  INNER JOIN checklists c ON c.id = o.checklist_id
  LEFT JOIN users assigned ON assigned.id = c.user_id
  LEFT JOIN users delegated ON delegated.id = c.delegated_to
  LEFT JOIN users creator ON creator.id = c.created_by
  LEFT JOIN users completer ON completer.id = o.completed_by
`;

// Get checklist occurrences based on condition.
const getOccurrences = async (userId, condition) => {
  const [rows] = await pool.query(`
    ${checklistSelect}
    WHERE c.user_id = ? AND ${condition}
    ORDER BY o.occurrence_date ASC, o.id ASC
  `, [userId]);

  return rows;
};

// Get all my checklists.
const getMyChecklists = async (userId) => {
  const [rows] = await pool.query(`
    ${checklistSelect}
    WHERE c.user_id = ?
    ORDER BY o.occurrence_date ASC, o.id ASC
  `, [userId]);

  return rows;
};

// Get delegated checklist requests.
const getDelegatedChecklists = async (userId) => {
  const [rows] = await pool.query(`
    SELECT
      d.id AS delegation_id,
      d.checklist_id AS id,
      d.checklist_id,
      d.delegated_by,
      d.delegated_to,
      d.delegated_to AS user_id,
      d.status,
      c.checklist_name,
      c.frequency,
      c.created_by,
      DATE_FORMAT(c.start_date, '%Y-%m-%d') AS start_date,
      DATE_FORMAT(c.end_date, '%Y-%m-%d') AS end_date,
      (
        SELECT DATE_FORMAT(MIN(o.occurrence_date), '%Y-%m-%d')
        FROM checklist_occurrences o
        WHERE o.checklist_id = c.id
          AND o.status = 'pending'
      ) AS occurrence_date,
      sender.full_name AS delegated_by_name,
      receiver.full_name AS delegated_to_name,
      creator.full_name AS created_by_name
    FROM checklist_delegations d
    INNER JOIN checklists c ON c.id = d.checklist_id
    INNER JOIN users sender ON sender.id = d.delegated_by
    INNER JOIN users receiver ON receiver.id = d.delegated_to
    LEFT JOIN users creator ON creator.id = c.created_by
    WHERE d.delegated_to = ?
      AND d.status = 'pending'
    ORDER BY d.id DESC
  `, [userId]);

  return rows;
};

// Complete checklist occurrence.
const completeOccurrence = async (occurrenceId, userId) => {
  const [result] = await pool.query(`
    UPDATE checklist_occurrences o
    INNER JOIN checklists c ON c.id = o.checklist_id
    SET
      o.status = 'completed',
      o.completed_at = NOW(),
      o.completed_by = ?
    WHERE o.id = ?
      AND c.user_id = ?
      AND o.status = 'pending'
  `, [userId, occurrenceId, userId]);

  return result.affectedRows;
};

// Delegate existing checklist.
const delegateChecklist = async (
  checklistId,
  currentUserId,
  employeeId
) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [checklists] = await connection.query(`
      SELECT id
      FROM checklists
      WHERE id = ? AND user_id = ?
      FOR UPDATE
    `, [checklistId, currentUserId]);

    if (!checklists.length) {
      const error = new Error("Checklist not found");
      error.statusCode = 404;
      throw error;
    }

    const [employees] = await connection.query(
      "SELECT id FROM users WHERE id = ?",
      [employeeId]
    );

    if (!employees.length) {
      const error = new Error("Selected employee was not found");
      error.statusCode = 404;
      throw error;
    }

    const [pending] = await connection.query(`
      SELECT id
      FROM checklist_delegations
      WHERE checklist_id = ? AND status = 'pending'
    `, [checklistId]);

    if (pending.length) {
      const error = new Error(
        "This checklist already has a pending delegation request"
      );
      error.statusCode = 400;
      throw error;
    }

    await connection.query(`
      INSERT INTO checklist_delegations
      (checklist_id, delegated_by, delegated_to, status)
      VALUES (?, ?, ?, 'pending')
    `, [checklistId, currentUserId, employeeId]);

    await connection.query(`
      UPDATE checklists
      SET delegated_to = ?
      WHERE id = ? AND user_id = ?
    `, [employeeId, checklistId, currentUserId]);

    await connection.commit();

  } catch (error) {
    await connection.rollback();
    throw error;

  } finally {
    connection.release();
  }
};

// Accept or reject a delegation.
const respondToDelegation = async (
  delegationId,
  userId,
  action
) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [requests] = await connection.query(`
      SELECT id, checklist_id, delegated_to, status
      FROM checklist_delegations
      WHERE id = ?
      FOR UPDATE
    `, [delegationId]);

    if (
      !requests.length ||
      Number(requests[0].delegated_to) !== Number(userId) ||
      requests[0].status !== "pending"
    ) {
      const error = new Error(
        "Pending delegation request not found"
      );
      error.statusCode = 404;
      throw error;
    }

    const request = requests[0];

    if (action === "accept") {
      await connection.query(`
        UPDATE checklist_delegations
        SET status = 'accepted', responded_at = NOW()
        WHERE id = ?
      `, [delegationId]);

      await connection.query(`
        UPDATE checklists
        SET user_id = ?, delegated_to = NULL
        WHERE id = ?
      `, [userId, request.checklist_id]);

      await connection.query(`
        UPDATE checklist_delegations
        SET status = 'rejected', responded_at = NOW()
        WHERE checklist_id = ?
          AND id != ?
          AND status = 'pending'
      `, [request.checklist_id, delegationId]);

    } else {
      await connection.query(`
        UPDATE checklist_delegations
        SET status = 'rejected', responded_at = NOW()
        WHERE id = ?
      `, [delegationId]);

      await connection.query(`
        UPDATE checklists
        SET delegated_to = NULL
        WHERE id = ? AND delegated_to = ?
      `, [request.checklist_id, userId]);
    }

    await connection.commit();

  } catch (error) {
    await connection.rollback();
    throw error;

  } finally {
    connection.release();
  }
};

module.exports = {
  getEmployees,
  employeeExists,
  getSelectedHolidays,
  getHolidays,
  createChecklist,
  getOccurrences,
  getMyChecklists,
  getDelegatedChecklists,
  completeOccurrence,
  delegateChecklist,
  respondToDelegation
};
