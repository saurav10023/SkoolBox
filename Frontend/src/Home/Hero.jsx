import { ArrowRight, ShoppingBag, Star, Package, Users, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import hero from "../images/hero.png";

const Hero = () => {
  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    if (section) section.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative bg-white overflow-hidden">

      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-blue-100 rounded-full opacity-50 blur-3xl" />
        <div className="absolute top-1/2 -left-32 w-80 h-80 bg-blue-50 rounded-full opacity-70 blur-3xl" />
        <div className="absolute -bottom-20 right-1/3 w-64 h-64 bg-indigo-50 rounded-full opacity-60 blur-2xl" />
      </div>

      {/* ── Main Hero ── */}
      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-12 pb-16 md:pt-20 md:pb-24">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">

          {/* ── Left ── */}
          <div className="space-y-7 text-center md:text-left">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold px-4 py-2 rounded-full shadow-sm">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              Now serving Gumla district
            </div>

            {/* Heading */}
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 leading-[1.1] tracking-tight">
                Everything Your
              </h1>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight">
                <span className="text-blue-600">Child Needs</span>
              </h1>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 leading-[1.1] tracking-tight">
                for School
              </h1>
            </div>

            {/* Subtext */}
            <p className="text-base md:text-lg text-gray-500 leading-relaxed max-w-sm mx-auto md:mx-0">
              Uniforms, bags, stationery and more — all in one place.
              Simple, fast and convenient for parents.
            </p>

            {/* Stats row */}
            <div className="flex items-center justify-center md:justify-start gap-8 py-1">
              {[
                { value: "500+", label: "Happy Parents", icon: Users },
                { value: "50+",  label: "Products",      icon: Package },
                { value: "Fast", label: "Delivery",      icon: Zap },
              ].map(({ value, label, icon: Icon }) => (
                <div key={label} className="flex flex-col items-center md:items-start gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <Icon size={13} className="text-blue-500" />
                    <p className="text-xl font-black text-gray-900">{value}</p>
                  </div>
                  <p className="text-xs text-gray-400 font-medium">{label}</p>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3 justify-center md:justify-start pt-1">
              <Link
                to="/products"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-7 py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-200 transition-all duration-200"
              >
                <ShoppingBag size={17} />
                Shop Now
              </Link>
              <button
                onClick={() => scrollToSection("uniform")}
                className="flex items-center gap-2 bg-white border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 text-gray-700 px-7 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 active:scale-95"
              >
                Explore
                <ArrowRight size={15} />
              </button>
            </div>

            {/* Trust row */}
            <div className="flex items-center justify-center md:justify-start gap-3 pt-1">
              <div className="flex -space-x-2">
                {["bg-blue-400", "bg-indigo-400", "bg-blue-300", "bg-blue-500"].map((c, i) => (
                  <div key={i} className={`w-7 h-7 ${c} rounded-full border-2 border-white flex items-center justify-center`}>
                    <span className="text-white text-xs font-bold">{String.fromCharCode(65 + i)}</span>
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} size={11} className="fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-xs text-gray-400 font-medium">Trusted by 500+ parents</p>
              </div>
            </div>

          </div>

          {/* ── Right — Image ── */}
          <div className="relative mt-4 md:mt-0">

            {/* Decorative ring */}
            <div className="absolute inset-0 -m-4 bg-gradient-to-br from-blue-100 to-indigo-50 rounded-3xl -z-10" />

            {/* Image */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-blue-100/60 border border-blue-50">
              <img
                src={hero}
                alt="School essentials"
                className="w-full h-72 sm:h-80 md:h-[420px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/25 via-transparent to-transparent" />
            </div>

            {/* Floating card — top left */}
            <div className="absolute -top-4 -left-3 sm:-left-6 bg-white rounded-2xl shadow-xl px-3 py-2.5 sm:px-4 sm:py-3 flex items-center gap-2.5 border border-gray-100">
              <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                <ShoppingBag size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-black text-gray-900">New Stock</p>
                <p className="text-xs text-gray-400">Just arrived</p>
              </div>
            </div>

            {/* Floating card — bottom right */}
            <div className="absolute -bottom-4 -right-3 sm:-right-6 bg-white rounded-2xl shadow-xl px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-100">
              <div className="flex items-center gap-1 mb-1">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} size={11} className="fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-xs font-black text-gray-900">Trusted by parents</p>
              <p className="text-xs text-gray-400">across Gumla district</p>
            </div>

            {/* Floating pill — bottom left (mobile hidden) */}
            <div className="hidden sm:flex absolute bottom-10 -left-5 bg-blue-600 text-white rounded-xl shadow-lg px-3 py-2 items-center gap-2">
              <Zap size={13} className="text-yellow-300" />
              <p className="text-xs font-bold">Fast Delivery</p>
            </div>

          </div>
        </div>
      </div>

      {/* ── Category Strip ── */}
      <div className="relative border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest shrink-0 mr-1">
              Browse
            </span>
            {[
              { label: "🎽 Uniforms",   id: "uniform" },
              { label: "🎒 Bags",       id: "bags" },
              { label: "✏️ Stationery", id: "stationery" },
              { label: "🧦 Socks",      id: "socks" },
            ].map(({ label, id }) => (
              <button
                key={id}
                onClick={() => scrollToSection(id)}
                className="shrink-0 px-4 py-2 bg-white border border-gray-200 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 active:scale-95 text-gray-600 text-xs font-semibold rounded-full transition-all duration-200 shadow-sm"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

    </section>
  );
};

export default Hero;