// src/features/profile/ProfilePage.js
import React, { useEffect, useMemo, useState } from "react";
import api, { BASE_URL } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

function Field({ label, value, readOnly = false, onChange, type = "text" }) {
  if (readOnly) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
          {label}
        </span>
        <span className="text-sm text-slate-900">{value || "—"}</span>
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

  // editable basic profile fields (always editable for the owner)
  const [personalEmail, setPersonalEmail] = useState("");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");

  // personal section fields (editable only for high-level users)
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [cnic, setCnic] = useState("");

  // job section fields (editable only for high-level users)
  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState("");
  const [station, setStation] = useState("");
  const [employmentStatus, setEmploymentStatus] = useState("");

  // password fields
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
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }, [employee, user]);

  const FILE_BASE = BASE_URL;

  // figure out permission level & whether this user can edit everything
  const level = Number(user?.flags?.level || 0);
  const userRole = user?.role?.toLowerCase() || "";

  // ✅ level > 6 (7, 8, 9, 10…) OR HR role can edit ALL sections
  const canEditAll = level > 6 || userRole === "hr";

  // support img from both user + employee and both keys
  const rawAvatarPath =
    user?.profile_img ||
    user?.profile_picture ||
    employee?.profile_img ||
    employee?.profile_picture ||
    null;

  const avatarUrl = rawAvatarPath
    ? rawAvatarPath.startsWith("http")
      ? rawAvatarPath
      : `${FILE_BASE}${rawAvatarPath.startsWith("/") ? rawAvatarPath : `/${rawAvatarPath}`
      }`
    : null;

  // Load profile info
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

        if (!sessionUser?.id) {
          if (!isCancelled) setLoading(false);
          return;
        }

        const { data: emp } = await api.get(`/employees/${sessionUser.id}`);
        if (isCancelled) return;

        setEmployee(emp);

        // basic profile
        setPersonalEmail(emp.emailPersonal || "");
        setContact(emp.contact || "");
        setAddress(emp.address || "");
        setEmergencyContact(emp.emergencyContact || "");

        // personal section
        setDob(emp.dateOfBirth || "");
        setGender(emp.gender || "");
        setBloodGroup(emp.bloodGroup || "");
        setCnic(emp.cnic || "");

        // job section
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

    return () => {
      isCancelled = true;
    };
  }, []); // run once

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setMsg("");

    const formData = new FormData();
    formData.append("image", file);

    try {
      const { data } = await api.post("/auth/me/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const newPath = data.profile_img || data.profile_picture;

      const updatedUser = {
        ...(user || {}),
        profile_img: newPath,
        profile_picture: newPath,
      };
      setUser && setUser(updatedUser);

      setEmployee((prev) =>
        prev
          ? {
            ...prev,
            profile_img: newPath,
            profile_picture: newPath,
          }
          : prev
      );

      setMsg("Profile picture updated.");
    } catch (err) {
      console.error("Avatar upload error:", err);
      const erMsg = err?.response?.data?.message || err?.message || "Failed to upload picture.";
      setMsg(erMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!employee?.id) return;
    setSaving(true);
    setMsg("");

    try {
      const payload = {
        emailPersonal: personalEmail,
        contact,
        address,
        emergencyContact,
      };

      // only high-level users are allowed to edit the "read only" sections
      if (canEditAll) {
        Object.assign(payload, {
          dateOfBirth: dob,
          gender,
          bloodGroup,
          cnic,
          designation,
          department,
          station,
          status: employmentStatus,
        });
      }

      await api.patch(`/employees/${employee.id}`, payload);

      const { data: emp } = await api.get(`/employees/${employee.id}`);
      setEmployee(emp);

      // refresh local state from latest server data
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

      setMsg("Profile updated successfully.");
    } catch (err) {
      console.error("Profile save error:", err);
      setMsg("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async () => {
    setPwError("");
    setPwMsg("");

    if (!pwCurrent || !pwNew || !pwConfirm) {
      setPwError("All fields are required.");
      return;
    }
    if (pwNew !== pwConfirm) {
      setPwError("New password and confirmation do not match.");
      return;
    }
    if (pwNew.length < 6) {
      setPwError("New password must be at least 6 characters.");
      return;
    }

    setPwSaving(true);
    try {
      await api.post("/auth/change-password", {
        currentPassword: pwCurrent,
        newPassword: pwNew,
      });
      setPwMsg("Password updated successfully.");
      setPwCurrent("");
      setPwNew("");
      setPwConfirm("");
    } catch (err) {
      const msg =
        err.response?.data?.message || "Failed to change password.";
      setPwError(msg);
    } finally {
      setPwSaving(false);
    }
  };

  // ---------- RENDER STATES ----------
  if (loading) {
    return (
      <div className="p-6 text-sm text-slate-600">Loading profile…</div>
    );
  }

  if (!employee) {
    return (
      <div className="p-6 text-sm text-red-600">
        Could not load your employee profile.
      </div>
    );
  }

  const statusText = employmentStatus || employee.status || "—";
  const statusLower = statusText.toLowerCase();
  let statusDotClass = "bg-amber-500";
  if (statusLower === "active") statusDotClass = "bg-emerald-500";
  else if (statusLower === "left" || statusLower === "inactive")
    statusDotClass = "bg-red-500";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="mx-auto max-w-5xl px-4 pt-6 pb-10">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-6">My Profile</h1>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          {/* HEADER */}
          <div className="relative px-6 pt-6 pb-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-customRed/10 via-rose-50 to-white dark:from-customRed/20 dark:via-slate-900 dark:to-slate-900">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              {/* Avatar + name */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={employee.name}
                      className="h-16 w-16 rounded-full object-cover border-2 border-white shadow-md"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-md text-base font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                      {initials}
                    </div>
                  )}

                  <label className="absolute -bottom-1 -right-1 cursor-pointer group">
                    <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-customRed text-white text-[10px] shadow-lg border-2 border-white group-hover:scale-110 active:scale-90 transition-all">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleUpload}
                    />
                  </label>
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-1">
                    <h2 className="text-lg font-semibold text-slate-900">
                      {employee.name}
                    </h2>
                    {employee.employeeCode && (
                      <span className="text-xs font-medium text-slate-500">
                        ({employee.employeeCode})
                      </span>
                    )}
                  </div>

                  <p className="mt-0.5 text-xs md:text-sm text-slate-600">
                    {designation || employee.designation || "—"}
                    <span className="mx-1 text-slate-400">·</span>
                    {department || employee.department || "—"}
                    <span className="mx-1 text-slate-400">·</span>
                    {station || employee.station || "—"}
                  </p>

                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {canEditAll
                      ? "You can edit all profile details here."
                      : "Edit only your basic contact details here."}
                  </p>
                </div>
              </div>

              {/* Status + official info */}
              <div className="flex flex-col items-start md:items-end gap-2 text-xs">
                <span className="inline-flex items-center rounded-full bg-white dark:bg-slate-800 px-3 py-1 border border-slate-200 dark:border-slate-700 text-[11px] font-medium">
                  <span
                    className={`mr-2 h-2 w-2 rounded-full ${statusDotClass}`}
                  />
                  Status:
                  <span className="ml-1 text-slate-900 dark:text-white">{statusText}</span>
                </span>

                <div className="text-right space-y-0.5">
                  <div className="text-[11px] text-slate-500">
                    Official Email
                  </div>
                  <div className="text-xs font-medium text-slate-800">
                    {employee.emailOfficial || user?.email || "—"}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    Joined on{" "}
                    <span className="font-medium text-slate-800">
                      {employee.dateOfJoining || "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BODY */}
          <div className="px-6 py-6 space-y-6">
            {/* PERSONAL + JOB SECTIONS */}
            <div className="grid gap-6 lg:grid-cols-2">
              <section>
                <h2 className="mb-3 text-xs font-semibold tracking-wide text-slate-700 uppercase">
                  Personal {canEditAll ? "(editable)" : "(read only)"}
                </h2>
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-4 py-4 shadow-sm grid gap-3">
                  <Field
                    label="Date of Birth"
                    value={dob}
                    onChange={setDob}
                    readOnly={!canEditAll}
                  />
                  <Field
                    label="Gender"
                    value={gender}
                    onChange={setGender}
                    readOnly={!canEditAll}
                  />
                  <Field
                    label="Blood Group"
                    value={bloodGroup}
                    onChange={setBloodGroup}
                    readOnly={!canEditAll}
                  />
                  <Field
                    label="CNIC"
                    value={cnic}
                    onChange={setCnic}
                    readOnly={!canEditAll}
                  />
                </div>
              </section>

              <section>
                <h2 className="mb-3 text-xs font-semibold tracking-wide text-slate-700 uppercase">
                  Job {canEditAll ? "(editable)" : "(read only)"}
                </h2>
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-4 py-4 shadow-sm grid gap-3">
                  <Field
                    label="Designation"
                    value={designation}
                    onChange={setDesignation}
                    readOnly={!canEditAll}
                  />
                  <Field
                    label="Department"
                    value={department}
                    onChange={setDepartment}
                    readOnly={!canEditAll}
                  />
                  <Field
                    label="Station"
                    value={station}
                    onChange={setStation}
                    readOnly={!canEditAll}
                  />
                  <Field
                    label="Employment Status"
                    value={employmentStatus}
                    onChange={setEmploymentStatus}
                    readOnly={!canEditAll}
                  />
                </div>
              </section>
            </div>

            {/* BASIC PROFILE (always editable for the user) */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-400 uppercase">
                  Basic Profile (you can edit)
                </h2>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 px-4 py-4 shadow-sm">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field
                    label="Personal Email"
                    value={personalEmail}
                    onChange={setPersonalEmail}
                  />
                  <Field
                    label="Contact Number"
                    value={contact}
                    onChange={setContact}
                  />
                  <Field
                    label="Emergency Contact"
                    value={emergencyContact}
                    onChange={setEmergencyContact}
                  />
                  <Field
                    label="Address"
                    value={address}
                    onChange={setAddress}
                    type="textarea"
                  />
                </div>

                <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
                  <button
                    type="button"
                    className="btn-outline w-full sm:w-auto"
                    onClick={() => {
                      // reset logic...
                      setPersonalEmail(employee.emailPersonal || "");
                      setContact(employee.contact || "");
                      setAddress(employee.address || "");
                      setEmergencyContact(employee.emergencyContact || "");
                      setMsg("");
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-primary w-full sm:w-auto shadow-lg shadow-red-500/15"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                </div>

                {msg && (
                  <div className="mt-3 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded">
                    {uploading ? "Uploading picture…" : msg}
                  </div>
                )}
              </div>
            </section>

            {/* CHANGE PASSWORD */}
            <section>
              <h2 className="mb-3 text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-400 uppercase">
                Change Password
              </h2>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 px-4 py-4 shadow-sm">
                <div className="grid gap-4 md:grid-cols-3">
                  <Field
                    label="Current Password"
                    value={pwCurrent}
                    onChange={setPwCurrent}
                    type="password"
                  />
                  <Field
                    label="New Password"
                    value={pwNew}
                    onChange={setPwNew}
                    type="password"
                  />
                  <Field
                    label="Confirm New Password"
                    value={pwConfirm}
                    onChange={setPwConfirm}
                    type="password"
                  />
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="btn-premium w-full sm:w-auto"
                    onClick={handlePasswordSave}
                    disabled={pwSaving}
                  >
                    {pwSaving ? "Updating…" : "Update Password"}
                  </button>
                </div>

                {pwError && (
                  <div className="mt-3 text-[11px] text-red-700 bg-red-50 border border-red-100 px-3 py-2 rounded">
                    {pwError}
                  </div>
                )}
                {pwMsg && (
                  <div className="mt-3 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded">
                    {pwMsg}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
