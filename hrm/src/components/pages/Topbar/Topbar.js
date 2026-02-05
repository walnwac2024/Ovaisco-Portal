// src/components/pages/Topbar/Topbar.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import hrmLogo from "../../../assets/hrm-logo.png";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaCog,
  FaUsers,
  FaUser,
  FaCalendarAlt,
  FaCalendarCheck,
  FaChartLine,
  FaThLarge,
  FaChartBar,
  FaBell,
  FaClock,
  FaSignOutAlt,
  FaShieldAlt,
} from "react-icons/fa";
import { useAuth } from "../../../context/AuthContext";
import { useTheme } from "../../../context/ThemeContext";
import api, { BASE_URL } from "../../../utils/api";

// Map backend keys -> route + icon + fallback label
const TAB_META = {
  dashboard: { to: "/dashboard", Icon: FaHome, label: "Dashboard" },
  organization: { to: "/organization", Icon: FaCog, label: "Organization" },
  recruitment: { to: "/recruitment", Icon: FaUsers, label: "Recruitment", isComingSoon: true },
  employee: { to: "/employees", Icon: FaUser, label: "Employee" },
  timesheet: { to: "/timesheet", Icon: FaCalendarAlt, label: "Timesheet", isComingSoon: true },
  leave: { to: "/leave", Icon: FaCalendarCheck, label: "Leave" },
  attendance: { to: "/attendance", Icon: FaClock, label: "Attendance" },
  performance: { to: "/performance", Icon: FaChartLine, label: "Performance", isComingSoon: true },
  payroll: { to: "/payroll", Icon: FaThLarge, label: "Payroll", isComingSoon: true },
  reports: { to: "/reports", Icon: FaChartBar, label: "Reports" },
  permissions: { to: "/dashboard/permissions", Icon: FaShieldAlt, label: "Permissions" },
  system_settings: { to: "/settings/system", Icon: FaCog, label: "Settings" },
};

function getInitials(nameOrEmail = "User") {
  const base = String(nameOrEmail).trim();
  const name = base.includes("@")
    ? base.split("@")[0].replace(/[._-]+/g, " ")
    : base;
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "U"
  );
}

export default function Topbar({ logoSrc }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, tabs, logout } = useAuth();
  const { logo: brandLogo } = useTheme();

  // ✅ Notification State
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'leave', 'attendance'
  const notifyRef = useRef(null);

  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'all') return true;
    if (activeTab === 'leave') return n.type === 'Leave';
    if (activeTab === 'attendance') return n.type === 'attendance'; // Assuming 'attendance' is the type key
    return true;
  });

  // ✅ Dropdown State
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const btnRef = useRef(null);

  // ✅ Mobile Drawer state
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      if (!user) return;
      const { data } = await api.get("/notifications");
      setNotifications(data);
    } catch (e) {
      console.error("fetchNotifications error", e);
    }
  }, [user]);

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
    } catch (e) {
      console.error("markRead error", e);
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    } catch (e) {
      console.error("markAllRead error", e);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 300000); // 5 mins
      return () => clearInterval(interval);
    }
  }, [user, fetchNotifications]);

  useEffect(() => {
    function onDocClick(e) {
      if (open && dropdownRef.current && !dropdownRef.current.contains(e.target) && btnRef.current && !btnRef.current.contains(e.target)) {
        setOpen(false);
      }
      if (showNotifications && notifyRef.current && !notifyRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    }

    function onEsc(e) {
      if (e.key === "Escape") {
        setOpen(false);
        setShowNotifications(false);
        setShowMobileMenu(false);
      }
    }

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open, showNotifications]);

  // resolve logo
  const fallbackLogo = `${process.env.PUBLIC_URL}/logo192.png`;
  const contextLogoUrl = brandLogo ? (brandLogo.startsWith('http') ? brandLogo : `${BASE_URL}${brandLogo}`) : null;
  const logo = logoSrc || contextLogoUrl || hrmLogo;

  // Build menu
  const safeTabs = Array.isArray(tabs) ? tabs : [];
  const menu = safeTabs
    .map((t) => {
      const meta = TAB_META[t.key] || {};
      return {
        key: t.key,
        label: t.label || meta.label || t.key,
        to: meta.to || `/${t.key}`,
        Icon: meta.Icon || FaHome,
        isComingSoon: meta.isComingSoon || false,
      };
    })
    .filter((m) => m.key !== "permissions");

  const activeMenu = menu.find((m) => location.pathname.startsWith(m.to));
  let activeLabel = activeMenu?.label ?? "";

  // ✅ Fallback for pages not in the main tab menu
  if (!activeLabel) {
    if (location.pathname.startsWith("/profile")) activeLabel = "Profile";
    else if (location.pathname.startsWith("/settings")) activeLabel = "Settings";
    else activeLabel = "Dashboard";
  }

  const userName = user?.name || user?.email || "User";
  const initials = getInitials(userName);

  const FILE_BASE = BASE_URL;

  // ✅ support both profile_img and profile_picture
  const rawAvatar = user?.profile_img || user?.profile_picture || null;
  const avatarUrl = rawAvatar
    ? rawAvatar.startsWith("http")
      ? rawAvatar
      : `${FILE_BASE}${rawAvatar.startsWith("/") ? rawAvatar : `/${rawAvatar}`}`
    : null;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error(e);
    } finally {
      setOpen(false);
      setShowMobileMenu(false);
      navigate("/login", { replace: true });
    }
  };

  const isAuthed = !!user;
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // ✅ Bell Animation Trigger Logic
  const [animateBell, setAnimateBell] = useState(false);
  const prevCountRef = useRef(unreadCount);

  // Check if we have unread LEAVE notifications
  const hasUnreadLeaves = notifications.some(n => n.type === 'Leave' && !n.is_read);

  useEffect(() => {
    // Basic pulse on any new notification
    if (unreadCount > prevCountRef.current) {
      setAnimateBell(true);
      const timer = setTimeout(() => setAnimateBell(false), 1000);
      return () => clearTimeout(timer);
    }
    prevCountRef.current = unreadCount;
  }, [unreadCount]);

  // "Nagging" interval for high priority leave notifications
  useEffect(() => {
    if (!hasUnreadLeaves) return;

    // Pulse every 3 seconds if there are unread leaves
    const interval = setInterval(() => {
      setAnimateBell(true);
      setTimeout(() => setAnimateBell(false), 1000);
    }, 3000);

    return () => clearInterval(interval);
  }, [hasUnreadLeaves]);

  return (
    <header className="w-full relative sticky top-0 z-[100]">
      {/* Drawer Overlay */}
      {showMobileMenu && (
        <div
          className="drawer-overlay block md:hidden"
          onClick={() => setShowMobileMenu(false)}
        />
      )}

      {/* Main Top Bar */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm transition-all duration-300 relative z-20">
        <div className="mx-auto max-w-screen-2xl h-[72px] px-4 sm:px-6 flex items-center justify-between">

          {/* Left: Logo & Mobile Toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowMobileMenu(true)}
              className="p-2 -ml-2 text-slate-500 hover:text-customRed md:hidden transition-colors rounded-xl hover:bg-red-50"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>

            <Link to="/dashboard" className="flex items-center shrink-0" aria-label="Go to dashboard">
              <img
                src={logo}
                alt="HRM Logo"
                className="h-8 sm:h-9 w-auto drop-shadow-sm"
                onError={(e) => {
                  e.target.src = fallbackLogo;
                }}
              />
            </Link>
          </div>

          {/* Center: Premium Desktop Navigation (High Performance) */}
          <nav className="hidden lg:flex items-center justify-center flex-1 mx-2 overflow-hidden">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 px-1">
              {menu.map((item) => {
                const isActive = location.pathname.startsWith(item.to);
                const Icon = item.Icon;
                return (
                  <Link
                    key={item.key}
                    to={item.to}
                    className={`group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all duration-200 whitespace-nowrap
                      ${isActive
                        ? "bg-customRed text-white shadow-md shadow-red-500/10 scale-[1.02] z-10"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                  >
                    <Icon className={`text-[13px] 2xl:text-[15px] transition-all duration-200 
                      ${isActive ? "scale-105" : "opacity-70 group-hover:opacity-100 group-hover:scale-105"}`}
                    />
                    <span className="text-[9px] 2xl:text-[11px] font-bold uppercase tracking-tight">
                      {item.label}
                    </span>

                    {isActive && (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 bg-white rounded-full" />
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-3 shrink-0 ml-1">

            {/* Notifications */}
            <div className="relative" ref={notifyRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2 rounded-xl transition-all duration-200 
                  ${showNotifications ? "bg-customRed/10 text-customRed" : "text-slate-500 hover:text-customRed hover:bg-slate-50"}`}
                aria-label="Notifications"
                type="button"
              >
                <FaBell className={`text-[19px] ${animateBell ? "animate-bell" : ""}`} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center bg-red-600 text-white text-[8px] font-bold rounded-full border border-white shadow-sm mb-1 mr-1">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-[calc(100%+8px)] w-[320px] rounded-[24px] border border-slate-200 bg-white shadow-2xl z-50 overflow-hidden animate-slide-up">
                  {/* Arrow pointer */}
                  <div className="absolute -top-1.5 right-4 w-3 h-3 bg-white border-t border-l border-slate-200 rotate-45 z-[-1]" />

                  {/* Header */}
                  <div className="px-4 py-3 border-b bg-slate-50/50 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-800">Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-[9px] text-customRed font-black uppercase tracking-wider hover:underline">
                        Clear All
                      </button>
                    )}
                  </div>

                  {/* Tabs */}
                  <div className="flex items-center px-1 py-1 border-b bg-white gap-1">
                    {['all', 'leave', 'attendance'].map((tab) => {
                      const isActive = activeTab === tab;
                      const label = tab === 'leave' ? 'Leaves' : (tab === 'attendance' ? 'Attendance' : 'All');
                      return (
                        <button
                          key={tab}
                          onClick={(e) => { e.stopPropagation(); setActiveTab(tab); }}
                          className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all
                             ${isActive ? "bg-slate-100 text-slate-900 shadow-sm" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"}
                           `}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                    {filteredNotifications.length === 0 ? (
                      <div className="px-6 py-10 text-center">
                        <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <FaBell className="text-xl text-slate-200" />
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {activeTab === 'all' ? "Everything is quiet" : `No ${activeTab} alerts`}
                        </div>
                      </div>
                    ) : (
                      filteredNotifications.map((n) => {
                        // Distinct style for Leave notifications
                        const isLeave = n.type === 'Leave';
                        const isUnread = !n.is_read;

                        return (
                          <div
                            key={n.id}
                            onClick={() => {
                              if (!n.is_read) markRead(n.id);

                              if (isLeave) {
                                navigate('/leave', { state: { activeTab: 'leave-approvals' } });
                                setShowNotifications(false);
                                return;
                              }

                              if (n.title === "New Support Message") {
                                const event = new CustomEvent("open-chat-auth");
                                window.dispatchEvent(event);
                                setShowNotifications(false);
                              }
                            }}
                            className={`
                            px-4 py-3 border-b last:border-b-0 cursor-pointer transition-colors relative
                            ${isLeave && isUnread ? "bg-amber-50 hover:bg-amber-100/80 border-l-4 border-l-amber-500" : "hover:bg-slate-50/80"}
                            ${!isLeave && isUnread ? "bg-red-50/10" : ""}
                          `}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 shadow-sm ${isUnread ? (isLeave ? "bg-amber-500 animate-pulse" : "bg-customRed animate-pulse") : "bg-slate-200"}`} />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-0.5">
                                  {isLeave && <span className="text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Leave Update</span>}
                                  <div className={`text-[11px] font-bold leading-tight ${isLeave ? "text-slate-900" : "text-slate-800"}`}>{n.title}</div>
                                </div>
                                <div className="text-[11px] text-slate-500 leading-relaxed font-medium line-clamp-2">{n.message}</div>
                                <div className="text-[8px] text-slate-400 mt-1.5 uppercase font-black tracking-widest flex items-center gap-1">
                                  <FaClock className="text-[9px]" />
                                  {new Date(n.created_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Menu */}
            {isAuthed && (
              <div className="relative" ref={dropdownRef}>
                <button
                  ref={btnRef}
                  onClick={() => setOpen((v) => !v)}
                  className={`flex items-center gap-3 p-1.5 pr-4 rounded-2xl border transition-all duration-200
                    ${open ? "bg-customRed/5 border-customRed/20 ring-4 ring-customRed/5" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}
                  aria-haspopup="menu"
                  aria-expanded={open}
                  aria-label="User menu"
                  type="button"
                >
                  <div className="relative shrink-0">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="User" className="h-9 w-9 rounded-xl object-cover border border-slate-100 shadow-sm" />
                    ) : (
                      <span className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-br from-customRed to-red-600 text-white text-[12px] font-black shadow-md shadow-red-500/20 uppercase">
                        {initials}
                      </span>
                    )}
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" title="Online" />
                  </div>
                  <div className="hidden lg:block text-left min-w-0">
                    <p className="text-[13px] font-bold text-slate-900 truncate leading-none mb-1">{userName}</p>
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest truncate leading-none mb-0.5">{user?.role || 'Authorized'}</p>
                    <p className="text-[9px] text-customRed font-bold truncate leading-none">{user?.Department || ''}</p>
                  </div>
                </button>

                {open && (
                  <div className="absolute right-0 top-[calc(100%+8px)] w-[190px] rounded-[20px] border border-slate-200 bg-white shadow-2xl z-50 overflow-hidden ring-1 ring-slate-900/5 animate-slide-up">
                    {/* Arrow pointer */}
                    <div className="absolute -top-1.5 right-6 w-3 h-3 bg-white border-t border-l border-slate-200 rotate-45 z-[-1]" />
                    <div className="px-4 py-3 border-b bg-slate-50/50">
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.15em] mb-0.5">Signed in as</p>
                      <p className="text-[12px] font-bold text-slate-800 truncate leading-tight">{userName}</p>
                    </div>

                    <div className="p-1.5 space-y-0.5">
                      <Link
                        to="/profile"
                        onClick={() => setOpen(false)}
                        className="group flex items-center gap-2.5 px-3 py-2 text-[12px] font-bold text-slate-600 hover:bg-slate-50 hover:text-customRed rounded-xl transition-all"
                        role="menuitem"
                      >
                        <div className="h-7 w-7 bg-slate-50 rounded-lg flex items-center justify-center transition-colors group-hover:bg-customRed/10">
                          <FaUser className="text-[14px] text-slate-400 group-hover:text-customRed" />
                        </div>
                        My Profile
                      </Link>

                      <Link
                        to="/settings/system"
                        onClick={() => setOpen(false)}
                        className="group flex items-center gap-2.5 px-3 py-2 text-[12px] font-bold text-slate-600 hover:bg-slate-50 hover:text-customRed rounded-xl transition-all"
                        role="menuitem"
                      >
                        <div className="h-7 w-7 bg-slate-50 rounded-lg flex items-center justify-center transition-colors group-hover:bg-customRed/10">
                          <FaCog className="text-[14px] text-slate-400 group-hover:text-customRed" />
                        </div>
                        System Settings
                      </Link>
                    </div>

                    <div className="px-1.5 pt-1 pb-1.5 border-t border-slate-100">
                      <button
                        onClick={handleLogout}
                        className="group w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-black text-red-600 hover:bg-red-50 rounded-xl transition-all uppercase tracking-widest"
                        role="menuitem"
                        type="button"
                      >
                        <div className="h-7 w-7 bg-red-50 rounded-lg flex items-center justify-center">
                          <FaSignOutAlt className="text-[14px]" />
                        </div>
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sub-Header / Perspective Bar */}
      <div className="bg-customRed text-white overflow-hidden shadow-sm relative z-10">
        <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-black/10" />

        <div className="mx-auto max-w-[1600px] h-7 px-4 sm:px-8 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-[9px] 2xl:text-[11px] font-bold uppercase tracking-widest text-white/95">{activeLabel}</span>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-[9px] 2xl:text-[11px] font-bold uppercase tracking-tight">
            <div className="flex items-center gap-2 pr-4 border-r border-white/20">
              <span className="text-white/60 tracking-widest">Status</span>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                <span className="text-white">Online</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/60 tracking-widest">Last Sync</span>
              <span className="text-white">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer (Refined) */}
      <div className={`fixed top-0 left-0 h-full w-[300px] bg-white z-[1001] shadow-[30px_0_60px_rgba(0,0,0,0.1)] transform transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] md:hidden rounded-r-[32px] overflow-hidden flex flex-col ${showMobileMenu ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Header */}
        <div className="shrink-0 p-6 border-b border-slate-100 flex items-center justify-between bg-white relative">
          <img src={logo} alt="Logo" className="h-8 w-auto" />
          <button
            onClick={() => setShowMobileMenu(false)}
            className="p-2 text-slate-400 hover:text-customRed hover:bg-red-50 rounded-xl transition-all"
            aria-label="Close menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav (Scrollable) */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
          {menu.map((item) => {
            const isActive = location.pathname.startsWith(item.to);
            const Icon = item.Icon;
            return (
              <Link
                key={item.key}
                to={item.to}
                onClick={() => setShowMobileMenu(false)}
                className={`flex items-center gap-4 px-5 py-4 rounded-2xl text-[13px] font-bold transition-all
                  ${isActive
                    ? "bg-customRed/5 text-customRed shadow-sm shadow-red-500/5 ring-1 ring-customRed/10"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
              >
                <div className={`p-2 rounded-xl transition-colors ${isActive ? "bg-customRed/10" : "bg-slate-50"}`}>
                  <Icon className={`text-[20px] ${isActive ? "text-customRed" : "text-slate-400"}`} />
                </div>
                <span className="uppercase tracking-widest">{item.label}</span>
                {isActive && <div className="ml-auto w-2 h-2 rounded-full bg-customRed shadow-[0_0_10px_rgba(221,4,28,0.5)]" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer (Safe Area + Profile) */}
        <div className="shrink-0 w-full px-6 pt-6 pb-[calc(1.5rem+var(--safe-area-bottom))] border-t bg-slate-50/50 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-customRed flex items-center justify-center text-white font-black text-sm uppercase shadow-lg shadow-red-500/30">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-black text-slate-800 truncate leading-none mb-1.5">{userName}</div>
              <div className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mb-0.5">{user?.role || 'authorized personnel'}</div>
              <div className="text-[10px] text-customRed font-bold truncate">{user?.Department || ''}</div>
            </div>
          </div>
        </div>
      </div>
    </header >
  );

}
