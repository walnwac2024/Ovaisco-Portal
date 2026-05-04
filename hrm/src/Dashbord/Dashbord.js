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
import * as Lucide from "lucide-react";

import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/api";
import TimeSyncModal from "../components/common/TimeSyncModal";
import FaceRecognitionModal from "../features/attendance/components/FaceRecognitionModal";
import MainLoader from "../components/common/MainLoader";

const BACKEND_URL = BASE_URL;

// Safe icon renderer to prevent "Element type is invalid" if an icon is missing
const Icon = ({ name, ...props }) => {
  const LucideIcon = Lucide[name];
  if (!LucideIcon) return null;
  return <LucideIcon {...props} />;
};

function formatTime(dt) {
  if (!dt) return "\u2014";
  const d = new Date(dt);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatLateMinutes(minutes) {
  if (!minutes) return "0 minutes";
  if (minutes < 60) return `${minutes} minutes`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  return `${hours} ${hours === 1 ? 'hour' : 'hours'} and ${remainingMinutes} ${remainingMinutes === 1 ? 'minute' : 'minutes'}`;
}

const getCurrentPosition = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos.coords),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
};

function badge(status) {
  const base = "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight transition-all duration-300 border shadow-sm";
  switch (status) {
    case "PRESENT":
      return <span className={`${base} bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-100/30`}>Present</span>;
    case "LATE":
      return <span className={`${base} bg-orange-50 text-orange-600 border-orange-100 shadow-orange-100/30`}>Late</span>;
    case "ABSENT":
      return <span className={`${base} bg-rose-50 text-rose-600 border-rose-100 shadow-rose-100/30`}>Absent</span>;
    case "LEAVE":
      return <span className={`${base} bg-indigo-50 text-indigo-600 border-indigo-100 shadow-indigo-100/30`}>On Leave</span>;
    default:
      return <span className={`${base} bg-slate-50 text-slate-400 border-slate-200 shadow-slate-100/30`}>Not marked</span>;
  }
}

const EmptyState = ({ icon, title, message }) => (
  <div className="flex flex-col items-center justify-center p-6 text-center bg-slate-50/40 rounded-2xl border border-dashed border-slate-200">
    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-300 shadow-sm mb-3 border border-slate-100">
      <Icon name={icon} size={20} />
    </div>
    <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-tight mb-1">{title}</h5>
    <p className="text-[10px] text-slate-400 font-medium tracking-tight uppercase">{message}</p>
  </div>
);

function DashboardHome() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [offices, setOffices] = useState([]);
  const [selectedOfficeId, setSelectedOfficeId] = useState("");
  const [todayData, setTodayData] = useState(null);
  const [punching, setPunching] = useState(false);
  const [error, setError] = useState("");

  const [leaveBalances, setLeaveBalances] = useState([]);
  const [leaveStats, setLeaveStats] = useState({ myRequestsCount: 0, myApprovalsCount: 0 });
  const [attendanceSummary, setAttendanceSummary] = useState([]);
  const [missingAttendance, setMissingAttendance] = useState([]);
  const [rightTab, setRightTab] = useState("requests");
  const [teamTab, setTeamTab] = useState("team");
  const [dashboardData, setDashboardData] = useState(null);
  const [news, setNews] = useState([]);
  const [timeSync, setTimeSync] = useState({ show: false, drift: 0 });
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [pendingPunchType, setPendingPunchType] = useState('IN');
  const [showPunchOptions, setShowPunchOptions] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ show: false, title: "", message: "", onConfirm: null });
  const [notifyModal, setNotifyModal] = useState({ show: false, type: "success", message: "" });

  const attendance = todayData?.attendance || null;
  const shift = todayData?.shift || null;
  const grace = todayData?.grace_minutes ?? 15;

  const canCheckIn = useMemo(() => !attendance, [attendance]);
  const canCheckOut = useMemo(() => attendance && !attendance.check_out, [attendance]);

  const statusText = useMemo(() => {
    if (!attendance) return "You have not marked your attendance today.";
    
    const source = attendance.source_in === 'BIOMETRIC' ? ' via Biometric' : '';
    if (attendance.status === "LATE") {
      return `Late by ${formatLateMinutes(attendance.late_minutes)}${source}.`;
    }
    return attendance.status === "PRESENT" ? `You are marked Present${source}.` : `Status: ${attendance.status}${source}`;
  }, [attendance]);

  const loadAttendance = async (silent = false) => {
    if (!silent) setLoadingAttendance(true);
    try {
      const [offList, tData, bal, lStats, personalSumm, summData, newsList] = await Promise.all([
        getAttendanceOffices(),
        getTodayAttendance(),
        getLeaveBalances(),
        getLeaveDashboardStats(),
        getPersonalAttendanceSummary(),
        getDashboardData(),
        listNews(1)
      ]);
      setOffices(offList);
      setTodayData(tData);
      setLeaveBalances(bal);
      setLeaveStats(lStats);
      setAttendanceSummary(personalSumm?.summary || []);
      setMissingAttendance(personalSumm?.missing || []);
      setDashboardData(summData);
      setNews(newsList?.data || []);
      if (offList.length > 0 && !selectedOfficeId) setSelectedOfficeId(offList[0].id);
    } catch (err) {
      console.error("Dashboard load failed", err);
    } finally {
      setLoadingAttendance(false);
    }
  };

  useEffect(() => { loadAttendance(); }, []);

  const handlePunch = async (type) => {
    if (!selectedOfficeId) { 
      setNotifyModal({ show: true, type: "error", message: "Please select an office location first." });
      return; 
    }
    setPendingPunchType(type);
    setShowPunchOptions(true); // Both IN and OUT now show options
  };

  const handleBiometricPunch = async () => {
    setShowPunchOptions(false);
    try {
      setPunching(true);
      setError("");
      const { authenticateBiometric } = await import("../features/attendance/services/biometricService");
      
      let authRes;
      try {
        authRes = await authenticateBiometric();
      } catch (err) {
        if (err?.response?.data?.message?.includes("No biometric device registered") || err.message?.includes("No biometric device registered")) {
          setConfirmModal({
            show: true,
            title: "Device Not Linked",
            message: "This device is not linked to your account. Would you like to link it now for biometric attendance?",
            onConfirm: async () => {
              setConfirmModal(prev => ({ ...prev, show: false }));
              const regRes = await handleRegisterBiometricInternal();
              if (regRes && regRes.verified) {
                  const retryAuth = await authenticateBiometric();
                  if (retryAuth && retryAuth.verified) {
                      await finishBiometricPunch();
                  }
              }
            }
          });
          setPunching(false);
          return;
        } else {
          throw err;
        }
      }
      
      if (authRes && authRes.verified) {
        await finishBiometricPunch();
      }
    } catch (err) {
      console.error("Biometric Punch Error:", err);
      let msg = err?.response?.data?.message || err.message || "Biometric failed";
      setNotifyModal({ show: true, type: "error", message: msg });
    } finally {
      setPunching(false);
    }
  };

  const finishBiometricPunch = async () => {
    const coords = await getCurrentPosition();
    const res = await punchAttendance({
      office_id: Number(selectedOfficeId),
      punch_type: pendingPunchType,
      clientTime: new Date().toISOString(),
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
      biometric_verified: true
    });
    setTodayData(prev => ({ ...prev, attendance: res.attendance }));
    loadAttendance(true);
    setNotifyModal({ show: true, type: "success", message: "Attendance marked successfully via Biometrics!" });
  };

  const handleRegisterBiometricInternal = async () => {
    if (!window.isSecureContext) {
      setNotifyModal({ show: true, type: "error", message: "Biometric registration requires a 'Secure Context' (HTTPS/localhost)." });
      return null;
    }
    try {
      const { registerBiometric } = await import("../features/attendance/services/biometricService");
      const res = await registerBiometric(`${user?.Employee_Name || 'My'} Device`);
      if (res.verified) {
        setNotifyModal({ show: true, type: "success", message: "Device linked successfully! You can now use Biometric Punch." });
      }
      return res;
    } catch (err) {
      console.error("Registration error:", err);
      setNotifyModal({ show: true, type: "error", message: err?.response?.data?.message || err.message || "Registration failed" });
      return null;
    }
  };

  const handleFaceCaptured = async (faceDescriptor) => {
    setShowFaceModal(false);
    setPunching(true);
    setError("");
    try {
      const coords = await getCurrentPosition();
      const res = await punchAttendance({
        office_id: Number(selectedOfficeId),
        punch_type: pendingPunchType,
        clientTime: new Date().toISOString(),
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        face_descriptor: Array.from(faceDescriptor)
      });
      setTodayData(prev => ({ ...prev, attendance: res.attendance }));
      loadAttendance(true);
      setNotifyModal({ show: true, type: "success", message: "Attendance marked successfully via Face Recognition!" });
    } catch (err) {
      setNotifyModal({ show: true, type: "error", message: err?.response?.data?.message || "Face recognition failed. Please try again." });
    } finally {
      setPunching(false);
    }
  };

  const getAvatarUrl = (imgPath) => {
    if (!imgPath) return null;
    if (imgPath.startsWith("http")) return imgPath;
    const cleanPath = imgPath.startsWith("/") ? imgPath : `/${imgPath}`;
    return `${BACKEND_URL}${cleanPath}`;
  };

  if (loadingAttendance) {
    return <MainLoader message="Syncing Dashboard..." />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8">
      <FaceRecognitionModal
        isOpen={showFaceModal}
        onClose={() => setShowFaceModal(false)}
        onCapture={handleFaceCaptured}
        employeeName={dashboardData?.profile?.name || user?.Employee_Name || user?.name}
      />

      {/* Check-In Options Overlay */}
      {showPunchOptions && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
            <div className="p-8 text-center border-b border-slate-50 relative">
              <button 
                onClick={() => setShowPunchOptions(false)}
                className="absolute top-6 right-6 p-2 text-slate-300 hover:text-customRed transition-colors rounded-xl hover:bg-red-50"
              >
                <Icon name="X" size={20} />
              </button>
              <div className={`w-16 h-16 ${pendingPunchType === 'IN' ? 'bg-red-50 text-customRed' : 'bg-slate-900 text-white'} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm`}>
                <Icon name={pendingPunchType === 'IN' ? "LogIn" : "LogOut"} size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Identity Verification</h3>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">Confirm {pendingPunchType === 'IN' ? 'Check In' : 'Check Out'}</p>
            </div>
            <div className="p-8 grid gap-4">
              <button
                onClick={handleBiometricPunch}
                className="flex items-center gap-5 p-6 rounded-[2rem] border-2 border-emerald-50 bg-emerald-50/30 hover:border-emerald-200/50 hover:bg-emerald-50/60 transition-all group shadow-sm hover:shadow-md active:scale-[0.98]"
              >
                <div className="p-4 bg-white rounded-2xl shadow-sm border border-emerald-100 text-emerald-500 group-hover:scale-110 transition-transform">
                  <Icon name="Fingerprint" size={32} />
                </div>
                <div className="text-left">
                  <div className="text-[14px] font-black text-slate-800 uppercase tracking-tight">Verify & Punch</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Beautiful Confirm Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mx-auto mb-5 shadow-sm">
                <Icon name="AlertTriangle" size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">{confirmModal.title}</h3>
              <p className="text-[12px] text-slate-500 font-medium leading-relaxed">{confirmModal.message}</p>
            </div>
            <div className="p-6 bg-slate-50/50 grid grid-cols-2 gap-3">
              <button 
                onClick={() => setConfirmModal({ ...confirmModal, show: false })}
                className="py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all active:scale-95"
              >
                Cancel
              </button>
              <button 
                onClick={confirmModal.onConfirm}
                className="py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest bg-slate-900 text-white shadow-lg shadow-slate-900/20 hover:bg-black transition-all active:scale-95"
              >
                Yes, Link It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Beautiful Notification Modal */}
      {notifyModal.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
            <div className="p-8 text-center">
              <div className={`w-16 h-16 ${notifyModal.type === 'success' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'} rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm`}>
                <Icon name={notifyModal.type === 'success' ? "CheckCircle2" : "XCircle"} size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">{notifyModal.type === 'success' ? 'Success!' : 'Oops!'}</h3>
              <p className="text-[12px] text-slate-500 font-medium leading-relaxed">{notifyModal.message}</p>
            </div>
            <div className="p-6">
              <button 
                onClick={() => setNotifyModal({ ...notifyModal, show: false })}
                className={`w-full py-4 rounded-xl text-[11px] font-black uppercase tracking-widest text-white transition-all active:scale-95 shadow-lg ${notifyModal.type === 'success' ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-rose-500 shadow-rose-500/20'}`}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      <TimeSyncModal
        show={timeSync.show}
        drift={timeSync.drift}
        onClose={() => setTimeSync({ ...timeSync, show: false })}
      />

      {/* LEFT COLUMN */}
      <section className="lg:col-span-3 space-y-6 lg:space-y-8">
        {/* Profile Card */}
        <div className="glass-card rounded-2xl lg:rounded-[2.5rem] shadow-premium p-5 lg:p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-red-500/10 transition-colors" />
          <div className="p-6 md:p-8 flex flex-col items-center text-center relative z-10">
            <div className="relative mb-5">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-slate-50 border-4 border-white shadow-lg overflow-hidden flex-shrink-0 transition-transform duration-500 group-hover:scale-105">
                {(() => {
                  const src = getAvatarUrl(dashboardData?.profile?.profile_img || user?.profile_img);
                  if (src) return <img src={src} alt="Profile" className="w-full h-full object-cover" />;
                  return <div className="w-full h-full flex items-center justify-center text-slate-200 bg-slate-50"><Icon name="User" size={40} /></div>;
                })()}
              </div>
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center shadow-sm" title="Online">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              </div>
            </div>
            
            <div className="min-w-0 w-full">
              <h2 className="text-lg font-black text-slate-800 truncate uppercase tracking-tight leading-tight mb-1">
                {dashboardData?.profile?.name || user?.Employee_Name || "User Name"}
              </h2>
              <p className="text-[12px] text-slate-400 truncate mb-4 font-medium">{dashboardData?.profile?.email || user?.Official_Email}</p>
              
              <div className="flex flex-col gap-2 items-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-[10px] text-customRed font-black rounded-full uppercase tracking-wider border border-red-100/50">
                  <Icon name="Briefcase" size={10} /> {dashboardData?.profile?.Department || user?.Department || "DEPT"}
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-100/50 flex divide-x divide-slate-100/50 text-[10px] md:text-[11px] font-bold uppercase text-slate-400">
            <button className="flex-1 py-4 hover:bg-slate-50/50 hover:text-customRed transition-all flex items-center justify-center gap-2">
              <Icon name="Cake" size={14} className="opacity-60" /> <span className="hidden sm:inline">0 Today</span><span className="sm:hidden">0 Bday</span>
            </button>
            <button className="flex-1 py-4 hover:bg-slate-50/50 hover:text-indigo-600 transition-all flex items-center justify-center gap-2">
              <Icon name="Mail" size={14} className="opacity-60" /> <span className="hidden sm:inline">Messages</span><span className="sm:hidden">Inbox</span>
            </button>
          </div>
        </div>

        {/* Attendance Card */}
        <div className="glass-card rounded-[2rem] shadow-premium p-6 md:p-8 card-hover overflow-hidden relative transition-all duration-500">
          <div className="absolute top-0 left-0 w-24 h-24 bg-emerald-500/5 rounded-full -ml-12 -mt-12 blur-2xl" />
          
          <div className="flex items-center justify-between mb-8 relative z-10">
            <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.15em]">Today's Shift</h3>
            <div className="flex items-center gap-2">
              {(attendance?.source_in === 'BIOMETRIC' || attendance?.source_out === 'BIOMETRIC') && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase tracking-tighter border border-indigo-100 shadow-sm animate-pulse">
                  <Lucide.Fingerprint size={10} /> Biometric
                </span>
              )}
              {badge(attendance?.status || "NOT_MARKED")}
            </div>
          </div>

          <div className="space-y-6 relative z-10">
            <div className="grid grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase tracking-wider opacity-60">
                   <Icon name="Clock" size={12} /> Shift
                </div>
                <div className="text-slate-800 font-black text-[12px] md:text-[13px]">{shift?.name || "RAMADAN"}</div>
              </div>
              <div className="space-y-1 text-right">
                <div className="flex items-center justify-end gap-1.5 text-slate-400 text-[10px] font-black uppercase tracking-wider opacity-60">
                   <Icon name="Timer" size={12} /> Timing
                </div>
                <div className="text-slate-800 font-black text-[12px] md:text-[13px] tracking-tight">
                  {shift ? `${shift.start_time?.slice(0, 5)} - ${shift.end_time?.slice(0, 5)}` : "10:30 - 19:00"}
                </div>
              </div>
            </div>

            {(() => {
              const isLate = attendance?.status === "LATE";
              const isAbsent = attendance?.status === "ABSENT";
              const hasNoAttendance = !attendance;
              const useRed = hasNoAttendance || isLate || isAbsent;

              return (
                <div className={`rounded-2xl p-4 border transition-all duration-500 ${useRed ? 'bg-rose-50 border-rose-100/50 shadow-sm shadow-rose-100/20' : 'bg-emerald-50 border-emerald-100/50 shadow-sm shadow-emerald-100/20'}`}>
                  <div className={`flex items-start gap-3 text-[11px] font-bold uppercase leading-tight tracking-tight ${useRed ? 'text-rose-600' : 'text-emerald-600'}`}>
                    <div className="p-1.5 bg-white/60 rounded-lg">
                      <Icon name={useRed ? "AlertCircle" : "CheckCircle2"} size={14} className="shrink-0" />
                    </div>
                    <p className="mt-1">{statusText}</p>
                  </div>
                </div>
              );
            })()}

            <div className="space-y-4 pt-2">
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1.5 bg-white rounded-lg shadow-sm border border-slate-100 text-customRed group-focus-within:scale-110 transition-transform">
                  <Icon name="MapPin" size={14} />
                </div>
                <select
                  value={selectedOfficeId}
                  onChange={(e) => setSelectedOfficeId(e.target.value)}
                  disabled={!canCheckIn && !canCheckOut}
                  className="w-full pl-12 pr-10 py-3.5 text-[11px] font-black uppercase tracking-wider border border-slate-200/60 rounded-[1.25rem] bg-slate-50/50 focus:bg-white focus:border-customRed/30 focus:ring-4 focus:ring-customRed/5 transition-all outline-none appearance-none cursor-pointer shadow-sm"
                >
                  <option value="">Select Office Location</option>
                  {offices.map((o, i) => (<option key={o.id || o.name || i} value={o.id}>{o.name}</option>))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300 group-hover:text-customRed transition-colors">
                   <Icon name="ChevronDown" size={16} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <button
                  onClick={() => handlePunch("IN")}
                  disabled={!canCheckIn || punching}
                  className={`btn-primary h-12 md:h-14 rounded-2xl text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all ${!canCheckIn || punching ? "opacity-50 grayscale" : ""}`}
                >
                  {punching && pendingPunchType === 'IN' ? (
                    <Icon name="Loader2" className="animate-spin" size={18} />
                  ) : !canCheckIn && attendance?.source_in === 'BIOMETRIC' ? (
                    <div className="flex flex-col items-center leading-none">
                      <span>Punched</span>
                      <span className="text-[8px] opacity-60">Biometric</span>
                    </div>
                  ) : 'In'}
                </button>
                <button
                  onClick={() => handlePunch("OUT")}
                  disabled={!canCheckOut || punching}
                  className={`btn-outline h-12 md:h-14 rounded-2xl text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all ${!canCheckOut || punching ? "opacity-50" : "hover:border-slate-300"}`}
                >
                  {punching && pendingPunchType === 'OUT' ? (
                    <Icon name="Loader2" className="animate-spin" size={18} />
                  ) : !canCheckOut && attendance?.source_out === 'BIOMETRIC' ? (
                    <div className="flex flex-col items-center leading-none">
                      <span>Punched</span>
                      <span className="text-[8px] opacity-60">Biometric</span>
                    </div>
                  ) : 'Out'}
                </button>
              </div>
            </div>

            <div className="pt-6 grid grid-cols-3 gap-2 border-t border-slate-100/50">
               <div className="flex flex-col items-center gap-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">In</span>
                  <span className="text-[11px] font-black text-slate-800">{formatTime(attendance?.check_in)}</span>
               </div>
               <div className="flex flex-col items-center gap-1 border-x border-slate-100/50 px-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Out</span>
                  <span className="text-[11px] font-black text-slate-800">{formatTime(attendance?.check_out)}</span>
               </div>
               <div className="flex flex-col items-center gap-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Total</span>
                  <span className="text-[11px] font-black text-customRed">{attendance?.worked_hours || "—"}</span>
               </div>
            </div>
          </div>
        </div>

        {/* Leave Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden text-[11px]">
          <div className="px-6 py-3.5 border-b border-slate-50 bg-slate-50/20 font-bold text-slate-500 uppercase tracking-widest">Leave Summary</div>
          <div className="divide-y divide-slate-50">
            {leaveBalances.map((item, i) => (
              <div key={item.id || item.leave_type_name || i} className="px-6 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                <span className="font-bold text-slate-500 uppercase group-hover:text-slate-800">{item.leave_type_name}</span>
                <span className="px-2 py-0.5 bg-slate-50 text-slate-800 font-bold rounded-lg border border-slate-100">{Number(item.balance).toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MIDDLE COLUMN */}
      <section className="lg:col-span-6 space-y-6 lg:space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Missing Attendance */}
          <div className="glass-card rounded-2xl lg:rounded-[2rem] shadow-premium flex flex-col min-h-[200px] md:min-h-[220px] transition-all duration-300 card-hover overflow-hidden">
            <div className="px-6 md:px-8 py-5 bg-slate-50/30 border-b border-slate-100/50 flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-xl text-customRed shadow-sm">
                <Icon name="CalendarX" size={16} />
              </div>
              <h3 className="text-[11px] md:text-[12px] font-black text-slate-500 uppercase tracking-widest">Missing Attendance</h3>
            </div>
            <div className="p-4 md:p-6 flex-1 overflow-auto custom-scrollbar">
              {missingAttendance.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 text-[9px] md:text-[10px] font-black text-slate-300 uppercase tracking-widest px-2 pb-1"><span>Date</span> <span>In</span> <span>Out</span></div>
                  {missingAttendance.slice(0, 4).map((m, i) => (
                    <div key={m.id || m.date || i} className="grid grid-cols-3 text-[10px] md:text-[11px] font-black text-slate-600 py-3 border-b border-slate-50 last:border-0 px-2 hover:bg-red-50/30 rounded-xl transition-all cursor-default group">
                      <span className="text-customRed group-hover:scale-105 transition-transform origin-left truncate">{m.date}</span> 
                      <span className="opacity-80">{m.check_in || "—"}</span> 
                      <span className="opacity-80">{m.check_out || "—"}</span>
                    </div>
                  ))}
                </div>
              ) : (<EmptyState icon="Verified" title="Clear Record" message="All entries present" />)}
            </div>
          </div>
          {/* Attendance Summary */}
          <div className="glass-card rounded-2xl lg:rounded-[2rem] shadow-premium flex flex-col min-h-[200px] md:min-h-[220px] transition-all duration-300 card-hover overflow-hidden">
            <div className="px-6 md:px-8 py-5 bg-slate-50/30 border-b border-slate-100/50 flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 shadow-sm">
                <Icon name="BarChart3" size={16} />
              </div>
              <h3 className="text-[11px] md:text-[12px] font-black text-slate-500 uppercase tracking-widest">Summary Stats</h3>
            </div>
            <div className="p-4 md:p-6 flex-1">
              <div className="space-y-4">
                <div className="flex justify-between text-[9px] md:text-[10px] font-black text-slate-300 uppercase tracking-widest px-2"><span>Category</span> <span>Days</span></div>
                {attendanceSummary.slice(0, 4).map((r, i) => (
                  <div key={r.title || i} className="flex justify-between items-center px-2 group cursor-default">
                    <span className="text-[10px] md:text-[11px] font-black text-slate-500 uppercase tracking-tight group-hover:text-slate-800 transition-colors truncate">{r.title}</span>
                    <span className="text-[11px] md:text-[12px] font-black text-slate-900 bg-white px-2 md:px-3 py-1 rounded-lg border border-slate-100 shadow-sm transition-all group-hover:border-indigo-200 group-hover:bg-indigo-50/30">{r.val}</span>
                  </div>
                ))}
                <div className="pt-2 md:pt-4 px-2">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Efficiency</span>
                    <span className="text-[9px] md:text-[10px] font-black text-customRed">65%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 shadow-inner">
                    <div className="h-full bg-gradient-to-r from-customRed via-red-400 to-red-600 w-[65%] rounded-full shadow-lg relative">
                      <div className="absolute top-0 right-0 w-1 h-full bg-white/40 blur-[1px]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Table */}
        <div className="glass-card rounded-[2.5rem] shadow-premium overflow-hidden card-hover transition-all duration-300 border-none">
          <div className="px-6 md:px-8 py-6 border-b border-slate-100/50 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white relative overflow-hidden gap-4">
             <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 opacity-30 pointer-events-none" />
             <div className="flex items-center gap-3 relative z-10">
                <div className="p-2 md:p-2.5 bg-red-500 rounded-[1rem] md:rounded-[1.25rem] text-white shadow-lg shadow-red-500/20">
                  <Icon name="Activity" size={18} />
                </div>
                <div>
                  <h4 className="text-[13px] md:text-[14px] font-black text-slate-800 uppercase tracking-tight">Performance KPI</h4>
                  <p className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest">Real-time Analytics</p>
                </div>
             </div>
             <div className="px-3 py-1 bg-emerald-50 text-[9px] md:text-[10px] text-emerald-600 font-black rounded-full uppercase tracking-wider border border-emerald-100 relative z-10 animate-pulse">Live</div>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left min-w-[500px]">
              <thead className="bg-slate-50/50">
                <tr><th className="px-6 md:px-10 py-4 md:py-5 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Parameter</th><th className="px-6 md:px-10 py-4 md:py-5 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Score</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 text-[10px] md:text-[11px]">
                {[
                  { name: "Working Hours Log", icon: "Clock", val: 85 },
                  { name: "Attendance Consistency", icon: "CheckSquare", val: 92 },
                  { name: "Timeliness Index", icon: "Timer", val: 78 },
                  { name: "Policy Compliance", icon: "ShieldCheck", val: 100 },
                  { name: "Department Average", icon: "Users2", val: 82 },
                  { name: "Overtime Input", icon: "PlusCircle", val: 15 }
                ].map((row, i) => (
                  <tr key={row.name} className="hover:bg-slate-50/80 transition-all group">
                    <td className="px-6 md:px-10 py-4 md:py-6">
                       <div className="flex items-center gap-3 md:gap-4">
                          <div className="w-7 h-7 md:w-8 md:h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-customRed group-hover:shadow-sm border border-transparent group-hover:border-slate-100 transition-all">
                             <Icon name={row.icon} size={14} />
                          </div>
                          <span className="font-black text-slate-600 group-hover:text-slate-900 uppercase tracking-tight truncate max-w-[150px] md:max-w-none">{row.name}</span>
                       </div>
                    </td>
                    <td className="px-6 md:px-10 py-4 md:py-6">
                       <div className="flex items-center justify-end gap-3 md:gap-4 w-full">
                          <div className="text-[11px] md:text-[12px] font-black text-slate-800 tabular-nums">{row.val}%</div>
                          <div className="w-24 md:w-32 h-2 md:h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 shadow-inner">
                             <div 
                                className={`h-full bg-gradient-to-r ${row.val > 80 ? 'from-emerald-400 to-emerald-600' : row.val > 50 ? 'from-orange-400 to-orange-600' : 'from-rose-400 to-rose-600'} rounded-full shadow-lg relative transition-all duration-1000 ease-out`}
                                style={{ width: `${row.val}%` }}
                             >
                                <div className="absolute top-0 right-0 w-1 h-full bg-white/40 blur-[1px]" />
                             </div>
                          </div>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-slate-50/30 p-5 border-t border-slate-100/50 text-center">
            <button className="flex items-center justify-center gap-2 mx-auto text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-customRed transition-all group active:scale-95">
              <span>Analysis</span>
              <div className="p-1.5 bg-white rounded-lg shadow-sm group-hover:shadow-md group-hover:translate-x-1 transition-all">
                <Icon name="ArrowRight" size={14} />
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* RIGHT COLUMN */}
      <section className="lg:col-span-3 space-y-6 lg:space-y-8">
        {/* Team Tabs */}
        <div className="glass-card rounded-[2.5rem] shadow-premium overflow-hidden text-[11px] card-hover border-none">
          <div className="flex p-2 bg-slate-50/50 rounded-t-[2.5rem]">
            <button onClick={() => setTeamTab("team")} className={`flex-1 py-3 font-black uppercase tracking-widest transition-all rounded-2xl ${teamTab === "team" ? "bg-white text-customRed shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"}`}>My Team</button>
            <button onClick={() => setTeamTab("managers")} className={`flex-1 py-3 font-black uppercase tracking-widest transition-all rounded-2xl ${teamTab === "managers" ? "bg-white text-customRed shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"}`}>Managers</button>
          </div>
          <div className="p-4 md:p-6 relative overflow-hidden h-[360px] md:h-[400px] flex flex-col">
            <div className="absolute top-0 left-0 w-full h-full bg-slate-50/10 -z-0" />
            
            <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar pr-1">
              {(() => {
                const list = teamTab === "team" 
                  ? (dashboardData?.widgets?.teamRecent || dashboardData?.widgets?.team || [])
                  : (dashboardData?.widgets?.managers || []);

                if (!list || list.length === 0) {
                  return (
                    <div className="h-full flex flex-col items-center justify-center py-8">
                      <EmptyState 
                        icon="Users" 
                        title={teamTab === "team" ? "Your Team" : "Managers"} 
                        message={teamTab === "team" ? "No team members found" : "No managers found"} 
                      />
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {list.map((member) => (
                      <div key={member.id} className="group flex items-center justify-between p-3 rounded-2xl border border-transparent hover:border-slate-100 hover:bg-white hover:shadow-sm transition-all duration-300">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            <div className="w-10 h-10 rounded-full bg-slate-50 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
                              {member.profile_img ? (
                                <img 
                                  src={getAvatarUrl(member.profile_img)} 
                                  alt={member.name} 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="text-slate-300"><Icon name="User" size={20} /></div>
                              )}
                            </div>
                            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                              member.attendance_status === 'PRESENT' ? 'bg-emerald-500' :
                              member.attendance_status === 'LATE' ? 'bg-orange-400' :
                              'bg-slate-300'
                            }`} />
                          </div>
                          <div className="min-w-0 text-left">
                            <div className="text-[11px] font-black text-slate-800 uppercase tracking-tight truncate group-hover:text-customRed transition-colors">
                              {member.name}
                            </div>
                            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider truncate">
                              {member.designation || member.Department || "Team Member"}
                            </div>
                          </div>
                        </div>
                        {member.is_birthday_today && (
                          <div className="w-6 h-6 bg-pink-50 text-pink-500 rounded-lg flex items-center justify-center shadow-sm animate-bounce" title="Birthday Today!">
                            <Icon name="Cake" size={12} />
                          </div>
                        )}
                        {!member.is_birthday_today && (
                          <button className="p-2 text-slate-300 hover:text-customRed hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                            <Icon name="ChevronRight" size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {teamTab === "team" && (
              <div className="relative z-10 pt-4 mt-auto">
                <button 
                  onClick={() => navigate("/dashboard/organization")}
                  className="w-full py-3 bg-white border border-slate-100 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-customRed hover:border-customRed/20 hover:shadow-sm transition-all active:scale-95"
                >
                  View Full Tribe
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Requests Tracker */}
        <div className="glass-card rounded-[2.5rem] shadow-premium overflow-hidden text-[11px] card-hover border-none">
          <div className="flex p-2 bg-slate-50/50 rounded-t-[2.5rem]">
            <button onClick={() => setRightTab("requests")} className={`flex-1 py-3 font-black uppercase tracking-widest transition-all rounded-2xl ${rightTab === "requests" ? "bg-white text-customRed shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"}`}>Requests</button>
            <button onClick={() => setRightTab("approvals")} className={`flex-1 py-3 font-black uppercase tracking-widest transition-all rounded-2xl ${rightTab === "approvals" ? "bg-white text-customRed shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"}`}>Approvals</button>
          </div>
          <div className="p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between p-4 md:p-5 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] shadow-xl shadow-slate-200">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-white/10 rounded-xl text-white/80">
                    <Icon name="Inbox" size={16} />
                 </div>
                 <span className="font-black text-white/90 uppercase tracking-tight">Active Items</span>
              </div>
              <span className="w-8 h-8 md:w-10 md:h-10 rounded-[0.85rem] md:rounded-[1rem] bg-customRed text-white text-[12px] md:text-[14px] font-black flex items-center justify-center shadow-lg shadow-customRed/30 border border-white/10">
                {rightTab === "requests" ? leaveStats.myRequestsCount : leaveStats.myApprovalsCount}
              </span>
            </div>
            <div className="h-px bg-slate-100 mx-4 opacity-50" />
            <div className="space-y-3">
              {(() => {
                const list = rightTab === "requests" ? leaveStats.myRequests : leaveStats.myApprovals;
                if (!list || list.length === 0) {
                  return <EmptyState icon="Layers" title="Queue Status" message="Zero Pending Tasks" />;
                }

                return list.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 border border-slate-100/50 group hover:bg-white hover:shadow-sm transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${rightTab === "requests" ? 'bg-indigo-50 text-indigo-500' : 'bg-amber-50 text-amber-500'}`}>
                        <Icon name={rightTab === "requests" ? "FileText" : "UserCheck"} size={14} />
                      </div>
                      <div className="text-left">
                        <div className="text-[10px] font-black text-slate-800 uppercase tracking-tight truncate">
                          {rightTab === "requests" ? item.leave_type : item.applicant_name}
                        </div>
                        <div className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">
                          {new Date(item.start_date).toLocaleDateString()} - {new Date(item.end_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    {rightTab === "requests" ? (
                      <span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest ${
                        item.status === 'approved' ? 'bg-emerald-50 text-emerald-600' :
                        item.status === 'rejected' ? 'bg-rose-50 text-rose-600' :
                        'bg-amber-50 text-amber-600'
                      }`}>
                        {item.status}
                      </span>
                    ) : (
                      <button 
                        onClick={() => navigate("/dashboard/leave")}
                        className="p-1.5 text-slate-300 hover:text-customRed transition-colors"
                      >
                        <Icon name="ChevronRight" size={14} />
                      </button>
                    )}
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>

        {/* Global News Broadcast */}
        <div className="glass-card rounded-2xl lg:rounded-[2.5rem] shadow-premium overflow-hidden text-[11px] card-hover border-none relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="px-6 md:px-8 py-5 border-b border-slate-100/50 flex items-center justify-between bg-white/50 relative z-10">
            <div className="flex items-center gap-2 md:gap-3 font-black text-slate-700 uppercase tracking-widest">
               <div className="p-2 bg-red-50 rounded-xl text-customRed shadow-sm">
                  <Icon name="Megaphone" size={16} />
               </div>
               News
            </div>
            <button onClick={() => navigate("/dashboard/news")} className="text-[9px] md:text-[10px] font-black text-customRed uppercase hover:bg-red-50 px-2 md:px-3 py-1 rounded-full transition-all tracking-widest">READ ALL</button>
          </div>
          <div className="p-8 md:p-12 relative z-10">
            <EmptyState icon="BellOff" title="Broadcasting" message="No recent updates" />
          </div>
        </div>
      </section>
    </div>
  );
}

export default DashboardHome;
