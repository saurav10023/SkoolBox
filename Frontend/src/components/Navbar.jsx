import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShoppingCart, Menu, X, LogOut, Shield, ChevronRight, Search, Loader2, ShoppingBag, Shirt, Backpack, PenLine, Footprints } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import API from "../api/axios";

import logo from "../assets/logo.png";

const navLinks = [
  { label: "Uniforms", to: "/products?category=uniform", icon: Shirt },
  { label: "Bags", to: "/products?category=bag", icon: Backpack },
  { label: "Socks", to: "/products?category=socks", icon: Footprints },
];

// Defined outside Navbar so it isn't remounted on every render
const Brand = ({ onClick }) => (
  <Link to="/" onClick={onClick} className="nb-brand nb-focus group flex items-center gap-2.5 shrink-0 min-w-0 rounded-2xl" aria-label="Skool Box Gumla — home">
    <span className="nb-badge relative shrink-0">
      <span className="nb-badge-glow" aria-hidden="true" />
      <span className="nb-badge-ring">
        <span className="nb-badge-face">
          <img src={logo} alt="" className="w-full h-full object-contain" />
        </span>
      </span>
    </span>
    <span className="flex flex-col leading-none min-w-0">
      <span className="nb-name">Skool Box</span>
      <span className="nb-sub">
        <i aria-hidden="true" />
        Gumla
      </span>
    </span>
  </Link>
);

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { cartCount } = useCart();

  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchBoxRef = useRef(null);
  const mobileInputRef = useRef(null);

  // Scroll: rAF-throttled, toggles the "floating capsule" state
  useEffect(() => {
    let ticking = false;
    const update = () => {
      setScrolled(window.scrollY > 12);
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll for mobile menu / search
  useEffect(() => {
    document.body.style.overflow = menuOpen || mobileSearchOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen, mobileSearchOpen]);

  // Close everything on route change
  useEffect(() => {
    setMenuOpen(false);
    setMobileSearchOpen(false);
    setSearchOpen(false);
  }, [location.pathname, location.search]);

  // Close mobile panels if the screen grows to desktop size (e.g. rotating a tablet)
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = (e) => {
      if (e.matches) {
        setMenuOpen(false);
        setMobileSearchOpen(false);
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Escape closes panels
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setMobileSearchOpen(false);
        setSearchOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Focus mobile search input when opened
  useEffect(() => {
    if (mobileSearchOpen) setTimeout(() => mobileInputRef.current?.focus(), 80);
  }, [mobileSearchOpen]);

  // Outside click closes desktop search
  useEffect(() => {
    const onDown = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) setSearchOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Debounced live search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await API.get(`/api/v1/products/filter?name=${encodeURIComponent(query.trim())}&limit=6`);
        setResults(res.data?.data?.products || []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  const goToResults = () => {
    if (!query.trim()) return;
    navigate(`/products?search=${encodeURIComponent(query.trim())}`);
    setSearchOpen(false);
    setMobileSearchOpen(false);
    setMenuOpen(false);
  };

  const goToProduct = (id) => {
    navigate(`/products/${id}`);
    setQuery("");
    setResults([]);
  };

  const scrollToSection = (id) => {
    setMenuOpen(false);
    const go = () => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    if (document.getElementById(id)) go();
    else {
      navigate("/");
      setTimeout(go, 400);
    }
  };

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate("/login");
  };

  const isActive = (to) => {
    const [path, q] = to.split("?");
    return location.pathname === path && (!q || location.search.includes(q));
  };

  const renderResults = () => (
    <div>
      {searching ? (
        <div className="flex items-center gap-2 px-3 py-4 text-sm text-gray-400">
          <Loader2 size={15} className="animate-spin" />
          Searching...
        </div>
      ) : results.length > 0 ? (
        <>
          {results.map((p) => {
            const minPrice = p.sizes?.length ? Math.min(...p.sizes.map((s) => s.price)) : null;
            return (
              <button
                key={p._id}
                onClick={() => goToProduct(p._id)}
                className="nb-focus flex items-center gap-3 w-full px-3 py-2.5 hover:bg-white/70 rounded-xl transition-colors text-left"
              >
                <div className="nb-chip w-11 h-11 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingBag size={14} className="text-blue-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                  <p className="text-xs text-gray-400 capitalize">{p.category}</p>
                </div>
                {minPrice !== null && <span className="text-sm font-bold text-blue-700 shrink-0">₹{minPrice}</span>}
              </button>
            );
          })}
          <button
            onClick={goToResults}
            className="nb-focus w-full text-center text-xs font-semibold text-blue-600 hover:underline py-3 mt-1 border-t border-white/60"
          >
            See all results for "{query}"
          </button>
        </>
      ) : query.trim() ? (
        <p className="px-3 py-4 text-sm text-gray-400 text-center">No products found for "{query}"</p>
      ) : null}
    </div>
  );

  return (
    <div className="contents nb" data-scrolled={scrolled} style={{ "--brand": "37,99,235", "--brand-2": "245,158,11" }}>
      <header className="nb-wrap">
        <nav className="nb-shell" aria-label="Main">
          <div className="nb-inner">
            <Brand />

            {/* Desktop links (lg and up) */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map(({ label, to, icon: Icon }) => (
                <Link key={label} to={to} data-active={isActive(to)} className="nb-link nb-focus">
                  <Icon size={15} className="hidden xl:block" />
                  {label}
                </Link>
              ))}
              <button onClick={() => scrollToSection("stationery")} className="nb-link nb-focus">
                <PenLine size={15} className="hidden xl:block" />
                Stationery
              </button>
            </div>

            {/* Desktop right */}
            <div className="hidden lg:flex items-center gap-1.5">
              <div ref={searchBoxRef} className="relative">
                <div className={`nb-search flex items-center rounded-full overflow-hidden ${searchOpen ? "w-56 xl:w-72 pr-3" : "w-10"}`}>
                  <button onClick={() => setSearchOpen(true)} className="nb-focus nb-icon-btn !bg-transparent !border-transparent" aria-label="Search products">
                    <Search size={17} />
                  </button>
                  {searchOpen && (
                    <input
                      autoFocus
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && goToResults()}
                      placeholder="Search products..."
                      className="w-full bg-transparent text-sm py-2 focus:outline-none text-gray-700 placeholder:text-gray-400"
                    />
                  )}
                </div>
                {searchOpen && query.trim() && (
                  <div className="nb-pop absolute top-full right-0 mt-3 w-80 rounded-2xl p-2 max-h-96 overflow-y-auto">
                    {renderResults()}
                  </div>
                )}
              </div>

              <Link to="/cart" className="nb-icon-btn nb-focus relative" aria-label={`Cart, ${cartCount} items`}>
                <ShoppingCart size={18} />
                {cartCount > 0 && <span className="nb-badge-count">{cartCount}</span>}
              </Link>

              {user ? (
                <div className="flex items-center gap-1">
                  {user.role === "admin" && (
                    <Link to="/admin" className="nb-admin nb-focus" aria-label="Admin dashboard">
                      <Shield size={13} />
                      <span className="hidden xl:inline">Admin</span>
                    </Link>
                  )}
                  <Link to="/profile" className="nb-profile nb-focus group" aria-label="Profile">
                    <span className="w-7 h-7 rounded-full overflow-hidden ring-2 ring-white/90 shrink-0">
                      <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                    </span>
                    <span className="hidden xl:inline text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors capitalize max-w-[7rem] truncate">
                      {user.username}
                    </span>
                  </Link>
                  <button onClick={handleLogout} className="nb-icon-btn nb-logout nb-focus" aria-label="Logout">
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1 pl-1">
                  <Link to="/login" className="nb-focus px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors rounded-full">
                    Login
                  </Link>
                  <Link to="/register" className="nb-cta nb-focus">
                    Register
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile + tablet right (below lg) */}
            <div className="lg:hidden flex items-center gap-1.5">
              <button onClick={() => setMobileSearchOpen(true)} className="nb-icon-btn nb-focus" aria-label="Search products">
                <Search size={19} />
              </button>
              <Link to="/cart" className="nb-icon-btn nb-focus relative" aria-label={`Cart, ${cartCount} items`}>
                <ShoppingCart size={19} />
                {cartCount > 0 && <span className="nb-badge-count">{cartCount}</span>}
              </Link>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="nb-icon-btn nb-focus"
                aria-label="Toggle menu"
                aria-expanded={menuOpen}
              >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile / tablet search overlay */}
      <div
        className={`lg:hidden fixed inset-0 z-[60] nb-overlay flex flex-col pt-[env(safe-area-inset-top)] transition-opacity duration-200 ${
          mobileSearchOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
        aria-hidden={!mobileSearchOpen}
      >
        <div className="flex items-center gap-2 px-3 h-16 shrink-0 w-full max-w-2xl mx-auto">
          <div className="nb-search flex items-center gap-2 rounded-full px-4 flex-1 w-auto">
            <Search size={17} className="text-gray-400 shrink-0" />
            <input
              ref={mobileInputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && goToResults()}
              placeholder="Search uniforms, bags, socks..."
              enterKeyHint="search"
              className="w-full bg-transparent text-[16px] py-3 focus:outline-none text-gray-700 placeholder:text-gray-400"
            />
          </div>
          <button
            onClick={() => { setMobileSearchOpen(false); setQuery(""); setResults([]); }}
            className="nb-icon-btn nb-focus"
            aria-label="Close search"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))] w-full max-w-2xl mx-auto">
          {renderResults()}
        </div>
      </div>

      {/* Mobile / tablet slide-over menu */}
      <div className={`lg:hidden fixed inset-0 z-[55] ${menuOpen ? "visible" : "invisible"} transition-[visibility] duration-300`}>
        <div
          onClick={() => setMenuOpen(false)}
          className={`absolute inset-0 bg-slate-900/30 backdrop-blur-[3px] transition-opacity duration-300 ${menuOpen ? "opacity-100" : "opacity-0"}`}
        />
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          aria-hidden={!menuOpen}
          className={`nb-sheet absolute top-[calc(0.5rem+env(safe-area-inset-top))] bottom-[calc(0.5rem+env(safe-area-inset-bottom))] right-[calc(0.5rem+env(safe-area-inset-right))] w-[88%] max-w-sm sm:max-w-md flex flex-col overflow-hidden transition-transform duration-[400ms] ease-[cubic-bezier(.22,1,.36,1)] ${
            menuOpen ? "translate-x-0" : "translate-x-[115%]"
          }`}
        >
          <div className="nb-blob nb-blob--1 absolute -top-20 -right-16 w-64 h-64 rounded-full pointer-events-none" />
          <div className="nb-blob nb-blob--2 absolute bottom-0 -left-16 w-56 h-56 rounded-full pointer-events-none" />

          <div className="relative flex items-center justify-between pl-4 pr-3 h-16 border-b border-white/50 shrink-0">
            <Brand onClick={() => setMenuOpen(false)} />
            <button onClick={() => setMenuOpen(false)} className="nb-icon-btn nb-focus" aria-label="Close menu">
              <X size={20} />
            </button>
          </div>

          <div className="relative flex-1 overflow-y-auto overscroll-contain px-4 py-4">
            {user && (
              <Link to="/profile" onClick={() => setMenuOpen(false)} className="nb-pop nb-focus flex items-center gap-3 px-4 py-3 mb-5 rounded-2xl">
                <span className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-white shrink-0">
                  <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-gray-800 capitalize truncate">{user.username}</span>
                  <span className="block text-xs text-gray-400 truncate">{user.email}</span>
                </span>
                <ChevronRight size={16} className="text-blue-600 shrink-0" />
              </Link>
            )}

            <p className="px-1 mb-2 text-xs font-semibold text-gray-400">Shop</p>
            <div className="space-y-2">
              {navLinks.map(({ label, to, icon: Icon }) => (
                <Link key={label} to={to} onClick={() => setMenuOpen(false)} data-active={isActive(to)} className="nb-row nb-focus">
                  <span className="nb-chip flex items-center justify-center w-10 h-10 rounded-xl shrink-0">
                    <Icon size={17} className="text-blue-600" />
                  </span>
                  <span className="flex-1">{label}</span>
                  <ChevronRight size={15} className="text-gray-300" />
                </Link>
              ))}
              <button onClick={() => scrollToSection("stationery")} className="nb-row nb-focus w-full text-left">
                <span className="nb-chip flex items-center justify-center w-10 h-10 rounded-xl shrink-0">
                  <PenLine size={17} className="text-blue-600" />
                </span>
                <span className="flex-1">Stationery</span>
                <ChevronRight size={15} className="text-gray-300" />
              </button>
            </div>

            {user?.role === "admin" && (
              <div className="mt-6">
                <p className="px-1 mb-2 text-xs font-semibold text-gray-400">Manage</p>
                <Link to="/admin" onClick={() => setMenuOpen(false)} className="nb-row nb-row--admin nb-focus">
                  <span className="nb-chip nb-chip--admin flex items-center justify-center w-10 h-10 rounded-xl shrink-0">
                    <Shield size={17} />
                  </span>
                  <span className="flex-1">Admin dashboard</span>
                </Link>
              </div>
            )}
          </div>

          <div className="relative border-t border-white/50 p-4 shrink-0">
            {user ? (
              <button onClick={handleLogout} className="nb-logout-row nb-focus">
                <LogOut size={16} />
                Logout
              </button>
            ) : (
              <div className="flex flex-col gap-2.5">
                <Link to="/login" onClick={() => setMenuOpen(false)} className="nb-btn-secondary nb-focus">
                  Login
                </Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="nb-cta nb-focus !flex !justify-center !py-3 !text-[15px] !rounded-2xl">
                  Register
                </Link>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Spacer for the fixed navbar */}
      <div className="nb-spacer" />

      <style>{`
        .nb { --ease: cubic-bezier(.22,1,.36,1); }
        .nb-focus:focus-visible { outline: 2px solid rgba(var(--brand),.7); outline-offset: 2px; }
        .nb-spacer { height: calc(4rem + env(safe-area-inset-top, 0px)); }
        @media (min-width: 1024px) { .nb-spacer { height: 4.75rem; } }

        /* ── Shell: full-width bar at top → floating glass capsule on scroll ── */
        .nb-wrap {
          position: fixed; top: 0; left: 0; right: 0; z-index: 50;
          padding: env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px) 0 env(safe-area-inset-left, 0px);
          transition: padding .5s var(--ease);
          pointer-events: none;
        }
        .nb[data-scrolled="true"] .nb-wrap {
          padding:
            calc(.5rem + env(safe-area-inset-top, 0px))
            calc(.625rem + env(safe-area-inset-right, 0px))
            .5rem
            calc(.625rem + env(safe-area-inset-left, 0px));
        }
        @media (min-width: 640px) {
          .nb[data-scrolled="true"] .nb-wrap {
            padding-left: calc(1rem + env(safe-area-inset-left, 0px));
            padding-right: calc(1rem + env(safe-area-inset-right, 0px));
          }
        }
        @media (min-width: 1024px) {
          .nb-wrap { padding-top: 0; }
          .nb[data-scrolled="true"] .nb-wrap { padding: .75rem 1.5rem; }
        }

        .nb-shell {
          pointer-events: auto;
          position: relative;
          margin: 0 auto;
          max-width: 100%;
          height: 4rem;
          border-radius: 0;
          background: linear-gradient(180deg, rgba(255,255,255,.74), rgba(255,255,255,.52));
          -webkit-backdrop-filter: blur(18px) saturate(170%);
          backdrop-filter: blur(18px) saturate(170%);
          border: 1px solid rgba(255,255,255,0);
          border-bottom-color: rgba(255,255,255,.65);
          box-shadow: 0 1px 0 rgba(var(--brand),.05);
          transition:
            max-width .6s var(--ease), height .5s var(--ease), border-radius .6s var(--ease),
            background .4s ease, box-shadow .5s ease, border-color .4s ease;
          will-change: max-width, border-radius;
        }
        @media (min-width: 1024px) { .nb-shell { height: 4.75rem; } }

        .nb[data-scrolled="true"] .nb-shell {
          max-width: 72rem;
          height: 3.5rem;
          border-radius: 1.75rem;
          background: linear-gradient(160deg, rgba(255,255,255,.84), rgba(255,255,255,.6));
          border-color: rgba(255,255,255,.85);
          box-shadow:
            0 18px 40px -22px rgba(var(--brand),.4),
            0 4px 14px -6px rgba(15,23,42,.12),
            inset 0 1px 0 rgba(255,255,255,.95),
            inset 0 -1px 0 rgba(var(--brand),.08);
        }
        @media (min-width: 1024px) { .nb[data-scrolled="true"] .nb-shell { height: 3.75rem; } }

        /* Soft colour wash inside the glass so the blur has something to refract */
        .nb-shell::before {
          content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
          background:
            radial-gradient(60% 140% at 8% 0%, rgba(var(--brand),.08), transparent 60%),
            radial-gradient(50% 140% at 96% 100%, rgba(var(--brand-2),.08), transparent 60%);
          opacity: .8; transition: opacity .5s ease;
        }
        .nb[data-scrolled="true"] .nb-shell::before { opacity: 1; }

        .nb-inner {
          position: relative; height: 100%;
          max-width: 80rem; margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between; gap: .5rem;
          padding: 0 .75rem;
          transition: padding .5s var(--ease);
        }
        @media (min-width: 400px) { .nb-inner { padding: 0 .875rem; } }
        @media (min-width: 640px) { .nb-inner { padding: 0 1.5rem; } }
        .nb[data-scrolled="true"] .nb-inner { padding: 0 .5rem 0 .75rem; }
        @media (min-width: 640px) { .nb[data-scrolled="true"] .nb-inner { padding: 0 .75rem 0 1rem; } }
        @media (min-width: 1024px) {
          .nb-inner { padding: 0 2rem; gap: 1rem; }
          .nb[data-scrolled="true"] .nb-inner { padding: 0 .75rem 0 1rem; }
        }

        /* ── Logo + wordmark ── */
        .nb-badge { width: 2.5rem; height: 2.5rem; transition: width .5s var(--ease), height .5s var(--ease), transform .35s var(--ease); }
        @media (min-width: 1024px) { .nb-badge { width: 2.875rem; height: 2.875rem; } }
        .nb[data-scrolled="true"] .nb-badge { width: 2.25rem; height: 2.25rem; }
        @media (min-width: 1024px) { .nb[data-scrolled="true"] .nb-badge { width: 2.5rem; height: 2.5rem; } }
        @media (hover: hover) {
          .nb-brand:hover .nb-badge { transform: rotate(-6deg) scale(1.05); }
          .nb-brand:hover .nb-badge-glow { opacity: .28; }
        }

        /* Dimmed glow: smaller, tighter and far less opaque than before */
        .nb-badge-glow {
          position: absolute; inset: -3px; border-radius: 1rem; filter: blur(7px); opacity: .14;
          background: conic-gradient(from 200deg, rgba(var(--brand),.8), rgba(var(--brand-2),.8), rgba(var(--brand),.8));
          transition: opacity .35s ease;
        }
        .nb-badge-ring {
          position: relative; display: block; width: 100%; height: 100%; padding: 2px; border-radius: 28%;
          background: conic-gradient(from 210deg, rgb(var(--brand)), rgb(var(--brand-2)), rgba(255,255,255,.95), rgb(var(--brand)));
          box-shadow: 0 4px 10px -6px rgba(var(--brand),.45), inset 0 1px 0 rgba(255,255,255,.7);
        }
        .nb-badge-face {
          display: block; width: 100%; height: 100%; padding: 12%; border-radius: 26%; overflow: hidden;
          background: linear-gradient(160deg, #fff, rgba(240,246,255,.95));
          box-shadow: inset 0 1px 2px rgba(255,255,255,1), inset 0 -2px 5px rgba(var(--brand),.1);
        }
        .nb-name {
          font-weight: 900; letter-spacing: -.02em; font-size: 1.0625rem; line-height: 1.1;
          background: linear-gradient(100deg, #0f172a 20%, rgb(29,78,216) 75%, rgb(37,99,235));
          -webkit-background-clip: text; background-clip: text; color: transparent;
          white-space: nowrap; transition: font-size .5s var(--ease);
        }
        @media (max-width: 359px) { .nb-name { font-size: .975rem; } }
        @media (min-width: 1024px) { .nb-name { font-size: 1.3125rem; } }
        .nb[data-scrolled="true"] .nb-name { font-size: 1rem; }
        @media (min-width: 1024px) { .nb[data-scrolled="true"] .nb-name { font-size: 1.125rem; } }
        .nb-sub {
          display: inline-flex; align-items: center; gap: .3rem; margin-top: .3rem;
          font-size: .6875rem; font-weight: 600; letter-spacing: .06em; color: rgb(217,119,6);
          overflow: hidden; max-height: 1rem; opacity: 1;
          transition: max-height .4s var(--ease), opacity .3s ease, margin .4s var(--ease);
        }
        .nb-sub i { width: .35rem; height: .35rem; border-radius: 9999px; background: rgb(var(--brand-2)); box-shadow: 0 0 0 3px rgba(var(--brand-2),.18); }
        /* Below lg the tagline tucks away inside the capsule to keep the bar calm */
        @media (max-width: 1023px) { .nb[data-scrolled="true"] .nb-shell .nb-sub { max-height: 0; opacity: 0; margin-top: 0; } }
        .nb-sheet .nb-sub { max-height: 1rem !important; opacity: 1 !important; margin-top: .3rem !important; }

        /* ── Links ── */
        .nb-link {
          display: inline-flex; align-items: center; gap: .4rem; padding: .5rem .8rem;
          font-size: .875rem; font-weight: 500; color: rgb(75,85,99); border-radius: 9999px;
          border: 1px solid transparent; transition: background .25s ease, color .25s ease, box-shadow .25s ease;
        }
        @media (min-width: 1280px) { .nb-link { padding: .5rem .9rem; } }
        .nb-link:hover { background: rgba(255,255,255,.7); color: rgb(37,99,235); }
        .nb-link[data-active="true"] {
          color: rgb(29,78,216); font-weight: 600; background: rgba(255,255,255,.9);
          border-color: rgba(255,255,255,.95);
          box-shadow: 0 6px 14px -8px rgba(var(--brand),.5), inset 0 1px 0 #fff;
        }

        /* ── Icon buttons, search, cart badge ── */
        .nb-icon-btn {
          display: inline-flex; align-items: center; justify-content: center; width: 2.5rem; height: 2.5rem; flex-shrink: 0;
          color: rgb(75,85,99); border-radius: 9999px;
          background: rgba(255,255,255,.45); border: 1px solid rgba(255,255,255,.75);
          transition: background .25s ease, color .25s ease, transform .2s ease;
        }
        /* Comfortable touch targets on phones/tablets that have the room */
        @media (min-width: 400px) and (max-width: 1023px) { .nb-icon-btn { width: 2.75rem; height: 2.75rem; } }
        @media (hover: hover) { .nb-icon-btn:hover { background: rgba(255,255,255,.85); color: rgb(37,99,235); } }
        .nb-icon-btn:active { transform: scale(.94); }
        @media (hover: hover) { .nb-logout:hover { background: rgba(239,68,68,.12); color: rgb(239,68,68); } }
        .nb-search {
          background: rgba(255,255,255,.55); border: 1px solid rgba(255,255,255,.8); height: 2.5rem;
          transition: width .4s var(--ease), background .25s ease;
        }
        .nb-overlay .nb-search { height: 2.75rem; }
        .nb-search:focus-within { background: rgba(255,255,255,.9); box-shadow: 0 0 0 3px rgba(var(--brand),.15); }
        .nb-badge-count {
          position: absolute; top: -2px; right: -2px; min-width: 17px; height: 17px; padding: 0 4px;
          display: flex; align-items: center; justify-content: center; border-radius: 9999px;
          font-size: 10px; font-weight: 700; color: #fff;
          background: linear-gradient(135deg, rgb(248,113,113), rgb(239,68,68)); border: 1.5px solid rgba(255,255,255,.95);
          box-shadow: 0 3px 8px -2px rgba(239,68,68,.55);
        }

        /* ── Auth ── */
        .nb-profile {
          display: flex; align-items: center; gap: .5rem; padding: .25rem; border-radius: 9999px;
          background: rgba(255,255,255,.45); border: 1px solid rgba(255,255,255,.75); transition: background .25s ease;
        }
        @media (min-width: 1280px) { .nb-profile { padding: .25rem .6rem .25rem .25rem; } }
        .nb-profile:hover { background: rgba(255,255,255,.85); }
        .nb-admin {
          display: inline-flex; align-items: center; justify-content: center; gap: .35rem; min-width: 2.25rem; height: 2.25rem; padding: 0 .6rem; border-radius: 9999px;
          font-size: .75rem; font-weight: 600; color: rgb(126,34,206);
          background: rgba(147,51,234,.1); border: 1px solid rgba(147,51,234,.2); transition: background .25s ease;
        }
        .nb-admin:hover { background: rgba(147,51,234,.18); }
        .nb-cta {
          position: relative; overflow: hidden; isolation: isolate; display: inline-flex; align-items: center;
          padding: .55rem 1.1rem; border-radius: 9999px; font-size: .875rem; font-weight: 600; color: #fff;
          background: linear-gradient(135deg, rgba(59,130,246,.95), rgba(29,78,216,.98));
          border: 1px solid rgba(255,255,255,.4);
          box-shadow: 0 12px 22px -12px rgba(var(--brand),.7), inset 0 1px 0 rgba(255,255,255,.45);
          transition: box-shadow .3s ease, transform .2s ease;
        }
        .nb-cta:hover { box-shadow: 0 16px 28px -12px rgba(var(--brand),.8), inset 0 1px 0 rgba(255,255,255,.5); }
        .nb-cta:active { transform: scale(.97); }
        .nb-cta::after {
          content: ""; position: absolute; top: 0; left: -60%; width: 40%; height: 100%; pointer-events: none;
          background: linear-gradient(115deg, transparent, rgba(255,255,255,.55), transparent);
          transform: skewX(-18deg); transition: left .7s ease;
        }
        @media (hover: hover) { .nb-cta:hover::after { left: 130%; } }

        /* ── Floating surfaces (search dropdown, profile card) ── */
        .nb-pop {
          background: rgba(255,255,255,.88);
          -webkit-backdrop-filter: blur(18px); backdrop-filter: blur(18px);
          border: 1px solid rgba(255,255,255,.9);
          box-shadow: 0 24px 48px -24px rgba(var(--brand),.4), 0 6px 16px -8px rgba(15,23,42,.12), inset 0 1px 0 #fff;
        }
        .nb-chip {
          background: linear-gradient(150deg, rgba(var(--brand),.2), rgba(var(--brand),.07));
          border: 1px solid rgba(255,255,255,.8); box-shadow: inset 0 1px 0 rgba(255,255,255,.7);
        }
        .nb-chip--admin { background: rgba(147,51,234,.14); border-color: rgba(147,51,234,.25); color: rgb(126,34,206); }

        /* ── Mobile search overlay + sheet ── */
        .nb-overlay { background: rgba(255,255,255,.9); -webkit-backdrop-filter: blur(22px); backdrop-filter: blur(22px); }
        .nb-sheet {
          border-radius: 1.75rem;
          background: linear-gradient(170deg, rgba(255,255,255,.84), rgba(255,255,255,.64));
          -webkit-backdrop-filter: blur(26px) saturate(170%); backdrop-filter: blur(26px) saturate(170%);
          border: 1px solid rgba(255,255,255,.85);
          box-shadow: -20px 20px 60px -24px rgba(var(--brand),.45), inset 0 1px 0 #fff;
        }
        .nb-row {
          display: flex; align-items: center; gap: .75rem; padding: .625rem .75rem; border-radius: 1rem; min-height: 3.5rem;
          font-size: 15px; font-weight: 600; color: rgb(55,65,81);
          background: rgba(255,255,255,.45); border: 1px solid rgba(255,255,255,.7); transition: background .25s ease, color .25s ease;
        }
        @media (hover: hover) { .nb-row:hover { background: rgba(255,255,255,.85); color: rgb(37,99,235); } }
        .nb-row[data-active="true"] { background: rgba(255,255,255,.95); color: rgb(29,78,216); box-shadow: 0 8px 18px -12px rgba(var(--brand),.6); }
        .nb-row--admin { color: rgb(126,34,206); background: rgba(147,51,234,.1); border-color: rgba(147,51,234,.22); }
        .nb-btn-secondary {
          display: block; text-align: center; padding: .75rem 1rem; border-radius: 1rem; font-size: 15px; font-weight: 600;
          color: rgb(29,78,216); background: rgba(255,255,255,.6); border: 2px solid rgba(255,255,255,.9); transition: background .25s ease;
        }
        .nb-btn-secondary:hover { background: rgba(239,246,255,.9); }
        .nb-logout-row {
          display: flex; align-items: center; justify-content: center; gap: .5rem; width: 100%; padding: .75rem 1rem;
          border-radius: 1rem; font-size: 15px; font-weight: 600; color: rgb(239,68,68);
          background: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.22); transition: background .25s ease, color .25s ease;
        }
        @media (hover: hover) { .nb-logout-row:hover { background: rgba(239,68,68,.92); color: #fff; } }
        .nb-logout-row:active { background: rgba(239,68,68,.92); color: #fff; }

        .nb-blob { filter: blur(50px); opacity: .35; }
        .nb-blob--1 { background: radial-gradient(circle at 30% 30%, rgba(var(--brand),.35), transparent 70%); animation: nbDrift1 15s ease-in-out infinite; }
        .nb-blob--2 { background: radial-gradient(circle at 60% 40%, rgba(var(--brand-2),.28), transparent 70%); animation: nbDrift2 13s ease-in-out infinite; }
        @keyframes nbDrift1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-14px,16px) scale(1.06); } }
        @keyframes nbDrift2 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(12px,-14px) scale(1.05); } }

        @media (prefers-reduced-motion: reduce) {
          .nb *, .nb *::before, .nb *::after { animation: none !important; transition-duration: .01ms !important; }
        }
        /* Fallback when backdrop-filter is unsupported */
        @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
          .nb-shell, .nb-sheet, .nb-overlay, .nb-pop { background: rgba(255,255,255,.95); }
        }
      `}</style>
    </div>
  );
};

export default Navbar;