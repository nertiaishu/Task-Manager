function ChecklistSidebar({
  activeView,
  setActiveView
}) {
  const buttonClass =
    "mb-1 block w-full rounded-md border-0 bg-transparent px-[11px] py-3 text-left text-sm text-[#505567] hover:bg-[#f6f4ff] hover:text-[#5141ad]";

  const activeClass =
    "bg-[#eeebff] font-semibold text-[#5141ad] shadow-[inset_3px_0_0_#6555b5]";

  return (
    <aside className="
      box-border
      w-full
      min-w-0
      shrink-0
      min-h-0
      rounded-xl
      border
      border-[#e3e6f0]
      bg-white
      p-[10px]
      shadow-[0_3px_14px_rgba(35,42,70,0.035)]
      min-[721px]:min-h-[600px]
      min-[721px]:px-3
      min-[721px]:py-[18px]
    ">

      <button
        type="button"
        className={`${buttonClass} ${
          activeView === 'my-checklist' ? activeClass : ''
        }`}
        onClick={() => setActiveView('my-checklist')}
      >
        My Checklist
      </button>

      <button
        type="button"
        className={`${buttonClass} ${
          activeView === 'create-checklist' ? activeClass : ''
        }`}
        onClick={() => setActiveView('create-checklist')}
      >
        Create Checklist
      </button>

    </aside>
  );
}
export default  ChecklistSidebar;