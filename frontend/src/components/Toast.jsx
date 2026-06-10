export default function Toast({
  toast,
  onClose
}) {
  if (!toast) return null

  const colors = {
    success: "bg-green-600",
    error: "bg-red-600",
    warning: "bg-yellow-500 text-black",
    info: "bg-blue-600"
  }

  return (
    <div className="fixed top-6 right-6 z-[9999] animate-pulse">
      <div
        className={`
          ${colors[toast.type] || colors.info}
          text-white
          px-6
          py-4
          rounded-2xl
          shadow-2xl
          max-w-sm
          border
          border-white/10
        `}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-bold">
              {toast.title}
            </h3>

            {toast.message && (
              <p className="text-sm mt-1 opacity-90">
                {toast.message}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="font-bold opacity-80 hover:opacity-100"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
}