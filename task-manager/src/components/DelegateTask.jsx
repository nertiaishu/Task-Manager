
import { useState } from "react";

const API = "http://localhost:5000";

function DelegateTask({
  panelClass,
  employees = [],
  onTaskCreated,
  showToast = () => {},
}) {
  const [employee, setEmployee] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [plannedDate, setPlannedDate] = useState("");
  const [loading, setLoading] = useState(false);

  const today = new Date();

  const minDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  const inputClass =
    "w-full rounded-lg border border-[#dfe2ec] bg-white px-3 py-3 text-sm text-[#303545] transition-colors focus:border-[#6653bd] focus:outline-none focus:ring-2 focus:ring-[#6653bd]/15";

  function getHeaders() {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sessionStorage.getItem("authToken") || ""}`,
    };
  }

  async function readResponse(response) {
    const text = await response.text();

    try {
      return text ? JSON.parse(text) : {};
    } catch {
      return {
        message: "Invalid server response. Please check the backend.",
      };
    }
  }

  async function addTask(event) {
    event.preventDefault();

    const title = taskTitle.trim();

    if (!title) {
      showToast("Please enter a task title.", "error");
      return;
    }

    if (title.length > 150) {
      showToast("Task title cannot exceed 150 characters.", "error");
      return;
    }

    if (!employee) {
      showToast("Please select a user.", "error");
      return;
    }

    if (!plannedDate) {
      showToast("Please select a planned date.", "error");
      return;
    }

    if (plannedDate < minDate) {
      showToast("Planned date cannot be in the past.", "error");
      return;
    }

    const taskData = {
      title,
      user_id: Number(employee),
      planned_date: plannedDate,
    };

    try {
      setLoading(true);

      const response = await fetch(`${API}/api/tasks/assign`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(taskData),
      });

      const data = await readResponse(response);

      if (!response.ok) {
        showToast(data.message || "Failed to assign task.", "error");
        return;
      }

      setEmployee("");
      setTaskTitle("");
      setPlannedDate("");

      await onTaskCreated?.();

      showToast(
        data.message || "Task assigned successfully.",
        "success"
      );
    } catch (error) {
      console.error("Add task error:", error);
      showToast("Unable to connect to the server.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={panelClass}>
      <h2 className="mb-2 mt-0 text-[21px] font-semibold text-[#252a40]">
        Create Task
      </h2>

      <p className="mb-6 mt-0 text-[13px] text-[#7b8090]">
        Create a task and assign it to a user.
      </p>

      <form onSubmit={addTask}>
        <div className="grid grid-cols-1 gap-5 min-[721px]:grid-cols-2">
          <div>
            <label
              htmlFor="taskTitle"
              className="mb-2 block text-[13px] font-semibold text-[#46506a]"
            >
              Task Title
            </label>

            <input
              id="taskTitle"
              type="text"
              className={inputClass}
              placeholder="Enter task title"
              value={taskTitle}
              onChange={(event) => setTaskTitle(event.target.value)}
              maxLength={150}
              required
            />

            <p className="mt-1 text-right text-xs text-[#9297a6]">
              {taskTitle.length}/150
            </p>
          </div>

          <div>
            <label
              htmlFor="assignedEmployee"
              className="mb-2 block text-[13px] font-semibold text-[#46506a]"
            >
              Assigned To
            </label>

            <select
              id="assignedEmployee"
              className={inputClass}
              value={employee}
              onChange={(event) => setEmployee(event.target.value)}
              required
            >
              <option value="">Select user</option>

              {employees.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="plannedDate"
              className="mb-2 block text-[13px] font-semibold text-[#46506a]"
            >
              Planned Date
            </label>

            <input
              id="plannedDate"
              type="date"
              className={inputClass}
              value={plannedDate}
              onChange={(event) => setPlannedDate(event.target.value)}
              min={minDate}
              required
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-[#6653bd] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#5744a9] focus:outline-none focus:ring-2 focus:ring-[#6653bd]/40 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating Task..." : "Add Task"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default DelegateTask;
