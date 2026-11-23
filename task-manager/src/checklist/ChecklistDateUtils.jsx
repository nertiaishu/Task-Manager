
export const weekdays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];

export const repeatDays = [
  { label: "M", day: "Monday", value: 1 },
  { label: "T", day: "Tuesday", value: 2 },
  { label: "W", day: "Wednesday", value: 3 },
  { label: "T", day: "Thursday", value: 4 },
  { label: "F", day: "Friday", value: 5 },
  { label: "S", day: "Saturday", value: 6 },
  { label: "S", day: "Sunday", value: 0 }
];

// Get selected weekly days.
export const getSelectedRepeatDays = (recurrencePattern) => {
  if (!recurrencePattern?.startsWith("weekly:")) {
    return [];
  }

  return recurrencePattern
    .replace("weekly:", "")
    .split(",")
    .filter(value => value !== "")
    .map(Number);
};

// Get the nth weekday of a month.
export const getNthWeekday = (year, month, nth, weekday) => {
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

  return result.getUTCMonth() === month ? result : null;
};

// Calculate checklist occurrence dates.
export const getPreviewDates = (
  startDate,
  endDate,
  frequency,
  weekOff,
  holidays,
  recurrencePattern
) => {
  if (!startDate || !endDate || !frequency) {
    return [];
  }

  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    start > end
  ) {
    return [];
  }

  const dates = [];
  const selectedDays = getSelectedRepeatDays(recurrencePattern);

  if (frequency === "Weekly" && selectedDays.length === 0) {
    return [];
  }

  // Monthly occurrence generation.
  if (frequency === "Monthly") {
    if (!recurrencePattern) {
      return [];
    }

    let year = start.getUTCFullYear();
    let month = start.getUTCMonth();

    while (true) {
      let occurrence = null;

      // Same day of every month.
      if (recurrencePattern.startsWith("day:")) {
        const requestedDay = Number(
          recurrencePattern.split(":")[1]
        );

        if (
          !Number.isInteger(requestedDay) ||
          requestedDay < 1 ||
          requestedDay > 31
        ) {
          return [];
        }

        const lastDayOfMonth = new Date(
          Date.UTC(year, month + 1, 0)
        ).getUTCDate();

        occurrence = new Date(
          Date.UTC(
            year,
            month,
            Math.min(requestedDay, lastDayOfMonth)
          )
        );
      }

      // Nth weekday of every month.
      else if (recurrencePattern.startsWith("nth:")) {
        const parts = recurrencePattern.split(":");

        if (parts.length !== 3) {
          return [];
        }

        occurrence = getNthWeekday(
          year,
          month,
          Number(parts[1]),
          parts[2]
        );
      } else {
        return [];
      }

      if (occurrence && occurrence > end) {
        break;
      }

      if (occurrence && occurrence >= start && occurrence <= end) {
        const dateString = occurrence.toISOString().slice(0, 10);
        const dayName = weekdays[occurrence.getUTCDay()];

        if (
          !weekOff.includes(dayName) &&
          !holidays.includes(dateString)
        ) {
          dates.push(dateString);
        }
      }

      month++;

      if (month > 11) {
        month = 0;
        year++;
      }
    }

    return dates;
  }

  // Daily and Weekly occurrence generation.
  const current = new Date(start);

  while (current <= end) {
    const dateString = current.toISOString().slice(0, 10);
    const dayName = weekdays[current.getUTCDay()];

    let shouldAddDate = false;

    if (frequency === "Daily") {
      shouldAddDate = true;
    } else if (frequency === "Weekly") {
      shouldAddDate = selectedDays.includes(
        current.getUTCDay()
      );
    } else {
      return [];
    }

    if (
      shouldAddDate &&
      !weekOff.includes(dayName) &&
      !holidays.includes(dateString)
    ) {
      dates.push(dateString);
    }

    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
};

// Format date as DD-MM-YYYY.
export const formatDate = (date) => {
  const value = String(date).slice(0, 10);
  const [year, month, day] = value.split("-");

  return `${day}-${month}-${year}`;
};
