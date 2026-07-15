/* ─────────────────────────────────────────────
   CONFIRM MODAL
───────────────────────────────────────────── */
const ConfirmModal = ({ message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
      <p className="text-sm font-semibold text-gray-800">{message}</p>
      <div className="flex gap-3">
        <button onClick={onCancel}
          className="flex-1 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button onClick={onConfirm}
          className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors">
          Confirm
        </button>
      </div>
    </div>
  </div>
);

export default ConfirmModal;