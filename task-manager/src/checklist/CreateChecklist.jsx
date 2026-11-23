
import React, { useState, useEffect } from "react";

import WeekOffModal from "./WeekOffModal";
import HolidaysModal from "./HolidaysModal";

import {
  repeatDays,
  getSelectedRepeatDays,
  getPreviewDates,
  formatDate
} from "./checklistDateUtils";

const API = import.meta.env.VITE_API_URL;

export default function CreateChecklist({ onSaveSuccess }) {

  // Form state.
  const [formData, setFormData] = useState({
    employee_id: "",
    frequency: "",
    checklist_name: "",
    start_date: "",
    end_date: "",
    recurrence_pattern: "",
    week_off: ["Saturday", "Sunday"]
  });

  // Employee and holiday states.
  const [employees, setEmployees] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [selectedHolidayDates, setSelectedHolidayDates] = useState([]);

  // Loading states.
  const [loading, setLoading] = useState(false);
  const [fetchingEmployees, setFetchingEmployees] = useState(true);

  // Popup states.
  const [showWeekOff, setShowWeekOff] = useState(false);
  const [showHolidays, setShowHolidays] = useState(false);

  const [weekOffDraft, setWeekOffDraft] = useState([
    "Saturday",
    "Sunday"
  ]);

  const [holidayDraft, setHolidayDraft] = useState([]);

  // Toast state.
  const [toast, setToast] = useState(null);

  // Get authentication token.
  const getToken = () =>
    sessionStorage.getItem("authToken") ||
    localStorage.getItem("token");

  // Request headers.
  const getHeaders = () => ({
    Authorization: `Bearer ${getToken()}`
  });

  // Display toast.
  const showMessage = (message, type = "success") => {
    setToast({ message, type });
  };

  // Automatically close toast.
  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast(null);
    }, 3000);

    return () => clearTimeout(timer);
  }, [toast]);

  // Load employees and holidays.
  useEffect(() => {
    fetchEmployees();
    fetchHolidays();
  }, []);

  // Fetch employees.
  const fetchEmployees = async () => {
    try {
      const response = await fetch(
        `${API}/api/checklists/employees`,
        {
          headers: getHeaders()
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load employees"
        );
      }

      setEmployees(Array.isArray(data) ? data : []);

    } catch (error) {
      console.error("Employee loading error:", error);
      showMessage(error.message, "error");

    } finally {
      setFetchingEmployees(false);
    }
  };

  // Fetch holidays.
  const fetchHolidays = async () => {
    try {
      const response = await fetch(
        `${API}/api/checklists/holidays`,
        {
          headers: getHeaders()
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load holidays"
        );
      }

      const holidayList = Array.isArray(data) ? data : [];

      setHolidays(holidayList);

      // Select all holidays by default.
      setSelectedHolidayDates(previous => {
        const availableDates = holidayList.map(holiday =>
          String(holiday.holiday_date).slice(0, 10)
        );

        const existingDates = previous.filter(date =>
          availableDates.includes(date)
        );

        const newDates = availableDates.filter(date =>
          !previous.includes(date)
        );

        return [...existingDates, ...newDates];
      });

    } catch (error) {
      console.error("Holiday loading error:", error);
      showMessage(error.message, "error");
    }
  };

  // Handle form input changes.
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData(previous => {
      const updated = {
        ...previous,
        [name]: value
      };

      // Set default monthly recurrence.
      if (name === "frequency") {
        if (value === "Monthly") {
          updated.recurrence_pattern = previous.start_date
            ? `day:${Number(previous.start_date.split("-")[2])}`
            : "";
        } else {
          updated.recurrence_pattern = "";
        }
      }

      // Update monthly recurrence when start date changes.
      if (
        name === "start_date" &&
        previous.frequency === "Monthly"
      ) {
        if (
          !previous.recurrence_pattern ||
          previous.recurrence_pattern.startsWith("day:")
        ) {
          updated.recurrence_pattern = value
            ? `day:${Number(value.split("-")[2])}`
            : "";
        }
      }

      return updated;
    });
  };

  // Select or unselect weekly repeat days.
  const toggleRepeatDay = (dayValue) => {
    const selectedDays = getSelectedRepeatDays(
      formData.recurrence_pattern
    );

    const updatedDays = selectedDays.includes(dayValue)
      ? selectedDays.filter(day => day !== dayValue)
      : [...selectedDays, dayValue];

    const recurrencePattern = updatedDays.length > 0
      ? `weekly:${updatedDays.sort((a, b) => a - b).join(",")}`
      : "";

    setFormData(previous => ({
      ...previous,
      recurrence_pattern: recurrencePattern
    }));
  };

  // Get selected weekly days.
  const selectedRepeatDays = getSelectedRepeatDays(
    formData.recurrence_pattern
  );

  // Calculate live occurrence preview.
  const previewDates = getPreviewDates(
    formData.start_date,
    formData.end_date,
    formData.frequency,
    formData.week_off,
    selectedHolidayDates,
    formData.recurrence_pattern
  );

  // Validate date range.
  const validDateRange =
    formData.start_date &&
    formData.end_date &&
    formData.start_date <= formData.end_date;

  // Open Week-Off popup.
  const openWeekOffPopup = () => {
    setWeekOffDraft([...formData.week_off]);
    setShowWeekOff(true);
  };

  // Apply Week-Off selection.
  const applyWeekOff = () => {
    setFormData(previous => ({
      ...previous,
      week_off: weekOffDraft
    }));

    setShowWeekOff(false);

    showMessage("Week-Off days updated successfully");
  };

  // Open Holidays popup.
  const openHolidayPopup = () => {
    setHolidayDraft([...selectedHolidayDates]);
    setShowHolidays(true);
  };

  // Apply holiday selection.
  const applyHolidays = () => {
    setSelectedHolidayDates(holidayDraft);
    setShowHolidays(false);

    showMessage("Holiday selection updated successfully");
  };

  // Submit checklist.
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!getToken()) {
      showMessage("Please log in again", "error");
      return;
    }

    if (!formData.employee_id) {
      showMessage("Please select an employee", "error");
      return;
    }

    if (!formData.checklist_name.trim()) {
      showMessage("Please enter checklist name", "error");
      return;
    }

    if (
      formData.frequency === "Weekly" &&
      selectedRepeatDays.length === 0
    ) {
      showMessage(
        "Please select at least one Repeat On day",
        "error"
      );
      return;
    }

    if (
      formData.frequency === "Monthly" &&
      !formData.recurrence_pattern
    ) {
      showMessage(
        "Please select a Monthly recurrence pattern",
        "error"
      );
      return;
    }

    if (!validDateRange) {
      showMessage(
        "End date must be on or after start date",
        "error"
      );
      return;
    }

    if (previewDates.length === 0) {
      showMessage(
        "No checklist dates are available with the selected Week-Off and Holidays.",
        "error"
      );
      return;
    }

    setLoading(true);

    try {
      const requestData = {
        ...formData,
        excluded_holidays: selectedHolidayDates
      };

      const response = await fetch(
        `${API}/api/checklists`,
        {
          method: "POST",
          headers: {
            ...getHeaders(),
            "Content-Type": "application/json"
          },
          body: JSON.stringify(requestData)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create checklist"
        );
      }

      showMessage(
        `${data.message || "Checklist created successfully"}${
          data.occurrence_count != null
            ? ` (${data.occurrence_count} occurrences)`
            : ""
        }`
      );

      // Reset form after successful creation.
      setFormData({
        employee_id: "",
        frequency: "",
        checklist_name: "",
        start_date: "",
        end_date: "",
        recurrence_pattern: "",
        week_off: ["Saturday", "Sunday"]
      });

      // Select all holidays again.
      setSelectedHolidayDates(
        holidays.map(holiday =>
          String(holiday.holiday_date).slice(0, 10)
        )
      );

      // Navigate after showing success message.
      if (typeof onSaveSuccess === "function") {
        setTimeout(() => {
          onSaveSuccess();
        }, 1500);
      }

    } catch (error) {
      console.error("Checklist creation error:", error);
      showMessage(error.message, "error");

    } finally {
      setLoading(false);
    }
  };

  // Common input styles.
  const inputClass =
    "w-full min-w-0 p-2.5 rounded-xl border border-slate-200 text-sm bg-[#FAFAFA] text-slate-700 outline-none focus:border-indigo-500";

  const labelClass =
    "text-xs font-semibold text-slate-700";

  return (
    <div className="relative w-full min-w-0 max-w-full overflow-hidden bg-white rounded-2xl p-4 sm:p-5 lg:p-7 border border-slate-100 shadow-sm">

      {/* Toast message */}
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-md bg-white border rounded-lg px-4 py-3 shadow-lg text-sm font-medium text-center ${
            toast.type === "error"
              ? "border-red-200 text-red-600"
              : "border-slate-200 text-slate-700"
          }`}
        >
          {toast.message}
        </div>
      )}

      <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">
        Individual Checklist
      </h2>

      <p className="text-xs sm:text-sm text-slate-500 mb-5 sm:mb-6">
        Create a recurring checklist and assign it to an employee.
      </p>

      <form onSubmit={handleSubmit} className="w-full min-w-0">

        {/* Employee and Frequency */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-5">

          <div className="min-w-0 flex flex-col gap-1.5">
            <label className={labelClass}>
              Employee Name *
            </label>

            <select
              name="employee_id"
              value={formData.employee_id}
              onChange={handleInputChange}
              required
              disabled={fetchingEmployees}
              className={`${inputClass} disabled:opacity-50`}
            >
              <option value="">
                {fetchingEmployees
                  ? "Loading employees..."
                  : "Select employee"}
              </option>

              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-0 flex flex-col gap-1.5">
            <label className={labelClass}>
              Frequency *
            </label>

            <select
              name="frequency"
              value={formData.frequency}
              onChange={handleInputChange}
              required
              className={inputClass}
            >
              <option value="">Select frequency</option>
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
            </select>
          </div>

        </div>

        {/* Weekly Repeat On */}
        {formData.frequency === "Weekly" && (
          <div className="mb-6">

            <label className="block text-xs font-semibold text-slate-700 mb-3">
              Repeat On: *
            </label>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">

              {repeatDays.map(item => {
                const isSelected = selectedRepeatDays.includes(
                  item.value
                );

                return (
                  <button
                    key={item.day}
                    type="button"
                    title={item.day}
                    aria-label={item.day}
                    aria-pressed={isSelected}
                    onClick={() => toggleRepeatDay(item.value)}
                    className={`w-9 h-9 shrink-0 rounded-full border text-xs font-semibold transition-colors ${
                      isSelected
                        ? "bg-[#7965B8] text-white border-[#7965B8]"
                        : "bg-white text-slate-600 border-slate-300 hover:border-[#7965B8] hover:text-[#7965B8]"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}

            </div>

            <p className="text-xs text-slate-500 mt-2">
              Select the days on which the checklist should repeat every week.
            </p>

            {selectedRepeatDays.length === 0 && (
              <p className="text-xs text-red-500 mt-2">
                Please select at least one day.
              </p>
            )}

            {selectedRepeatDays.length > 0 && (
              <p className="text-xs text-indigo-600 mt-2">
                Selected: {repeatDays
                  .filter(item =>
                    selectedRepeatDays.includes(item.value)
                  )
                  .map(item => item.day)
                  .join(", ")}
              </p>
            )}

          </div>
        )}

        {/* Checklist Name, Start Date and End Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 mb-6">

          {/* Checklist Name */}
          <div className="min-w-0 flex flex-col gap-1.5">
            <label className={labelClass}>
              Checklist Name *
            </label>

            <input
              type="text"
              name="checklist_name"
              placeholder="Enter Checklist Name"
              value={formData.checklist_name}
              onChange={handleInputChange}
              required
              className={inputClass}
            />
          </div>

          {/* Start Date */}
          <div className="min-w-0 flex flex-col gap-1.5">
            <label className={labelClass}>
              Start Date *
            </label>

            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleInputChange}
              required
              className={inputClass}
            />

            {formData.start_date && (
              <div className="mt-1 text-xs text-indigo-600 break-words">
                Start date selected: {formatDate(formData.start_date)}

                {!formData.end_date && (
                  <p className="mt-1 text-slate-500">
                    Please select an end date to see the checklist preview.
                  </p>
                )}
              </div>
            )}

            {/* Monthly Recurrence Options */}
            {formData.frequency === "Monthly" &&
              formData.start_date && (
                <div className="mt-3 space-y-3">

                  <label className="block text-xs font-semibold text-slate-700">
                    Repeat On: *
                  </label>

                  <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="monthly_recurrence"
                      value={`day:${Number(formData.start_date.split("-")[2])}`}
                      checked={
                        formData.recurrence_pattern ===
                        `day:${Number(formData.start_date.split("-")[2])}`
                      }
                      onChange={() => {
                        setFormData(previous => ({
                          ...previous,
                          recurrence_pattern: `day:${Number(previous.start_date.split("-")[2])}`
                        }));
                      }}
                      className="w-4 h-4 mt-0.5 shrink-0 accent-[#7965B8]"
                    />

                    <span>
                      On day {Number(formData.start_date.split("-")[2])} of every month
                    </span>
                  </label>

                  <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="monthly_recurrence"
                      value="nth:2:Wednesday"
                      checked={
                        formData.recurrence_pattern === "nth:2:Wednesday"
                      }
                      onChange={() => {
                        setFormData(previous => ({
                          ...previous,
                          recurrence_pattern: "nth:2:Wednesday"
                        }));
                      }}
                      className="w-4 h-4 mt-0.5 shrink-0 accent-[#7965B8]"
                    />

                    <span>
                      On the Second Wednesday of every month
                    </span>
                  </label>

                </div>
              )}

          </div>

          {/* End Date */}
          <div className="min-w-0 flex flex-col gap-1.5">
            <label className={labelClass}>
              End Date *
            </label>

            <input
              type="date"
              name="end_date"
              value={formData.end_date}
              onChange={handleInputChange}
              required
              min={formData.start_date || undefined}
              className={inputClass}
            />

            {formData.start_date &&
              formData.end_date &&
              !validDateRange && (
                <p className="text-xs text-red-500 mt-1">
                  End date must be on or after start date.
                </p>
              )}

            {/* Live Occurrence Preview */}
            {validDateRange && (
              <div className="mt-1 text-xs text-indigo-600 space-y-1 break-words">

                <p>
                  End date selected: {formatDate(formData.end_date)}
                </p>

                {formData.frequency ? (
                  <>
                    {formData.frequency === "Weekly" &&
                    selectedRepeatDays.length === 0 ? (
                      <p className="text-red-500">
                        Select Repeat On days to see the preview.
                      </p>
                    ) : formData.frequency === "Monthly" &&
                      !formData.recurrence_pattern ? (
                      <p className="text-red-500">
                        Select a Monthly recurrence pattern to see the preview.
                      </p>
                    ) : (
                      <>
                        <p className="font-semibold">
                          Total checklist occurrences: {previewDates.length}
                        </p>

                        {previewDates.length === 0 && (
                          <p className="text-red-500">
                            No checklist dates are available with the selected Week-Off and Holidays.
                          </p>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <p className="text-slate-500">
                    Select a frequency to see the occurrence count.
                  </p>
                )}

              </div>
            )}

          </div>

        </div>

        {/* Week-Off and Holidays Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">

          <button
            type="button"
            onClick={openWeekOffPopup}
            className="bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-xs font-semibold hover:bg-indigo-700 flex items-center gap-2"
          >
            Week-Off

            <span className="bg-white text-indigo-600 rounded px-1.5 py-0.5 text-[10px] font-bold">
              {formData.week_off.length}
            </span>
          </button>

          <button
            type="button"
            onClick={openHolidayPopup}
            className="bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-xs font-semibold hover:bg-indigo-700"
          >
            Holidays

            <span className="ml-2 bg-white text-indigo-600 rounded px-1.5 py-0.5 text-[10px]">
              {selectedHolidayDates.length}
            </span>
          </button>

        </div>

        {/* Create Button */}
        <div className="flex justify-end mt-5">

          <button
            type="submit"
            disabled={loading || fetchingEmployees}
            className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create"}
          </button>

        </div>

      </form>

      {/* Week-Off Modal */}
      <WeekOffModal
        show={showWeekOff}
        weekOffDraft={weekOffDraft}
        setWeekOffDraft={setWeekOffDraft}
        onClose={() => setShowWeekOff(false)}
        onApply={applyWeekOff}
      />

      {/* Holidays Modal */}
      <HolidaysModal
        show={showHolidays}
        holidays={holidays}
        holidayDraft={holidayDraft}
        setHolidayDraft={setHolidayDraft}
        checklistName={formData.checklist_name}
        onClose={() => setShowHolidays(false)}
        onApply={applyHolidays}
      />

    </div>
  );
}
