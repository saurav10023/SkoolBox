import { useState } from "react";
import { X } from "lucide-react";
import API from "../api/axios";

/* ─────────────────────────────────────────────
   STOCK MODAL
───────────────────────────────────────────── */
const StockModal = ({ product, onClose, showToast, onSave }) => {
  const [stocks, setStocks] = useState(
    product.sizes.map(s => ({ size: s.size, stock: s.stock }))
  );
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (size, stock) => {
    setLoading(true);
    try {
      await API.patch(`/api/v1/products/${product._id}/stock`, { size, stock: Number(stock) });
      showToast(`Stock updated for size ${size}`, "success");
      onSave();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update stock", "error");
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-black text-gray-900">Update Stock — {product.name}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
        </div>
        <div className="px-6 py-4 space-y-3">
          {stocks.map((s, i) => (
            <div key={s.size} className="flex items-center gap-3">
              <span className="text-sm font-bold text-gray-700 w-16">{s.size}</span>
              <input
                type="number"
                value={s.stock}
                min={0}
                onChange={e => {
                  const updated = [...stocks];
                  updated[i].stock = e.target.value;
                  setStocks(updated);
                }}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => handleUpdate(s.size, s.stock)}
                disabled={loading}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                Save
              </button>
            </div>
          ))}
        </div>
        <div className="px-6 py-3 border-t border-gray-100">
          <button onClick={onClose} className="w-full py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockModal;