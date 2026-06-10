export default function ConfirmModal({
  open,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/70 z-[9998] flex items-center justify-center px-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-md text-white shadow-2xl">
        <h2 className="text-2xl font-bold">
          {title}
        </h2>

        <p className="text-slate-400 mt-3">
          {message}
        </p>

        <div className="grid grid-cols-2 gap-3 mt-6">
          <button
            onClick={onCancel}
            className="bg-slate-700 hover:bg-slate-600 p-3 rounded-xl font-bold"
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 p-3 rounded-xl font-bold"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}