// src/userdetails/Login.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import api, { BASE_URL, initCsrf, setApiPortalCode } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff } from "lucide-react";

const PORTAL_DEFAULTS = {
  propeople: { name: "Pro People", color: "#E02D3D" },
  ovisco: { name: "Ovaisco", color: "#D49A2F" },
};

const toInternalCompanyCode = (code) => {
  const normalized = String(code || "").trim().toLowerCase();
  return normalized === "ovaisco" ? "ovisco" : normalized;
};

const getPublicCompanyName = (name, code) => {
  if (toInternalCompanyCode(code) === "ovisco") return "Ovaisco";
  return name;
};

function hexToRgb(hex) {
  const clean = String(hex || "#ef4444").replace("#", "");
  const normalized = clean.length === 3
    ? clean.split("").map((c) => c + c).join("")
    : clean.padEnd(6, "0").slice(0, 6);

  return {
    r: parseInt(normalized.substring(0, 2), 16) || 239,
    g: parseInt(normalized.substring(2, 4), 16) || 68,
    b: parseInt(normalized.substring(4, 6), 16) || 68,
  };
}

/**
 * Login Component - Optimized Professional & Compact
 * 
 * Final Fixes:
 * - Locked h-screen to prevent any scrolling.
 * - Balanced professional scaling (no oversized elements).
 * - Premium interactive states & persistent "Remember Me".
 */
export default function Login({
  status,
  serverErrors = [],
  fixedCompanyCode = "",
}) {
  const { portalCode } = useParams();
  const lockedCompanyCode = toInternalCompanyCode(fixedCompanyCode || portalCode || "");
  const initialPortal = PORTAL_DEFAULTS[lockedCompanyCode] || null;
  const [email, setEmail] = useState("");
  const [companyCode, setCompanyCode] = useState(lockedCompanyCode);
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [brandColor, setBrandColor] = useState(initialPortal?.color || "#ef4444");
  const [companyLogo, setCompanyLogo] = useState(null);
  const [companyName, setCompanyName] = useState(initialPortal?.name || "WorkSphere");
  const [isBrandingLoading, setIsBrandingLoading] = useState(Boolean(lockedCompanyCode));

  const navigate = useNavigate();
  const { setUser, login: ctxLogin } = useAuth();
  const brandRgb = hexToRgb(brandColor);
  const brandSoft = `rgb(${brandRgb.r} ${brandRgb.g} ${brandRgb.b} / 0.10)`;
  const brandSofter = `rgb(${brandRgb.r} ${brandRgb.g} ${brandRgb.b} / 0.06)`;
  const brandBorder = `rgb(${brandRgb.r} ${brandRgb.g} ${brandRgb.b} / 0.24)`;

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    const savedCompanyCode = localStorage.getItem("rememberedCompanyCode");
    if (savedEmail) {
      setEmail(savedEmail);
      setRemember(true);
    }
    if (lockedCompanyCode) {
      setCompanyCode(lockedCompanyCode);
    } else if (savedCompanyCode) {
      setCompanyCode(savedCompanyCode);
      setRemember(true);
    }
  }, [lockedCompanyCode]);

  useEffect(() => {
    if (lockedCompanyCode) {
      setApiPortalCode(lockedCompanyCode);
    }
  }, [lockedCompanyCode]);

  useEffect(() => {
    const code = String(companyCode || "").trim().toLowerCase();
    if (!code || code.length < 2) {
      setBrandColor("#ef4444");
      setCompanyLogo(null);
      setCompanyName("WorkSphere");
      setIsBrandingLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsBrandingLoading(Boolean(lockedCompanyCode));
      try {
        const { data } = await api.get("/settings/branding", {
          params: { companyCode: code },
        });
        const primary = data?.colors?.primary || "#ef4444";
        setBrandColor(primary);
        setCompanyLogo(data?.logo ? `${BASE_URL}${data.logo}` : null);
        setCompanyName(getPublicCompanyName(data?.companyName || code, data?.companyCode || code));

        const hex = primary.replace("#", "");
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        document.documentElement.style.setProperty("--color-primary", primary);
        document.documentElement.style.setProperty("--color-primary-rgb", `${r} ${g} ${b}`);

        if (data?.favicon) {
          document.querySelectorAll("link[rel='icon'], link[rel='shortcut icon']").forEach((link) => {
            link.setAttribute("href", `${BASE_URL}${data.favicon}`);
          });
        }
      } catch {
        const fallback = PORTAL_DEFAULTS[code] || null;
        setBrandColor(fallback?.color || "#ef4444");
        setCompanyLogo(null);
        setCompanyName(getPublicCompanyName(fallback?.name || "WorkSphere", code));
      } finally {
        setIsBrandingLoading(false);
      }
    }, lockedCompanyCode ? 0 : 350);

    return () => clearTimeout(timer);
  }, [companyCode, lockedCompanyCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setIsSubmitting(true);

    const payload = {
      companyCode: String(companyCode).trim().toLowerCase(),
      email: String(email).trim().toLowerCase(),
      password: String(password).trim(),
      remember,
    };

    try {
      setApiPortalCode(payload.companyCode);
      await initCsrf();
      if (remember) {
        localStorage.setItem("rememberedEmail", payload.email);
        if (!lockedCompanyCode) {
          localStorage.setItem("rememberedCompanyCode", payload.companyCode);
        }
      } else {
        localStorage.removeItem("rememberedEmail");
        if (!lockedCompanyCode) {
          localStorage.removeItem("rememberedCompanyCode");
        }
      }

      if (typeof ctxLogin === "function") {
        await ctxLogin(payload.companyCode, payload.email, payload.password, payload.remember);
        navigate("/dashboard", { replace: true });
        return;
      }

      const res = await api.post("/auth/login", payload);
      const u = res?.data?.user;
      if (!u) throw new Error("Login failure.");
      setUser(u);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setErrors([err?.response?.data?.message || err?.message || "Request failed."]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col md:flex-row bg-white font-['Outfit',sans-serif] text-slate-800 overflow-hidden" style={{ "--login-brand": brandColor }}>

      <style>{`
        .glass-bg { background: #ffffff; }
        .brand-focus:focus {
          border-color: var(--login-brand);
          box-shadow: 0 0 0 4px rgb(${brandRgb.r} ${brandRgb.g} ${brandRgb.b} / 0.10);
        }
        .animate-in-fade {
          animation: fadeIn 0.6s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Left: Professional Compact Form */}
      <div className="w-full md:w-[45%] h-full flex items-center justify-center p-8 lg:p-12 xl:p-16 glass-bg border-r border-slate-100">
        <div className="w-full max-w-md animate-in-fade">
          <div className="mb-10">
            {lockedCompanyCode && (
              <div
                className="mb-4 inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]"
                style={{ backgroundColor: brandSoft, color: brandColor }}
              >
                {companyName} Portal
              </div>
            )}
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-2">
              Welcome back<span style={{ color: brandColor }}>.</span>
            </h1>
            <p className="text-slate-400 font-medium text-sm">
              Sign in to your WorkSphere workspace.
            </p>
          </div>

          {status && (
            <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-100 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              {status}
            </div>
          )}

          {errors.length > 0 && (
            <div className="mb-6 p-4 bg-rose-50 text-rose-600 text-xs font-medium rounded-xl border border-rose-100">
              <ul className="space-y-1">
                {errors.map((msg, i) => <li key={i} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                  {msg}
                </li>)}
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!lockedCompanyCode && (
              <div className="space-y-1.5">
                <label htmlFor="companyCode" className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                  Company Code
                </label>
                <input
                  id="companyCode"
                  type="text"
                  value={companyCode}
                  onChange={(e) => setCompanyCode(e.target.value)}
                  required
                  placeholder="your company code here..."
                  className="brand-focus w-full px-5 py-3.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white outline-none transition-all duration-200 text-sm font-semibold placeholder:text-slate-300"
                  style={{ borderColor: companyCode ? brandBorder : undefined }}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                Official Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@company.com"
                className="brand-focus w-full px-5 py-3.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white outline-none transition-all duration-200 text-sm font-semibold placeholder:text-slate-300"
                style={{ borderColor: companyCode ? brandBorder : undefined }}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" title="Enter password" className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="brand-focus w-full px-5 py-3.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white outline-none transition-all duration-200 text-sm font-semibold placeholder:text-slate-300"
                  style={{ borderColor: companyCode ? brandBorder : undefined }}
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 transition-colors p-1"
                  style={{ color: show ? brandColor : undefined }}
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? (
                    <EyeOff strokeWidth={2.5} size={20} />
                  ) : (
                    <Eye strokeWidth={2.5} size={20} />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center ml-1">
              <label className="flex items-center cursor-pointer group select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className="w-4 h-4 border-2 rounded transition-all duration-200 flex items-center justify-center bg-white border-slate-200"
                  style={remember ? { backgroundColor: brandColor, borderColor: brandColor } : undefined}
                >
                  {remember && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" d="M5 13l4 4L19 7" /></svg>
                  )}
                </div>
                <span className="ml-2.5 text-[11px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-600 transition-colors">Remember Session</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full text-white font-black py-4 rounded-xl active:scale-[0.98] disabled:opacity-50 transition-all duration-300 shadow-lg flex items-center justify-center gap-2 text-sm tracking-widest"
              style={{ backgroundColor: brandColor, boxShadow: `0 12px 28px -12px ${brandColor}` }}
            >
              {isSubmitting ? (
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <span>SIGN IN →</span>
              )}
            </button>
          </form>

          <footer className="mt-10 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
              &copy; 2025 WorkSphere
            </p>
          </footer>
        </div>
      </div>

      {/* Right: Immersive Branding Pane */}
      <div className="hidden md:flex w-[55%] h-full bg-white flex-col items-center justify-center p-12 lg:p-20 relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.04] pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="w-full max-w-lg space-y-8 text-center relative z-10 animate-in-fade" style={{ animationDelay: '0.1s' }}>
          <div className="space-y-3">
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">
              {companyName}
            </h2>
            <p className="max-w-xs mx-auto text-slate-400 font-medium text-sm">
              Unified workforce and operations platform.
            </p>
          </div>

          <div className="relative mx-auto mt-4 flex h-[360px] w-[390px] max-w-full items-center justify-center">
            <div
              className="absolute inset-8 rounded-full blur-[70px]"
              style={{ backgroundColor: brandSoft }}
            />
            <div className="relative flex h-[300px] w-[300px] items-center justify-center rounded-[28px] border bg-white shadow-2xl shadow-slate-200/70"
              style={{ borderColor: brandBorder }}
            >
              {companyLogo ? (
                <img
                  src={companyLogo}
                  alt="Company logo"
                  width="230"
                  height="210"
                  loading="eager"
                  decoding="async"
                  className="max-h-[210px] max-w-[230px] object-contain"
                />
              ) : isBrandingLoading ? (
                <div
                  className="flex h-[245px] w-[245px] items-center justify-center rounded-3xl"
                  style={{ backgroundColor: brandSoft }}
                  aria-label="Loading company branding"
                >
                  <div
                    className="h-10 w-10 animate-spin rounded-full border-4 border-transparent"
                    style={{ borderTopColor: brandColor, borderRightColor: brandColor }}
                  />
                </div>
              ) : (
                <div className="h-[245px] w-[245px] overflow-hidden bg-white">
                  <img
                    src="/hrm.jpg"
                    alt="WorkSphere workspace"
                    width="245"
                    height="245"
                    loading="eager"
                    decoding="async"
                    className="h-full w-full scale-125 object-cover object-top"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-center gap-8 pt-4">
            <div className="text-center group px-4">
              <p className="text-sm font-black" style={{ color: brandColor }}>Realtime</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-300 mt-0.5 group-hover:text-slate-500 transition-colors">Reporting</p>
            </div>
            <div className="w-px h-8 bg-slate-100"></div>
            <div className="text-center group px-4">
              <p className="text-sm font-black" style={{ color: brandColor }}>Secure</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-300 mt-0.5 group-hover:text-slate-500 transition-colors">Database</p>
            </div>
            <div className="w-px h-8 bg-slate-100"></div>
            <div className="text-center group px-4">
              <p className="text-sm font-black" style={{ color: brandColor }}>Global</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-300 mt-0.5 group-hover:text-slate-500 transition-colors">Support</p>
            </div>
          </div>
        </div>

        <div
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{ backgroundColor: brandSofter }}
        />
      </div>
    </div>
  );
}
