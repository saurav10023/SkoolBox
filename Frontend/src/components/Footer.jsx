import { useState, useEffect } from "react";
import { Mail, Phone, MapPin, ArrowRight, ArrowUp, Instagram, Facebook, Clock, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

// Same logo asset used in the Navbar
import logo from "../assets/logo.png";

const WHATSAPP_NUMBER = "7004335880";
const WHATSAPP_DEFAULT_MSG = encodeURIComponent("Hi! I have a question about Skool Box Store.");
const WA_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_DEFAULT_MSG}`;

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
// Display order Mon → Sun; value = JS getDay() index
const storeHours = [1, 2, 3, 4, 5, 6, 0].map((i) => ({ day: DAYS[i], index: i, open: i !== 0 }));

const quickLinks = [
  { label: "Home", to: "/" },
  { label: "Uniforms", to: "/#uniform" },
  { label: "Bags", to: "/#bags" },
  { label: "Stationery", to: "/#stationery" },
  { label: "Cart", to: "/cart" },
  { label: "My orders", to: "/profile" },
];

const WhatsAppIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

const Footer = () => {
  // Re-evaluate open/closed every minute so the pill stays accurate on long sessions
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const dayIndex = now.getDay();
  const isOpenNow = dayIndex !== 0 && now.getHours() >= 9 && now.getHours() < 18;

  return (
    <footer className="fb relative bg-[#0b1220] text-gray-400 overflow-hidden pt-10 sm:pt-14 pb-4 sm:pb-6" style={{ "--brand": "37,99,235", "--brand-2": "245,158,11" }}>
      {/* Ambient blobs */}
      <div className="fb-blob fb-blob--1 absolute -top-24 right-0 w-96 h-96 rounded-full pointer-events-none" />
      <div className="fb-blob fb-blob--2 absolute bottom-0 -left-20 w-80 h-80 rounded-full pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-600 via-amber-400 to-blue-600 opacity-90" />

      {/* Floating glass panel — echoes the navbar capsule */}
      <div className="relative max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="fb-panel rounded-[1.75rem] overflow-hidden">

          {/* WhatsApp call-to-action */}
          <div className="fb-cta-strip px-5 sm:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <span className="fb-wa-chip w-10 h-10 rounded-2xl flex items-center justify-center shrink-0">
                <WhatsAppIcon className="w-5 h-5 fill-white" />
              </span>
              <div>
                <p className="text-white font-semibold text-sm sm:text-base leading-tight">Questions about sizes or orders?</p>
                <p className="text-gray-400 text-xs mt-0.5">Message us on WhatsApp — we reply quickly.</p>
              </div>
            </div>
            <a href={WA_LINK} target="_blank" rel="noreferrer" className="fb-btn-green fb-focus w-full sm:w-auto justify-center">
              <MessageCircle size={15} />
              Start chat
            </a>
          </div>

          {/* Main grid */}
          <div className="px-5 sm:px-8 py-8 sm:py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1.1fr] gap-8 lg:gap-12">

            {/* Brand + contact */}
            <div className="space-y-5">
              <Link to="/" className="fb-brand fb-focus group inline-flex items-center gap-3 rounded-2xl" aria-label="Skool Box Gumla — home">
                <span className="fb-badge relative shrink-0">
                  <span className="fb-badge-glow" aria-hidden="true" />
                  <span className="fb-badge-ring">
                    <span className="fb-badge-face">
                      <img src={logo} alt="" className="w-full h-full object-contain" />
                    </span>
                  </span>
                </span>
                <span className="flex flex-col leading-none">
                  <span className="fb-name">Skool Box</span>
                  <span className="fb-sub"><i aria-hidden="true" />Gumla</span>
                </span>
              </Link>

              <p className="text-[13px] leading-relaxed text-gray-400 max-w-xs">
                Your one-stop shop for school essentials — uniforms, bags, socks and stationery for primary school students across the Gumla district.
              </p>

              <div className="space-y-2">
                <a href="tel:+917004335880" className="fb-contact fb-focus group">
                  <span className="fb-chip"><Phone size={13} /></span>
                  +91 70043 35880
                </a>
                <a href="mailto:skoolboxgumla@gmail.com" className="fb-contact fb-focus group">
                  <span className="fb-chip"><Mail size={13} /></span>
                  skoolboxgumla@gmail.com
                </a>
                <div className="fb-contact !text-gray-400 !cursor-default hover:!text-gray-400">
                  <span className="fb-chip"><MapPin size={13} /></span>
                  Gumla, Jharkhand, India
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a href="#" aria-label="Instagram" className="fb-chip fb-chip--btn fb-focus"><Instagram size={15} /></a>
                <a href="#" aria-label="Facebook" className="fb-chip fb-chip--btn fb-focus"><Facebook size={15} /></a>
                <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="fb-chip fb-chip--btn fb-focus">
                  <WhatsAppIcon className="w-4 h-4 fill-current" />
                </a>
              </div>
            </div>

            {/* Quick links */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white">Quick links</h3>
              <ul className="grid grid-cols-2 sm:grid-cols-1 gap-2">
                {quickLinks.map(({ label, to }) => (
                  <li key={label}>
                    <Link to={to} className="fb-link fb-focus group">
                      <span>{label}</span>
                      <ArrowRight size={13} className="text-blue-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Store hours */}
            <div className="space-y-4 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Clock size={15} className="text-blue-400" />
                  <h3 className="text-sm font-bold text-white">Store hours</h3>
                </div>
                <span className={`fb-status ${isOpenNow ? "fb-status--open" : "fb-status--closed"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isOpenNow ? "bg-green-400" : "bg-red-400"}`} />
                  {isOpenNow ? "Open now" : "Closed now"}
                </span>
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {storeHours.map(({ day, index, open }) => {
                  const isToday = index === dayIndex;
                  return (
                    <div key={day} className="flex flex-col items-center gap-1.5">
                      <span className={`text-[10px] font-semibold ${isToday ? "text-blue-400" : "text-gray-500"}`}>{day}</span>
                      <span
                        className={`fb-day ${open ? "fb-day--open" : "fb-day--closed"} ${isToday ? "fb-day--today" : ""}`}
                        aria-label={`${day}: ${open ? "open" : "closed"}${isToday ? " (today)" : ""}`}
                      >
                        {open ? "✓" : "✕"}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="fb-card rounded-2xl px-4 py-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Monday to Saturday</span>
                  <span className="text-white font-semibold">9:00 AM – 6:00 PM</span>
                </div>
                <div className="h-px bg-white/10" />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Sunday</span>
                  <span className="text-red-400 font-semibold">Closed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/10 px-5 sm:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
            <p className="text-center sm:text-left">© {now.getFullYear()} Skool Box Store. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <p>
                Developed by{" "}
                <a href= "https://portfolio-five-orpin-qp04v1u332.vercel.app/" target="_blank" rel="noreferrer" className="fb-focus text-gray-300 hover:text-blue-400 font-medium transition-colors rounded">
                  Kumar Saurav
                </a>
              </p>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="fb-chip fb-chip--btn fb-focus"
                aria-label="Back to top"
              >
                <ArrowUp size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .fb-focus:focus-visible { outline: 2px solid rgba(96,165,250,.8); outline-offset: 2px; }

        /* ── Main glass panel ── */
        .fb-panel {
          position: relative;
          background: linear-gradient(160deg, rgba(255,255,255,.08), rgba(255,255,255,.03));
          border: 1px solid rgba(255,255,255,.12);
          -webkit-backdrop-filter: blur(22px) saturate(150%);
          backdrop-filter: blur(22px) saturate(150%);
          box-shadow: 0 30px 70px -30px rgba(var(--brand),.45), inset 0 1px 0 rgba(255,255,255,.14);
        }
        .fb-cta-strip {
          background: linear-gradient(100deg, rgba(34,197,94,.1), rgba(255,255,255,.02) 60%);
          border-bottom: 1px solid rgba(255,255,255,.08);
        }
        .fb-card {
          background: rgba(255,255,255,.045);
          border: 1px solid rgba(255,255,255,.1);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.06);
        }

        /* ── Logo badge (same construction as the navbar) ── */
        .fb-badge { width: 3rem; height: 3rem; transition: transform .35s cubic-bezier(.22,1,.36,1); }
        .fb-brand:hover .fb-badge { transform: rotate(-6deg) scale(1.06); }
        .fb-badge-glow {
          position: absolute; inset: -6px; border-radius: 1.25rem; filter: blur(12px); opacity: .5;
          background: conic-gradient(from 200deg, rgba(var(--brand),.85), rgba(var(--brand-2),.85), rgba(var(--brand),.85));
          transition: opacity .35s ease;
        }
        .fb-brand:hover .fb-badge-glow { opacity: .8; }
        .fb-badge-ring {
          position: relative; display: block; width: 100%; height: 100%; padding: 2px; border-radius: 28%;
          background: conic-gradient(from 210deg, rgb(var(--brand)), rgb(var(--brand-2)), rgba(255,255,255,.95), rgb(var(--brand)));
          box-shadow: 0 8px 18px -8px rgba(var(--brand),.7), inset 0 1px 0 rgba(255,255,255,.7);
        }
        .fb-badge-face {
          display: block; width: 100%; height: 100%; padding: 12%; border-radius: 26%; overflow: hidden;
          background: linear-gradient(160deg, #fff, rgba(240,246,255,.95));
          box-shadow: inset 0 -2px 5px rgba(var(--brand),.12);
        }
        .fb-name {
          font-weight: 900; font-size: 1.375rem; letter-spacing: -.02em; line-height: 1.05; white-space: nowrap;
          background: linear-gradient(100deg, #fff 30%, rgb(147,197,253));
          -webkit-background-clip: text; background-clip: text; color: transparent;
        }
        .fb-sub {
          display: inline-flex; align-items: center; gap: .3rem; margin-top: .35rem;
          font-size: .75rem; font-weight: 600; letter-spacing: .06em; color: rgb(251,191,36);
        }
        .fb-sub i { width: .35rem; height: .35rem; border-radius: 9999px; background: rgb(var(--brand-2)); box-shadow: 0 0 0 3px rgba(var(--brand-2),.22); }

        /* ── Contact, chips, links ── */
        .fb-contact { display: flex; align-items: center; gap: .75rem; font-size: 13px; color: rgb(209,213,219); transition: color .2s ease; width: fit-content; border-radius: .5rem; }
        .fb-contact:hover { color: #fff; }
        .fb-chip {
          display: inline-flex; align-items: center; justify-content: center; width: 2rem; height: 2rem; flex-shrink: 0;
          border-radius: 9999px; color: rgb(156,163,175);
          background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12);
          transition: background .25s ease, color .25s ease, border-color .25s ease, transform .2s ease;
        }
        .fb-chip--btn { width: 2.25rem; height: 2.25rem; }
        .fb-contact:hover .fb-chip, .fb-chip--btn:hover {
          color: #fff; background: linear-gradient(150deg, rgba(var(--brand),.95), rgba(var(--brand),.7)); border-color: rgba(var(--brand),.9);
        }
        .fb-chip--btn:active { transform: scale(.94); }
        .fb-link {
          display: flex; align-items: center; justify-content: space-between; gap: .5rem;
          padding: .5rem .85rem; border-radius: 9999px; font-size: 13px; color: rgb(209,213,219);
          background: rgba(255,255,255,.035); border: 1px solid rgba(255,255,255,.08);
          transition: background .25s ease, color .25s ease, border-color .25s ease;
        }
        .fb-link:hover { background: rgba(255,255,255,.09); color: #fff; border-color: rgba(255,255,255,.18); }

        /* ── WhatsApp ── */
        .fb-wa-chip {
          background: linear-gradient(150deg, rgba(34,197,94,.95), rgba(21,128,61,.9));
          border: 1px solid rgba(255,255,255,.25);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.3), 0 8px 16px -8px rgba(21,128,61,.7);
        }
        .fb-btn-green {
          position: relative; overflow: hidden; isolation: isolate; display: inline-flex; align-items: center; gap: .4rem;
          padding: .6rem 1.25rem; border-radius: 9999px; font-size: .8125rem; font-weight: 600; color: #fff; white-space: nowrap;
          background: linear-gradient(135deg, rgba(34,197,94,.95), rgba(21,128,61,.98));
          border: 1px solid rgba(255,255,255,.25);
          box-shadow: 0 12px 24px -12px rgba(21,128,61,.7), inset 0 1px 0 rgba(255,255,255,.3);
          transition: box-shadow .3s ease, transform .2s ease;
        }
        .fb-btn-green:hover { box-shadow: 0 16px 28px -12px rgba(21,128,61,.85), inset 0 1px 0 rgba(255,255,255,.35); }
        .fb-btn-green:active { transform: scale(.97); }
        .fb-btn-green::after {
          content: ""; position: absolute; top: 0; left: -60%; width: 40%; height: 100%; pointer-events: none;
          background: linear-gradient(115deg, transparent, rgba(255,255,255,.45), transparent);
          transform: skewX(-18deg); transition: left .7s ease;
        }
        .fb-btn-green:hover::after { left: 130%; }

        /* ── Hours ── */
        .fb-status { display: inline-flex; align-items: center; gap: .4rem; padding: .25rem .65rem; border-radius: 9999px; font-size: 11px; font-weight: 700; }
        .fb-status--open { background: rgba(34,197,94,.12); border: 1px solid rgba(34,197,94,.3); color: rgb(74,222,128); }
        .fb-status--closed { background: rgba(239,68,68,.12); border: 1px solid rgba(239,68,68,.3); color: rgb(248,113,113); }
        .fb-day {
          display: flex; align-items: center; justify-content: center; width: 100%; max-width: 2.25rem; aspect-ratio: 1; border-radius: 9999px;
          font-size: 11px; font-weight: 700; border: 1px solid rgba(255,255,255,.1);
        }
        .fb-day--open { background: rgba(255,255,255,.06); color: rgb(209,213,219); }
        .fb-day--closed { background: rgba(255,255,255,.02); border-color: rgba(255,255,255,.05); color: rgb(107,114,128); }
        .fb-day--today.fb-day--open {
          background: linear-gradient(150deg, rgba(var(--brand),.95), rgba(29,78,216,.9)); border-color: rgba(147,197,253,.6); color: #fff;
          box-shadow: 0 0 0 3px rgba(var(--brand),.22), 0 8px 16px -8px rgba(var(--brand),.7);
        }
        .fb-day--today.fb-day--closed { background: rgba(239,68,68,.16); border-color: rgba(239,68,68,.45); color: rgb(248,113,113); }

        /* ── Ambient blobs ── */
        .fb-blob { filter: blur(70px); opacity: .24; }
        .fb-blob--1 { background: radial-gradient(circle at 40% 30%, rgba(var(--brand),.55), transparent 70%); animation: fbDrift1 18s ease-in-out infinite; }
        .fb-blob--2 { background: radial-gradient(circle at 60% 50%, rgba(var(--brand-2),.45), transparent 70%); animation: fbDrift2 16s ease-in-out infinite; }
        @keyframes fbDrift1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-20px,18px) scale(1.06); } }
        @keyframes fbDrift2 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(18px,-16px) scale(1.05); } }

        @media (prefers-reduced-motion: reduce) {
          .fb *, .fb *::before, .fb *::after { animation: none !important; transition-duration: .01ms !important; }
        }
        @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
          .fb-panel { background: rgba(22,30,48,.97); }
        }
      `}</style>
    </footer>
  );
};

export default Footer;