// src/features/employees/components/EditEmployeeModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import api, { BASE_URL } from "../../../utils/api";
import useEmployee from "../hooks/useEmployee";
import { useAuth } from "../../../context/AuthContext";
import SharedDropdown from "../../../components/common/SharedDropdown";

const DOC_TYPES = [
  "CNIC",
  "Passport",
  "Offer Letter",
  "Appointment Letter",
  "Contract",
  "Degree",
  "Certification",
  "Experience Letter",
  "NDA",
  "Other",
];

function Field({ label, children, required, error }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1">
        {label} {required && <span className="text-customRed">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-[11px] text-customRed">{error}</p>}
    </div>
  );
}

function toDateInputValue(val) {
  if (!val) return "";
  // supports "2025-12-15T..." or "2025-12-15"
  const s = String(val);
  return s.slice(0, 10);
}

export default function EditEmployeeModal({ employeeId, onClose }) {
  const { employee, loading, error } = useEmployee(employeeId);
  const { user } = useAuth();
  const role = user?.role;
  const canEditVault = role === "super_admin" || role === "admin" || role === "hr";

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingVault, setSavingVault] = useState(false);
  const [vaultSuccess, setVaultSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: "",
    employeeCode: "",
    department: "",
    designation: "",
    station: "",
    status: "",
    dateOfBirth: "",
    dateOfJoining: "",
    cnic: "",
    gender: "",
    bloodGroup: "",
    personalEmail: "",
    officialEmail: "",
    contact: "",
    emergencyContact: "",
    address: "",
    profile_img: "",
    probation: "",
    religion: "",
    maritalStatus: "",
  });

  const [vaultForm, setVaultForm] = useState({
    officialEmail: "",
    canLogin: false,
    password: "",
    userType: "",
  });

  const [lookups, setLookups] = useState({
    userTypes: [],
    statuses: [],
    stations: [],
    departments: [],
    designations: [],
    bloodGroups: [],
    religions: [],
    maritalStatuses: [],
  });

  // ---------------- DOCUMENTS STATE (NEW) ----------------
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsError, setDocsError] = useState("");
  const [docs, setDocs] = useState([]); // existing docs from backend
  const [docSavingId, setDocSavingId] = useState(null);
  const [docReplacingId, setDocReplacingId] = useState(null);
  const [docDeletingId, setDocDeletingId] = useState(null);

  // new docs upload rows
  const [newDocs, setNewDocs] = useState([]);
  const canAddMoreNewDocs = newDocs.length < 10;

  const FILE_BASE = BASE_URL;

  const [avatarUploading, setAvatarUploading] = useState(false);
  const handleUpdateAvatar = async (file) => {
    if (!file) return;
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      const { data } = await api.post(`/employees/${employeeId}/avatar`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfileForm((prev) => ({ ...prev, profile_img: data.profile_img }));
    } catch (e) {
      console.error("Avatar upload failed", e);
      const msg = e?.response?.data?.message || e?.message || "Failed to upload avatar";
      alert(msg);
    } finally {
      setAvatarUploading(false);
    }
  };

  const loadDocuments = async () => {
    setDocsLoading(true);
    setDocsError("");
    try {
      const { data } = await api.get(`/employees/${employeeId}/documents`);
      setDocs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load documents", e);
      setDocsError(
        e?.response?.data?.message || e?.message || "Failed to load documents"
      );
      setDocs([]);
    } finally {
      setDocsLoading(false);
    }
  };

  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [utRes, stRes, statRes, deptRes, desRes, bgRes, relRes, msRes] = await Promise.all([
          api.get("/employees/lookups/user-types"),
          api.get("/employees/lookups/statuses"),
          api.get("/employees/lookups/stations"),
          api.get("/employees/lookups/departments"),
          api.get("/employees/lookups/designations"),
          api.get("/settings/blood-groups?active_only=true"),
          api.get("/settings/religions?active_only=true"),
          api.get("/settings/marital-statuses?active_only=true"),
        ]);
        setLookups({
          userTypes: utRes.data || [],
          statuses: stRes.data || [],
          stations: statRes.data || [],
          departments: deptRes.data || [],
          designations: desRes.data || [],
          bloodGroups: (bgRes.data || []).map(i => i.name),
          religions: (relRes.data || []).map(i => i.name),
          maritalStatuses: (msRes.data || []).map(i => i.name),
        });
      } catch (err) {
        console.error("Failed to load edit lookups", err);
      }
    };
    fetchLookups();
  }, []);

  useEffect(() => {
    if (!employee) return;

    setProfileForm({
      name: employee.name || "",
      employeeCode: employee.employeeCode || "",
      department: employee.department || "",
      designation: employee.designation || "",
      station: employee.station || "",
      status: employee.status || "",
      dateOfBirth: employee.dateOfBirth || "",
      dateOfJoining: employee.dateOfJoining || "",
      cnic: employee.cnic || "",
      gender: employee.gender || "",
      bloodGroup: employee.bloodGroup || "",
      personalEmail: employee.personalEmail || "",
      officialEmail: employee.officialEmail || "",
      contact: employee.contact || "",
      emergencyContact: employee.emergencyContact || "",
      address: employee.address || "",
      profile_img: employee.profile_img || null,
      probation: employee.probation || "",
      religion: employee.religion || "",
      maritalStatus: employee.maritalStatus || "",
    });

    setVaultForm({
      officialEmail: employee.officialEmail || "",
      canLogin: employee.canLogin ?? true,
      password: "",
      userType: employee.userType || "",
    });

    // load docs whenever modal opens/employee loads
    loadDocuments();
    // reset new doc rows
    setNewDocs([]);
  }, [employee]); // eslint-disable-line react-hooks/exhaustive-deps

  const onProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const onVaultChange = (e) => {
    const { name, type, checked, value } = e.target;
    setVaultForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.patch(`/employees/${employeeId}`, profileForm);
      onClose(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveVault = async (e) => {
    e.preventDefault();
    if (!canEditVault) return;
    setSavingVault(true);
    try {
      const payload = {
        officialEmail: vaultForm.officialEmail,
        canLogin: vaultForm.canLogin,
        userType: vaultForm.userType,
      };
      if (vaultForm.password.trim()) {
        payload.password = vaultForm.password.trim();
      }
      await api.put(`/employees/${employeeId}/login`, payload);
      setVaultForm((prev) => ({ ...prev, password: "" }));
      setVaultSuccess(true);
      // Auto-hide success message after 5 seconds
      setTimeout(() => setVaultSuccess(false), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingVault(false);
    }
  };

  const handleGeneratePassword = () => {
    const random = Math.random().toString(36).slice(-10);
    setVaultForm((prev) => ({ ...prev, password: random }));
    setShowPassword(true);
  };

  // ---------------- DOCUMENTS ACTIONS (NEW) ----------------
  const updateDocLocal = (docId, patch) => {
    setDocs((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, ...patch } : d))
    );
  };

  const handleSaveDocMeta = async (doc) => {
    setDocSavingId(doc.id);
    try {
      await api.patch(`/employees/${employeeId}/documents/${doc.id}`, {
        title: doc.title || "",
        type: doc.type || "",
        issuedAt: doc.issuedAt || null,
        expiresAt: doc.expiresAt || null,
      });
      await loadDocuments();
    } catch (e) {
      console.error("Update doc failed", e);
      alert(
        e?.response?.data?.message || e?.message || "Failed to update document"
      );
    } finally {
      setDocSavingId(null);
    }
  };

  const handleReplaceDocFile = async (docId, file) => {
    if (!file) return;
    setDocReplacingId(docId);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await api.put(`/employees/${employeeId}/documents/${docId}/file`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await loadDocuments();
    } catch (e) {
      console.error("Replace doc file failed", e);
      alert(
        e?.response?.data?.message ||
        e?.message ||
        "Failed to replace document file"
      );
    } finally {
      setDocReplacingId(null);
    }
  };

  const handleDeleteDoc = async (docId) => {
    const ok = window.confirm("Delete this document?");
    if (!ok) return;

    setDocDeletingId(docId);
    try {
      await api.delete(`/employees/${employeeId}/documents/${docId}`);
      await loadDocuments();
    } catch (e) {
      console.error("Delete doc failed", e);
      alert(
        e?.response?.data?.message || e?.message || "Failed to delete document"
      );
    } finally {
      setDocDeletingId(null);
    }
  };

  const addNewDocRow = () => {
    if (!canAddMoreNewDocs) return;
    setNewDocs((prev) => [
      ...prev,
      { title: "", type: "", file: null, issuedAt: "", expiresAt: "" },
    ]);
  };

  const removeNewDocRow = (idx) => {
    setNewDocs((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateNewDocField = (idx, field, value) => {
    setNewDocs((prev) =>
      prev.map((d, i) => (i === idx ? { ...d, [field]: value } : d))
    );
  };

  const handleUploadNewDocs = async () => {
    const docsToUpload = newDocs.filter((d) => d.file);
    if (!docsToUpload.length) {
      alert("Select at least 1 file to upload.");
      return;
    }

    const fd = new FormData();
    docsToUpload.forEach((d) => {
      fd.append("documents", d.file);
      fd.append("titles", (d.title || "").trim());
      fd.append("types", d.type || "");
      fd.append("issued_at", d.issuedAt || "");
      fd.append("expires_at", d.expiresAt || "");
    });

    try {
      setDocsLoading(true);
      await api.post(`/employees/${employeeId}/documents`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setNewDocs([]);
      await loadDocuments();
    } catch (e) {
      console.error("Upload docs failed", e);
      alert(e?.response?.data?.message || e?.message || "Upload failed");
    } finally {
      setDocsLoading(false);
    }
  };

  // --- UI helpers for NEW DOCS upload rows (only this part is improved) ---
  const MiniLabel = ({ children }) => (
    <div className="mb-1 flex items-center justify-between">
      <span className="block text-[11px] font-semibold text-slate-700">
        {children}
      </span>
    </div>
  );

  const InputBase =
    "w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-800 shadow-sm " +
    "focus:border-customRed focus:outline-none focus:ring-1 focus:ring-customRed";

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="rounded-xl bg-white px-6 py-4 text-sm text-slate-600 shadow-lg">
          Loading employee…
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="rounded-xl bg-white px-6 py-4 text-sm text-red-600 shadow-lg">
          {error || "Employee not found."}
          <div className="mt-3 text-right">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="inline-flex h-8 px-4 items-center justify-center rounded border border-slate-300 text-xs text-slate-700 bg-white hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusText = profileForm.status || "—";
  const lower = statusText.toLowerCase();
  let statusDot = "bg-amber-500";
  if (lower === "active") statusDot = "bg-emerald-500";
  else if (lower === "left" || lower === "inactive") statusDot = "bg-red-500";

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-6xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="modal-header shrink-0">
          <div>
            <h2 className="h2 text-slate-900">Edit Employee</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {profileForm.name || "—"} ·{" "}
              <span className="font-medium">{profileForm.employeeCode}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1 border border-slate-200 text-[11px] font-medium">
              <span className={`mr-2 h-2 w-2 rounded-full ${statusDot}`} />
              {statusText}
            </span>
            <button
              type="button"
              onClick={() => onClose(false)}
              className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body (Scrollable) */}
        <div className="modal-body flex-1 overflow-y-auto min-h-0 p-6">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)]">
            {/* LEFT: Profile / general */}
            <form onSubmit={handleSaveProfile} className="space-y-5 flex flex-col h-full">
              <div className="flex items-center gap-6 mb-4">
                <div className="relative group">
                  <div className="h-16 w-16 rounded-full bg-slate-100 border-2 border-slate-200 overflow-hidden flex-shrink-0">
                    {profileForm.profile_img ? (
                      <img
                        src={`${FILE_BASE}${profileForm.profile_img}`}
                        alt="Avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-slate-400">
                        NO PHOTO
                      </div>
                    )}
                  </div>
                  {avatarUploading && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-full">
                      <div className="h-4 w-4 border-2 border-customRed border-t-transparent animate-spin rounded-full" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-xs font-semibold tracking-wide text-slate-700 uppercase mb-1">
                    Employee Photo
                  </h3>
                  <label className="cursor-pointer inline-flex h-8 px-3 items-center justify-center rounded border border-slate-300 text-[11px] font-medium bg-white hover:bg-slate-50 transition-colors">
                    {avatarUploading ? "Uploading..." : "Change Photo"}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      disabled={avatarUploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUpdateAvatar(file);
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="section-divider">
                <div className="section-indicator" />
                <h3 className="section-title">Profile Information</h3>
              </div>

              <div className="form-grid">
                <Field label="Employee Name:" required>
                  <input
                    type="text"
                    name="name"
                    value={profileForm.name}
                    onChange={onProfileChange}
                    className="input"
                  />
                </Field>

                <Field label="Employee Code:">
                  <input
                    type="text"
                    name="employeeCode"
                    value={profileForm.employeeCode}
                    onChange={onProfileChange}
                    className="input"
                  />
                </Field>

                <Field label="Department:">
                  <SharedDropdown
                    value={profileForm.department}
                    onChange={(val) => setProfileForm(p => ({ ...p, department: val }))}
                    options={lookups.departments}
                    placeholder="Select Department"
                    searchable={true}
                  />
                </Field>

                <Field label="Designation:">
                  <SharedDropdown
                    value={profileForm.designation}
                    onChange={(val) => setProfileForm(p => ({ ...p, designation: val }))}
                    options={lookups.designations}
                    placeholder="Select Designation"
                    searchable={true}
                  />
                </Field>

                <Field label="Station:">
                  <SharedDropdown
                    value={profileForm.station}
                    onChange={(val) => setProfileForm(p => ({ ...p, station: val }))}
                    options={lookups.stations}
                    placeholder="Select Station"
                    searchable={true}
                  />
                </Field>

                <Field label="Status:">
                  <SharedDropdown
                    value={profileForm.status}
                    onChange={(val) => setProfileForm(p => ({ ...p, status: val }))}
                    options={lookups.statuses}
                    placeholder="Select Status"
                    searchable={true}
                  />
                </Field>

                <Field label="Probation Period:">
                  <input
                    type="text"
                    name="probation"
                    value={profileForm.probation}
                    onChange={onProfileChange}
                    className="input"
                    placeholder="e.g. 3 Months"
                  />
                </Field>

                <Field label="Date of Birth:">
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={profileForm.dateOfBirth || ""}
                    onChange={onProfileChange}
                    className="input"
                  />
                </Field>

                <Field label="Date of Joining:">
                  <input
                    type="date"
                    name="dateOfJoining"
                    value={profileForm.dateOfJoining || ""}
                    onChange={onProfileChange}
                    className="input"
                  />
                </Field>

                <Field label="CNIC:">
                  <input
                    type="text"
                    name="cnic"
                    value={profileForm.cnic}
                    onChange={onProfileChange}
                    className="input"
                  />
                </Field>

                <Field label="Gender:">
                  <SharedDropdown
                    value={profileForm.gender}
                    onChange={(val) => setProfileForm(p => ({ ...p, gender: val }))}
                    options={["Male", "Female", "Other"]}
                    placeholder="Select Gender"
                    searchable={true}
                  />
                </Field>

                <Field label="Religion:">
                  <SharedDropdown
                    value={profileForm.religion}
                    onChange={(val) => setProfileForm(p => ({ ...p, religion: val }))}
                    options={lookups.religions}
                    placeholder="Select Religion"
                    searchable={true}
                  />
                </Field>

                <Field label="Marital Status:">
                  <SharedDropdown
                    value={profileForm.maritalStatus}
                    onChange={(val) => setProfileForm(p => ({ ...p, maritalStatus: val }))}
                    options={lookups.maritalStatuses}
                    placeholder="Select Status"
                    searchable={true}
                  />
                </Field>

                <Field label="Blood Group:">
                  <SharedDropdown
                    value={profileForm.bloodGroup}
                    onChange={(val) => setProfileForm(p => ({ ...p, bloodGroup: val }))}
                    options={lookups.bloodGroups}
                    placeholder="Select Blood Group"
                    searchable={true}
                  />
                </Field>

                <Field label="Official Email:">
                  <input
                    type="email"
                    name="officialEmail"
                    value={profileForm.officialEmail}
                    onChange={onProfileChange}
                    className="input"
                  />
                </Field>

                <Field label="Personal Email:">
                  <input
                    type="email"
                    name="personalEmail"
                    value={profileForm.personalEmail}
                    onChange={onProfileChange}
                    className="input"
                  />
                </Field>

                <Field label="Contact:">
                  <input
                    type="text"
                    name="contact"
                    value={profileForm.contact}
                    onChange={onProfileChange}
                    className="input"
                  />
                </Field>

                <Field label="Emergency Contact:">
                  <input
                    type="text"
                    name="emergencyContact"
                    value={profileForm.emergencyContact}
                    onChange={onProfileChange}
                    className="input"
                  />
                </Field>
              </div>

              <Field label="Address:">
                <textarea
                  name="address"
                  value={profileForm.address}
                  onChange={onProfileChange}
                  className="textarea"
                  rows={3}
                />
              </Field>

              {/* ---------------- DOCUMENTS SECTION (NEW) ---------------- */}
              <div className="pt-4">
                <div className="flex items-center justify-between section-divider">
                  <div className="flex items-center gap-3">
                    <div className="section-indicator" />
                    <h3 className="section-title">Documents</h3>
                  </div>
                  <button
                    type="button"
                    onClick={addNewDocRow}
                    disabled={!canAddMoreNewDocs}
                    className="btn-outline h-8 px-4 text-[10px] uppercase font-bold tracking-widest rounded-xl"
                  >
                    + Add Document
                  </button>
                </div>

                <div className="mt-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4">
                  {docsLoading ? (
                    <div className="text-xs text-slate-600">Loading documents…</div>
                  ) : docsError ? (
                    <div className="text-xs text-red-600">{docsError}</div>
                  ) : docs.length === 0 ? (
                    <div className="text-xs text-slate-500">No documents uploaded.</div>
                  ) : (
                    <div className="space-y-3">
                      {docs.map((doc) => {
                        const viewUrl = doc.path ? `${FILE_BASE}${doc.path}` : "#";
                        const busy =
                          docSavingId === doc.id ||
                          docReplacingId === doc.id ||
                          docDeletingId === doc.id;

                        return (
                          <div
                            key={doc.id}
                            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4"
                          >
                            <div className="flex flex-col gap-4">
                              <div className="min-w-0 flex-1">
                                <div className="grid gap-3 sm:grid-cols-2">
                                  <Field label="Title">
                                    <input
                                      type="text"
                                      className="w-full h-9 rounded border border-slate-300 px-3 text-xs focus:border-customRed focus:outline-none focus:ring-1 focus:ring-customRed"
                                      value={doc.title || ""}
                                      onChange={(e) =>
                                        updateDocLocal(doc.id, { title: e.target.value })
                                      }
                                    />
                                  </Field>

                                  <Field label="Type">
                                    <SharedDropdown
                                      value={doc.type || ""}
                                      onChange={(val) => updateDocLocal(doc.id, { type: val })}
                                      options={DOC_TYPES}
                                      placeholder="Select Type"
                                      searchable={true}
                                    />
                                  </Field>

                                  <Field label="Issued At">
                                    <input
                                      type="date"
                                      className="w-full h-9 rounded border border-slate-300 px-3 text-xs focus:border-customRed focus:outline-none focus:ring-1 focus:ring-customRed"
                                      value={toDateInputValue(doc.issuedAt)}
                                      onChange={(e) =>
                                        updateDocLocal(doc.id, { issuedAt: e.target.value })
                                      }
                                    />
                                  </Field>

                                  <Field label="Expires At">
                                    <input
                                      type="date"
                                      className="w-full h-9 rounded border border-slate-300 px-3 text-xs focus:border-customRed focus:outline-none focus:ring-1 focus:ring-customRed"
                                      value={toDateInputValue(doc.expiresAt)}
                                      onChange={(e) =>
                                        updateDocLocal(doc.id, { expiresAt: e.target.value })
                                      }
                                    />
                                  </Field>
                                </div>

                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                  <a
                                    href={viewUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex h-8 px-3 items-center justify-center rounded border border-slate-300 text-[11px] font-medium bg-white hover:bg-slate-50"
                                  >
                                    View
                                  </a>

                                  <a
                                    href={`${BASE_URL}/api/v1/employees/${employeeId}/documents/${doc.id}/download`}
                                    className="inline-flex h-8 px-3 items-center justify-center rounded border border-customRed text-customRed text-[11px] font-medium hover:bg-customRed/10"
                                  >
                                    Download
                                  </a>
                                </div>
                              </div>

                              <div className="shrink-0 flex flex-row sm:flex-col gap-2 border-t sm:border-t-0 pt-3 sm:pt-0">
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => handleSaveDocMeta(doc)}
                                  className="flex-1 h-8 px-3 rounded bg-slate-900 text-white text-[11px] font-semibold hover:bg-black disabled:opacity-60"
                                >
                                  {docSavingId === doc.id ? "Saving…" : "Save"}
                                </button>

                                <label className="flex-1 h-8 px-3 rounded border border-slate-300 text-[11px] font-medium bg-white hover:bg-slate-50 cursor-pointer inline-flex items-center justify-center">
                                  {docReplacingId === doc.id ? "Replacing…" : "Replace"}
                                  <input
                                    type="file"
                                    className="hidden"
                                    disabled={busy}
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      e.target.value = "";
                                      if (file) handleReplaceDocFile(doc.id, file);
                                    }}
                                  />
                                </label>

                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => handleDeleteDoc(doc.id)}
                                  className="flex-1 h-8 px-3 rounded border border-red-200 text-red-600 text-[11px] font-semibold hover:bg-red-50 disabled:opacity-60"
                                >
                                  {docDeletingId === doc.id ? "Deleting…" : "Delete"}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* NEW DOCS UPLOAD (UI IMPROVED ONLY) */}
                  {newDocs.length > 0 ? (
                    <div className="mt-5 border-t border-slate-200 pt-4">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-semibold text-slate-700">
                          Upload new document(s)
                        </div>
                        <button
                          type="button"
                          onClick={handleUploadNewDocs}
                          disabled={docsLoading}
                          className="h-8 px-3 rounded bg-customRed text-white text-[11px] font-semibold hover:bg-customRed/90 disabled:opacity-60"
                        >
                          {docsLoading ? "Uploading…" : "Upload"}
                        </button>
                      </div>

                      <div className="mt-3 space-y-3">
                        {newDocs.map((d, idx) => {
                          const fileName = d.file?.name || "";
                          return (
                            <div
                              key={idx}
                              className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
                            >
                              {/* top row */}
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="text-[11px] font-semibold text-slate-700">
                                    New document #{idx + 1}
                                  </div>
                                  <div className="mt-0.5 text-[11px] text-slate-500 truncate">
                                    {fileName ? fileName : "No file selected"}
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => removeNewDocRow(idx)}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                                  title="Remove row"
                                >
                                  ✕
                                </button>
                              </div>

                              {/* fields */}
                              <div className="mt-3 grid gap-3 md:grid-cols-12">
                                {/* Title */}
                                <div className="md:col-span-4">
                                  <MiniLabel>Title</MiniLabel>
                                  <input
                                    type="text"
                                    value={d.title}
                                    onChange={(e) =>
                                      updateNewDocField(idx, "title", e.target.value)
                                    }
                                    className={InputBase}
                                    placeholder="e.g. CNIC Front, Passport Bio Page"
                                  />
                                </div>

                                {/* Type */}
                                <div className="md:col-span-3">
                                  <MiniLabel>Type</MiniLabel>
                                  <select
                                    value={d.type}
                                    onChange={(e) =>
                                      updateNewDocField(idx, "type", e.target.value)
                                    }
                                    className={InputBase}
                                  >
                                    <option value="">Select</option>
                                    {DOC_TYPES.map((t) => (
                                      <option key={t} value={t}>
                                        {t}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                {/* File */}
                                <div className="md:col-span-5">
                                  <MiniLabel>File</MiniLabel>
                                  <div className="flex gap-2">
                                    <label className="inline-flex h-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-[11px] font-semibold text-slate-700 hover:bg-slate-50">
                                      Choose file
                                      <input
                                        type="file"
                                        className="hidden"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0] || null;
                                          updateNewDocField(idx, "file", file);
                                          e.target.value = "";
                                          if (file && !d.title.trim()) {
                                            updateNewDocField(idx, "title", file.name);
                                          }
                                        }}
                                      />
                                    </label>

                                    <div className="flex-1 min-w-0">
                                      <div
                                        className={`h-9 w-full rounded-lg border px-3 text-xs flex items-center ${fileName
                                          ? "border-slate-300 text-slate-800"
                                          : "border-slate-200 text-slate-400"
                                          }`}
                                        title={fileName || "No file selected"}
                                      >
                                        <span className="truncate">
                                          {fileName || "No file selected"}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Issued */}
                                <div className="md:col-span-3">
                                  <MiniLabel>Issued</MiniLabel>
                                  <input
                                    type="date"
                                    value={d.issuedAt || ""}
                                    onChange={(e) =>
                                      updateNewDocField(idx, "issuedAt", e.target.value)
                                    }
                                    className={InputBase}
                                  />
                                </div>

                                {/* Expires */}
                                <div className="md:col-span-3">
                                  <MiniLabel>Expires</MiniLabel>
                                  <input
                                    type="date"
                                    value={d.expiresAt || ""}
                                    onChange={(e) =>
                                      updateNewDocField(idx, "expiresAt", e.target.value)
                                    }
                                    className={InputBase}
                                  />
                                </div>

                                {/* Small hint row */}
                                <div className="md:col-span-6 flex items-end">
                                  <div className="text-[11px] text-slate-500">
                                    Tip: Title auto-fills from file name if left empty.
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
              {/* -------------------------------------------------------- */}

              <div className="mt-auto sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm pt-4 pb-2 border-t border-slate-100 dark:border-slate-800 z-10 -mx-1 px-1">
                <div className="flex flex-wrap justify-center sm:justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => onClose(false)}
                    className="btn-outline w-full sm:w-auto"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="btn-primary w-full sm:w-auto px-6"
                  >
                    {savingProfile ? "Saving…" : "Update Employee Info"}
                  </button>
                </div>
              </div>
            </form>

            {/* RIGHT: Vault / Login */}
            <form onSubmit={handleSaveVault} className="space-y-5 flex flex-col h-full">
              <div>
                <h3 className="text-xs font-semibold tracking-wide text-slate-700 uppercase">
                  Vault / Login Info
                </h3>
                <p className="mt-1 text-[11px] text-slate-500">
                  Only admins and HR can change login access and reset password.
                </p>
              </div>

              <div className="space-y-4">
                <Field label="Login / Official Email:">
                  <input
                    type="email"
                    name="officialEmail"
                    value={vaultForm.officialEmail}
                    onChange={onVaultChange}
                    disabled={!canEditVault}
                    className={`w-full h-9 rounded border px-3 text-xs focus:outline-none focus:ring-1 ${canEditVault
                      ? "border-slate-300 focus:border-customRed focus:ring-customRed"
                      : "border-slate-200 bg-slate-50 text-slate-500"
                      }`}
                  />
                </Field>

                <Field label="User Type:">
                  <select
                    name="userType"
                    value={vaultForm.userType}
                    onChange={onVaultChange}
                    disabled={!canEditVault}
                    className={`w-full h-9 rounded border px-3 text-xs focus:outline-none focus:ring-1 ${canEditVault
                      ? "border-slate-300 focus:border-customRed focus:ring-customRed"
                      : "border-slate-200 bg-slate-50 text-slate-500"
                      }`}
                  >
                    <option value="">Select user type</option>
                    {lookups.userTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </Field>

                <div className="flex items-center justify-between">
                  <label className="inline-flex items-center gap-2 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      name="canLogin"
                      checked={vaultForm.canLogin}
                      onChange={onVaultChange}
                      disabled={!canEditVault}
                    />
                    <span>Allow this employee to log in</span>
                  </label>
                </div>

                {canEditVault && (
                  <Field label="Reset Password:">
                    <div className="space-y-2">
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={vaultForm.password}
                          onChange={onVaultChange}
                          placeholder="Leave blank to keep current password"
                          className="w-full h-9 rounded border border-slate-300 px-3 pr-10 text-xs focus:border-customRed focus:outline-none focus:ring-1 focus:ring-customRed"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute inset-y-0 right-0 flex items-center px-3 text-[11px] text-slate-500 hover:text-slate-700"
                        >
                          {showPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={handleGeneratePassword}
                        className="text-[11px] font-medium text-customRed hover:text-customRed/80"
                      >
                        Generate random password
                      </button>
                    </div>
                  </Field>
                )}

                {!canEditVault && (
                  <p className="text-[11px] text-slate-400">
                    You don't have permission to modify login credentials.
                  </p>
                )}
              </div>

              {/* Success Message */}
              {vaultSuccess && (
                <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <svg className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-emerald-900">Success!</h4>
                    <p className="mt-0.5 text-xs text-emerald-700">Vault information has been updated successfully.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setVaultSuccess(false)}
                    className="text-emerald-600 hover:text-emerald-800 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              <div className="mt-auto sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm pt-4 pb-2 border-t border-slate-100 dark:border-slate-800 z-10 -mx-1 px-1">
                <div className="flex flex-wrap justify-center sm:justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => onClose(false)}
                    className="btn-outline w-full sm:w-auto"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingVault || !canEditVault}
                    className="btn-primary w-full sm:w-auto px-6"
                  >
                    {savingVault ? "Updating…" : "Update Vault Info"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div >
    </div >
  );
}
