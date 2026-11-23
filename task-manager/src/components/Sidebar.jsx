function Sidebar({ activePage, setActivePage}) {
  const buttonClass =
    "mb-1 inline-block w-auto rounded-md border-0 bg-transparent px-[11px] py-3 text-left text-sm text-[#505567] hover:bg-[#f6f4ff] hover:text-[#5141ad] min-[721px]:block min-[721px]:w-full";

  const activeClass =
    "bg-[#eeebff] font-semibold text-[#5141ad] shadow-[inset_3px_0_0_#6555b5]";

  return (
    <aside className="min-h-0 rounded-xl border border-[#e3e6f0] bg-white p-[10px] shadow-[0_3px_14px_rgba(35,42,70,0.035)] min-[721px]:min-h-[600px] min-[721px]:px-3 min-[721px]:py-[18px]">
      <button
        type="button"
        className={`${buttonClass} ${
          activePage === "status" ? activeClass : ""
        }`}
        onClick={() => setActivePage("status")}
      >
        My Task Status
      </button>

      <button
        type="button"
        className={`${buttonClass} ${
          activePage === "delegate" ? activeClass : ""
        }`}
        onClick={() => setActivePage("delegate")}
      >
        Delegate Task
      </button>
    </aside>
  );
}

export default Sidebar;
