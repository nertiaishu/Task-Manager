
import { useNavigate, useLocation } from "react-router-dom";

function Header({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  //getting user name
  const fullName =
    user?.full_name ||
    user?.fullName ||
    user?.name ||
    user?.username ||
    "User";

    //generating employee id
  const employeeId =
    user?.employee_id ||
    user?.employeeId ||
    (user?.id
      ? `EMP${String(user.id).padStart(3, "0")}`
      : "EMP001");

  // Identify the active module using the browser URL
  const activeModule = location.pathname.startsWith("/checklist")
    ? "CHECKLIST"
    : "WDS";

  const getInitials = (name) => {
    const parts = name.trim().split(/\s+/);

    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    return name.slice(0, 2).toUpperCase();
  };

  // Navigate between WDS and Checklist pages
  const handleModuleChange = (tab) => {
    if (tab === "WDS") {
      navigate("/tasks");
    } else {
      navigate("/checklist");
    }
  };

  return (
    <header className="w-full rounded-xl border-purple-800 bg-white shadow-2xl">
      <div className="flex items-center justify-between sm:gap-4 lg:px-6 py-3">
  
        {/* Logo and module navigation */}
        <div className="flex items-center gap-3">

          <div className="mr-4">
            <h1 className="text-xl font-bold text-indigo-700">
              TASKFLOW
            </h1>

            <p className="mt-0.5 text-xs text-gray-500">
              Task Management System
            </p>
          </div>

          {/* WDS and Checklist */}
          <div className="flex border rounded-lg px-2 py-2 items-center gap-2">
            {["WDS", "CHECKLIST"].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => handleModuleChange(tab)}
                className={`rounded-lg border px-4 py-1.5 text-xs font-semibold ${
                  activeModule === tab
                    ? "border-indigo-600 bg-indigo-500 text-indigo-200"
                    : "border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

        </div>

        {/* User details and logout */}
        <div className="flex items-center gap-3">

          <div className="text-right">
            <p className="text-sm font-semibold text-gray-800">
              {fullName}
            </p>

            <p className="text-xs text-gray-500">
              {employeeId}
            </p>
          </div>

          {/* Profile initials */}
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
            {getInitials(fullName)}
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={onLogout}
            className="rounded-xl bg-indigo-100 px-3 py-2 text-sm font-medium text-indigo-700 transition hover:bg-indigo-200"
          >
            Logout
          </button>

        </div>
      </div>

      <div className="h-1 rounded-b-xl bg-indigo-500" />
    </header>
  );
}

export default Header;
