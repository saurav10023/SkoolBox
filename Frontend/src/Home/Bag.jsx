import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, AlertCircle, ChevronRight, Tag, ArrowUpRight } from "lucide-react";
import API from "../api/axios";

/* Persistent-observer reveal hook: observes an element the instant it mounts
   (via the ref callback), so it works for elements that appear after async data. */
const useFadeIn = () => {
  const observerRef = useRef(null);
  if (!observerRef.current) {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observerRef.current.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
  }

  useEffect(() => {
    const observer = observerRef.current;
    return () => observer?.disconnect();
  }, []);

  return (el) => {
    if (el) observerRef.current.observe(el);
  };
};

/* ───────────── Skeleton ───────────── */
const SkeletonCard = ({ index }) => (
  <div
    className="uf-card uf-skeleton rounded-3xl overflow-hidden"
    style={{ animationDelay: `${index * 90}ms` }}
  >
    <div className="h-44 sm:h-56 uf-shimmer" />
    <div className="p-3.5 sm:p-4 space-y-3">
      <div className="h-4 uf-shimmer rounded-full w-3/4" />
      <div className="h-4 uf-shimmer rounded-full w-1/3" />
      <div className="h-9 uf-shimmer rounded-2xl mt-4" />
    </div>
  </div>
);

/* ───────────── Product card ───────────── */
const ProductCard = ({ product, index, navigate, addFadeRef }) => {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef(null);

  const minPrice = product.sizes?.length
    ? Math.min(...product.sizes.map((s) => s.price))
    : null;

  const isOutOfStock = product.sizes?.every((s) => s.stock === 0);
  const hasSecondImage = Boolean(product.images?.[1]);

  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true);
  }, []);

  const open = () => {
    if (!isOutOfStock) navigate(`/products/${product._id}`);
  };

  const handleMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <div
      ref={addFadeRef}
      onClick={open}
      onMouseMove={handleMove}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          open();
        }
      }}
      role="link"
      tabIndex={isOutOfStock ? -1 : 0}
      aria-disabled={isOutOfStock}
      aria-label={`${product.name}${isOutOfStock ? ", out of stock" : ""}`}
      style={{ animationDelay: `${Math.min(index, 11) * 70}ms` }}
      className={`uf-card uf-reveal group rounded-3xl overflow-hidden flex flex-col
        ${isOutOfStock ? "opacity-70 cursor-not-allowed" : "uf-card-live cursor-pointer"}`}
    >
      {/* Image */}
      <div className="relative h-44 sm:h-56 overflow-hidden m-1.5 rounded-[1.25rem] bg-white/40">
        {product.images?.[0] ? (
          <>
            {!loaded && <div className="absolute inset-0 uf-shimmer" />}
            <img
              ref={imgRef}
              src={product.images[0]}
              alt={product.name}
              loading="lazy"
              onLoad={() => setLoaded(true)}
              className={`absolute inset-0 w-full h-full object-cover uf-img
                ${loaded ? "opacity-100" : "opacity-0"}
                ${hasSecondImage ? "group-hover:opacity-0" : ""}`}
            />
            {hasSecondImage && (
              <img
                src={product.images[1]}
                alt=""
                loading="lazy"
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover uf-img opacity-0 group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag size={32} className="text-blue-200" />
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-slate-900/25 to-transparent pointer-events-none" />

        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/55 backdrop-blur-sm flex items-center justify-center">
            <span className="bg-red-500/90 text-white text-xs font-bold px-3.5 py-1.5 rounded-full backdrop-blur-sm shadow-lg shadow-red-500/20">
              Out of Stock
            </span>
          </div>
        )}

        {!isOutOfStock && product.sizes?.length > 0 && (
          <div className="glass-pill-light absolute bottom-2.5 left-2.5 text-gray-700 text-[11px] sm:text-xs font-semibold px-2.5 py-1 rounded-full">
            {product.sizes.length} size{product.sizes.length > 1 ? "s" : ""}
          </div>
        )}

        {!isOutOfStock && (
          <span className="uf-arrow absolute top-2.5 right-2.5 w-8 h-8 rounded-full glass-pill-light flex items-center justify-center text-blue-700">
            <ArrowUpRight size={15} />
          </span>
        )}
      </div>

      {/* Info */}
      <div className="px-3.5 pb-3.5 pt-2 sm:px-4 sm:pb-4 flex flex-col gap-2.5 flex-1">
        <h3 className="text-sm sm:text-[15px] font-bold text-gray-800 leading-snug line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h3>

        <div className="flex items-baseline gap-1.5 text-blue-700 mt-auto">
          <Tag size={12} className="self-center" />
          <span className="text-base sm:text-lg font-black tracking-tight">
            {minPrice !== null ? `₹${minPrice}` : "—"}
          </span>
          {product.sizes?.length > 1 && (
            <span className="text-xs text-gray-400 font-medium">onwards</span>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!isOutOfStock) navigate(`/products/${product._id}`);
          }}
          disabled={isOutOfStock}
          className="glass-view-btn w-full flex items-center justify-center gap-1.5 text-blue-700 text-xs sm:text-[13px] font-semibold py-2.5 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ShoppingBag size={14} />
          View Product
        </button>
      </div>
    </div>
  );
};

/* ───────────── Section ───────────── */
const Bag = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const addFadeRef = useFadeIn();

  useEffect(() => {
    const fetchBags = async () => {
      try {
        const res = await API.get("/api/v1/products?category=bag");
        setProducts(res.data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load bags");
      } finally {
        setLoading(false);
      }
    };
    fetchBags();
  }, []);

  return (
    <section
      id="bags"
      className="uf-root relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 overflow-hidden"
      style={{ "--brand": "37,99,235" /* blue-600 */, "--brand-2": "245,158,11" /* amber-500 */ }}
    >
      {/* Ambient glass blobs */}
      <div className="glass-blob glass-blob--1 absolute -top-16 -right-16 w-80 h-80 rounded-full pointer-events-none" />
      <div className="glass-blob glass-blob--2 absolute bottom-0 -left-16 w-72 h-72 rounded-full pointer-events-none" />
      <div className="glass-blob glass-blob--3 absolute top-1/2 left-1/2 w-64 h-64 rounded-full pointer-events-none" />

      {/* Section Header */}
      <div className="uf-enter relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div className="space-y-1.5">
          <div className="glass-pill inline-flex items-center gap-2 text-blue-700 text-xs font-semibold px-3.5 py-1.5 rounded-full">
            <span className="glass-dot w-1.5 h-1.5 rounded-full" />
            Collection
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
            School Bags
          </h2>
          <p className="text-sm sm:text-base text-gray-500">
            Durable and spacious bags for every student
          </p>
        </div>

        <button
          onClick={() => navigate("/products?category=bag")}
          className="uf-link hidden sm:flex glass-pill items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 px-4 py-2 rounded-full shrink-0"
        >
          View All
          <ChevronRight size={16} className="uf-chevron" />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="uf-enter relative glass-card flex items-center gap-2 text-red-600 px-4 py-3 rounded-2xl text-sm mb-6 border-red-200/70">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Grid */}
      <div className="relative grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} index={i} />)
        ) : products.length === 0 ? (
          <div className="uf-enter col-span-full flex flex-col items-center justify-center py-16 gap-3">
            <span className="glass-icon-chip uf-float flex items-center justify-center w-16 h-16 rounded-full">
              <ShoppingBag size={28} className="text-blue-400" />
            </span>
            <p className="text-gray-500 text-sm font-medium text-center">No bags available right now</p>
          </div>
        ) : (
          products.map((product, i) => (
            <ProductCard key={product._id} product={product} index={i} navigate={navigate} addFadeRef={addFadeRef} />
          ))
        )}
      </div>

      {/* Mobile view all */}
      {!loading && products.length > 0 && (
        <div className="uf-enter relative sm:hidden mt-8 text-center">
          <button
            onClick={() => navigate("/products?category=bag")}
            className="uf-link glass-pill flex items-center gap-1.5 mx-auto text-sm font-semibold text-blue-600 hover:text-blue-700 px-5 py-2.5 rounded-full"
          >
            View All Bags
            <ChevronRight size={16} className="uf-chevron" />
          </button>
        </div>
      )}

      <style>{`
        .uf-root { --ease: cubic-bezier(.22,1,.36,1); }

        /* ── Liquid glass surfaces ── */
        .glass-card, .uf-card {
          background: linear-gradient(160deg, rgba(255,255,255,0.72), rgba(255,255,255,0.42));
          border: 1px solid rgba(255,255,255,0.8);
          backdrop-filter: blur(18px) saturate(160%);
          -webkit-backdrop-filter: blur(18px) saturate(160%);
          box-shadow: 0 12px 30px -16px rgba(var(--brand),0.3),
                      inset 0 1px 0 rgba(255,255,255,0.95),
                      inset 0 -1px 0 rgba(var(--brand),0.06);
        }

        .uf-card {
          position: relative;
          isolation: isolate;
          transition: transform .5s var(--ease), box-shadow .5s var(--ease), opacity .3s;
          -webkit-tap-highlight-color: transparent;
        }
        .uf-card:focus-visible {
          outline: 2px solid rgba(var(--brand),0.9);
          outline-offset: 3px;
        }
        .uf-card::before {
          content: ""; position: absolute; inset: 0; z-index: 1; pointer-events: none;
          border-radius: inherit; opacity: 0; transition: opacity .4s;
          background: radial-gradient(240px circle at var(--mx,50%) var(--my,0%),
                      rgba(255,255,255,0.65), transparent 65%);
        }
        .uf-card::after {
          content: ""; position: absolute; top: 0; left: -70%; z-index: 2;
          width: 40%; height: 100%; pointer-events: none;
          background: linear-gradient(115deg, transparent, rgba(255,255,255,0.5), transparent);
          transform: skewX(-18deg);
          transition: left .9s var(--ease);
        }
        .uf-card-live:hover { transform: translateY(-6px); box-shadow: 0 26px 44px -20px rgba(var(--brand),0.45), inset 0 1px 0 rgba(255,255,255,1); }
        .uf-card-live:active { transform: translateY(-2px) scale(.985); }
        .uf-card-live:hover::before { opacity: 1; }
        .uf-card-live:hover::after { left: 130%; }

        .uf-img { transition: transform .8s var(--ease), opacity .6s ease; will-change: transform; }
        .uf-card-live:hover .uf-img { transform: scale(1.08); }

        .uf-arrow { opacity: 0; transform: translate(-6px, 6px) scale(.8); transition: all .45s var(--ease); }
        .uf-card-live:hover .uf-arrow, .uf-card-live:focus-visible .uf-arrow { opacity: 1; transform: none; }
        @media (hover: none) { .uf-arrow { display: none; } }

        .glass-pill {
          background: rgba(255,255,255,0.6);
          border: 1px solid rgba(255,255,255,0.85);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          box-shadow: 0 8px 18px -10px rgba(var(--brand),0.3), inset 0 1px 0 rgba(255,255,255,0.95);
        }
        .glass-dot { background: rgb(var(--brand)); position: relative; }
        .glass-dot::after {
          content: ""; position: absolute; inset: 0; border-radius: 9999px;
          background: rgb(var(--brand)); animation: ufPing 2s ease-out infinite;
        }
        @keyframes ufPing { 0% { transform: scale(1); opacity: .7; } 100% { transform: scale(3.2); opacity: 0; } }

        .glass-icon-chip {
          background: linear-gradient(150deg, rgba(var(--brand),0.2), rgba(var(--brand),0.06));
          border: 1px solid rgba(255,255,255,0.8);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.8), 0 8px 18px -8px rgba(var(--brand),0.35);
        }
        .uf-float { animation: ufFloat 4s ease-in-out infinite; }
        @keyframes ufFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }

        .glass-pill-light {
          background: rgba(255,255,255,0.78);
          border: 1px solid rgba(255,255,255,0.9);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          box-shadow: 0 6px 14px -8px rgba(15,23,42,0.25);
        }

        /* View product button */
        .glass-view-btn {
          background: rgba(37,99,235,0.08);
          border: 1px solid rgba(37,99,235,0.16);
          transition: background .35s var(--ease), color .35s var(--ease), border-color .35s var(--ease),
                      transform .35s var(--ease), box-shadow .35s var(--ease);
        }
        .glass-view-btn:hover:not(:disabled) {
          background: rgba(37,99,235,0.95); color: #fff; border-color: rgba(37,99,235,0.95);
          box-shadow: 0 10px 20px -10px rgba(var(--brand),0.6);
        }
        .glass-view-btn:active:not(:disabled) { transform: scale(.97); }
        .glass-view-btn:focus-visible { outline: 2px solid rgba(var(--brand),0.9); outline-offset: 2px; }

        /* "View all" links */
        .uf-link { transition: transform .35s var(--ease), box-shadow .35s var(--ease); }
        .uf-link:hover { transform: translateY(-2px); }
        .uf-chevron { transition: transform .35s var(--ease); }
        .uf-link:hover .uf-chevron { transform: translateX(3px); }

        /* ── Entrance + loading ── */
        .uf-enter { animation: ufRise .8s var(--ease) backwards; }
        @keyframes ufRise {
          from { opacity: 0; transform: translateY(22px) scale(.96); filter: blur(6px); }
          to   { opacity: 1; transform: none; filter: blur(0); }
        }
        .uf-skeleton { animation: ufRise .6s var(--ease) backwards; }
        .uf-reveal:not(.in-view) { opacity: 0; }
        .uf-reveal.in-view { animation: ufRise .8s var(--ease) backwards; }
        .uf-shimmer {
          background: linear-gradient(100deg, rgba(255,255,255,0.35) 30%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0.35) 70%);
          background-size: 200% 100%;
          animation: ufShimmer 1.4s linear infinite;
        }
        @keyframes ufShimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }

        /* ── Ambient background blobs ── */
        .glass-blob { filter: blur(64px); opacity: 0.4; }
        .glass-blob--1 {
          background: radial-gradient(circle at 30% 30%, rgba(var(--brand),0.32), rgba(var(--brand),0));
          animation: drift1 16s ease-in-out infinite;
        }
        .glass-blob--2 {
          background: radial-gradient(circle at 60% 40%, rgba(var(--brand-2),0.24), rgba(var(--brand-2),0));
          animation: drift2 14s ease-in-out infinite;
        }
        .glass-blob--3 {
          background: radial-gradient(circle, rgba(99,102,241,0.18), rgba(99,102,241,0));
          animation: drift1 20s ease-in-out infinite reverse;
        }
        @keyframes drift1 {
          0%, 100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(-22px, 24px) scale(1.08); }
        }
        @keyframes drift2 {
          0%, 100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(20px, -20px) scale(1.06); }
        }

        @media (hover: none) {
          .uf-card-live:hover { transform: none; }
          .uf-card-live:hover .uf-img { transform: none; }
        }

        @media (prefers-reduced-motion: reduce) {
          .glass-blob--1, .glass-blob--2, .glass-blob--3,
          .glass-dot::after, .uf-float, .uf-shimmer { animation: none !important; }
          .uf-enter, .uf-skeleton, .uf-reveal.in-view { animation: none !important; }
          .uf-reveal:not(.in-view) { opacity: 1 !important; }
          .uf-card, .uf-img, .uf-card::after { transition: none !important; }
        }
      `}</style>
    </section>
  );
};

export default Bag;