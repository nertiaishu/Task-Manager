
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import Header from "./Header";
import Toast from "./Notification";
import Sidebar from "./Sidebar";
import TaskStatus from "./TaskStatus";
import DelegateTask from "./DelegateTask";

const API = "http://localhost:5000";

// Get today's date in YYYY-MM-DD format
function getLocalDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// Convert date into YYYY-MM-DD format
function normalizeDate(value) {
  if (!value) return "";

  if (value instanceof Date) {
    return getLocalDate(value);
  }

  return String(value).slice(0, 10);
}

// Get logged-in user from sessionStorage
function getStoredUser() {
  try {
    const stored = JSON.parse(
      sessionStorage.getItem("user") || "null"
    );

    return stored?.user ?? stored;
  } catch {
    return null;
  }
}

// Get logged-in user's ID
function getUserId(user) {
  return (
    user?.id ??
    user?.user_id ??
    user?.userId ??
    user?.employee_id ??
    null
  );
}

function TaskManager() {
  const navigate = useNavigate();
  const location = useLocation();

  // Main states
  const [tasks, setTasks] = useState([]);
  const [activePage, setActivePage] = useState("status");
  const [activeTab, setActiveTab] = useState("Today");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");

  const [employees, setEmployees] = useState([]);

  // Toast notification state
  const [toast, setToast] = useState({
    message: "",
    type: "success",
  });

  // Logged-in user
  const [user] = useState(getStoredUser);
  const loggedInUserId = getUserId(user);

  // Show toast message
  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  // Common API headers
  function getHeaders() {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${
        sessionStorage.getItem("authToken") || ""
      }`,
    };
  }

  // Read API response
  async function readResponse(response) {
    const text = await response.text();

    try {
      return text ? JSON.parse(text) : {};
    } catch {
      return {
        message: "Unable to parse server response.",
      };
    }
  }

  // Show message received through navigation
  useEffect(() => {
    if (!location.state?.message) return;

    showToast(location.state.message, "success");

    navigate(location.pathname, {
      replace: true,
      state: null,
    });
  }, [
    location.state?.message,
    location.pathname,
    navigate,
    showToast,
  ]);

  // Automatically close toast after 3 seconds
  useEffect(() => {
    if (!toast.message) return;

    const timer = setTimeout(() => {
      setToast({
        message: "",
        type: "success",
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [toast.message, toast.type]);

  // Logout
  function logout() {
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("user");

    navigate("/auth/login", {
      replace: true,
    });
  }

  // Load tasks from backend
  const loadTasks = useCallback(async () => {
    try {
      const [myResponse, delegatedResponse] = await Promise.all([
        fetch(`${API}/api/tasks/my-tasks`, {
          headers: getHeaders(),
        }),

        fetch(`${API}/api/tasks/delegated`, {
          headers: getHeaders(),
        }),
      ]);

      const myData = await readResponse(myResponse);
      const delegatedData = await readResponse(delegatedResponse);

      if (!myResponse.ok) {
        showToast(
          myData.message || "Unable to load your tasks.",
          "error"
        );
        return;
      }

      if (!delegatedResponse.ok) {
        showToast(
          delegatedData.message ||
            "Unable to load delegated tasks.",
          "error"
        );
        return;
      }

      // Get task array from API response
      const getTaskList = (data) => {
        if (Array.isArray(data)) return data;

        if (Array.isArray(data.tasks)) {
          return data.tasks;
        }

        return [];
      };

      // Combine both task lists
      const taskList = [
        ...getTaskList(myData),
        ...getTaskList(delegatedData),
      ];

      // Remove duplicate tasks
      const uniqueTasks = Array.from(
        new Map(
          taskList.map((task) => [
            String(task.id),
            task,
          ])
        ).values()
      );

      // Convert backend task data into frontend format
      const mappedTasks = uniqueTasks.map((task) => {
        const status = String(
          task.status || "Pending"
        ).trim();

        const completed =
          status.toLowerCase() === "completed";

        const creatorId = task.assigned_by ?? null;
        const assignedToId = task.user_id ?? null;

        const isSelfCreated =
          creatorId != null &&
          loggedInUserId != null &&
          String(creatorId) === String(loggedInUserId);

        const isAssignedToSelf =
          assignedToId != null &&
          loggedInUserId != null &&
          String(assignedToId) === String(loggedInUserId);

        const isSelfAssigned =
          creatorId != null &&
          assignedToId != null &&
          String(creatorId) === String(assignedToId);

        const acceptanceStatus = String(
          task.acceptance_status || ""
        )
          .trim()
          .toLowerCase();

        return {
          id: task.id,
          delegationId: null,

          title: task.title || "",

          plannedDate: normalizeDate(
            task.planned_date
          ),

          completed_date: normalizeDate(
            task.completed_date
          ),

          acceptance_status: acceptanceStatus,

          employee: task.assigned_to_name || "",

          assignedBy: isSelfAssigned
            ? "Self Assigned"
            : task.assigned_by_name || "",

          delegatedBy: task.delegated_by_name || "",

          assignedToId,

          lastDelegatedBy:
            task.last_delegated_by ?? null,

          status: completed ? "Completed" : "Pending",

          completed,

          createdBy: creatorId,

          isSelfCreated,
          isAssignedToSelf,
          isSelfAssigned,
        };
      });

      setTasks(mappedTasks);
    } catch (error) {
      console.error("Load tasks error:", error);

      showToast("Unable to load tasks.", "error");
    }
  }, [loggedInUserId, showToast]);

  // Load employees from backend
  const loadEmployees = useCallback(async () => {
    try {
      const response = await fetch(
        `${API}/api/tasks/employees`,
        {
          headers: getHeaders(),
        }
      );

      const data = await readResponse(response);

      if (!response.ok) {
        showToast(
          data.message || "Unable to load employees.",
          "error"
        );
        return;
      }

      const employeeList = Array.isArray(data)
        ? data
        : Array.isArray(data.employees)
          ? data.employees
          : [];

      setEmployees(employeeList);
    } catch (error) {
      console.error("Load employees error:", error);

      showToast("Unable to load employees.", "error");
    }
  }, [showToast]);

  // Check authentication and load initial data
  useEffect(() => {
    if (
      !sessionStorage.getItem("authToken") ||
      !user
    ) {
      navigate("/auth/login", {
        replace: true,
      });

      return;
    }

    loadTasks();
    loadEmployees();
  }, [loadTasks, loadEmployees, navigate, user]);

  // Accept task
  async function acceptTask(taskId) {
    try {
      const response = await fetch(
        `${API}/api/tasks/${taskId}/accept`,
        {
          method: "PATCH",
          headers: getHeaders(),
        }
      );

      const data = await readResponse(response);

      if (!response.ok) {
        showToast(
          data.message || "Unable to accept task.",
          "error"
        );
        return;
      }

      await loadTasks();

      setActiveTab("Today");

      showToast("Task accepted successfully.");
    } catch (error) {
      console.error("Accept task error:", error);

      showToast("Unable to accept task.", "error");
    }
  }

  // Reject task
  async function rejectTask(taskId) {
    try {
      const response = await fetch(
        `${API}/api/tasks/${taskId}/reject`,
        {
          method: "PATCH",
          headers: getHeaders(),
        }
      );

      const data = await readResponse(response);

      if (!response.ok) {
        showToast(
          data.message || "Unable to reject task.",
          "error"
        );
        return;
      }

      await loadTasks();

      setActiveTab("Today");

      showToast(
        "Task rejected and returned successfully."
      );
    } catch (error) {
      console.error("Reject task error:", error);

      showToast("Unable to reject task.", "error");
    }
  }

  // Delegate task to another employee
  async function delegateTask(taskId, employeeId) {
    if (!employeeId) return;

    try {
      const response = await fetch(
        `${API}/api/tasks/${taskId}/delegate`,
        {
          method: "PATCH",
          headers: getHeaders(),

          body: JSON.stringify({
            user_id: Number(employeeId),
          }),
        }
      );

      const data = await readResponse(response);

      if (!response.ok) {
        showToast(
          data.message || "Unable to delegate task.",
          "error"
        );
        return;
      }

      await loadTasks();

      showToast("Task delegated successfully.");
    } catch (error) {
      console.error("Delegate task error:", error);

      showToast("Unable to delegate task.", "error");
    }
  }

  // Mark task as completed
  async function toggleTask(id, status) {
    if (status === "Completed") return;

    try {
      const response = await fetch(
        `${API}/api/tasks/${id}/status`,
        {
          method: "PATCH",
          headers: getHeaders(),

          body: JSON.stringify({
            status: "Completed",
          }),
        }
      );

      const data = await readResponse(response);

      if (!response.ok) {
        showToast(
          data.message || "Failed to complete task.",
          "error"
        );
        return;
      }

      await loadTasks();

      setActiveTab("Completed");

      showToast("Task marked as completed.");
    } catch (error) {
      console.error(
        "Update task status error:",
        error
      );

      showToast(
        "Unable to update task status.",
        "error"
      );
    }
  }

  // Today's date
  const todayString = getLocalDate();

  // Tasks assigned to logged-in employee
  const myTasks = tasks.filter(
    (task) => task.isAssignedToSelf
  );

  // Accepted tasks
  const acceptedTasks = myTasks.filter(
    (task) =>
      task.acceptance_status === "accepted"
  );

  // Awaiting acceptance tasks
  const awaitingAcceptanceTasks = myTasks.filter(
    (task) =>
      task.acceptance_status === "awaitingacceptance" &&
      !task.completed
  );

  // Delegated tasks waiting for action
  const delegatedTasks = myTasks.filter(
    (task) =>
      task.acceptance_status === "delegatedpending" &&
      !task.completed
  );

  // Completed tasks
  const completedTasks = myTasks.filter(
    (task) => task.completed
  );

  // Today's tasks
  const todayTasks = acceptedTasks.filter(
    (task) =>
      task.plannedDate === todayString &&
      !task.completed
  );

  // Delayed tasks
  const delayedTasks = acceptedTasks.filter(
    (task) =>
      task.plannedDate &&
      task.plannedDate < todayString &&
      !task.completed
  );

  // Upcoming tasks
  const upcomingTasks = acceptedTasks.filter(
    (task) =>
      task.plannedDate &&
      task.plannedDate > todayString &&
      !task.completed
  );

  // WDS tabs
  const tabs = [
    {
      id: "Today",
      label: "Today's Tasks",
      count: todayTasks.length,
    },
    {
      id: "Delayed",
      label: "Delayed Tasks",
      count: delayedTasks.length,
    },
    {
      id: "Completed",
      label: "Completed Tasks",
      count: completedTasks.length,
    },
    {
      id: "Upcoming",
      label: "Upcoming Tasks",
      count: upcomingTasks.length,
    },
    {
      id: "AwaitingAcceptance",
      label: "Awaiting Acceptance",
      count: awaitingAcceptanceTasks.length,
    },
    {
      id: "Delegated",
      label: "Delegated Tasks",
      count: delegatedTasks.length,
    },
  ];

  // Task data for each tab
  const taskSources = {
    Today: todayTasks,
    Delayed: delayedTasks,
    Completed: completedTasks,
    Upcoming: upcomingTasks,
    AwaitingAcceptance: awaitingAcceptanceTasks,
    Delegated: delegatedTasks,
  };

  const visibleTaskSource =
    taskSources[activeTab] || [];

  // Search and employee filtering
  const visibleTasks = visibleTaskSource.filter(
    (task) => {
      const search = searchTerm.trim().toLowerCase();

      const matchesSearch =
        String(task.id).toLowerCase().includes(search) ||
        task.title.toLowerCase().includes(search) ||
        String(task.assignedBy).toLowerCase().includes(search) ||
        String(task.delegatedBy).toLowerCase().includes(search);

      const matchesEmployee =
        selectedEmployee === "" ||
        String(task.assignedToId) ===
          String(selectedEmployee);

      return matchesSearch && matchesEmployee;
    }
  );

  // Completed tab does not need action buttons
  const showActions = activeTab !== "Completed";

  // Main content styling
  // const panelClass =
  //   "min-h-[600px] rounded-xl border border-[#e3e6f0] bg-white p-3 shadow-[0_3px_14px_rgba(35,42,70,0.035)] min-[421px]:p-4 min-[1001px]:p-[22px]";
 
  // Main content styling
const panelClass =
  "min-h-[600px] rounded-xl border border-[#e3e6f0] bg-white p-7 shadow-[0_3px_14px_rgba(35,42,70,0.035)]";
  return (
    <main className="min-h-screen bg-[#f5f6fb] p-3 font-[Arial,Helvetica,sans-serif] text-[#303545] min-[721px]:p-6">

      {/* Header */}
      <Header
        user={user}
        onLogout={logout}
      />

      {/* Toast Notification */}
      <Toast
        notification={toast}
        onClose={() =>
          setToast({
            message: "",
            type: "success",
          })
        }
      />

      {/* WDS Content */}
      <div className="mt-[22px] grid grid-cols-1 items-start gap-3 min-[721px]:grid-cols-[180px_minmax(0,1fr)] min-[721px]:gap-5 min-[1001px]:grid-cols-[210px_minmax(0,1fr)]">

        {/* Sidebar */}
        <Sidebar
          activePage={activePage}
          setActivePage={setActivePage}
        />

        {/* Main Section */}
        <section className="min-w-0">

          {/* Task Status */}
          {activePage === "status" && (
            <TaskStatus
              panelClass={panelClass}
              tabs={tabs}
              activeTab={activeTab}
              setActiveTab={(tab) => {
                setActiveTab(tab);
                setSelectedEmployee("");
              }}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              visibleTasks={visibleTasks}
              employees={employees}
              delegateTask={delegateTask}
              acceptTask={acceptTask}
              rejectTask={rejectTask}
              showActions={showActions}
              toggleTask={toggleTask}
            />
          )}

          {/* Delegate Task Page */}
          {activePage === "delegate" && (
            <DelegateTask
              panelClass={panelClass}
              employees={employees}
              showToast={showToast}
              onTaskCreated={async () => {
                await loadTasks();

                setActivePage("status");
                setSearchTerm("");
                setSelectedEmployee("");
                setActiveTab("Today");
              }}
            />
          )}

        </section>
      </div>
    </main>
  );
}

export default TaskManager;
