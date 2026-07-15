import { useState } from "react";
import { Plus, X, Upload, Loader2 } from "lucide-react";
import API from "../api/axios";

/* ─────────────────────────────────────────────
   PRODUCT FORM MODAL
───────────────────────────────────────────── */
const ProductModal = ({ product, onClose, onSave, showToast }) => {
  const isEdit = !!product;
  const [form, setForm] = useState({
    name: product?.name || "",
    description: product?.description || "",
    category: product?.category || "",
    sizes: product?.sizes?.map(s => ({ size: s.size, price: s.price, stock: s.stock })) || [{ size: "", price: "", stock: "" }],
  });
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState(product?.images || []);
  const [loading, setLoading] = useState(false);

  const handleSizeChange = (i, field, val) => {
    const updated = [...form.sizes];
    updated[i][field] = val;
    setForm({ ...form, sizes: updated });
  };

  const addSize = () => setForm({ ...form, sizes: [...form.sizes, { size: "", price: "", stock: "" }] });
  const removeSize = (i) => setForm({ ...form, sizes: form.sizes.filter((_, idx) => idx !== i) });

  const handleImages = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    setPreviews(files.map(f => URL.createObjectURL(f)));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.category || form.sizes.length === 0) {
      showToast("Name, category and at least one size are required", "error");
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append("name", form.name);
      data.append("description", form.description);
      data.append("category", form.category.toLowerCase().trim());
      data.append("sizes", JSON.stringify(form.sizes));
      images.forEach(img => data.append("images", img));

      if (isEdit) {
        await API.patch(`/api/v1/products/${product._id}`, data, { headers: { "Content-Type": "multipart/form-data" } });
        showToast("Product updated", "success");
      } else {
        await API.post("/api/v1/products", data, { headers: { "Content-Type": "multipart/form-data" } });
        showToast("Product created", "success");
      }
      onSave();
      onClose();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save product", "error");
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4 py-6 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-black text-gray-900">{isEdit ? "Edit Product" : "Add Product"}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><X size={16} /></button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600">Product Name *</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600">Category *</label>
            <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              placeholder="e.g. uniform, bag, stationery"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              rows={2} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-600">Sizes *</label>
              <button onClick={addSize} className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1">
                <Plus size={12} /> Add Size
              </button>
            </div>
            {form.sizes.map((s, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input value={s.size} onChange={e => handleSizeChange(i, "size", e.target.value)}
                  placeholder="Size" className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input value={s.price} onChange={e => handleSizeChange(i, "price", e.target.value)}
                  placeholder="Price ₹" type="number" className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input value={s.stock} onChange={e => handleSizeChange(i, "stock", e.target.value)}
                  placeholder="Stock" type="number" className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {form.sizes.length > 1 && (
                  <button onClick={() => removeSize(i)} className="text-red-400 hover:text-red-600 p-1"><X size={14} /></button>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-600">Images (max 5)</label>
            <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-xl px-4 py-3 transition-colors">
              <Upload size={15} className="text-gray-400" />
              <span className="text-xs text-gray-400">Click to upload images</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImages} />
            </label>
            {previews.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {previews.map((p, i) => (
                  <img key={i} src={p} alt="" className="w-16 h-16 rounded-xl object-cover border border-gray-200" />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
            {loading ? <Loader2 size={15} className="animate-spin" /> : null}
            {loading ? "Saving..." : isEdit ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;