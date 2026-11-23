
import { formatDate } from "./checklistDateUtils";

function HolidaysModal({
  show,
  holidays,
  holidayDraft,
  setHolidayDraft,
  checklistName,
  onClose,
  onApply
}) {
  if (!show) return null;

  const toggleHoliday = (date) => {
    setHolidayDraft(previous =>
      previous.includes(date)
        ? previous.filter(item => item !== date)
        : [...previous, date]
    );
  };

  const getHolidaySummary = () => {
    if (holidayDraft.length === 0) {
      return "No holidays";
    }

    if (holidayDraft.length === holidays.length) {
      return "All holidays";
    }

    return `${holidayDraft.length} selected`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px] p-3 sm:p-4">

      <div className="bg-white w-full max-w-[540px] max-h-[90vh] overflow-y-auto rounded-xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7 shadow-xl">

        <div className="flex justify-between items-start gap-3 mb-4">

          <h3 className="text-base sm:text-xl font-semibold text-slate-800 min-w-0">
            Exclude Holidays for {checklistName.trim() || "Checklist"}
          </h3>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Holidays popup"
            className="text-slate-400 hover:text-slate-700 text-3xl leading-none shrink-0"
          >
            ×
          </button>

        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5 mb-4 text-xs text-blue-700">

          <span className="text-purple-300 mr-2">■</span>
          Unchecked dates will be treated as normal working days

        </div>

        <div className="max-h-[35vh] sm:max-h-[190px] overflow-y-auto pr-2 space-y-1">

          {holidays.length === 0 ? (

            <p className="text-center text-sm text-slate-400 py-8">
              No holidays available.
            </p>

          ) : (

            holidays.map(holiday => {
              const date = String(
                holiday.holiday_date
              ).slice(0, 10);

              return (
                <label
                  key={holiday.id}
                  className="flex items-start sm:items-center gap-3 px-1 py-2 cursor-pointer hover:bg-slate-50 rounded-md"
                >

                  <input
                    type="checkbox"
                    checked={holidayDraft.includes(date)}
                    onChange={() => toggleHoliday(date)}
                    className="w-5 h-5 sm:w-6 sm:h-6 mt-0.5 sm:mt-0 accent-[#7965B8] shrink-0 cursor-pointer"
                  />

                  <span className="text-xs sm:text-sm font-medium text-slate-800 min-w-0 flex-1 break-words">
                    {holiday.holiday_name}
                  </span>

                  <span className="text-xs text-slate-400 shrink-0">
                    ({formatDate(date)})
                  </span>

                </label>
              );
            })

          )}

        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-3 mt-4 text-sm text-blue-700">

          <span className="font-semibold">Holidays:</span>{" "}
          {getHolidaySummary()}

        </div>

        <div className="flex justify-end mt-5">

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

export default HolidaysModal;
