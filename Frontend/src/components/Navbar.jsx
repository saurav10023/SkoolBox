import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Menu, X, LogOut, Shield, User, ChevronRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

// Same logo asset used across the auth pages / footer / invoice
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
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white/95 backdrop-blur-md ${
          scrolled
            ? "shadow-sm border-b border-gray-100"
            : "border-b border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16 lg:h-[4.25rem]">

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