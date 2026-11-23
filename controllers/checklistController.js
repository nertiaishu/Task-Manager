
const checklistService = require("../services/checklistService");

const getEmployees = async (req, res) => {
  try {
    const employees = await checklistService.getEmployees();
    return res.json(employees);
  } catch (error) {
    console.error("Get employees error:", error);

    return res.status(500).json({
      message: "Unable to load employees"
    });
  }
};

const createChecklist = async (req, res) => {
  try {
    const result = await checklistService.createChecklist(
      req.body,
      req.user?.id
    );

    return res.status(201).json(result);
  } catch (error) {
    console.error("Create checklist error:", error);

    return res.status(error.statusCode || 500).json({
      message: error.message || "Unable to create checklist"
    });
  }
};


const getMyChecklists = async (req, res) => {
  try {
    const rows = await checklistService.getMyChecklists(
      req.user.id
    );

    return res.json(rows);
  } catch (error) {
    console.error("Get my checklists error:", error);

    return res.status(500).json({
      message: "Unable to load checklists"
    });
  }
};

const getTodayChecklists = async (req, res) => {
  try {
    const rows = await checklistService.getTodayChecklists(
      req.user.id
    );

    return res.json(rows);
  } catch (error) {
    console.error("Get today checklists error:", error);

    return res.status(500).json({
      message: "Unable to load checklists"
    });
  }
};


const getDelayedChecklists = async (req, res) => {
  try {
    const rows = await checklistService.getDelayedChecklists(
      req.user.id
    );

    return res.json(rows);
  } catch (error) {
    console.error("Get delayed checklists error:", error);

    return res.status(500).json({
      message: "Unable to load checklists"
    });
  }
};

const getCompletedChecklists = async (req, res) => {
  try {
    const rows = await checklistService.getCompletedChecklists(
      req.user.id
    );

    return res.json(rows);
  } catch (error) {
    console.error("Get completed checklists error:", error);

    return res.status(500).json({
      message: "Unable to load checklists"
    });
  }
};


const getUpcomingChecklists = async (req, res) => {
  try {
    const rows = await checklistService.getUpcomingChecklists(
      req.user.id
    );

    return res.json(rows);
  } catch (error) {
    console.error("Get upcoming checklists error:", error);

    return res.status(500).json({
      message: "Unable to load checklists"
    });
  }
};


const getDelegatedChecklists = async (req, res) => {
  try {
    const rows = await checklistService.getDelegatedChecklists(
      req.user.id
    );

    return res.json(rows);
  } catch (error) {
    console.error("Get delegated checklists error:", error);

    return res.status(500).json({
      message: "Unable to load delegation requests"
    });
  }
};

const markChecklistAsCompleted = async (req, res) => {
  try {
    const result =
      await checklistService.markChecklistAsCompleted(
        req.params.id,
        req.user?.id
      );

    return res.json(result);
  } catch (error) {
    console.error("Complete checklist error:", error);

    return res.status(error.statusCode || 500).json({
      message: error.message || "Unable to complete checklist"
    });
  }
};


const delegateChecklist = async (req, res) => {
  try {
    const result = await checklistService.delegateChecklist(
      req.params.id,
      req.body,
      req.user?.id
    );

    return res.json(result);
  } catch (error) {
    console.error("Delegate checklist error:", error);

    return res.status(error.statusCode || 500).json({
      message: error.message || "Unable to delegate checklist"
    });
  }
};


const acceptDelegation = async (req, res) => {
  try {
    const result = await checklistService.acceptDelegation(
      req.params.id,
      req.user?.id
    );

    return res.json(result);
  } catch (error) {
    console.error("Accept delegation error:", error);

    return res.status(error.statusCode || 500).json({
      message: error.message || "Unable to accept delegation"
    });
  }
};


const rejectDelegation = async (req, res) => {
  try {
    const result = await checklistService.rejectDelegation(
      req.params.id,
      req.user?.id
    );

    return res.json(result);
  } catch (error) {
    console.error("Reject delegation error:", error);

    return res.status(error.statusCode || 500).json({
      message: error.message || "Unable to reject delegation"
    });
  }
};


const getHolidays = async (req, res) => {
  try {
    const holidays = await checklistService.getHolidays();

    return res.json(holidays);
  } catch (error) {
    console.error("Get holidays error:", error);

    return res.status(500).json({
      message: "Unable to load holidays"
    });
  }
};

module.exports = {
  getEmployees,
  createChecklist,
  getMyChecklists,
  getTodayChecklists,
  getDelayedChecklists,
  getCompletedChecklists,
  getUpcomingChecklists,
  getDelegatedChecklists,
  markChecklistAsCompleted,
  delegateChecklist,
  acceptDelegation,
  rejectDelegation,
  getHolidays
};
