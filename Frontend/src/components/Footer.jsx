import { Mail, Phone, MapPin, ArrowRight, Instagram, Facebook, Clock, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

// Point this at your actual logo file (same one used in the Navbar)
import logo from "../assets/logo.png";

const WHATSAPP_NUMBER = "917004335880";
const WHATSAPP_DEFAULT_MSG = encodeURIComponent("Hi! I have a question about Skool Box Store.");

const storeHours = [
  { day: "Mon", open: true },
  { day: "Tue", open: true },
  { day: "Wed", open: true },
  { day: "Thu", open: true },
  { day: "Fri", open: true },
  { day: "Sat", open: true },
  { day: "Sun", open: false },
];

const quickLinks = [
  { label: "Home",       to: "/" },
  { label: "Uniforms",   to: "/#uniform" },
  { label: "Bags",       to: "/#bags" },
  { label: "Stationery", to: "/#stationery" },
  { label: "Cart",       to: "/cart" },
  { label: "My Orders",  to: "/profile" },
];

const Footer = () => {
  const now = new Date();
  // 0=Sun,1=Mon...6=Sat
  const dayIndex = now.getDay();
  const isOpenNow =
    dayIndex !== 0 &&
    now.getHours() >= 9 &&
    now.getHours() < 18;

  return (
    <footer className="bg-[#0d1117] text-gray-400 mt-16">

      {/* Gradient accent bar */}
      <div className="h-[3px] w-full bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500" />

      {/* WhatsApp Hero Banner */}
      <div className="bg-[#0a1f14] border-b border-green-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-green-500 rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-green-900/50">
              <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-5.5 sm:h-5.5 fill-white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-sm sm:text-base">Chat with us on WhatsApp</p>
              <p className="text-green-400 text-xs sm:text-sm">Quick replies · Uniforms, sizes, orders & more</p>
            </div>
          </div>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_DEFAULT_MSG}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 bg-green-500 hover:bg-green-400 active:scale-95 text-white font-bold text-sm px-5 py-3 rounded-2xl shadow-lg shadow-green-900/40 transition-all duration-200 whitespace-nowrap w-full sm:w-auto justify-center"
          >
            <MessageCircle size={16} />
            Start Chat
          </a>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 lg:gap-12">

        {/* ── Brand & Contact ── */}
        <div className="space-y-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-black/30 border border-gray-800 overflow-hidden shrink-0">
              <img
                src={logo}
                alt="Skool Box logo"
                className="w-full h-full object-contain p-1.5"
              />
            </div>
            <div className="leading-tight">
              <span className="block font-black text-white text-lg sm:text-xl tracking-tight">Skool Box</span>
              <span className="block font-light text-amber-400 text-xs sm:text-sm tracking-[0.2em] uppercase">Store</span>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-gray-500 max-w-xs">
            Your one-stop shop for school essentials — uniforms, bags, socks and
            stationery for primary school students across the Gumla district.
          </p>

          {/* Contact */}
          <div className="space-y-2.5">
            <a href="tel:+919608881888"
              className="flex items-center gap-3 text-sm text-gray-400 hover:text-white transition-colors group">
              <div className="w-8 h-8 bg-gray-800 group-hover:bg-amber-500 rounded-xl flex items-center justify-center transition-all duration-200 shrink-0">
                <Phone size={13} />
              </div>
              +91 7004335880
            </a>
            <a href="mailto:littlekingdomstore@email.com"
              className="flex items-center gap-3 text-sm text-gray-400 hover:text-white transition-colors group">
              <div className="w-8 h-8 bg-gray-800 group-hover:bg-amber-500 rounded-xl flex items-center justify-center transition-all duration-200 shrink-0">
                <Mail size={13} />
              </div>
              skoolboxgumla@gmail.com
            </a>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <div className="w-8 h-8 bg-gray-800 rounded-xl flex items-center justify-center shrink-0">
                <MapPin size={13} />
              </div>
              Gumla, Jharkhand, India
            </div>
          </div>

          {/* Social */}
          <div className="flex items-center gap-2 pt-1">
            <a href="#" aria-label="Instagram"
              className="w-9 h-9 sm:w-8 sm:h-8 bg-gray-800 hover:bg-pink-600 rounded-xl flex items-center justify-center transition-all duration-200">
              <Instagram size={14} />
            </a>
            <a href="#" aria-label="Facebook"
              className="w-9 h-9 sm:w-8 sm:h-8 bg-gray-800 hover:bg-blue-700 rounded-xl flex items-center justify-center transition-all duration-200">
              <Facebook size={14} />
            </a>
            <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" aria-label="WhatsApp"
              className="w-9 h-9 sm:w-8 sm:h-8 bg-gray-800 hover:bg-green-600 rounded-xl flex items-center justify-center transition-all duration-200">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
            </a>
          </div>
        </div>

        {/* ── Quick Links ── */}
        <div className="space-y-5">
          <h3 className="text-xs font-black text-white uppercase tracking-widest">Quick Links</h3>
          <ul className="grid grid-cols-2 sm:grid-cols-1 gap-2">
            {quickLinks.map(({ label, to }) => (
              <li key={label}>
                <Link to={to}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors group w-fit">
                  <ArrowRight size={13}
                    className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-amber-400 hidden sm:inline-block" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Store Hours (highlighted) ── */}
        <div className="space-y-4 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-amber-400" />
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Store Hours</h3>
          </div>

          {/* Open / Closed pill */}
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
            isOpenNow
              ? "bg-green-900/40 text-green-400 border border-green-700/50"
              : "bg-red-900/30 text-red-400 border border-red-800/50"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isOpenNow ? "bg-green-400" : "bg-red-400"} animate-pulse`} />
            {isOpenNow ? "Open Now" : "Closed Now"}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-1 max-w-[280px] sm:max-w-none">
            {storeHours.map(({ day, open }) => {
              const todayDayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
              const isToday = todayDayNames[dayIndex] === day;
              return (
                <div key={day} className="flex flex-col items-center gap-1">
                  <span className={`text-[10px] font-semibold ${isToday ? "text-amber-400" : "text-gray-600"}`}>
                    {day}
                  </span>
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-[10px] font-bold border transition-all
                    ${isToday
                      ? open
                        ? "bg-amber-500 border-amber-400 text-white shadow-md shadow-amber-900/50"
                        : "bg-red-900/40 border-red-700 text-red-400"
                      : open
                        ? "bg-gray-800 border-gray-700 text-gray-400"
                        : "bg-gray-900 border-gray-800 text-gray-700"
                    }`}>
                    {open ? "✓" : "✕"}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time range */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Mon – Sat</span>
              <span className="text-white font-semibold">9:00 AM – 6:00 PM</span>
            </div>
            <div className="h-px bg-gray-800" />
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Sunday</span>
              <span className="text-red-400 font-semibold">Closed</span>
            </div>
          </div>

          {/* WhatsApp shortcut inside hours section */}
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_DEFAULT_MSG}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 w-full justify-center bg-[#0a1f14] hover:bg-green-900/50 border border-green-800/60 hover:border-green-600 text-green-400 hover:text-green-300 text-xs font-semibold py-2.5 rounded-xl transition-all duration-200"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current shrink-0">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
            Message us on WhatsApp
          </a>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-600 text-center sm:text-left">
          <p>© {new Date().getFullYear()} Skool Box Store. All rights reserved.</p>
          <p>Made with ❤️ for students of Gumla district</p>
          <p>
            Developed by{" "}
            <a
              href="https://github.com/YOUR_USERNAME"
              target="_blank"
              rel="noreferrer"
              className="text-gray-400 hover:text-amber-400 font-medium transition-colors duration-200"
            >
              @YOUR_USERNAME
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;