
import React, { useState } from "react";

function ChecklistTable({
  activeTab,
  checklists,
  searchQuery,
  setSearchQuery,
  employeeList,
  currentUser,
  onComplete,
  onDelegate,
  onAccept,
  onReject,
}) {
  const [delegateSelections, setDelegateSelections] = useState({});

  // Get employee name using employee ID.
  const getEmployeeName = (employeeId) => {
    const employee = employeeList.find(
      (item) => Number(item.id) === Number(employeeId)
    );

    return (
      employee?.full_name ||
      employee?.fullName ||
      employee?.name ||
      employee?.username ||
      "—"
    );
  };

  // Get the name of the employee who assigned the checklist.
  const getAssignedByName = (item) => {
    return (
      item.assigned_by_name ||
      item.created_by_name ||
      getEmployeeName(item.created_by || item.assigned_by) ||
      "—"
    );
  };

  // Get the name of the employee receiving the checklist.
  const getAssignedToName = (item) => {
    return (
      item.assigned_to_name ||
      item.employee_name ||
      getEmployeeName(item.user_id || item.assigned_to) ||
      "—"
    );
  };

  // Check whether the checklist belongs to another employee.
  const canDelegate = (item) => {
    return (
      item.created_by != null &&
      item.user_id != null &&
      Number(item.created_by) !== Number(item.user_id)
    );
  };

  // Save the selected employee for a checklist.
  const handleEmployeeChange = (checklistId, employeeId) => {
    setDelegateSelections((previous) => ({
      ...previous,
      [checklistId]: employeeId,
    }));
  };

  // Send the delegation request.
  const handleDelegateClick = async (checklistId) => {
    const selectedEmployee = delegateSelections[checklistId];

    if (!selectedEmployee) {
      return;
    }

    const success = await onDelegate(checklistId, selectedEmployee);

    if (success) {
      setDelegateSelections((previous) => {
        const updated = { ...previous };
        delete updated[checklistId];
        return updated;
      });
    }
  };

  const isCompleted = activeTab === "completed";
  const isDelegated = activeTab === "delegated";

  const getDate = (item) => {
    return (
      item.occurrence_date ||
      item.planned_date ||
      item.start_date ||
      "—"
    );
  };

  return (
    <div className="w-full">
      {/* Search */}
      <div className="mb-4 flex justify-end">
        <input
          type="text"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search checklist...."
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:border-indigo-500 sm:w-72"
        />
      </div>

      {/* Empty message */}
      {checklists.length === 0 ? (
        <div className="flex min-h-[350px] flex-col items-center justify-center gap-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50">
            <span className="text-4xl text-indigo-400">☑</span>
          </div>

          <h3 className="text-base font-semibold text-gray-700">
            No {activeTab} checklists
          </h3>

          <p className="text-sm text-gray-400">
            There are no checklists available right now.
          </p>
        </div>
      ) : (
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[850px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-gray-600">
                <th className="px-4 py-3 font-semibold">
                  Checklist ID
                </th>

                {isDelegated && (
                  <th className="px-4 py-3 font-semibold">
                    Delegated By
                  </th>
                )}

                <th className="px-4 py-3 font-semibold">
                  Assigned By
                </th>

                {!isDelegated && (
                  <th className="px-4 py-3 font-semibold">
                    Assigned To
                  </th>
                )}

                <th className="px-4 py-3 font-semibold">
                  Checklist Name
                </th>

                <th className="px-4 py-3 font-semibold">
                  Frequency
                </th>

                <th className="px-4 py-3 font-semibold">
                  Planned Date
                </th>

                {isCompleted && (
                  <>
                    <th className="px-4 py-3 font-semibold">
                      Completed Date
                    </th>

                    <th className="px-4 py-3 font-semibold">
                      Completed By
                    </th>
                  </>
                )}

                <th className="px-4 py-3 font-semibold">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {checklists.map((item) => {
                const checklistId =
                  item.checklist_id || item.id;

                const occurrenceId =
                  item.occurrence_id || item.id;

                const delegationId =
                  item.delegation_id || item.id;

                return (
                  <tr
                    key={
                      isDelegated
                        ? delegationId
                        : occurrenceId
                    }
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-4 py-4">
                      {checklistId}
                    </td>

                    {isDelegated && (
                      <td className="px-4 py-4">
                        {item.delegated_by_name ||
                          getEmployeeName(item.delegated_by) ||
                          "—"}
                      </td>
                    )}

                    <td className="px-4 py-4">
                      {getAssignedByName(item)}
                    </td>

                    {!isDelegated && (
                      <td className="px-4 py-4">
                        {getAssignedToName(item)}
                      </td>
                    )}

                    <td className="px-4 py-4 font-medium text-gray-800">
                      {item.checklist_name || "—"}
                    </td>

                    <td className="px-4 py-4">
                      {item.frequency || "—"}
                    </td>

                    <td className="px-4 py-4">
                      {getDate(item)}
                    </td>

                    {isCompleted && (
                      <>
                        <td className="px-4 py-4">
                          {item.completed_at
                            ? String(item.completed_at).split("T")[0]
                            : "—"}
                        </td>

                        <td className="px-4 py-4">
                          {item.completed_by_name ||
                            getEmployeeName(item.completed_by) ||
                            "—"}
                        </td>
                      </>
                    )}

                    <td className="px-4 py-4">
                      {/* Delegated tab: Accept and Reject */}
                      {isDelegated ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => onAccept(delegationId)}
                            className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                          >
                            Accept
                          </button>

                          <button
                            type="button"
                            onClick={() => onReject(delegationId)}
                            className="rounded-md bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <>
                          {/* Completed tab: no action */}
                          {!isCompleted && (
                            <>
                              {/* Today and Upcoming: delegation option */}
                              {(activeTab === "today" ||
                                activeTab === "upcoming") &&
                              canDelegate(item) ? (
                                <div className="flex items-center gap-2">
                                  <select
                                    value={
                                      delegateSelections[checklistId] || ""
                                    }
                                    onChange={(event) =>
                                      handleEmployeeChange(
                                        checklistId,
                                        event.target.value
                                      )
                                    }
                                    className="rounded-md border border-gray-300 px-2 py-1.5 text-xs outline-none focus:border-indigo-500"
                                  >
                                    <option value="">
                                      Delegate To
                                    </option>

                                    {employeeList
                                      .filter(
                                        (employee) =>
                                          Number(employee.id) !==
                                          Number(currentUser?.id)
                                      )
                                      .map((employee) => (
                                        <option
                                          key={employee.id}
                                          value={employee.id}
                                        >
                                          {employee.full_name ||
                                            employee.fullName ||
                                            employee.name ||
                                            employee.username}
                                        </option>
                                      ))}
                                  </select>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDelegateClick(checklistId)
                                    }
                                    disabled={
                                      !delegateSelections[checklistId]
                                    }
                                    className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    Delegate
                                  </button>
                                </div>
                              ) : (
                                /* Complete action for own checklist and Delayed */
                                <button
                                  type="button"
                                  onClick={() =>
                                    onComplete(occurrenceId)
                                  }
                                  className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                                >
                                  Complete
                                </button>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ChecklistTable;
