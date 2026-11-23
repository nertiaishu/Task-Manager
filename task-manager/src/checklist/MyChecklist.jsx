
import React, { useCallback, useEffect, useState } from "react";

import ChecklistTabs from "./ChecklistTabs";
import ChecklistTable from "./ChecklistTable";
import ChecklistToast from "./ChecklistToast";

const API = import.meta.env.VITE_API_URL;

function MyChecklist({ currentUser, employeeList = [] }) {
  const [activeTab, setActiveTab] = useState("today");
  const [checklists, setChecklists] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [counts, setCounts] = useState({
    today: 0,
    delayed: 0,
    completed: 0,
    upcoming: 0,
    delegated: 0,
  });

  const [toast, setToast] = useState(null);

  // All tab details are maintained in this one place.
  const tabs = [
    {
      id: "today",
      label: "Today's Checklist",
      color: "bg-[#6366f1]",
    },
    {
      id: "delayed",
      label: "Delayed Checklist",
      color: "bg-[#ef4444]",
    },
    {
      id: "completed",
      label: "Completed Checklist",
      color: "bg-[#10b981]",
    },
    {
      id: "upcoming",
      label: "Upcoming Checklist",
      color: "bg-[#3b82f6]",
    },
    {
      id: "delegated",
      label: "Delegated Checklist",
      color: "bg-[#f59e0b]",
    },
  ];

  // Get authentication token for API requests.
  const getHeaders = () => {
    const token =
      sessionStorage.getItem("authToken") ||
      localStorage.getItem("token");

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  // Display toast message.
  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  // Fetch all five checklist tabs.
  const loadAllChecklistData = useCallback(
    async (selectedTab) => {
      const results = await Promise.allSettled(
        tabs.map(async (tab) => {
          const response = await fetch(
            `${API}/api/checklists/${tab.id}`,
            {
              method: "GET",
              headers: getHeaders(),
            }
          );

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || "Unable to fetch checklists");
          }

          return {
            tabId: tab.id,
            data: Array.isArray(data) ? data : [],
          };
        })
      );

      const newCounts = {
        today: 0,
        delayed: 0,
        completed: 0,
        upcoming: 0,
        delegated: 0,
      };

      let selectedData = [];
      let selectedTabFailed = false;

      results.forEach((result, index) => {
        const tabId = tabs[index].id;

        if (result.status === "fulfilled") {
          const { data } = result.value;

          newCounts[tabId] = data.length;

          if (tabId === selectedTab) {
            selectedData = data;
          }
        } else if (tabId === selectedTab) {
          selectedTabFailed = true;
        }
      });

      setCounts(newCounts);
      setChecklists(selectedData);

      if (selectedTabFailed) {
        showToast("Unable to load checklists", "error");
      }
    },
    [showToast]
  );

  // Load data whenever the selected tab changes.
  useEffect(() => {
    loadAllChecklistData(activeTab);
  }, [activeTab, loadAllChecklistData]);

  // Automatically close toast after 3 seconds.
  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast(null);
    }, 3000);

    return () => clearTimeout(timer);
  }, [toast]);

  // Refresh the current tab and all tab counts.
  const refreshChecklistData = () => {
    loadAllChecklistData(activeTab);
  };

  // Complete a checklist occurrence.
  const handleComplete = async (occurrenceId) => {
    try {
      const response = await fetch(
        `${API}/api/checklists/occurrences/${occurrenceId}/complete`,
        {
          method: "PATCH",
          headers: getHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to complete checklist");
      }

      showToast("Checklist completed successfully");
      refreshChecklistData();
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  // Delegate a checklist to another employee.
  const handleDelegate = async (checklistId, targetUser) => {
    if (!targetUser) {
      showToast("Please select an employee", "error");
      return false;
    }

    try {
      const response = await fetch(
        `${API}/api/checklists/${checklistId}/delegate`,
        {
          method: "PATCH",
          headers: getHeaders(),
          body: JSON.stringify({
            delegated_to: targetUser,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to delegate checklist");
      }

      showToast("Checklist delegated successfully");
      refreshChecklistData();

      return true;
    } catch (error) {
      showToast(error.message, "error");
      return false;
    }
  };

  // Accept a delegated checklist.
  const handleAccept = async (delegationId) => {
    try {
      const response = await fetch(
        `${API}/api/checklists/delegations/${delegationId}/accept`,
        {
          method: "PATCH",
          headers: getHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to accept checklist");
      }

      showToast("Checklist accepted successfully");
      refreshChecklistData();
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  // Reject a delegated checklist.
  const handleReject = async (delegationId) => {
    try {
      const response = await fetch(
        `${API}/api/checklists/delegations/${delegationId}/reject`,
        {
          method: "PATCH",
          headers: getHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to reject checklist");
      }

      showToast("Checklist rejected");
      refreshChecklistData();
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  // Filter checklists based on search text.
  const filteredChecklists = checklists.filter((item) => {
    const searchText = searchQuery.toLowerCase();

    return (
      String(item.checklist_name || "")
        .toLowerCase()
        .includes(searchText) ||
      String(item.checklist_id || item.id || "")
        .toLowerCase()
        .includes(searchText) ||
      String(item.assigned_by_name || item.created_by_name || "")
        .toLowerCase()
        .includes(searchText)
    );
  });

  return (
    <div className="w-full rounded-xl border border-[#e3e6f0] bg-white p-4 shadow-sm">
      <ChecklistTabs
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        counts={counts}
      />

      <ChecklistTable
        activeTab={activeTab}
        checklists={filteredChecklists}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        employeeList={employeeList}
        currentUser={currentUser}
        onComplete={handleComplete}
        onDelegate={handleDelegate}
        onAccept={handleAccept}
        onReject={handleReject}
      />

      <ChecklistToast
        toast={toast}
        onClose={() => setToast(null)}
      />
    </div>
  );
}

export default MyChecklist;
