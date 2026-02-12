// src/features/profile/ProfilePage.js
import React, { useEffect, useMemo, useState } from "react";
import api, { BASE_URL } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import {
  User, Mail, Phone, MapPin, Calendar,
  Briefcase, ShieldCheck, Camera, PenLine,
  Lock, CheckCircle2, Award, Medal,
  Star, Trophy, Milestone, Loader2, Timer
} from "lucide-react";

function Field({ label, value, readOnly = false, onChange, type = "text" }) {
  if (readOnly) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
          {label}
        </span>
        <span className="text-sm text-slate-900 dark:text-slate-100">{value || "—"}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
        {label}
      </label>
      {type === "textarea" ? (
        <textarea
          className="textarea min-h-[70px]"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          type={type}
          className="input"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [personalEmail, setPersonalEmail] = useState("");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");

  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [cnic, setCnic] = useState("");

  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState("");
  const [station, setStation] = useState("");
  const [employmentStatus, setEmploymentStatus] = useState("");
  const [badges, setBadges] = useState([]);

  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState("");
  const [pwError, setPwError] = useState("");

  const initials = useMemo(() => {
    const name = employee?.name || user?.name || "User";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || "U";
    return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
  }, [employee, user]);

  const FILE_BASE = BASE_URL;
  const level = Number(user?.flags?.level || 0);
  const userRole = user?.role?.toLowerCase() || "";
  const canEditAll = level > 6 || userRole === "hr";

  const rawAvatarPath = user?.profile_img || user?.profile_picture || employee?.profile_img || employee?.profile_picture || null;
  const avatarUrl = rawAvatarPath ? (rawAvatarPath.startsWith("http") ? rawAvatarPath : `${FILE_BASE}${rawAvatarPath.startsWith("/") ? rawAvatarPath : `/${rawAvatarPath}`}`) : null;

  useEffect(() => {
    let isCancelled = false;
    const loadProfile = async () => {
      try {
        let sessionUser = user;
        if (!sessionUser?.id) {
          const { data } = await api.get("/auth/me");
          sessionUser = data.user;
          if (setUser && data.user) setUser(data.user);
        }
        if (!sessionUser?.id) { if (!isCancelled) setLoading(false); return; }

        const { data: emp } = await api.get(`/employees/${sessionUser.id}`);
        if (isCancelled) return;
        setEmployee(emp);

        // Fetch badges
        api.get(`/gamification/badges/me`).then(res => setBadges(res.data)).catch(console.error);

        setPersonalEmail(emp.emailPersonal || "");
        setContact(emp.contact || "");
        setAddress(emp.address || "");
        setEmergencyContact(emp.emergencyContact || "");
        setDob(emp.dateOfBirth || "");
        setGender(emp.gender || "");
        setBloodGroup(emp.bloodGroup || "");
        setCnic(emp.cnic || "");
        setDesignation(emp.designation || "");
        setDepartment(emp.department || "");
        setStation(emp.station || "");
        setEmploymentStatus(emp.status || "");
      } catch (err) {
        console.error("Profile load error:", err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };
    loadProfile();
    return () => { isCancelled = true; };
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);
    try {
      const { data } = await api.post("/auth/me/avatar", formData, { headers: { "Content-Type": "multipart/form-data" } });
      const newPath = data.profile_img || data.profile_picture;
      setUser && setUser({ ...(user || {}), profile_img: newPath, profile_picture: newPath });
      setEmployee(prev => prev ? { ...prev, profile_img: newPath, profile_picture: newPath } : prev);
      setMsg("Profile picture updated.");
    } catch (err) {
      setMsg(err?.response?.data?.message || "Upload failed.");
    } finally { setUploading(false); }
  };

  const handleSave = async () => {
    if (!employee?.id) return;
    setSaving(true);
    setMsg("");
    try {
      const payload = { emailPersonal: personalEmail, contact, address, emergencyContact };
      if (canEditAll) Object.assign(payload, { dateOfBirth: dob, gender, bloodGroup, cnic, designation, department, station, status: employmentStatus });
      await api.patch(`/employees/${employee.id}`, payload);
      setMsg("Profile updated successfully.");
    } catch (err) { setMsg("Failed to save profile."); } finally { setSaving(false); }
  };

  const handlePasswordSave = async () => {
    if (!pwCurrent || !pwNew || !pwConfirm) { setPwError("All fields are required."); return; }
    if (pwNew !== pwConfirm) { setPwError("Passwords do not match."); return; }
    setPwSaving(true);
    try {
      await api.post("/auth/change-password", { currentPassword: pwCurrent, newPassword: pwNew });
      setPwMsg("Password updated successfully.");
      setPwCurrent(""); setPwNew(""); setPwConfirm("");
    } catch (err) { setPwError(err.response?.data?.message || "Failed to change password."); } finally { setPwSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-customRed" size={40} /></div>;
  if (!employee) return <div className="p-6 text-sm text-red-600">Could not load profile.</div>;

  const getBadgeIcon = (type) => {
    switch (type) {
      case 'attendance': return <Timer size={20} className="text-emerald-600" />;
      case 'performance': return <Trophy size={20} className="text-amber-600" />;
      default: return <Award size={20} className="text-blue-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors pb-20">
      <div className="mx-auto max-w-5xl px-4 pt-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">My Profile</h1>
          <div className="flex -space-x-2">
            {badges.slice(0, 3).map((b, i) => (
              <div key={i} title={b.name} className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-50 dark:border-slate-900 shadow-sm flex items-center justify-center transform hover:-translate-y-1 transition-transform cursor-help">
                <span className="text-lg">{b.icon}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden mb-10">
          <div className="relative h-32 bg-gradient-to-r from-customRed to-rose-600 opacity-90" />

          <div className="px-8 pb-8">
            <div className="relative flex flex-col md:flex-row items-end gap-6 -mt-16 mb-6">
              <div className="relative group">
                <div className="h-32 w-32 rounded-[24px] border-4 border-white dark:border-slate-900 overflow-hidden shadow-2xl bg-white dark:bg-slate-800">
                  {avatarUrl ? <img src={avatarUrl} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-4xl font-bold text-slate-300">{initials}</div>}
                </div>
                <label className="absolute -bottom-2 -right-2 h-10 w-10 bg-customRed text-white rounded-xl flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 active:scale-95 transition-all">
                  <Camera size={20} />
                  <input type="file" className="hidden" accept="image/*" onChange={handleUpload} />
                </label>
              </div>

              <div className="flex-1 pb-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{employee.name}</h2>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${employee.status?.toLowerCase() === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    {employee.status || 'Active'}
                  </span>
                </div>
                <p className="text-slate-500 font-medium">{designation || employee.designation} • {department || employee.department}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <PenLine size={18} className="text-customRed" />
                    <h3 className="font-bold text-slate-800 dark:text-white uppercase text-xs tracking-widest">Personal & Work Info</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/40 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                    <Field label="Employee Code" value={employee.employeeCode} readOnly />
                    <Field label="Official Email" value={employee.emailOfficial || user?.email} readOnly />
                    <Field label="Joining Date" value={employee.dateOfJoining} readOnly />
                    <Field label="Date of Birth" value={dob} onChange={setDob} readOnly={!canEditAll} />
                    <Field label="Gender" value={gender} onChange={setGender} readOnly={!canEditAll} />
                    <Field label="Blood Group" value={bloodGroup} onChange={setBloodGroup} readOnly={!canEditAll} />
                  </div>
                </section>

                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Award size={18} className="text-customRed" />
                    <h3 className="font-bold text-slate-800 dark:text-white uppercase text-xs tracking-widest">Achievements & Badges</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {badges.length > 0 ? badges.map((b, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                        <div className="h-12 w-12 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-2xl shadow-inner italic">
                          {b.icon}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-sm">{b.name}</div>
                          <p className="text-[11px] text-slate-500 leading-tight">{b.description}</p>
                        </div>
                      </div>
                    )) : (
                      <div className="col-span-full py-10 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                        <Milestone className="text-slate-300 mb-2" size={32} />
                        <p className="text-sm font-medium text-slate-400">Your journey has just begun! Earn badges by being on time and performing well.</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              <div className="space-y-8">
                <section className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-8 rounded-[32px] shadow-xl">
                  <div className="flex items-center gap-2 mb-6">
                    <Lock size={18} className="opacity-60" />
                    <h3 className="font-bold uppercase text-xs tracking-widest opacity-60">Security</h3>
                  </div>
                  <div className="space-y-4">
                    <Field label="Current Password" value={pwCurrent} onChange={setPwCurrent} type="password" />
                    <Field label="New Password" value={pwNew} onChange={setPwNew} type="password" />
                    <button onClick={handlePasswordSave} disabled={pwSaving} className="w-full py-4 bg-customRed text-white font-bold rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-customRed/30 disabled:opacity-50 mt-4">
                      {pwSaving ? "Updating..." : "Update Password"}
                    </button>
                    {pwMsg && <p className="text-emerald-400 text-[11px] font-medium text-center">{pwMsg}</p>}
                    {pwError && <p className="text-rose-400 text-[11px] font-medium text-center">{pwError}</p>}
                  </div>
                </section>

                <section className="bg-slate-50 dark:bg-slate-800/40 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 mb-6">
                    <PenLine size={18} className="text-customRed" />
                    <h3 className="font-bold text-slate-800 dark:text-white uppercase text-xs tracking-widest">Contact Details</h3>
                  </div>
                  <div className="space-y-4">
                    <Field label="Personal Email" value={personalEmail} onChange={setPersonalEmail} />
                    <Field label="Contact #" value={contact} onChange={setContact} />
                    <Field label="Emergency Contact" value={emergencyContact} onChange={setEmergencyContact} />
                    <button onClick={handleSave} disabled={saving} className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-2xl hover:bg-slate-800 transition-colors disabled:opacity-50">
                      {saving ? "Saving..." : "Save Contact Info"}
                    </button>
                    {msg && <p className="text-emerald-600 text-[11px] font-medium text-center mt-2">{msg}</p>}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
