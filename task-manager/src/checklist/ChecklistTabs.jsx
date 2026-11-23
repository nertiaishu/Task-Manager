function ChecklistTabs({ tabs, activeTab, setActiveTab, counts }) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-2 border-b border-gray-800">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex items-center gap-2 border-b-2 px-3 py-4 text-sm font-medium transition ${
            activeTab === tab.id
              ? "border-indigo-500 font-semibold text-indigo-600"
              : "border-transparent text-gray-600 hover:text-indigo-600"
          }`}
        >
          <span>{tab.label}</span>

          <span
            className={`${tab.color} rounded-full px-2 py-1 text-xs font-semibold text-white`}
          >
            {counts[tab.id] || 0}
          </span>
        </button>
      ))}
    </div>
  );
}

export default ChecklistTabs;