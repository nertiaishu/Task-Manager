
import { weekdays } from "./checklistDateUtils";

function WeekOffModal({
  show,
  weekOffDraft,
  setWeekOffDraft,
  onClose,
  onApply
}) {
  if (!show) return null;

  //handles checkbox selection
  const toggleWeekday = (day) => {
    setWeekOffDraft(previous =>
      previous.includes(day)
        ? previous.filter(item => item !== day)
        : [...previous, day]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px] p-3 sm:p-4">

      <div className="bg-white w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl p-4 sm:p-6 shadow-xl">

        <div className="flex justify-between items-center gap-3 mb-5">

          <h3 className="text-base sm:text-lg font-semibold text-slate-800">
            Select Week-Off Days
          </h3>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Week-Off popup"
            className="text-slate-800 hover:text-slate-700 text-2xl leading-none shrink-0"
          >
            ×
          </button>

        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5 mb-4 text-xs text-blue-700">
          Unchecked days will be treated as normal working days
        </div>

        <div className="max-h-48 overflow-y-auto space-y-2 pr-1">

          {weekdays.map(day => (
            <label
              key={day}
              className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-50"
            >

              <input
                type="checkbox"
                checked={weekOffDraft.includes(day)}
                onChange={() => toggleWeekday(day)}
                className="w-5 h-5 shrink-0 accent-[#7965B8]"
              />

              <span className="text-sm font-medium text-slate-700">
                {day}
              </span>

            </label>
          ))}

        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-3 mt-4 text-sm text-blue-700 break-words">

          <span className="font-semibold">Week-Off:</span>{" "}

          {weekOffDraft.length === 0
            ? "None"
            : weekOffDraft.length === 7
              ? "All days"
              : weekOffDraft.join(", ")}

        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-5">

          <button
            type="button"
            onClick={() => setWeekOffDraft([])}
            className="w-full sm:w-auto px-4 py-2.5 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Clear
          </button>

          <button
            type="button"
            onClick={onApply}
            className="w-full sm:w-auto px-5 py-2.5 text-sm text-white bg-[#7965B8] rounded-lg hover:bg-[#6853A8]"
          >
            Apply
          </button>

        </div>

      </div>

    </div>
  );
}

export default WeekOffModal;
