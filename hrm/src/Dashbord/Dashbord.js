// src/Dashbord/Dashbord.js
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getAttendanceOffices,
  getTodayAttendance,
  punchAttendance,
  getPersonalAttendanceSummary,
} from "../features/attendance/services/attendanceService";
import {
  getLeaveBalances,
  getLeaveDashboardStats
} from "../features/leave/services/leaveService";
import { getDashboardData } from "../features/dashboard/services/dashboardService";
import { listNews } from "../features/news/newsService";
import { Megaphone, ChevronRight, Gift, PartyPopper } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/api";
import BirthdayCelebration from "../components/common/BirthdayCelebration";
import TimeSyncModal from "../components/common/TimeSyncModal";
import AttendancePhotoModal from "../features/attendance/components/AttendancePhotoModal";

const BACKEND_URL = BASE_URL;

function formatTime(dt) {
  if (!dt) return "—";
  const d = new Date(dt);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatLateMinutes(minutes) {
  if (!minutes) return "0 minutes";
  if (minutes < 60) {
    return `${minutes} minutes`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }
  return `${hours} ${hours === 1 ? 'hour' : 'hours'} and ${remainingMinutes} ${remainingMinutes === 1 ? 'minute' : 'minutes'}`;
}

/**
 * Haversine formula for client-side check
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function badge(status) {
  const base =
    "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold";
  switch (status) {
    case "PRESENT":
      return (
        <span className={`${base} bg-green-50 text-green-700 border border-green-200`}>
          Present
        </span>
      );
    case "LATE":
      return (
        <span className={`${base} bg-yellow-50 text-yellow-800 border border-yellow-200`}>
          Late
        </span>
      );
    case "ABSENT":
      return (
        <span className={`${base} bg-red-50 text-red-700 border border-red-200`}>
          Absent
        </span>
      );
    case "LEAVE":
      return (
        <span className={`${base} bg-blue-50 text-blue-700 border border-blue-200`}>
          On Leave
        </span>
      );
    case "NOT_MARKED":
    default:
      return (
        <span className={`${base} bg-gray-50 text-gray-700 border border-gray-200`}>
          Not marked yet
        </span>
      );
  }
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [offices, setOffices] = useState([]);
  const [selectedOfficeId, setSelectedOfficeId] = useState("");
  const [todayData, setTodayData] = useState(null);
  const [punching, setPunching] = useState(false);
  const [error, setError] = useState("");

  // New Summary States
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [leaveStats, setLeaveStats] = useState({ myRequestsCount: 0, myApprovalsCount: 0 });
  const [attendanceSummary, setAttendanceSummary] = useState([]);
  const [missingAttendance, setMissingAttendance] = useState([]);
  const [rightTab, setRightTab] = useState("requests"); // "requests" or "approvals"
  const [dashboardData, setDashboardData] = useState(null);
  const [news, setNews] = useState([]);
  const [selectedBirthday, setSelectedBirthday] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [timeSync, setTimeSync] = useState({ show: false, drift: 0 });
  const [photoModal, setPhotoModal] = useState({ show: false, type: 'IN' });
  const [pendingPunch, setPendingPunch] = useState(null);

  const kpiRows = [
    "Working Hour",
    "Average Working Hours",
    "Min Working Hour",
    "Max Working Hour",
    "Sign In",
    "Average Sign In Time",
    "Min Sign In Time",
    "Max Sign In Time",
    "Sign Out",
    "Average Sign Out Time",
    "Min Sign Out Time",
    "Max Sign Out Time",
  ];

  const attendance = todayData?.attendance || null;
  const shift = todayData?.shift || null;
  const grace = todayData?.grace_minutes ?? 15;

  const canCheckIn = useMemo(() => {
    if (!attendance) return true;
    return !attendance.first_in;
  }, [attendance]);

  const canCheckOut = useMemo(() => {
    if (!attendance) return false;
    return !!attendance.first_in && !attendance.last_out;
  }, [attendance]);

  const statusText = useMemo(() => {
    if (!attendance) return "You have not marked your Attendance Today!";
    if (!attendance.first_in) return "You have not checked in yet today!";
    if (attendance.first_in && !attendance.last_out)
      return "You are checked in. Don’t forget to check out.";
    if (attendance.first_in && attendance.last_out)
      return "Attendance completed for today.";
    return "You have not marked your Attendance Today!";
  }, [attendance]);

  async function loadAttendance(silent = false) {
    try {
      if (!silent) setLoadingAttendance(true);
      setError("");

      const [officeList, today, balances, stats, summaryData, dbData, newsData] = await Promise.all([
        getAttendanceOffices(),
        getTodayAttendance(),
        getLeaveBalances(),
        getLeaveDashboardStats(),
        getPersonalAttendanceSummary(),
        getDashboardData(),
        listNews(),
      ]);

      setOffices(officeList);
      setTodayData(today);
      setLeaveBalances(balances);
      setLeaveStats(stats);
      setAttendanceSummary(summaryData.summary || []);
      setMissingAttendance(summaryData.missing || []);
      setDashboardData(dbData);
      const userRoles = (user?.roles || []).map(r => String(r).toLowerCase());
      if (user?.role) userRoles.push(user.role.toLowerCase());
      const isStaff = userRoles.some(r => ["admin", "super_admin", "hr", "developer"].includes(r));
      setNews((isStaff ? newsData : (newsData || []).filter(n => n.is_published)).slice(0, 3));

      // Only auto-set office selection on initial load, not during background refreshes
      // This prevents resetting user's manual selection during photo capture
      if (!silent) {
        const inOfficeId = today?.attendance?.office_id_first_in;
        if (inOfficeId) {
          setSelectedOfficeId(String(inOfficeId));
        } else if (!selectedOfficeId && officeList?.length) {
          setSelectedOfficeId(String(officeList[0].id));
        }
      }

      // --- Proactive Time Sync Check ---
      if (today?.serverTime) {
        const sTime = new Date(today.serverTime);
        const cTime = new Date();
        const driftMin = Math.abs(sTime.getTime() - cTime.getTime()) / 60000;
        if (driftMin > 5) {
          setTimeSync({ show: true, drift: Math.round(driftMin) });
        }
      }
    } catch (e) {
      console.error(e);
      setError("Failed to load dashboard data. Please refresh.");
    } finally {
      if (!silent) setLoadingAttendance(false);
    }
  }

  useEffect(() => {
    if (!user?.id) return;
    loadAttendance();

    // Real-time polling for team status (every 30 seconds)
    const interval = setInterval(() => {
      loadAttendance(true);
    }, 30000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const getCurrentPosition = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser."));
        return;
      }

      const options = { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 };

      const success = (pos) => resolve(pos.coords);
      const failure = (err) => {
        if (err.code === err.TIMEOUT && options.enableHighAccuracy) {
          // Fallback to lower accuracy if high accuracy times out
          console.warn("High accuracy timed out, falling back to standard accuracy.");
          options.enableHighAccuracy = false;
          options.timeout = 10000;
          navigator.geolocation.getCurrentPosition(success, finalFailure, options);
          return;
        }
        finalFailure(err);
      };

      const finalFailure = (err) => {
        let msg = "Location permission is required to mark attendance.";
        if (err.code === err.PERMISSION_DENIED) {
          msg = "Location permission was denied. Please enable it in your browser settings.";
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = "Location information is unavailable.";
        } else if (err.code === err.TIMEOUT) {
          msg = "Location request timed out. Please ensure your device location is on and try again.";
        }
        reject(new Error(msg));
      };

      navigator.geolocation.getCurrentPosition(success, failure, options);
    });
  };

  const handlePunch = async (type) => {
    try {
      if (!selectedOfficeId) {
        setError("Please select an office first.");
        return;
      }

      setError("");
      setPendingPunch(type);
      setPhotoModal({ show: true, type });
    } catch (e) {
      setError("An unexpected error occurred.");
    }
  };

  const onPhotoCaptured = async (photoBase64) => {
    const type = pendingPunch;
    try {
      setPunching(true);
      setError("");

      // 1. Get Location
      let coords = null;
      try {
        coords = await getCurrentPosition();
      } catch (err) {
        setError(err.message);
        return;
      }

      const { latitude, longitude } = coords;

      // 2. Client-side Geofence Check
      const office = offices.find((o) => String(o.id) === String(selectedOfficeId));
      if (office && office.latitude && office.longitude) {
        const dist = calculateDistance(
          latitude,
          longitude,
          Number(office.latitude),
          Number(office.longitude)
        );
        const radius = office.allowed_radius_meters || 200;
        if (dist > radius) {
          setError(
            `You are not within the authorized radius for ${office.name
            }. You are approximately ${Math.round(dist)}m away.`
          );
          return;
        }
      }

      const res = await punchAttendance({
        office_id: Number(selectedOfficeId),
        punch_type: type,
        clientTime: new Date().toISOString(),
        latitude,
        longitude,
        photo: photoBase64, // Send Captured Photo
      });

      setTodayData((prev) => ({
        ...(prev || {}),
        date: res.date,
        shift: res.shift,
        grace_minutes: res.grace_minutes,
        attendance: res.attendance,
      }));
      setPendingPunch(null);
    } catch (e) {
      if (e?.response?.status === 403) {
        const data = e.response.data;
        if (data.drift !== undefined) {
          setTimeSync({ show: true, drift: Math.round(data.drift) });
          setError(`SECURITY VIOLATION: Your device time is out of sync.`);
        } else {
          setError(data.message || "Attendance blocked.");
        }
      } else {
        const msg = e?.response?.data?.message || "Failed to mark attendance.";
        setError(msg);
      }
    } finally {
      setPunching(false);
    }
  };

  // ✅ Unified Helper for profile images
  const getAvatarUrl = (imgPath) => {
    if (!imgPath) return null;
    if (imgPath.startsWith("http")) return imgPath;
    const cleanPath = imgPath.startsWith("/") ? imgPath : `/${imgPath}`;
    return `${BACKEND_URL}${cleanPath}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
      {/* LEFT COLUMN */}
      <section className="lg:col-span-3 space-y-3 sm:space-y-4">
        {/* Profile Card */}
        <div className="bg-white dark:bg-slate-900/40 rounded-xl shadow border dark:border-slate-800 overflow-hidden">
          <div className="p-3 sm:p-4 flex items-center gap-3">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gray-200 border overflow-hidden flex-shrink-0">
              {(() => {
                const imgPath = dashboardData?.profile?.profile_img || user?.profile_img || user?.profile_picture;
                const src = getAvatarUrl(imgPath);
                if (src) {
                  return (
                    <img
                      src={src}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  );
                }
                return (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                );
              })()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-800 truncate">
                {dashboardData?.profile?.name || user?.Employee_Name || user?.name || "—"}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {dashboardData?.profile?.email || user?.Official_Email || user?.email || "—"}
              </div>
              <div className="text-[11px] text-customRed font-semibold truncate mt-0.5">
                {dashboardData?.profile?.Department || user?.Department || "—"}
              </div>
            </div>
          </div>
          {/* Self Birthday or Selected Colleague Birthday */}
          {(dashboardData?.widgets?.birthdayToday || selectedBirthday) && (
            <div className="px-3 pb-3 relative animate-fade-in">
              <BirthdayCelebration
                isBirthday={true}
                name={selectedBirthday ? selectedBirthday.name : (dashboardData?.profile?.name || user?.Employee_Name || user?.name)}
                isSelf={!selectedBirthday && dashboardData?.widgets?.birthdayToday}
              />
              {selectedBirthday && (
                <button
                  onClick={() => {
                    setSelectedBirthday(null);
                    setShowConfetti(false);
                  }}
                  className="w-full mt-1 text-[10px] text-gray-400 hover:text-customRed uppercase font-black tracking-widest transition-colors"
                >
                  ✕ Close Celebration
                </button>
              )}
            </div>
          )}

          <div className="border-t">
            <div className="flex text-[11px] sm:text-xs text-center">
              {!dashboardData?.widgets?.birthdayToday && (
                <div className="flex-1 relative group">
                  <button className={`w-full py-2 hover:bg-gray-50 flex items-center justify-center gap-1 ${dashboardData?.widgets?.colleaguesBirthdays?.length > 0 ? 'text-customRed font-bold' : 'text-gray-500'}`}>
                    <Gift size={12} className={dashboardData?.widgets?.colleaguesBirthdays?.length > 0 ? "animate-bounce" : ""} />
                    <span>{dashboardData?.widgets?.colleaguesBirthdays?.length || 0} Birthday Today</span>
                  </button>

                  {/* Dropdown helper */}
                  {dashboardData?.widgets?.colleaguesBirthdays?.length > 0 && (
                    <div className="absolute bottom-full left-0 w-48 bg-white border shadow-xl rounded-lg hidden group-hover:block z-50 animate-fade-in mb-1 overflow-hidden">
                      <div className="px-3 py-1.5 bg-gray-50 border-b text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Who is celebrating?
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {dashboardData.widgets.colleaguesBirthdays.map((b, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedBirthday(b)}
                            className="w-full px-3 py-2 text-left text-[11px] hover:bg-red-50 hover:text-customRed transition-colors border-b last:border-0 flex items-center gap-2"
                          >
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-400 to-customRed text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                              {b.name.charAt(0)}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold truncate">{b.name}</span>
                              <span className="text-[9px] text-gray-400 truncate">{b.department || "No Department"}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <button className="flex-1 py-2 border-l hover:bg-gray-50 text-gray-500">
                New Message
              </button>
            </div>
          </div>
        </div>

        {/* Attendance card (UPDATED) */}
        <div className="bg-white dark:bg-slate-900/40 rounded-xl shadow border dark:border-slate-800 overflow-hidden">
          <div className="px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between">
            <div className="text-[12px] sm:text-[13px] font-semibold text-gray-700">
              ATTENDANCE (TODAY)
            </div>
            {badge(attendance?.status || "NOT_MARKED")}
          </div>

          <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-3">
            {/* Shift row */}
            <div className="rounded-lg border bg-gray-50 p-2.5 sm:p-3 text-[12px] sm:text-[13px] text-gray-700">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Shift</span>
                <span className="text-gray-600">{shift?.name || "—"}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="font-semibold">Timing</span>
                <span className="text-gray-600">
                  {shift?.start_time || "—"} - {shift?.end_time || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="font-semibold">Grace</span>
                <span className="text-gray-600">{grace} min</span>
              </div>
            </div>

            {/* Status message */}
            <div className="rounded-lg border border-red-200 bg-red-50 text-red-600 p-2.5 sm:p-3 text-[12px] sm:text-[13px]">
              {loadingAttendance ? "Loading attendance..." : statusText}
              {attendance?.status === "LATE" && (
                <div className="mt-1 text-[12px] text-red-700">
                  Late by {formatLateMinutes(attendance?.late_minutes)}
                </div>
              )}
            </div>

            {/* Office select */}
            <div>
              <label className="text-[12px] text-gray-600 font-semibold">
                Office
              </label>
              <select
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-200"
                value={selectedOfficeId}
                onChange={(e) => setSelectedOfficeId(e.target.value)}
                disabled={loadingAttendance || punching}
              >
                {offices.map((o) => (
                  <option key={o.id} value={String(o.id)}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Punch buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handlePunch("IN")}
                disabled={loadingAttendance || punching || !canCheckIn}
                className={`${loadingAttendance || punching || !canCheckIn
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                  : "btn-primary !bg-emerald-600 !hover:bg-emerald-700 !shadow-emerald-600/20"
                  } w-full`}
              >
                {punching ? "..." : "Check In"}
              </button>

              <button
                onClick={() => handlePunch("OUT")}
                disabled={loadingAttendance || punching || !canCheckOut}
                className={`${loadingAttendance || punching || !canCheckOut
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                  : "btn-outline !text-rose-600 !hover:bg-rose-50 !shadow-rose-600/20"
                  } w-full shadow-lg`}
              >
                {punching ? "..." : "Check Out"}
              </button>
            </div>

            {/* Today summary */}
            <div className="rounded-lg border p-2.5 sm:p-3 text-[12px] sm:text-[13px] text-gray-700">
              <div className="flex items-center justify-between">
                <span className="font-semibold">In</span>
                <span>{formatTime(attendance?.first_in)}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="font-semibold">Out</span>
                <span>{formatTime(attendance?.last_out)}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="font-semibold">Worked</span>
                <span>
                  {attendance?.worked_minutes
                    ? `${Math.floor(attendance.worked_minutes / 60)}h ${attendance.worked_minutes % 60
                    }m`
                    : "—"}
                </span>
              </div>
            </div>

            {error && (
              <div className="text-xs text-red-600 border border-red-200 bg-red-50 rounded-lg p-2">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Leave Summary (unchanged) */}
        <div className="bg-white dark:bg-slate-900/40 rounded-xl shadow border dark:border-slate-800 overflow-hidden">
          <div className="px-3 sm:px-4 py-2.5 sm:py-3 text-[12px] sm:text-[13px] font-semibold text-gray-700">
            LEAVE SUMMARY
          </div>
          <div className="px-3 sm:px-4 pb-3 sm:pb-4 max-h-[250px] overflow-y-auto custom-scrollbar">
            <div className="text-[10px] sm:text-[11px] uppercase text-gray-500 mb-2">
              Title
            </div>
            {leaveBalances.length === 0 && (
              <div className="text-xs text-gray-400 py-4 text-center">No leave balances found</div>
            )}
            {leaveBalances.map((r) => (
              <div
                key={r.leave_type_name}
                className="flex items-center justify-between py-2 border-t first:border-t-0"
              >
                <span className="text-[13px] text-gray-700">{r.leave_type_name}</span>
                <span className="px-2 py-1 rounded bg-gray-100 text-[11px] sm:text-[12px]">
                  {r.balance}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CENTER COLUMN (we will connect HR widget next) */}
      <section className="lg:col-span-6 space-y-3 sm:space-y-4">
        <div className="bg-white dark:bg-slate-900/40 rounded-xl shadow border dark:border-slate-800 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
            <div className="p-0">
              <div className="flex items-center justify-between bg-gray-100 px-3 sm:px-4 py-2">
                <div className="text-[11px] sm:text-[12px] uppercase font-semibold text-gray-600">
                  Missing Attendance
                </div>
              </div>
              <div className="p-0 sm:p-2.5 md:p-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                {/* FIX: Removed table-scroll class effectively to avoid negative margin issues on p-0 container */}
                <div className="w-full overflow-x-auto border-0 sm:border dark:border-slate-800 rounded-none sm:rounded-lg scrollbar-hide">
                  <table style={{ minWidth: '600px' }} className="w-full text-[10px] sm:text-[12px] table-auto">
                    <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-600 dark:text-slate-400">
                      <tr>
                        <th className="p-1.5 sm:p-2 text-left bg-gray-50/50 dark:bg-transparent">Date</th>
                        <th className="p-1.5 sm:p-2 text-left bg-gray-50/50 dark:bg-transparent">In</th>
                        <th className="p-1.5 sm:p-2 text-left bg-gray-50/50 dark:bg-transparent">Out</th>
                        <th className="p-1.5 sm:p-2 text-left bg-gray-50/50 dark:bg-transparent">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {missingAttendance.length === 0 ? (
                        <tr className="border-t">
                          <td colSpan="4" className="p-4 sm:p-6 text-center text-gray-400 text-xs sm:text-sm italic bg-gray-50/20">
                            No missing attendance found
                          </td>
                        </tr>
                      ) : (
                        missingAttendance.map((m, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="p-1.5 sm:p-2">{new Date(m.date).toLocaleDateString()}</td>
                            <td className="p-1.5 sm:p-2">{m.in ? formatTime(m.in) : "—"}</td>
                            <td className="p-1.5 sm:p-2">{m.out ? formatTime(m.out) : "—"}</td>
                            <td className="p-1.5 sm:p-2">{badge(m.status)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-0">
              <div className="flex items-center justify-between bg-gray-100 px-3 sm:px-4 py-2">
                <div className="text-[11px] sm:text-[12px] uppercase font-semibold text-gray-600">
                  Attendance Summary
                </div>
              </div>
              <div className="p-0 sm:p-2.5 md:p-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                <div className="w-full overflow-x-auto border-0 sm:border dark:border-slate-800 rounded-none sm:rounded-lg scrollbar-hide">
                  <table style={{ minWidth: '350px' }} className="w-full text-[10px] sm:text-[12px] table-auto">
                    <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-600 dark:text-slate-400">
                      <tr>
                        <th className="p-2 text-left">Title</th>
                        <th className="p-2 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceSummary.length === 0 ? (
                        <tr className="border-t">
                          <td colSpan="2" className="p-4 sm:p-6 text-center text-gray-400 text-xs sm:text-sm italic bg-gray-50/20">
                            No data for current month
                          </td>
                        </tr>
                      ) : (
                        attendanceSummary.map((r) => (
                          <tr key={r.status} className="border-t">
                            <td className="p-1.5 sm:p-2">{r.status}</td>
                            <td className="p-1.5 sm:p-2 text-right">
                              <span className="px-1.5 sm:px-2 py-0.5 rounded bg-gray-100">
                                {r.count}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Employee KPI */}
        <div className="bg-white dark:bg-slate-900/40 rounded-xl shadow border dark:border-slate-800 overflow-hidden">
          <div className="flex items-center justify-between bg-gray-100 px-3 sm:px-4 py-2">
            <div className="text-[11px] sm:text-[12px] uppercase font-semibold text-gray-600">
              Employee KPI
            </div>
            <div className="text-[11px] sm:text-[12px] text-gray-500">—</div>
          </div>
          <div className="p-2.5 sm:p-3">
            <div className="table-scroll border dark:border-slate-800 rounded">
              <table className="min-w-[320px] w-full text-[11px] sm:text-[12px]">
                <thead className="bg-gray-50 dark:bg-slate-800/50 text-gray-600 dark:text-slate-400">
                  <tr>
                    <th className="p-2 text-left">Description</th>
                    <th className="p-2 text-left">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {kpiRows.map((row) => (
                    <tr key={row} className="border-t">
                      <td className="p-2 sm:p-2">{row}</td>
                      <td className="p-2 sm:p-2">
                        <span className="inline-block h-2.5 sm:h-3 w-16 sm:w-28 bg-gray-100 rounded" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* RIGHT COLUMN (unchanged) */}
      <section className="lg:col-span-3 space-y-3 sm:space-y-4">
        <div className="bg-white dark:bg-slate-900/40 rounded-xl shadow border dark:border-slate-800 overflow-hidden">
          <div className="px-3 sm:px-4 pt-2 border-b">
            <nav className="flex text-[11px] sm:text-[12px]">
              <button className="px-3 py-2 font-semibold text-customRed border-b-2 border-customRed">
                My Team
              </button>
              <button className="px-3 py-2 text-gray-600">My Managers</button>
            </nav>
          </div>
          <div className="p-3 sm:p-4 space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar">
            {(() => {
              const teamMembers = dashboardData?.widgets?.team ||
                dashboardData?.widgets?.teamRecent ||
                dashboardData?.widgets?.recentEmployees ||
                [];

              if (teamMembers.length === 0) {
                return <p className="text-xs text-gray-500">No team data yet.</p>;
              }

              return (
                <>
                  {teamMembers.map((m) => (
                    <div key={m.id} className="flex items-center justify-between group">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-gray-100 border overflow-hidden flex-shrink-0">
                          {(() => {
                            const src = getAvatarUrl(m.profile_img);
                            if (src) {
                              return (
                                <img
                                  src={src}
                                  alt={m.name}
                                  className="w-full h-full object-cover"
                                />
                              );
                            }
                            return (
                              <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-400">
                                {m.name?.charAt(0).toUpperCase()}
                              </div>
                            );
                          })()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <div className="text-[12px] font-semibold text-gray-700 truncate group-hover:text-customRed transition-colors">
                              {m.name}
                            </div>
                            {m.is_birthday_today && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedBirthday(m);
                                  setShowConfetti(true);
                                  // Auto-hide confetti after 5 seconds but keep the card
                                  setTimeout(() => setShowConfetti(false), 5000);
                                }}
                                className="flex items-center gap-1 hover:scale-110 transition-transform bg-red-50 px-2 py-0.5 rounded-full border border-red-100 shadow-sm group/btn"
                              >
                                <span className="animate-bounce group-hover/btn:rotate-12">🎂</span>
                                <span className="text-[10px] font-black text-customRed uppercase tracking-tighter animate-pulse flex items-center gap-1">
                                  Celebrate! <PartyPopper size={10} className="text-orange-500" />
                                </span>
                              </button>
                            )}
                          </div>
                          <div className="text-[10px] text-gray-500 truncate">
                            {m.designation || "Employee"}
                          </div>
                        </div>
                      </div>
                      {badge(m.attendance_status || "NOT_MARKED")}
                    </div>
                  ))}
                </>
              );
            })()}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/40 rounded-xl shadow border dark:border-slate-800 overflow-hidden">
          <div className="px-3 sm:px-4 pt-2 border-b">
            <nav className="flex text-[11px] sm:text-[12px]">
              <button
                onClick={() => setRightTab("requests")}
                className={`px-3 py-2 font-semibold ${rightTab === "requests" ? "text-customRed border-b-2 border-customRed" : "text-gray-500"}`}
              >
                My Requests
              </button>
              <button
                onClick={() => setRightTab("approvals")}
                className={`px-3 py-2 font-semibold ${rightTab === "approvals" ? "text-customRed border-b-2 border-customRed" : "text-gray-500"}`}
              >
                My Approvals
              </button>
            </nav>
          </div>
          <div className="p-3 sm:p-4 space-y-2 text-[13px] text-gray-700 max-h-[150px] overflow-y-auto custom-scrollbar">
            {rightTab === "requests" ? (
              <div className="flex items-center justify-between">
                <span>Pending Leave Applications</span>
                <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-800 font-bold">
                  {leaveStats.myRequestsCount}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span>Leaves Pending Approval</span>
                <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-800 font-bold">
                  {leaveStats.myApprovalsCount}
                </span>
              </div>
            )}
            {((rightTab === "requests" && leaveStats.myRequestsCount === 0) ||
              (rightTab === "approvals" && leaveStats.myApprovalsCount === 0)) && (
                <p className="text-xs text-gray-400 pt-2 text-center">No pending items</p>
              )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/40 rounded-xl shadow border dark:border-slate-800 overflow-hidden">
          <div className="px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between border-b">
            <div className="text-[12px] sm:text-[13px] font-semibold text-gray-700 flex items-center gap-2">
              <Megaphone size={16} className="text-customRed" />
              NEWS
            </div>
            <button
              onClick={() => navigate("/dashboard/news")}
              className="text-[10px] text-customRed font-bold hover:underline flex items-center shrink-0"
            >
              VIEW ALL <ChevronRight size={12} />
            </button>
          </div>
          <div className="divide-y max-h-[300px] overflow-y-auto custom-scrollbar">
            {news.length === 0 ? (
              <div className="px-3 sm:px-4 py-6 text-center">
                <p className="text-xs text-gray-400">No recent announcements</p>
              </div>
            ) : (
              news.map((item) => (
                <div key={item.id} className="p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer" onClick={() => navigate("/dashboard/news")}>
                  <div className="text-[13px] font-bold text-gray-800 line-clamp-1 mb-1">
                    {item.title}
                  </div>
                  <div className="text-[11px] text-gray-500 line-clamp-2 mb-2 leading-relaxed">
                    {item.content}
                  </div>
                  <div className="text-[10px] text-gray-400 flex items-center justify-between uppercase tracking-tighter font-semibold">
                    <span>{item.author_name}</span>
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
      {/* Dramatic Confetti Overlay */}
      {showConfetti && (
        <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px] animate-pulse" />
          {[...Array(60)].map((_, i) => (
            <div
              key={i}
              className="absolute top-[-20px] animate-confetti-fall"
              style={{
                left: `${Math.random() * 100}%`,
                width: `${Math.random() * 10 + 5}px`,
                height: `${Math.random() * 15 + 5}px`,
                backgroundColor: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'][Math.floor(Math.random() * 6)],
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
                transform: `rotate(${Math.random() * 360}deg)`,
                opacity: 0.8
              }}
            />
          ))}
          <div className="relative z-10 text-center animate-bounce-slow">
            <h2 className="text-4xl md:text-6xl font-black text-customRed drop-shadow-2xl uppercase tracking-tighter">
              Happy Birthday! 🎈
            </h2>
            <div className="text-2xl mt-4 bg-white/80 backdrop-blur rounded-full px-6 py-2 border shadow-xl inline-block font-bold">
              {selectedBirthday?.name} 🎉
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes confetti-fall {
            0% { transform: translateY(0) rotate(0); opacity: 1; }
            100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti-fall {
            animation: confetti-fall linear infinite;
        }
        .animate-bounce-slow {
            animation: bounce 2s infinite;
        }
      `}</style>
      {/* Time Sync Warning Modal */}
      <TimeSyncModal
        show={timeSync.show}
        drift={timeSync.drift}
        onClose={() => setTimeSync({ ...timeSync, show: false })}
      />

      <AttendancePhotoModal
        isOpen={photoModal.show}
        punchType={photoModal.type}
        onClose={() => {
          setPhotoModal({ ...photoModal, show: false });
          setPendingPunch(null);
        }}
        onCapture={onPhotoCaptured}
      />
    </div>
  );
}
