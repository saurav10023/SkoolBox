import { useEffect, useState } from "react";
import {
  Plus, Package, Tag, Pencil, RefreshCw, Eye, EyeOff, Trash2,
  ChevronDown, AlertTriangle, PackageX,
} from "lucide-react";
import API from "../api/axios";
import ProductModal from "./ProductModal";
import StockModal from "./StockModal";
import ConfirmModal from "./ConfirmModal ";

// Fixed inventory-alert rules (no per-product configuration):
// a size is "critically low" below this count...
const SIZE_LOW_THRESHOLD = 3;
// ...and a product is flagged "low stock" overall if its sizes add up to
// fewer than this many units, even if no single size is critically low.
const TOTAL_LOW_THRESHOLD = 5;

// Classifies a product's inventory status using the rules above.
// Returns per-size flags too, so the table can highlight individual rows.
const getStockStatus = (product) => {
  const sizes = product.sizes || [];
  const withStock = sizes.map(s => ({ ...s, stockNum: Number(s.stock) || 0 }));
  const total = withStock.reduce((a, s) => a + s.stockNum, 0);
  const outOfStock = sizes.length === 0 || withStock.every(s => s.stockNum === 0);
  const anySizeCriticallyLow = withStock.some(s => s.stockNum > 0 && s.stockNum < SIZE_LOW_THRESHOLD);
  const totalLow = total > 0 && total < TOTAL_LOW_THRESHOLD;
  const lowStock = !outOfStock && (anySizeCriticallyLow || totalLow);
  return { total, outOfStock, lowStock, sizes: withStock };
};

/* ─────────────────────────────────────────────
   SINGLE PRODUCT CARD — compact by default,
   expands in place to show full details
───────────────────────────────────────────── */
const ProductCard = ({ product, expanded, onToggle, onEdit, onStock, onToggleAvailability, onDelete }) => {
  const minPrice = product.sizes?.length ? Math.min(...product.sizes.map(s => Number(s.price) || 0)) : null;
  const maxPrice = product.sizes?.length ? Math.max(...product.sizes.map(s => Number(s.price) || 0)) : null;
  const status = getStockStatus(product);

  return (
    <div
      id={`product-${product._id}`}
      className={`bg-white border border-gray-100 rounded-2xl shadow-sm transition-all duration-200 ${
        expanded ? "col-span-full ring-1 ring-blue-100" : ""
      }`}
    >
      {/* Collapsed header — always visible, click to expand/collapse */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 sm:p-4 text-left"
      >
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0">
          {product.images?.[0] ? (
            <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package size={18} className="text-gray-300" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-base sm:text-lg font-extrabold text-gray-900 tracking-tight line-clamp-1">{product.name}</p>
          <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
            <span className="flex items-center gap-1 text-xs text-blue-600 font-bold">
              <Tag size={11} />
              {minPrice === null ? "—" : minPrice === maxPrice ? `₹${minPrice}` : `₹${minPrice}–${maxPrice}`}
            </span>
            <span className={`text-xs font-semibold ${status.outOfStock ? "text-red-500" : "text-gray-400"}`}>
              {status.total} in stock
            </span>
            <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${product.isAvailable ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
              {product.isAvailable ? "Active" : "Hidden"}
            </span>
            {status.outOfStock ? (
              <span className="flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">
                <PackageX size={10} /> Out of stock
              </span>
            ) : status.lowStock ? (
              <span className="flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                <AlertTriangle size={10} /> Low stock
              </span>
            ) : null}
          </div>
        </div>

        <ChevronDown
          size={18}
          className={`text-gray-300 shrink-0 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-3 sm:px-4 pb-4 space-y-4 border-t border-gray-50 pt-4">

          {/* Images */}
          {product.images?.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {product.images.map((img, i) => (
                <img key={i} src={img} alt="" className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-gray-100" />
              ))}
            </div>
          )}

          {/* Category + description */}
          <div className="space-y-1">
            <span className="inline-block text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wide">
              {product.category}
            </span>
            {product.description && (
              <p className="text-sm text-gray-500 leading-relaxed">{product.description}</p>
            )}
          </div>

          {/* Size / price / stock breakdown */}
          {product.sizes?.length > 0 && (
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="grid grid-cols-3 bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wide px-3 py-2">
                <span>Size</span>
                <span>Price</span>
                <span>Stock</span>
              </div>
              <div className="divide-y divide-gray-50">
                {status.sizes.map((s, i) => {
                  const isOut = s.stockNum === 0;
                  const isLow = !isOut && s.stockNum < SIZE_LOW_THRESHOLD;
                  return (
                    <div key={i} className="grid grid-cols-3 px-3 py-2 text-sm">
                      <span className="font-semibold text-gray-700">{s.size}</span>
                      <span className="text-gray-600">₹{s.price}</span>
                      <span className={`font-semibold ${isOut ? "text-red-500" : isLow ? "text-amber-600" : "text-gray-700"}`}>
                        {isOut ? "Out of stock" : isLow ? `${s.stockNum} (low)` : s.stockNum}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 flex-wrap pt-1">
            <button onClick={(e) => { e.stopPropagation(); onEdit(product); }}
              className="flex items-center gap-1 text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all font-medium">
              <Pencil size={11} /> Edit
            </button>
            <button onClick={(e) => { e.stopPropagation(); onStock(product); }}
              className="flex items-center gap-1 text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 hover:text-purple-600 transition-all font-medium">
              <RefreshCw size={11} /> Stock
            </button>
            <button onClick={(e) => { e.stopPropagation(); onToggleAvailability(product); }}
              className={`flex items-center gap-1 text-xs px-3 py-1.5 border rounded-lg transition-all font-medium
                ${product.isAvailable
                  ? "border-orange-200 text-orange-600 hover:bg-orange-50"
                  : "border-green-200 text-green-600 hover:bg-green-50"}`}>
              {product.isAvailable ? <EyeOff size={11} /> : <Eye size={11} />}
              {product.isAvailable ? "Hide" : "Show"}
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(product._id); }}
              className="flex items-center gap-1 text-xs px-3 py-1.5 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-all font-medium">
              <Trash2 size={11} /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   PRODUCTS TAB — grouped by category
───────────────────────────────────────────── */
const Products = ({ showToast }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editProduct, setEditProduct] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [stockProduct, setStockProduct] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [openCategory, setOpenCategory] = useState(null);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const res = await API.get("/api/v1/products");
      setProducts(res.data.data || []);
    } catch { showToast("Failed to fetch products", "error"); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/api/v1/products/${id}`);
      setProducts(prev => prev.filter(p => p._id !== id));
      showToast("Product deleted", "success");
    } catch { showToast("Failed to delete product", "error"); }
    finally { setConfirm(null); }
  };

  const handleToggle = async (product) => {
    try {
      const res = await API.patch(`/api/v1/products/${product._id}/toggle-availability`);
      setProducts(prev => prev.map(p => p._id === product._id ? { ...p, isAvailable: res.data.data.isAvailable } : p));
      showToast(`Product ${res.data.data.isAvailable ? "enabled" : "disabled"}`, "success");
    } catch { showToast("Failed to toggle availability", "error"); }
  };

  const toggleExpanded = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Group products by category, preserving alphabetical order
  const grouped = products.reduce((acc, p) => {
    const cat = p.category?.trim() || "Uncategorized";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});
  const categories = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

  // Default to the "Uniform" category being open once products load, since
  // that's the highest-traffic section — falls back to the first category
  // if there's no exact match.
  useEffect(() => {
    if (openCategory === null && categories.length > 0) {
      const uniformCat = categories.find(c => c.toLowerCase().includes("uniform"));
      setOpenCategory(uniformCat || categories[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]);

  // Inventory alerts for the dashboard panel
  const outOfStockProducts = [];
  const lowStockProducts = [];
  products.forEach(p => {
    const status = getStockStatus(p);
    if (status.outOfStock) outOfStockProducts.push(p);
    else if (status.lowStock) lowStockProducts.push(p);
  });

  // Opens the product's category tab, expands its card, and scrolls to it —
  // used when clicking an item in the alerts panel
  const jumpToProduct = (product) => {
    setOpenCategory(product.category?.trim() || "Uncategorized");
    setExpandedIds(prev => new Set(prev).add(product._id));
    setTimeout(() => {
      document.getElementById(`product-${product._id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  };

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400 font-medium">{products.length} products</p>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-blue-200"
        >
          <Plus size={15} /> Add Product
        </button>
      </div>

      {/* Inventory alerts */}
      {(outOfStockProducts.length > 0 || lowStockProducts.length > 0) && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-2xl p-3.5 sm:p-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <AlertTriangle size={16} className="text-amber-600" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-xl font-black text-amber-700 leading-none">{lowStockProducts.length}</p>
                <p className="text-[11px] sm:text-xs text-amber-600 font-semibold mt-0.5">Low stock</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl p-3.5 sm:p-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <PackageX size={16} className="text-red-600" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-xl font-black text-red-700 leading-none">{outOfStockProducts.length}</p>
                <p className="text-[11px] sm:text-xs text-red-600 font-semibold mt-0.5">Out of stock</p>
              </div>
            </div>
          </div>

          <div className="border border-gray-100 rounded-2xl divide-y divide-gray-50 max-h-56 overflow-y-auto">
            {[...outOfStockProducts, ...lowStockProducts].map(product => {
              const status = getStockStatus(product);
              return (
                <button
                  key={product._id}
                  onClick={() => jumpToProduct(product)}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Package size={14} className="text-gray-300 m-auto" />
                    )}
                  </div>
                  <span className="flex-1 min-w-0 text-sm font-semibold text-gray-700 truncate">{product.name}</span>
                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                    status.outOfStock ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"
                  }`}>
                    {status.outOfStock ? "Out of stock" : `${status.total} left`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {products.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-2">
          <Package size={32} className="text-gray-200" />
          <p className="text-gray-400 text-sm">No products yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Horizontal category tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {categories.map(category => {
              const isActive = openCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => setOpenCategory(category)}
                  className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-colors
                    ${isActive
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                >
                  {category}
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/20" : "bg-white text-gray-400"}`}>
                    {grouped[category].length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active category's products */}
          {openCategory && grouped[openCategory] && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 items-start">
              {grouped[openCategory].map(product => (
                <ProductCard
                  key={product._id}
                  product={product}
                  expanded={expandedIds.has(product._id)}
                  onToggle={() => toggleExpanded(product._id)}
                  onEdit={setEditProduct}
                  onStock={setStockProduct}
                  onToggleAvailability={handleToggle}
                  onDelete={setConfirm}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {showAddModal && <ProductModal onClose={() => setShowAddModal(false)} onSave={fetchProducts} showToast={showToast} />}
      {editProduct && <ProductModal product={editProduct} onClose={() => setEditProduct(null)} onSave={fetchProducts} showToast={showToast} />}
      {stockProduct && <StockModal product={stockProduct} onClose={() => setStockProduct(null)} onSave={fetchProducts} showToast={showToast} />}
      {confirm && <ConfirmModal message="Delete this product? This cannot be undone." onConfirm={() => handleDelete(confirm)} onCancel={() => setConfirm(null)} />}
    </div>
  );
};

export default Products;