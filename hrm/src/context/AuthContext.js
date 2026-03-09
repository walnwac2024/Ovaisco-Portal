// src/context/AuthContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import api, { initCsrf } from "../utils/api";

const AuthContext = createContext(null);

const IDLE_LIMIT_MS = 15 * 60 * 1000;
const WARNING_MS = 60 * 1000;

function normalizeUser(raw) {
  if (!raw) return null;

  return {
    ...raw,
    role: raw.role ? String(raw.role).toLowerCase() : null,
    roles: Array.isArray(raw.roles) ? raw.roles.map(r => String(r).toLowerCase()) : [],
    features: Array.isArray(raw.features) ? raw.features.map(f => String(f).toLowerCase()) : [],
    profile_img: raw.profile_img || raw.profile_picture || raw.profileImage || null,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tabs, setTabs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showIdleWarning, setShowIdleWarning] = useState(false);
  const idleTimerRef = useRef(null);
  const warnTimerRef = useRef(null);
  const bcRef = useRef(null);

  const loadSession = async () => {
    try {
      await initCsrf();
      const meRes = await api.get("/auth/me");
      console.log("the meRes:",meRes)
      const meUser = normalizeUser(meRes.data?.user || null);
      setUser(meUser);

      if (meUser) {
        const menuRes = await api.get("/me/menu");
        setTabs(menuRes.data?.tabs || []);
      } else {
        setTabs([]);
      }
    } catch (e) {
      console.error("loadSession error", e);
      setUser(null);
      setTabs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email, password, remember) => {
    await initCsrf();

    const { data } = await api.post("/auth/login", {
      email,
      password,
      remember,
    });

    const loggedInUser = normalizeUser(data?.user || null);
    setUser(loggedInUser);

    if (loggedInUser) {
      const menuRes = await api.get("/me/menu");
      setTabs(menuRes.data?.tabs || []);
      startIdleWatch();
    } else {
      stopIdleWatch();
      setTabs([]);
    }

    return loggedInUser;
  };

  const logout = async () => {
    try {
      await initCsrf();
      await api.post("/auth/logout");
    } catch (e) {
      console.warn("logout error (ignored):", e);
    }

    stopIdleWatch();
    setUser(null);
    setTabs([]);

    localStorage.setItem("idle:forceLogout", String(Date.now()));
    try {
      bcRef.current?.postMessage({ type: "forceLogout" });
    } catch { }
  };

  const refresh = async () => {
    const meRes = await api.get("/auth/me");
    const meUser = normalizeUser(meRes.data?.user || null);
    setUser(meUser);

    if (meUser) {
      const menuRes = await api.get("/me/menu");
      setTabs(menuRes.data?.tabs || []);
    } else {
      setTabs([]);
    }

    return meUser;
  };

  const setUserFlexible = (value) => {
    const u = value && value.user ? value.user : value;
    setUser(normalizeUser(u));
  };

  const resetIdleTimers = () => {
    localStorage.setItem("idle:lastActivity", String(Date.now()));
    try {
      bcRef.current?.postMessage({ type: "activity", ts: Date.now() });
    } catch { }

    clearTimeout(idleTimerRef.current);
    clearTimeout(warnTimerRef.current);
    setShowIdleWarning(false);

    warnTimerRef.current = setTimeout(() => {
      setShowIdleWarning(true);
    }, Math.max(0, IDLE_LIMIT_MS - WARNING_MS));

    idleTimerRef.current = setTimeout(() => {
      logout();
    }, IDLE_LIMIT_MS);
  };

  const onUserActivity = () => {
    if (!user) return;
    resetIdleTimers();
  };

  const addActivityListeners = () => {
    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "visibilitychange",
      "click",
    ];
    events.forEach((ev) =>
      window.addEventListener(ev, onUserActivity, { passive: true })
    );
  };

  const removeActivityListeners = () => {
    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "visibilitychange",
      "click",
    ];
    events.forEach((ev) => window.removeEventListener(ev, onUserActivity));
  };

  const startIdleWatch = () => {
    if (!user) return;

    addActivityListeners();
    resetIdleTimers();

    try {
      bcRef.current = new BroadcastChannel("idle-channel");
      bcRef.current.onmessage = (e) => {
        if (e?.data?.type === "activity") resetIdleTimers();
        if (e?.data?.type === "forceLogout") logout();
      };
    } catch { }

    const onStorage = (e) => {
      if (e.key === "idle:lastActivity") resetIdleTimers();
      if (e.key === "idle:forceLogout") logout();
    };

    window.addEventListener("storage", onStorage);
    startIdleWatch._cleanup = () => window.removeEventListener("storage", onStorage);
  };

  const stopIdleWatch = () => {
    clearTimeout(idleTimerRef.current);
    clearTimeout(warnTimerRef.current);
    removeActivityListeners();
    setShowIdleWarning(false);

    try {
      bcRef.current?.close();
    } catch { }
    bcRef.current = null;

    startIdleWatch._cleanup?.();
  };

  useEffect(() => {
    if (user) startIdleWatch();
    else stopIdleWatch();
    return () => stopIdleWatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      tabs,
      loading,
      isAuthenticated: !!user,
      login,
      logout,
      refresh,
      setUser: setUserFlexible,
      showIdleWarning,
      staySignedIn: resetIdleTimers,
    }),
    [user, tabs, loading, showIdleWarning]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      {showIdleWarning && (
        <IdleWarningModal onStay={resetIdleTimers} onLogout={logout} />
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

function IdleWarningModal({ onStay, onLogout }) {
  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 w-[90%] max-w-md shadow-xl">
        <h3 className="text-lg font-semibold mb-2">You’ve been inactive</h3>
        <p className="text-sm text-gray-600 mb-4">
          You’ll be signed out for security in about a minute. Stay signed in?
        </p>
        <div className="flex gap-2 justify-end">
          <button onClick={onLogout} className="px-3 py-2 rounded-md border">
            Sign out now
          </button>
          <button
            onClick={onStay}
            className="px-3 py-2 rounded-md bg-red-600 text-white"
          >
            Stay signed in
          </button>
        </div>
      </div>
    </div>
  );
}
