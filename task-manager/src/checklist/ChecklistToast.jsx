
function ChecklistToast({ toast, onClose }) {
  if (!toast) return null;

  return (
    <div className="fixed right-5 top-5 z-50">
      <div
        className={`flex items-center gap-3 rounded-lg px-5 py-3 text-sm shadow-lg ${
          toast.type === "error"
            ? "bg-red-100 text-red-700"
            : "bg-white text-green-700"
        }`}
      >
        <span>{toast.message}</span>

        <button
          type="button"
          onClick={onClose}
          className="ml-2 font-semibold text-gray-500 hover:text-gray-800"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default ChecklistToast;