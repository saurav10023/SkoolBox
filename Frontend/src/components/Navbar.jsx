import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Menu, X, LogOut, Shield, User, ChevronRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

// Point this at your actual logo file (e.g. imported from src/assets, or a public/ path)
import logo from "../assets/logo.png";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { cartCount } = useCart();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

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
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/98 backdrop-blur-sm shadow-md shadow-gray-200/60 border-b border-gray-100"
            : "bg-white border-b border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20 lg:h-24">

            {/* ── Logo ── */}
            <Link to="/" className="flex items-center gap-2 sm:gap-3 group shrink-0">
              <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-md shadow-amber-200/60 border border-amber-100 overflow-hidden shrink-0 transition-transform duration-200 group-hover:scale-105">
                <img
                  src={logo}
                  alt="Skool Box logo"
                  className="w-full h-full object-contain p-1 sm:p-1.5"
                />
              </div>
              <div className="leading-tight">
                <span className="block font-black text-gray-900 text-base sm:text-xl lg:text-2xl tracking-tight">
                  Skool Box
                </span>
                <span className="block font-light text-amber-500 text-[9px] sm:text-xs lg:text-sm tracking-[0.2em] uppercase">
                  Store
                </span>
              </div>
            </Link>

            {/* ── Desktop / Tablet Nav Links ── */}
            <div className="hidden md:flex items-center gap-0.5 lg:gap-1">
              {navLinks.map(({ label, to }) => (
                <Link
                  key={label}
                  to={to}
                  className="px-3 lg:px-5 py-2 lg:py-2.5 text-sm lg:text-base font-medium text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all duration-200"
                >
                  {label}
                </Link>
              ))}
              <button
                onClick={() => scrollToSection("stationery")}
                className="px-3 lg:px-5 py-2 lg:py-2.5 text-sm lg:text-base font-medium text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all duration-200"
              >
                Stationery
              </button>
            </div>

            {/* ── Desktop / Tablet Right ── */}
            <div className="hidden md:flex items-center gap-2 lg:gap-3">

              {/* Cart */}
              <Link
                to="/cart"
                className="relative p-2 lg:p-2.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all duration-200"
              >
                <ShoppingCart size={20} className="lg:w-6 lg:h-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full font-bold px-1">
                    {cartCount}
                  </span>
                )}
              </Link>

              {user ? (
                <div className="flex items-center gap-1.5 lg:gap-2">
                  {user.role === "admin" && (
                    <Link
                      to="/admin"
                      className="flex items-center gap-1.5 px-2.5 lg:px-3.5 py-1.5 lg:py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-xs lg:text-sm font-semibold hover:bg-purple-100 transition-all duration-200"
                    >
                      <Shield size={12} className="lg:w-3.5 lg:h-3.5" />
                      <span className="hidden lg:inline">Admin</span>
                    </Link>
                  )}

                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-2 lg:px-3 py-1.5 rounded-xl hover:bg-gray-100 transition-all duration-200 group"
                  >
                    <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full overflow-hidden border-2 border-amber-200 group-hover:border-amber-400 transition-colors shrink-0">
                      <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                    </div>
                    <span className="hidden lg:inline text-sm font-medium text-gray-700 group-hover:text-amber-600 transition-colors capitalize">
                      {user.username}
                    </span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-2.5 lg:px-3.5 py-1.5 lg:py-2 bg-red-50 text-red-500 border border-red-100 rounded-xl text-xs lg:text-sm font-medium hover:bg-red-100 hover:border-red-200 transition-all duration-200"
                  >
                    <LogOut size={14} />
                    <span className="hidden lg:inline">Logout</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 lg:gap-3">
                  <Link
                    to="/login"
                    className="px-3 lg:px-4 py-1.5 lg:py-2 text-sm lg:text-base font-medium text-gray-600 hover:text-amber-600 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 lg:px-5 py-1.5 lg:py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm lg:text-base font-semibold rounded-xl transition-colors shadow-sm shadow-amber-200"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>

            {/* ── Mobile Right ── */}
            <div className="md:hidden flex items-center gap-1">
              <Link to="/cart" className="relative p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors">
                <ShoppingCart size={22} />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full font-bold px-1">
                    {cartCount}
                  </span>
                )}
              </Link>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                aria-label="Toggle menu"
              >
                {menuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

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
          className={`absolute top-0 right-0 h-full w-[82%] max-w-sm bg-white shadow-2xl transition-transform duration-300 ease-out flex flex-col ${
            menuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Panel header */}
          <div className="flex items-center justify-between px-5 h-16 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-amber-100 overflow-hidden">
                <img src={logo} alt="Skool Box logo" className="w-full h-full object-contain p-1" />
              </div>
              <span className="font-black text-gray-900 text-base">Skool Box</span>
            </div>
            <button
              onClick={() => setMenuOpen(false)}
              className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
              aria-label="Close menu"
            >
              <X size={22} />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {user && (
              <Link
                to="/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 mb-3 bg-amber-50 rounded-2xl border border-amber-100"
              >
                <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-amber-300 shrink-0">
                  <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-800 capitalize truncate">{user.username}</p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
                <ChevronRight size={18} className="text-amber-400 shrink-0" />
              </Link>
            )}

            <div className="space-y-1">
              {navLinks.map(({ label, to }) => (
                <Link
                  key={label}
                  to={to}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between w-full px-4 py-3 text-[15px] font-medium text-gray-700 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                >
                  {label}
                  <ChevronRight size={16} className="text-gray-300" />
                </Link>
              ))}
              <button
                onClick={() => scrollToSection("stationery")}
                className="flex items-center justify-between w-full text-left px-4 py-3 text-[15px] font-medium text-gray-700 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
              >
                Stationery
                <ChevronRight size={16} className="text-gray-300" />
              </button>
            </div>

            {user?.role === "admin" && (
              <div className="border-t border-gray-100 mt-3 pt-3">
                <Link
                  to="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-3 text-[15px] font-medium text-purple-700 hover:bg-purple-50 rounded-xl transition-all"
                >
                  <Shield size={17} />
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
                className="flex items-center justify-center gap-2 w-full px-4 py-3 text-[15px] font-semibold text-red-500 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-all"
              >
                <LogOut size={17} />
                Logout
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block w-full text-center px-4 py-3 text-[15px] font-semibold text-amber-600 border border-amber-200 rounded-xl hover:bg-amber-50 transition-all"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="block w-full text-center px-4 py-3 text-[15px] font-semibold text-white bg-amber-500 rounded-xl hover:bg-amber-600 transition-all shadow-sm"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Spacer to offset fixed navbar */}
      <div className="h-16 sm:h-20 lg:h-24" />
    </>
  );
};

export default Navbar;