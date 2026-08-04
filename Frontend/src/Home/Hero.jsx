import { ArrowRight, ShoppingBag, Star, Shirt, Backpack, PenLine, Footprints, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import hero from "../images/hero.png";

const categories = [
  { label: "Uniforms",   icon: Shirt,      id: "uniform" },
  { label: "Bags",       icon: Backpack,   id: "bags" },
  { label: "Stationery", icon: PenLine,    id: "stationery" },
  { label: "Socks",      icon: Footprints, id: "socks" },
];

const Hero = () => {
  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    if (section) section.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative bg-white overflow-hidden">

      {/* Dot-grid canvas + a single soft depth blob (restrained, not the whole background) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-70"
        style={{
          backgroundImage: "radial-gradient(circle, #dbeafe 1.5px, transparent 1.5px)",
          backgroundSize: "26px 26px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 90%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 90%)",
        }}
      />
      <div className="absolute -top-24 -right-24 w-[420px] h-[420px] bg-blue-100/60 rounded-full blur-3xl pointer-events-none" />

      {/* ── Main Hero ── */}
      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-10 pb-11 md:pt-14 md:pb-14">
        <div className="grid md:grid-cols-2 gap-10 md:gap-12 items-center">

          {/* ── Left ── */}
          <div className="space-y-5 text-center md:text-left">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold px-4 py-2 rounded-full">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              Now serving Gumla district
            </div>

            {/* Heading — highlighter underline is the type signature */}
            <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-black text-gray-900 leading-[1.05] tracking-tight">
              Everything your child needs{" "}
              <span className="relative inline-block whitespace-nowrap">
                <span className="relative z-10">for school</span>
                <svg
                  className="absolute -bottom-1 left-0 w-full h-3 z-0"
                  viewBox="0 0 200 12"
                  preserveAspectRatio="none"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M2 9C40 3 100 2 140 6C160 8 180 9 198 5"
                    stroke="#FBBF24"
                    strokeWidth="7"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-[15px] md:text-base text-gray-500 leading-relaxed max-w-sm mx-auto md:mx-0">
              Uniforms, bags, stationery and more — sourced, checked and
              delivered with care, so parents don't have to run around town.
            </p>

            {/* Trust line — quiet, single row, no stat tiles */}
            <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-gray-500">
              <ShieldCheck size={16} className="text-blue-500" />
              <span>Quality-checked essentials, packed for the full school year</span>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3 justify-center md:justify-start pt-1">
              <Link
                to="/products"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-200 transition-all duration-200"
              >
                <ShoppingBag size={17} />
                Shop now
              </Link>
              <button
                onClick={() => scrollToSection("uniform")}
                className="flex items-center gap-2 bg-white border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 text-gray-700 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-200 active:scale-95"
              >
                Explore
                <ArrowRight size={15} />
              </button>
            </div>
          </div>

          {/* ── Right — Stacked photo treatment ── */}
          <div className="relative mt-6 md:mt-0 max-w-md mx-auto md:max-w-none">

            {/* Backing panel — offset, rotated, dot-grid, reads as a second photo underneath */}
            <div
              className="absolute inset-0 -z-10 rounded-[2rem] border-2 border-blue-100 bg-blue-50/80 rotate-6"
              style={{
                backgroundImage: "radial-gradient(circle, #bfdbfe 1.5px, transparent 1.5px)",
                backgroundSize: "16px 16px",
              }}
            />

            {/* Photo */}
            <div className="relative rounded-[2rem] overflow-hidden shadow-2xl shadow-blue-200/50 border-4 border-white -rotate-2">
              <img
                src={hero}
                alt="School essentials"
                className="w-full h-64 sm:h-72 md:h-[360px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 via-transparent to-transparent" />
            </div>

            {/* Sticker tag — taped-on note, top-left */}
            <div className="absolute -top-5 -left-4 sm:-left-7 bg-white rounded-xl shadow-lg px-3.5 py-2.5 flex items-center gap-2 border border-gray-100 -rotate-3">
              <ShieldCheck size={15} className="text-blue-500 shrink-0" />
              <div className="text-left">
                <p className="text-xs font-black text-gray-900 leading-none">New stock</p>
                <p className="text-[10px] text-gray-400 leading-none mt-1">Just arrived</p>
              </div>
            </div>

            {/* Stamp badge — wax-seal style trust mark, bottom-right */}
            <div className="absolute -bottom-6 -right-3 sm:-right-6 w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-full shadow-xl border border-gray-100 flex flex-col items-center justify-center gap-1 rotate-3">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} size={8} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-[9px] font-bold text-gray-500 text-center leading-tight px-2">
                Trusted by local parents
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Signature: category rail — gradient band, icon chips, hairline dividers, edge fade ── */}
      <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 [clip-path:polygon(0_10px,100%_0,100%_100%,0_100%)]">
        <div
          className="relative overflow-hidden py-3"
          style={{
            maskImage: "linear-gradient(to right, transparent 0, black 64px, black calc(100% - 64px), transparent 100%)",
            WebkitMaskImage: "linear-gradient(to right, transparent 0, black 64px, black calc(100% - 64px), transparent 100%)",
          }}
        >
          <div className="marquee-track flex items-stretch w-max motion-safe:animate-marquee">
            {[...categories, ...categories, ...categories].map(({ label, icon: Icon, id }, i) => (
              <div key={`${label}-${i}`} className="flex items-stretch shrink-0">
                <button
                  onClick={() => scrollToSection(id)}
                  className="group flex items-center gap-3 px-7 text-white whitespace-nowrap"
                >
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 ring-1 ring-inset ring-white/15 group-hover:bg-amber-400 group-hover:ring-amber-400 transition-colors duration-200">
                    <Icon size={15} strokeWidth={2.25} className="text-white group-hover:text-blue-900 transition-colors duration-200" />
                  </span>
                  <span className="text-[13px] font-bold uppercase tracking-[0.12em] text-blue-50 group-hover:text-amber-300 transition-colors duration-200">
                    {label}
                  </span>
                </button>
                <span className="w-px my-2 bg-white/15" aria-hidden="true" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-33.333%); }
        }
        .motion-safe\\:animate-marquee {
          animation: marquee 26s linear infinite;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .motion-safe\\:animate-marquee {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
};

export default Hero;