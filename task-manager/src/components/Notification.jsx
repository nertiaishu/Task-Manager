function Notification({ notification, onClose }) {
  if (!notification || !notification.message) {
    return null;
  }

  const isSuccess = notification.type === "success";

  return (
    <div
      role={isSuccess ? "status" : "alert"}
      className={`fixed left-1/2 top-6 z-[9999] flex w-[min(92vw,420px)] -translate-x-1/2 items-center gap-3 rounded-xl border bg-white px-4 py-3 shadow-lg ${
        isSuccess
          ? "border-green-200 text-green-800"
          : "border-red-200 text-red-700"
      }`}
    >
      <span className="text-lg font-bold">
        {isSuccess ? "✓" : "!"}
      </span>

      <p className="m-0 flex-1 text-sm font-medium">
        {notification.message}
      </p>

      <button
        type="button"
        onClick={onClose}
        className="border-0 bg-transparent text-xl text-gray-500"
        aria-label="Close notification"
      >
        &times;
      </button>
    </div>
  );
}

export default Notification;