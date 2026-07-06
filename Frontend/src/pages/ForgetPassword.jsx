import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, ArrowRight, Loader2, CheckCircle2, Eye, EyeOff, MessageCircle } from "lucide-react";
import API from "../api/axios";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "../firebase";

// ✅ Replace with your actual WhatsApp support number (with country code, no + or spaces)
const SUPPORT_WHATSAPP = "9608881888";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep]                             = useState("mobile");
  const [mobileNumber, setMobileNumber]             = useState("");
  const [otp, setOtp]                               = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [newPassword, setNewPassword]               = useState("");
  const [confirmPass, setConfirmPass]               = useState("");
  const [showPass, setShowPass]                     = useState(false);
  const [showConfirm, setShowConfirm]               = useState(false);
  const [loading, setLoading]                       = useState(false);
  const [error, setError]                           = useState("");
  const recaptchaRef                                = useRef(null);

  const isMobileValid = /^[0-9]{10}$/.test(mobileNumber);

  const stepIndex = { mobile: 0, otp: 1, reset: 2, done: 3 }[step];
  const steps     = ["Mobile", "OTP", "Reset"];

  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  const openWhatsApp = () => {
    const message = encodeURIComponent(
      `Hello, I need help resetting my password for my account registered with mobile number: +91 ${mobileNumber || "________"}. Please assist me.`
    );
    window.open(`https://wa.me/${SUPPORT_WHATSAPP}?text=${message}`, "_blank");
  };

  /* ── Step 1: Send OTP via Firebase ── */
  const handleSendOTP = async () => {
    if (!isMobileValid) { setError("Enter a valid 10-digit mobile number"); return; }
    setLoading(true); setError("");
    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(
          auth,
          recaptchaRef.current,
          { size: "invisible" }
        );
      }
      const result = await signInWithPhoneNumber(
        auth,
        `+91${mobileNumber}`,
        window.recaptchaVerifier
      );
      setConfirmationResult(result);
      setStep("otp");
    } catch (err) {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
      setError(err.message || "Failed to send OTP. Try again.");
    } finally { setLoading(false); }
  };

  /* ── Step 2: Verify OTP & call backend ── */
  const handleVerifyOTP = async () => {
    if (otp.length !== 6) { setError("Enter the 6-digit OTP"); return; }
    setLoading(true); setError("");
    try {
      const result = await confirmationResult.confirm(otp);
      const firebaseToken = await result.user.getIdToken();
      await API.post(
        "/api/v1/users/request-password-reset",
        {},
        { headers: { Authorization: `Bearer ${firebaseToken}` } }
      );
      sessionStorage.setItem("resetFirebaseToken", firebaseToken);
      setStep("reset");
    } catch (err) {
      const message = err.response?.data?.message || "";
      if (message === "User not found") {
        setError("No account found with this mobile number.");
      } else {
        setError(message || "Invalid OTP. Try again.");
      }
    } finally { setLoading(false); }
  };

  /* ── Step 3: Reset Password ── */
  const handleResetPassword = async () => {
    if (newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPass) { setError("Passwords do not match"); return; }
    setLoading(true); setError("");
    try {
      const firebaseToken = sessionStorage.getItem("resetFirebaseToken");
      if (!firebaseToken) {
        setError("Session expired. Please verify your mobile number again.");
        setStep("mobile");
        return;
      }
      await API.post(
        "/api/v1/users/reset-password",
        { newPassword },
        { headers: { Authorization: `Bearer ${firebaseToken}` } }
      );
      sessionStorage.removeItem("resetFirebaseToken");
      setStep("done");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password. Try again.");
    } finally { setLoading(false); }
  };

  const handleResendOTP = async () => {
    setOtp(""); setError("");
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }
    await handleSendOTP();
  };

  const StepIndicator = () => (
    <div className="flex items-center gap-1">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-1 flex-1">
          <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 transition-all
            ${i < stepIndex   ? "bg-blue-600 text-white"
            : i === stepIndex ? "bg-blue-600 text-white ring-4 ring-blue-100"
            : "bg-gray-100 text-gray-400"}`}>
            {i < stepIndex ? "✓" : i + 1}
          </div>
          <span className={`text-xs font-medium hidden sm:block ${i === stepIndex ? "text-blue-600" : "text-gray-400"}`}>
            {s}
          </span>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-px mx-1 ${i < stepIndex ? "bg-blue-600" : "bg-gray-100"}`} />
          )}
        </div>
      ))}
    </div>
  );

  /* ── WhatsApp Help Banner ── */
  const WhatsAppHelp = ({ context = "default" }) => (
    <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
        <MessageCircle size={16} className="text-green-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-green-800">
          {context === "not-found"
            ? "Number not registered?"
            : context === "otp-issue"
            ? "Not receiving OTP?"
            : "Need help?"}
        </p>
        <p className="text-xs text-green-600 mt-0.5">
          {context === "not-found"
            ? "Contact support if you think this number should have an account."
            : context === "otp-issue"
            ? "Contact our support team and we'll help you reset your password manually."
            : "Our support team can help you reset your password via WhatsApp."}
        </p>
      </div>
      <button
        onClick={openWhatsApp}
        className="shrink-0 flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
      >
        <MessageCircle size={12} />
        Chat
      </button>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-gray-50">

      <div ref={recaptchaRef} />

      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-blue-600">
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
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
              Forgot your<br />
              <span className="text-blue-200">password?</span>
            </h1>
            <p className="text-blue-100 text-base font-light max-w-xs">
              Verify your mobile number and we'll get you back in.
            </p>

            {/* WhatsApp support callout on left panel */}
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 mt-4">
              <MessageCircle size={18} className="text-green-300 shrink-0" />
              <div>
                <p className="text-sm font-bold text-white">Need help?</p>
                <p className="text-xs text-blue-200">Chat with us on WhatsApp for support</p>
              </div>
              <button
                onClick={openWhatsApp}
                className="ml-auto shrink-0 bg-green-500 hover:bg-green-400 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              >
                Chat
              </button>
            </div>
          </div>
          <p className="text-blue-200 text-sm">© {new Date().getFullYear()} The Little Kingdom. All rights reserved.</p>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex justify-center items-center px-6 py-12">
        <div className="w-full max-w-md space-y-6">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-base leading-none">
              🏫
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-black text-gray-900 text-base tracking-tight">The Little Kingdom</span>
              <span className="font-light text-blue-600 text-xs tracking-widest uppercase">Store</span>
            </div>
          </div>

          {/* Done state */}
          {step === "done" ? (
            <div className="text-center space-y-5 py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} className="text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900">Password Reset!</h2>
                <p className="text-sm text-gray-400 mt-1">You can now log in with your new password.</p>
              </div>
              <button
                onClick={() => navigate("/login")}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-sm shadow-md shadow-blue-200 transition-all"
              >
                Go to Login <ArrowRight size={15} />
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <h2 className="text-3xl font-black text-gray-900">Reset Password</h2>
                <p className="text-gray-500 text-sm">
                  {step === "mobile" && "Enter the mobile number linked to your account"}
                  {step === "otp"    && `OTP sent to +91 ${mobileNumber}`}
                  {step === "reset"  && "Choose a strong new password"}
                </p>
              </div>

              <StepIndicator />

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
                  {error}
                </div>
              )}

              {/* ── Step 1: Mobile ── */}
              {step === "mobile" && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Mobile Number</label>
                    <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 bg-white">
                      <span className="px-3 py-3 bg-gray-50 text-sm text-gray-500 border-r border-gray-200 font-medium">+91</span>
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="10-digit mobile number"
                        value={mobileNumber}
                        onChange={e => setMobileNumber(e.target.value.replace(/\D/, ""))}
                        onKeyDown={e => e.key === "Enter" && handleSendOTP()}
                        className="flex-1 px-3 py-3 text-sm outline-none text-gray-800"
                      />
                    </div>
                    {mobileNumber && (
                      <p className={`text-xs pl-1 ${isMobileValid ? "text-green-500" : "text-gray-400"}`}>
                        {mobileNumber.length}/10 digits {isMobileValid && "✓"}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={handleSendOTP}
                    disabled={loading || !isMobileValid}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold text-sm shadow-md shadow-blue-200 transition-all"
                  >
                    {loading
                      ? <><Loader2 size={15} className="animate-spin" /> Sending OTP...</>
                      : <>Send OTP <ArrowRight size={15} /></>}
                  </button>

                  {/* WhatsApp help — shown after error or always */}
                  {error && error.includes("account") ? (
                    <WhatsAppHelp context="not-found" />
                  ) : (
                    <WhatsAppHelp context="default" />
                  )}

                  <p className="text-center text-sm text-gray-500">
                    Remember your password?{" "}
                    <Link to="/login" className="font-semibold text-blue-600 hover:underline">Sign in</Link>
                  </p>
                </div>
              )}

              {/* ── Step 2: OTP ── */}
              {step === "otp" && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Enter OTP</label>
                    <input
                      type="tel"
                      maxLength={6}
                      placeholder="• • • • • •"
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/, ""))}
                      onKeyDown={e => e.key === "Enter" && handleVerifyOTP()}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-xl focus:outline-none focus:ring-2 focus:ring-blue-500 tracking-[0.5em] text-center font-bold bg-white"
                    />
                    <p className="text-xs text-gray-400 text-center">
                      OTP sent to +91 {mobileNumber} — expires in 10 minutes
                    </p>
                  </div>

                  <button
                    onClick={handleVerifyOTP}
                    disabled={loading || otp.length !== 6}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold text-sm shadow-md shadow-blue-200 transition-all"
                  >
                    {loading
                      ? <><Loader2 size={15} className="animate-spin" /> Verifying...</>
                      : <>Verify OTP <ArrowRight size={15} /></>}
                  </button>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => { setStep("mobile"); setOtp(""); setError(""); }}
                      className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      ← Change number
                    </button>
                    <button
                      onClick={handleResendOTP}
                      disabled={loading}
                      className="text-xs text-blue-600 hover:underline font-medium disabled:opacity-50"
                    >
                      Resend OTP
                    </button>
                  </div>

                  {/* WhatsApp help for OTP issues */}
                  {error && <WhatsAppHelp context="otp-issue" />}
                </div>
              )}

              {/* ── Step 3: New Password ── */}
              {step === "reset" && (
                <div className="space-y-4">

                  <div className="flex items-center gap-2 px-3 py-2.5 bg-green-50 border border-green-200 rounded-xl">
                    <CheckCircle2 size={15} className="text-green-600 shrink-0" />
                    <span className="text-sm text-green-700 font-semibold">+91 {mobileNumber}</span>
                    <span className="text-xs text-green-500 ml-auto">Verified</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">New Password</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showPass ? "text" : "password"}
                        placeholder="Min. 6 characters"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="w-full pl-10 pr-11 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Confirm Password</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showConfirm ? "text" : "password"}
                        placeholder="Re-enter new password"
                        value={confirmPass}
                        onChange={e => setConfirmPass(e.target.value)}
                        className={`w-full pl-10 pr-11 py-3 border rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 bg-white transition-all
                          ${confirmPass && confirmPass !== newPassword
                            ? "border-red-300 focus:ring-red-400"
                            : "border-gray-200 focus:ring-blue-500"}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {confirmPass && confirmPass !== newPassword && (
                      <p className="text-xs text-red-500 pl-1">Passwords do not match</p>
                    )}
                    {confirmPass && confirmPass === newPassword && (
                      <p className="text-xs text-green-500 pl-1">✓ Passwords match</p>
                    )}
                  </div>

                  <button
                    onClick={handleResetPassword}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold text-sm shadow-md shadow-blue-200 transition-all"
                  >
                    {loading
                      ? <><Loader2 size={15} className="animate-spin" /> Resetting...</>
                      : <>Reset Password <ArrowRight size={15} /></>}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}