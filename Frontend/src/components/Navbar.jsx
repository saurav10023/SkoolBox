import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Menu, X, LogOut, Shield, ChevronRight, Search, Loader2, ShoppingBag } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import API from "../api/axios";

// Same logo asset used across the auth pages / footer / invoice
import logo from "../assets/logo.png";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { cartCount } = useCart();

  // ── Search state (shared logic, two UIs: desktop dropdown + mobile panel) ──
  const [searchOpen, setSearchOpen] = useState(false);       // desktop expandable bar
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false); // mobile overlay
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchBoxRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu or mobile search overlay is open
  useEffect(() => {
    document.body.style.overflow = (menuOpen || mobileSearchOpen) ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen, mobileSearchOpen]);

  // Close desktop search dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced live search — hits the /products/filter?name= endpoint
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
      } catch (err) {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350); // debounce so we're not firing a request on every keystroke

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
    setSearchOpen(false);
    setMobileSearchOpen(false);
  };

  const scrollToSection = (id) => {
    setMenuOpen(false);
    const section = document.getElementById(id);
    if (section) section.scrollIntoView({ behavior: "smooth" });
  };

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate("/login");
  };

  const navLinks = [
    { label: "Uniforms", to: "/products?category=uniform" },
    { label: "Bags",     to: "/products?category=bag" },
    { label: "Socks",    to: "/products?category=socks" },
  ];

  // Shared results dropdown, reused for both desktop and mobile
  const ResultsList = ({ compact }) => (
    <div className={compact ? "" : "border-t border-gray-100 mt-2 pt-2"}>
      {searching ? (
        <div className="flex items-center gap-2 px-3 py-4 text-sm text-gray-400">
          <Loader2 size={15} className="animate-spin" />
          Searching...
        </div>
      ) : results.length > 0 ? (
        <>
          {results.map((p) => {
            const minPrice = p.sizes?.length ? Math.min(...p.sizes.map(s => s.price)) : null;
            return (
              <button
                key={p._id}
                onClick={() => goToProduct(p._id)}
                className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-blue-50 rounded-lg transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag size={14} className="text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                  <p className="text-xs text-gray-400 capitalize">{p.category}</p>
                </div>
                {minPrice !== null && (
                  <span className="text-sm font-bold text-blue-600 shrink-0">₹{minPrice}</span>
                )}
              </button>
            );
          })}
          <button
            onClick={goToResults}
            className="w-full text-center text-xs font-semibold text-blue-600 hover:underline py-2.5 mt-1 border-t border-gray-50"
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
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white/95 backdrop-blur-md ${
          scrolled ? "shadow-sm border-b border-gray-100" : "border-b border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16 lg:h-[4.25rem] gap-2">

            {/* ── Logo ── */}
            <Link to="/" className="flex items-center gap-2 sm:gap-2.5 group shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 bg-blue-600 rounded-lg flex items-center justify-center overflow-hidden shrink-0 transition-transform duration-200 group-hover:scale-105">
                <img
                  src={logo}
                  alt="Skool Box logo"
                  className="w-full h-full object-contain p-1 bg-white rounded-lg"
                />
              </div>
              <div className="leading-none">
                <span className="block font-black text-gray-900 text-sm sm:text-base lg:text-lg tracking-tight">
                  Skool Box
                </span>
                <span className="block font-medium text-blue-500 text-[8px] sm:text-[9px] lg:text-[10px] tracking-[0.2em] uppercase mt-0.5">
                  Store
                </span>
              </div>
            </Link>

            {/* ── Desktop / Tablet Nav Links ── */}
            <div className="hidden md:flex items-center gap-0.5">
              {navLinks.map(({ label, to }) => (
                <Link
                  key={label}
                  to={to}
                  className="px-3 lg:px-4 py-2 text-sm font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                >
                  {label}
                </Link>
              ))}
              <button
                onClick={() => scrollToSection("stationery")}
                className="px-3 lg:px-4 py-2 text-sm font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
              >
                Stationery
              </button>
            </div>

            {/* ── Desktop / Tablet Right ── */}
            <div className="hidden md:flex items-center gap-1.5">

              {/* Search */}
              <div ref={searchBoxRef} className="relative">
                <div
                  className={`flex items-center bg-gray-100 rounded-lg transition-all duration-200 overflow-hidden ${
                    searchOpen ? "w-56 lg:w-72 px-3" : "w-9 px-0 justify-center"
                  }`}
                >
                  <button
                    onClick={() => setSearchOpen(true)}
                    className="p-2 text-gray-500 hover:text-blue-600 shrink-0"
                    aria-label="Search products"
                  >
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

                {/* Dropdown results */}
                {searchOpen && query.trim() && (
                  <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 p-2 max-h-96 overflow-y-auto">
                    <ResultsList compact />
                  </div>
                )}
              </div>

              {/* Cart */}
              <Link
                to="/cart"
                className="relative p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
              >
                <ShoppingCart size={19} />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] min-w-[16px] h-[16px] flex items-center justify-center rounded-full font-bold px-1">
                    {cartCount}
                  </span>
                )}
              </Link>

              {user ? (
                <div className="flex items-center gap-1">
                  {user.role === "admin" && (
                    <Link
                      to="/admin"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-semibold hover:bg-purple-100 transition-all duration-200"
                    >
                      <Shield size={12} />
                      <span className="hidden lg:inline">Admin</span>
                    </Link>
                  )}

                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-all duration-200 group"
                  >
                    <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-blue-100 group-hover:border-blue-300 transition-colors shrink-0">
                      <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                    </div>
                    <span className="hidden lg:inline text-sm font-medium text-gray-600 group-hover:text-blue-600 transition-colors capitalize">
                      {user.username}
                    </span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg text-xs font-medium transition-all duration-200"
                  >
                    <LogOut size={14} />
                    <span className="hidden lg:inline">Logout</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <Link
                    to="/login"
                    className="px-3 lg:px-4 py-1.5 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-3.5 lg:px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>

            {/* ── Mobile Right ── */}
            <div className="md:hidden flex items-center gap-0.5">
              <button
                onClick={() => setMobileSearchOpen(true)}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                aria-label="Search products"
              >
                <Search size={20} />
              </button>
              <Link to="/cart" className="relative p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                <ShoppingCart size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] min-w-[16px] h-[16px] flex items-center justify-center rounded-full font-bold px-1">
                    {cartCount}
                  </span>
                )}
              </Link>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                aria-label="Toggle menu"
              >
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile Search Overlay ── */}
      <div
        className={`md:hidden fixed inset-0 z-50 bg-white transition-all duration-200 flex flex-col ${
          mobileSearchOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <div className="flex items-center gap-2 px-4 h-14 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 flex-1">
            <Search size={17} className="text-gray-400 shrink-0" />
            <input
              autoFocus={mobileSearchOpen}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && goToResults()}
              placeholder="Search products..."
              className="w-full bg-transparent text-sm py-2.5 focus:outline-none text-gray-700 placeholder:text-gray-400"
            />
          </div>
          <button
            onClick={() => { setMobileSearchOpen(false); setQuery(""); setResults([]); }}
            className="p-2 text-gray-500 shrink-0"
            aria-label="Close search"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <ResultsList compact />
        </div>
      </div>

      {/* ── Mobile Slide-over Menu ── */}
      <div
        className={`md:hidden fixed inset-0 z-40 transition-all duration-300 ${
          menuOpen ? "visible" : "invisible"
        }`}
      >
        {/* Backdrop */}
        <div
          onClick={() => setMenuOpen(false)}
          className={`absolute inset-0 bg-gray-900/40 backdrop-blur-[2px] transition-opacity duration-300 ${
            menuOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Panel */}
        <div
          className={`absolute top-0 right-0 h-full w-[80%] max-w-sm bg-white shadow-2xl transition-transform duration-300 ease-out flex flex-col ${
            menuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Panel header */}
          <div className="flex items-center justify-between px-5 h-14 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                <img src={logo} alt="Skool Box logo" className="w-full h-full object-contain p-1 bg-white rounded-lg" />
              </div>
              <span className="font-black text-gray-900 text-sm">Skool Box</span>
            </div>
            <button
              onClick={() => setMenuOpen(false)}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {user && (
              <Link
                to="/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 mb-3 bg-blue-50 rounded-xl border border-blue-100"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-blue-200 shrink-0">
                  <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-800 capitalize truncate">{user.username}</p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
                <ChevronRight size={17} className="text-blue-400 shrink-0" />
              </Link>
            )}

            <div className="space-y-0.5">
              {navLinks.map(({ label, to }) => (
                <Link
                  key={label}
                  to={to}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between w-full px-4 py-3 text-[15px] font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                >
                  {label}
                  <ChevronRight size={15} className="text-gray-300" />
                </Link>
              ))}
              <button
                onClick={() => scrollToSection("stationery")}
                className="flex items-center justify-between w-full text-left px-4 py-3 text-[15px] font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
              >
                Stationery
                <ChevronRight size={15} className="text-gray-300" />
              </button>
            </div>

            {user?.role === "admin" && (
              <div className="border-t border-gray-100 mt-3 pt-3">
                <Link
                  to="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-3 text-[15px] font-medium text-purple-700 hover:bg-purple-50 rounded-lg transition-all"
                >
                  <Shield size={16} />
                  Admin Dashboard
                </Link>
              </div>
            )}
          </div>

          {/* Bottom action area */}
          <div className="border-t border-gray-100 p-4 shrink-0">
            {user ? (
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 text-[15px] font-semibold text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-all"
              >
                <LogOut size={16} />
                Logout
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block w-full text-center px-4 py-3 text-[15px] font-semibold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-all"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="block w-full text-center px-4 py-3 text-[15px] font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Spacer to offset fixed navbar */}
      <div className="h-14 sm:h-16 lg:h-[4.25rem]" />
    </>
  );
};

export default Navbar;