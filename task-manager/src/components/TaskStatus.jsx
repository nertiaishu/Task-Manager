
import React from "react";

function TaskStatus({
  panelClass,
  tabs,
  activeTab,
  setActiveTab,
  searchTerm,
  setSearchTerm,
  visibleTasks,
  employees = [],
  delegateTask,
  acceptTask,
  rejectTask,
  showActions,
  toggleTask,
}) {
  const inputClass =
    "min-w-0 rounded-lg border border-[#dfe3ef] bg-white px-3 py-2.5 text-sm text-[#454a59] outline-none transition focus:border-[#6555b5] focus:ring-2 focus:ring-[#6555b5]/10";

  const buttonClass =
    "cursor-pointer rounded-lg border px-3 py-2 text-xs font-medium transition";

  const countColors = {
    Today: "bg-[#7863bd] text-white",
    Upcoming: "bg-[#6386f5] text-white",
    Delayed: "bg-[#f05b5b] text-white",
    AwaitingAcceptance: "bg-[#eab83f] text-white",
    Completed: "bg-[#2ca76b] text-white",
    Delegated: "bg-[#07833b] text-white",
  };

  const isDelegated = activeTab === "Delegated";
  const isCompleted = activeTab === "Completed";
  const isAwaitingAcceptance = activeTab === "AwaitingAcceptance";
  const isToday = activeTab === "Today";
  const isUpcoming = activeTab === "Upcoming";
  const isDelayed = activeTab === "Delayed";

  const emptyMessages = {
    Today: "No today's tasks found",
    Upcoming: "No upcoming tasks found",
    Delayed: "No delayed tasks found",
    AwaitingAcceptance: "No awaiting tasks found",
    Completed: "No completed tasks found",
    Delegated: "No delegated tasks found",
  };

  const headings = [
    "TASK ID",
    "ASSIGNED BY",
    "TASK NAME",
    "PLANNED DATE",
    ...(isDelegated ? ["DELEGATED BY"] : []),
    ...(isCompleted ? ["COMPLETED DATE"] : ["ACTION"]),
  ];

  return (
    <div className={panelClass}>
      {/* Task Tabs */}
      <div className="mb-0 grid grid-cols-2 border-b border-[#e5e6ed] lsm:grid-cols-3 lg:grid-cols-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`flex items-center justify-center gap-2 border-b-[3px] px-2 py-5 text-sm whitespace-nowrap transition ${
              activeTab === tab.id
                ? "border-[#7863bd] font-semibold text-[#7863bd]"
                : "border-transparent text-[#656a79] hover:text-[#7863bd]"
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}

            <span
              className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-bold ${
                countColors[tab.id] || "bg-gray-200 text-gray-700"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content Panel */}
      <div className="rounded-xl border border-[#e7e8ee] mt-3 bg-white p-3 py-3 sm:p-5">
        {visibleTasks.length === 0 ? (
          <div className="flex min-h-[200px] items-center justify-center text-center">
            <p className="text-sm text-[#74798a]">
              {emptyMessages[activeTab] || "No tasks found"}
            </p>
          </div>
        ) : (
          <>
            {/* Search */}
            <div className="mb-5 flex flex-col gap-3 sm:flex-row">
              <input
                className={`${inputClass} w-full flex-1`}
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search tasks..."
                aria-label="Search tasks"
              />
            </div>

            {/* Task Table */}
            <div className="w-full overflow-x-auto rounded-xl border border-[#e7e8ee] ">
              <table className="w-full min-w-[850px] border-collapse text-left">
                <thead className="bg-[#f7f8fc]">
                  <tr>
                    {headings.map((heading) => (
                      <th
                        key={heading}
                        className="whitespace-nowrap border-b border-[#e5e6ed] px-4 py-4 text-xs font-semibold text-[#46506a]"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {visibleTasks.map((task) => (
                    <tr
                      key={task.id}
                      className="transition-colors hover:bg-[#f8f7ff]"
                    >
                      {/* TASK ID */}
                      <td className="whitespace-nowrap border-b border-[#ebecf1] px-4 py-4 text-sm">
                        {task.id}
                      </td>

                      {/* ASSIGNED BY */}
                      <td className="whitespace-nowrap border-b border-[#ebecf1] px-4 py-4 text-sm">
                        {task.assignedBy || "—"}
                      </td>

                      {/* TASK NAME */}
                      <td className="max-w-[240px] border-b border-[#ebecf1] px-4 py-4 text-sm">
                        <span className="break-words">
                          {task.title}
                        </span>
                      </td>

                      {/* PLANNED DATE */}
                      <td className="whitespace-nowrap border-b border-[#ebecf1] px-4 py-4 text-sm">
                        {task.plannedDate || "—"}
                      </td>

                      {/* DELEGATED BY */}
                      {isDelegated && (
                        <td className="whitespace-nowrap border-b border-[#ebecf1] px-4 py-4 text-sm">
                          {task.delegatedBy || "—"}
                        </td>
                      )}

                      {/* COMPLETED DATE */}
                      {isCompleted && (
                        <td className="whitespace-nowrap border-b border-[#ebecf1] px-4 py-4 text-sm">
                          {task.completed_date || "—"}
                        </td>
                      )}

                      {/* ACTION */}
                      {showActions && !isCompleted && (
                        <td className="min-w-[230px] whitespace-nowrap border-b border-[#ebecf1] px-4 py-4 text-sm">

                          {/* Awaiting Acceptance and Delegated */}
                          {(isAwaitingAcceptance || isDelegated) && (
                            <>
                              <button
                                type="button"
                                className={`${buttonClass} mr-2 border-[#c6e9d2] bg-[#effaf2] text-[#18794e] hover:bg-[#dcf5e4]`}
                                onClick={() => acceptTask(task.id)}
                              >
                                Accept
                              </button>

                              <button
                                type="button"
                                className={`${buttonClass} border-[#f0d5d5] bg-white text-[#d14343] hover:bg-[#fff0f0]`}
                                onClick={() => rejectTask(task.id)}
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {/* Today, Delayed and Upcoming */}
                          {(isToday || isDelayed || isUpcoming) && (
                            <>
                              <button
                                type="button"
                                className={`${buttonClass} mr-2 border-[#c6e9d2] bg-[#effaf2] text-[#18794e] hover:bg-[#dcf5e4]`}
                                onClick={() =>
                                  toggleTask(task.id, task.status)
                                }
                              >
                                Complete Task
                              </button>

                              {/* Delegate accepted tasks that are not self-assigned */}
                              {!task.isSelfAssigned &&
                                (isToday || isUpcoming) && (
                                  <select
                                    className={`${inputClass} mt-2 min-w-[160px] cursor-pointer`}
                                    value=""
                                    onChange={(event) => {
                                      const employeeId = event.target.value;

                                      if (employeeId) {
                                        delegateTask(task.id, employeeId);
                                      }
                                    }}
                                    aria-label={`Delegate task ${task.id}`}
                                  >
                                    <option value="">
                                      Delegate To
                                    </option>

                                    {employees
                                      .filter(
                                        (employee) =>
                                          String(employee.id) !==
                                          String(task.assignedToId)
                                      )
                                      .map((employee) => (
                                        <option
                                          key={employee.id}
                                          value={String(employee.id)}
                                        >
                                          {employee.full_name}
                                        </option>
                                      ))}
                                  </select>
                                )}
                            </>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default TaskStatus;
