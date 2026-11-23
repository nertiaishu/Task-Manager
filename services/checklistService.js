const repository = require("../repositories/checklistRepository");

const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// Format date as YYYY-MM-DD.
function formatDate(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// Convert date without timezone issues.
function getValidDate(value) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return new Date(NaN);
    }

    return new Date(Date.UTC(
      value.getUTCFullYear(),
      value.getUTCMonth(),
      value.getUTCDate()
    ));
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(
    String(value ?? "")
  );

  if (!match) return new Date(NaN);

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return new Date(NaN);
  }

  return date;
}

// Check valid ID.
function isValidId(value) {
  return (
    (typeof value === "number" ||
      (typeof value === "string" && /^\d+$/.test(value))) &&
    Number.isSafeInteger(Number(value)) &&
    Number(value) > 0
  );
}

// Get nth weekday of a month.
function getNthWeekday(year, month, nth, weekday) {
  const weekdays = [
    "Sunday", "Monday", "Tuesday", "Wednesday",
    "Thursday", "Friday", "Saturday"
  ];

  const weekdayNumber = weekdays.indexOf(weekday);

  if (
    weekdayNumber === -1 ||
    !Number.isInteger(nth) ||
    nth < 1 ||
    nth > 5
  ) {
    return null;
  }

  const firstDay = new Date(Date.UTC(year, month, 1));

  const offset =
    (weekdayNumber - firstDay.getUTCDay() + 7) % 7;

  const day = 1 + offset + (nth - 1) * 7;

  const result = new Date(Date.UTC(year, month, day));

  if (result.getUTCMonth() !== month) {
    return null;
  }

  return result;
}

// Validate monthly recurrence pattern.
function isValidMonthlyPattern(pattern) {
  if (
    pattern === null ||
    pattern === undefined ||
    pattern === ""
  ) {
    return true;
  }

  if (typeof pattern !== "string") return false;

  const dayMatch = /^day:(\d{1,2})$/.exec(pattern);

  if (dayMatch) {
    const day = Number(dayMatch[1]);
    return day >= 1 && day <= 31;
  }

  const nthMatch =
    /^nth:([1-5]):(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)$/
      .exec(pattern);

  return Boolean(nthMatch);
}

// Generate checklist occurrence dates.
function getOccurrenceDates(
  startDate,
  endDate,
  frequency,
  recurrencePattern,
  weekOff = [],
  holidays = []
) {
  const start = getValidDate(startDate);
  const end = getValidDate(endDate);

  const dates = [];

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    start > end
  ) {
    return dates;
  }

  const holidaySet = new Set(holidays);
  const weekOffSet = new Set(weekOff);

  // Daily recurrence.
  if (frequency === "Daily") {
    for (
      let date = new Date(start);
      date <= end;
      date.setUTCDate(date.getUTCDate() + 1)
    ) {
      dates.push(new Date(date));
    }
  }

  // Weekly recurrence.
  else if (frequency === "Weekly") {
    const match =
      /^weekly:([0-6](?:,[0-6])*)$/.exec(
        recurrencePattern || ""
      );

    if (!match) return [];

    const selectedDays = new Set(
      match[1].split(",").map(Number)
    );

    for (
      let date = new Date(start);
      date <= end;
      date.setUTCDate(date.getUTCDate() + 1)
    ) {
      if (selectedDays.has(date.getUTCDay())) {
        dates.push(new Date(date));
      }
    }
  }

  // Monthly recurrence.
  else if (frequency === "Monthly") {
    let currentMonth = new Date(Date.UTC(
      start.getUTCFullYear(),
      start.getUTCMonth(),
      1
    ));

    while (currentMonth <= end) {
      const year = currentMonth.getUTCFullYear();
      const month = currentMonth.getUTCMonth();

      let occurrence = null;

      // Particular day of every month.
      if (recurrencePattern?.startsWith("day:")) {
        const requestedDay = Number(
          recurrencePattern.split(":")[1]
        );

        const lastDay = new Date(
          Date.UTC(year, month + 1, 0)
        ).getUTCDate();

        occurrence = new Date(Date.UTC(
          year,
          month,
          Math.min(requestedDay, lastDay)
        ));
      }

      // Nth weekday of every month.
      else if (recurrencePattern?.startsWith("nth:")) {
        const parts = recurrencePattern.split(":");

        occurrence = getNthWeekday(
          year,
          month,
          Number(parts[1]),
          parts[2]
        );
      }

      if (
        occurrence &&
        occurrence >= start &&
        occurrence <= end
      ) {
        dates.push(occurrence);
      }

      currentMonth.setUTCMonth(
        currentMonth.getUTCMonth() + 1
      );
    }
  }

  const weekdayNames = [
    "Sunday", "Monday", "Tuesday", "Wednesday",
    "Thursday", "Friday", "Saturday"
  ];

  // Exclude week-offs and holidays.
  return dates
    .filter(date => {
      const dateString = formatDate(date);
      const weekday = weekdayNames[date.getUTCDay()];

      return (
        !weekOffSet.has(weekday) &&
        !holidaySet.has(dateString)
      );
    })
    .map(formatDate);
}

const createChecklist = async (body, currentUserId) => {
  const {
    employee_id,
    checklist_name,
    frequency,
    start_date,
    end_date,
    recurrence_pattern = null,
    week_off = ["Saturday", "Sunday"],
    excluded_holidays = []
  } = body || {};

  // Validate checklist name.
  if (
    typeof checklist_name !== "string" ||
    !checklist_name.trim()
  ) {
    throw createError("Checklist name is required");
  }

  const checklistName = checklist_name.trim();

  // Validate employee.
  if (!isValidId(employee_id)) {
    throw createError("Invalid employee selection");
  }

  const employeeId = Number(employee_id);

  // Validate frequency.
  if (!["Daily", "Weekly", "Monthly"].includes(frequency)) {
    throw createError("Invalid checklist frequency");
  }

  // Validate logged-in user.
  if (!isValidId(currentUserId)) {
    throw createError("Invalid logged-in user", 401);
  }

  currentUserId = Number(currentUserId);

  // Validate dates.
  const start = getValidDate(start_date);
  const end = getValidDate(end_date);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    throw createError(
      "Invalid dates. Please select valid dates"
    );
  }

  if (start > end) {
    throw createError(
      "End date must be on or after start date"
    );
  }

  // Validate weekly recurrence.
  if (frequency === "Weekly") {
    const match =
      /^weekly:([0-6](?:,[0-6])*)$/.exec(
        recurrence_pattern || ""
      );

    const selectedDays = match
      ? match[1].split(",").map(Number)
      : [];

    if (
      !match ||
      selectedDays.length === 0 ||
      new Set(selectedDays).size !== selectedDays.length
    ) {
      throw createError(
        "Please select at least one valid Repeat On day"
      );
    }
  }

  // Validate monthly recurrence.
  if (
    frequency === "Monthly" &&
    !isValidMonthlyPattern(recurrence_pattern)
  ) {
    throw createError(
      "Invalid monthly recurrence selection"
    );
  }

  // Validate week-offs.
  const validWeekdays = [
    "Sunday", "Monday", "Tuesday", "Wednesday",
    "Thursday", "Friday", "Saturday"
  ];

  if (
    !Array.isArray(week_off) ||
    week_off.some(day =>
      typeof day !== "string" ||
      !validWeekdays.includes(day)
    ) ||
    new Set(week_off).size !== week_off.length
  ) {
    throw createError("Invalid week-off selection");
  }

  // Validate excluded holidays.
  if (
    !Array.isArray(excluded_holidays) ||
    excluded_holidays.some(date =>
      typeof date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      Number.isNaN(getValidDate(date).getTime())
    )
  ) {
    throw createError("Invalid holiday selection");
  }

  if (
    new Set(excluded_holidays).size !==
    excluded_holidays.length
  ) {
    throw createError("Duplicate holiday selection");
  }

  // Check employee.
  const employeeExists =
    await repository.employeeExists(employeeId);

  if (!employeeExists) {
    throw createError(
      "Selected employee was not found",
      404
    );
  }

  // Verify selected holidays.
  const selectedHolidays =
    await repository.getSelectedHolidays(excluded_holidays);

  if (selectedHolidays.length !== excluded_holidays.length) {
    throw createError(
      "One or more selected holidays were not found"
    );
  }

  // Generate occurrence dates.
  const occurrenceDates = getOccurrenceDates(
    start,
    end,
    frequency,
    recurrence_pattern,
    week_off,
    selectedHolidays
  );

  if (occurrenceDates.length === 0) {
    throw createError(
      "No checklist dates are available after excluding week-offs and holidays"
    );
  }

  const isDelegating = employeeId !== currentUserId;

  const result = await repository.createChecklist({
    checklistName,
    frequency,
    startDate: formatDate(start),
    endDate: formatDate(end),
    employeeId,
    currentUserId,
    recurrencePattern: recurrence_pattern,
    weekOff: week_off,
    occurrenceDates,
    isDelegating
  });

  return {
    message: isDelegating
      ? "Checklist delegation request sent successfully"
      : "Checklist created successfully",
    checklist_id: result.checklistId,
    occurrence_count: result.occurrenceCount
  };
};

// Get checklist occurrences.
const getOccurrences = async (userId, condition) => {
  return repository.getOccurrences(userId, condition);
};

// Get my checklists.
const getMyChecklists = async userId => {
  return repository.getMyChecklists(userId);
};

// Get today's checklists.
const getTodayChecklists = async userId => {
  return getOccurrences(
    userId,
    "o.occurrence_date = CURDATE() AND o.status = 'pending'"
  );
};

// Get delayed checklists.
const getDelayedChecklists = async userId => {
  return getOccurrences(
    userId,
    "o.occurrence_date < CURDATE() AND o.status = 'pending'"
  );
};

// Get completed checklists.
const getCompletedChecklists = async userId => {
  return getOccurrences(
    userId,
    "o.status = 'completed'"
  );
};

// Get upcoming checklists.
const getUpcomingChecklists = async userId => {
  return getOccurrences(
    userId,
    "o.occurrence_date > CURDATE() AND o.status = 'pending'"
  );
};

// Get delegated checklists.
const getDelegatedChecklists = async userId => {
  return repository.getDelegatedChecklists(userId);
};

// Complete checklist.
const markChecklistAsCompleted = async (id, userId) => {
  if (!isValidId(id)) {
    throw createError(
      "Invalid checklist occurrence ID"
    );
  }

  if (!isValidId(userId)) {
    throw createError("Invalid logged-in user", 401);
  }

  const affectedRows =
    await repository.completeOccurrence(
      Number(id),
      Number(userId)
    );

  if (affectedRows === 0) {
    throw createError(
      "Checklist occurrence not found or already completed",
      404
    );
  }

  return {
    message: "Checklist completed successfully"
  };
};

// Delegate checklist.
const delegateChecklist = async (id, body, userId) => {
  const { delegated_to } = body || {};

  if (!isValidId(id)) {
    throw createError("Invalid checklist ID");
  }

  if (!isValidId(delegated_to)) {
    throw createError("Please select a valid employee");
  }

  if (!isValidId(userId)) {
    throw createError("Invalid logged-in user", 401);
  }

  const employeeId = Number(delegated_to);
  const currentUserId = Number(userId);

  if (employeeId === currentUserId) {
    throw createError(
      "You cannot delegate a checklist to yourself"
    );
  }

  await repository.delegateChecklist(
    Number(id),
    currentUserId,
    employeeId
  );

  return {
    message: "Delegation request sent successfully"
  };
};

// Accept delegation.
const acceptDelegation = async (id, userId) => {
  if (!isValidId(id)) {
    throw createError("Invalid delegation ID");
  }

  if (!isValidId(userId)) {
    throw createError("Invalid logged-in user", 401);
  }

  await repository.respondToDelegation(
    Number(id),
    Number(userId),
    "accept"
  );

  return {
    message: "Checklist delegation accepted successfully"
  };
};

// Reject delegation.
const rejectDelegation = async (id, userId) => {
  if (!isValidId(id)) {
    throw createError("Invalid delegation ID");
  }

  if (!isValidId(userId)) {
    throw createError("Invalid logged-in user", 401);
  }

  await repository.respondToDelegation(
    Number(id),
    Number(userId),
    "reject"
  );

  return {
    message: "Checklist delegation rejected"
  };
};

// Get holidays.
const getHolidays = async () => {
  return repository.getHolidays();
};

module.exports = {
  createChecklist,
  getEmployees: () => repository.getEmployees(),
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
