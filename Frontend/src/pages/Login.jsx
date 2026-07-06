import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Phone, Lock, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await API.post("/api/v1/users/login", {
        loginId,
        password
      });

      login(res.data.data);
      navigate("/");
    } catch (err) {
      const message = err.response?.data?.message || "";
      if (message === "Invalid Mobile number/username  does not  exists") {
        setError("Mobile Number / Username is invalid. To register click the Register Link below");
      }
      else setError("User Don't Exists")

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">

      {/* Left — Image Side */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-blue-600">
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          
          {/* Left panel logo — replace the logo block */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center text-lg leading-none">
              🏫
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-black text-white text-base tracking-tight">The Little Kingdom</span>
              <span className="font-light text-blue-200 text-xs tracking-widest uppercase">Store</span>
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-black leading-tight">
              Everything your child needs,<br />
              <span className="text-blue-200">all in one place.</span>
            </h1>
            <p className="text-blue-100 text-base font-light max-w-xs">
              Uniforms, bags, stationery — sourced and delivered for your school.
            </p>
          </div>

          {/* Copyright line */}
          <p className="text-blue-200 text-sm">
            © {new Date().getFullYear()} The Little Kingdom Store. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right — Form Side */}
      <div className="flex-1 flex justify-center items-center px-6 py-12">
        <div className="w-full max-w-md space-y-8">

          {/* Mobile logo */}
          {/* Mobile logo — replace the mobile logo block */}
          <div className="lg:hidden flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-base leading-none">
              🏫
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-black text-gray-900 text-base tracking-tight">The Little Kingdom</span>
              <span className="font-light text-blue-600 text-xs tracking-widest uppercase">Store</span>
            </div>
          </div>



          {/* Heading */}
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-gray-900">Welcome back</h2>
            <p className="text-gray-500 text-sm">Sign in with your mobile number or username</p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Mobile / Username */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">
                Mobile Number or Username
              </label>
              <div className="relative">
                <Phone
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="9876543210 or username"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end">
              <Link
                to="/forgotpassword"
                className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-xl font-semibold text-sm shadow-md shadow-blue-200 transition-all duration-200"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Register Link */}
          <p className="text-center text-sm text-gray-500">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}