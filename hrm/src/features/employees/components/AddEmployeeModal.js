// src/features/employees/components/AddEmployeeModal.jsx
import React, { useEffect, useState } from "react";
import { FaTimes, FaEye, FaEyeSlash, FaPlus, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../../../utils/api";
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



export default function AddEmployeeModal({ open, onClose, onCreated, onSave }) {
  const [activeTab, setActiveTab] = useState("employment");
  const TABS = ["employment", "personal", "contact", "emails", "account", "documents"];
  const currentTabIndex = TABS.indexOf(activeTab);

  const validateTab = (tab) => {
    const suffix = " Please fill this first then go ahead.";
    switch (tab) {
      case "employment":
        if (!form.fullName.trim()) { toast.error("Full Name is required." + suffix); return false; }
        if (!form.designation) { toast.error("Designation is required." + suffix); return false; }
        if (!form.department) { toast.error("Department is required." + suffix); return false; }
        if (!form.station) { toast.error("Station / Office is required." + suffix); return false; }
        if (!form.status) { toast.error("Status is required." + suffix); return false; }
        if (!form.shiftId) { toast.error("Default Shift is required." + suffix); return false; }
        break;
      case "personal":
        if (!form.gender) { toast.error("Gender is required." + suffix); return false; }
        break;
      case "contact":
        if (!form.dateOfJoining) { toast.error("Date of Joining is required." + suffix); return false; }
        break;
      case "emails":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!form.personalEmail.trim()) { toast.error("Personal Email is required." + suffix); return false; }
        if (!emailRegex.test(form.personalEmail)) { toast.error("Invalid Personal Email."); return false; }
        if (!form.officialEmail.trim()) { toast.error("Official Email is required." + suffix); return false; }
        if (!emailRegex.test(form.officialEmail)) { toast.error("Invalid Official Email."); return false; }
        break;
      case "account":
        if (form.allowPortalLogin) {
          if (!form.password || form.password.length < 6) { toast.error("Password (min 6 chars) is required." + suffix); return false; }
          if (!form.userType) { toast.error("User Type is required." + suffix); return false; }
        }
        break;
      case "documents":
        // doc validation (optional but helpful)
        const anyDocHasFile = documents.some((d) => d.file);
        if (anyDocHasFile) {
          for (const d of documents) {
            if (d.file && !d.title.trim()) {
              toast.error("Document title is required when a file is selected.");
              return false;
            }
          }
        }
        break;
      default:
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateTab(activeTab)) return;
    if (currentTabIndex < TABS.length - 1) {
      setActiveTab(TABS[currentTabIndex + 1]);
    }
  };

  const handleBack = () => {
    if (currentTabIndex > 0) {
      setActiveTab(TABS[currentTabIndex - 1]);
    }
  };

  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [lookups, setLookups] = useState({
    stations: [],
    departments: [],
    designations: [],
    userTypes: [],
    shifts: [],
    statuses: [],
    employees: [],
    bloodGroups: [],
    religions: [],
    maritalStatuses: [],
  });

  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    // employment
    employeeCode: "", // auto-generated, read-only (shown)
    fullName: "",
    designation: "",
    department: "",
    station: "",
    status: "Active",

    // personal
    dateOfBirth: "",
    gender: "",
    bloodGroup: "",
    religion: "",
    maritalStatus: "",
    address: "",
    cnic: "",

    // job & contact
    dateOfJoining: "",
    personalContact: "",
    officialContact: "",
    emergencyContact: "",
    emergencyRelation: "",
    reportingTo: "",
    officialEmail: "",
    personalEmail: "",
    allowPortalLogin: true,
    password: "",
    userType: "",
    shiftId: "",
    profileImg: null,
    probation: "",
  });

  // ✅ documents state now includes file
  // array of { title, type, file, issuedAt, expiresAt }
  const [documents, setDocuments] = useState([]);

  // ----------------------------------------------------
  // helpers
  // ----------------------------------------------------
  const updateField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const canAddMoreDocs = documents.length < 10;

  const addDocumentRow = () => {
    if (!canAddMoreDocs) return;
    setDocuments((prev) => [
      ...prev,
      { title: "", type: "", file: null, issuedAt: "", expiresAt: "" },
    ]);
  };

  const removeDocumentRow = (idx) => {
    setDocuments((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateDocumentField = (idx, field, value) => {
    setDocuments((prev) =>
      prev.map((doc, i) => (i === idx ? { ...doc, [field]: value } : doc))
    );
  };

  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [statRes, deptRes, desRes, typeRes, shiftRes, stRes, empRes, bgRes, relRes, msRes] = await Promise.all([
          api.get("/employees/lookups/stations"),
          api.get("/employees/lookups/departments"),
          api.get("/employees/lookups/designations"),
          api.get("/employees/lookups/user-types"),
          api.get("/attendance/settings/shifts"),
          api.get("/employees/lookups/statuses"),
          api.get("/employees/lookups/basic"),
          api.get("/settings/blood-groups?active_only=true"),
          api.get("/settings/religions?active_only=true"),
          api.get("/settings/marital-statuses?active_only=true"),
        ]);
        setLookups({
          stations: statRes.data || [],
          departments: deptRes.data || [],
          designations: desRes.data || [],
          userTypes: typeRes.data || [],
          shifts: shiftRes.data?.shifts || [],
          statuses: stRes.data || [],
          employees: empRes.data || [],
          bloodGroups: (bgRes.data || []).map(i => i.name),
          religions: (relRes.data || []).map(i => i.name),
          maritalStatuses: (msRes.data || []).map(i => i.name),
        });
      } catch (err) {
        console.error("Failed to fetch lookups", err);
        toast.error("Failed to load dropdown options.");
      }
    };
    if (open) fetchLookups();
  }, [open]);

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    // Final Submission: Validate ALL tabs before creating employee
    for (const tab of TABS) {
      if (!validateTab(tab)) {
        setActiveTab(tab); // Go to the first invalid tab
        return;
      }
    }

    // 3. Show confirmation before final save
    const ok = window.confirm(`Are you sure you want to onboard ${form.fullName}?`);
    if (!ok) return;

    setLoading(true);
    try {
      const formData = new FormData();

      // Append all form fields
      Object.keys(form).forEach((key) => {
        if (key === "profileImg") {
          if (form[key]) {
            formData.append("avatar", form[key]);
          }
        } else if (form[key] !== null && form[key] !== undefined) {
          formData.append(key, form[key]);
        }
      });

      const res = await api.post("/employees", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const created = res.data;
      setSuccessData(created);
      setIsSuccess(true);

      const code = created?.employeeCode || "(auto)";
      toast.success(`Employee created successfully. ID: ${code}`);

      // if backend generated code, show it in the form until modal closes
      if (!form.employeeCode && created?.employeeCode) {
        setForm((prev) => ({ ...prev, employeeCode: created.employeeCode }));
      }

      const docsToUpload = documents.filter((d) => d.file);
      if (created?.id && docsToUpload.length > 0) {
        const fd = new FormData();
        docsToUpload.forEach((d) => {
          fd.append("documents", d.file);
          fd.append("titles", d.title.trim());
          fd.append("types", d.type || "");
          fd.append("issued_at", d.issuedAt || "");
          fd.append("expires_at", d.expiresAt || "");
        });

        await api.post(`/employees/${created.id}/documents`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        toast.success(`Uploaded ${docsToUpload.length} document(s).`);
      }

      if (typeof onCreated === "function") {
        onCreated(created);
      } else if (typeof onSave === "function") {
        onSave(created);
      }
    } catch (err) {
      console.error("Create employee error:", err);
      const msg = err?.response?.data?.message || err?.message || "Failed to create employee. Please check data and try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    onClose?.();
  };

  if (!open) return null;

  const handleFormKeyDown = (e) => {
    if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
      e.preventDefault();
      if (activeTab !== "documents") {
        handleNext();
      } else {
        handleSubmit();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-white rounded-[32px] shadow-2xl overflow-hidden border border-white/20">

        {isSuccess ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-sm border border-emerald-200">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-2">Employee Added!</h2>
            <p className="text-slate-500 max-w-md mb-8">
              New employee <span className="font-bold text-slate-800">{successData?.fullName || successData?.name}</span> has been successfully onboarded with ID <span className="text-customRed font-bold">{successData?.employeeCode}</span>.
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setForm({
                    employeeCode: "", fullName: "", designation: "", department: "", station: "", status: "Active",
                    dateOfBirth: "", gender: "", bloodGroup: "", religion: "", maritalStatus: "", address: "", cnic: "",
                    dateOfJoining: "", personalContact: "", officialContact: "", emergencyContact: "", emergencyRelation: "",
                    reportingTo: "", officialEmail: "", personalEmail: "", allowPortalLogin: true, password: "", userType: "", shiftId: "",
                    profileImg: null, probation: "",
                  });
                  setDocuments([]);
                  setIsSuccess(false);
                  setActiveTab("employment");
                }}
                className="btn-success h-11 px-8 rounded-2xl shadow-emerald-500/20"
              >
                Add Another
              </button>
              <button
                onClick={handleClose}
                className="btn-outline h-11 px-8 rounded-2xl"
              >
                Return to List
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="modal-header shrink-0">
              <div>
                <h2 className="h2 text-slate-900">Add New Employee</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Onboarding Process</p>
              </div>
              <button
                onClick={handleClose}
                className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
              >
                <FaTimes size={18} />
              </button>
            </div>

            {/* Tabs Navigation - Segmented Control */}
            <div className="px-5 sm:px-8 py-4 bg-white border-b border-slate-50 shrink-0">
              <div className="flex sm:grid sm:grid-cols-3 lg:grid-cols-6 gap-1.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 overflow-x-auto no-scrollbar">
                {[
                  { id: "employment", label: "Employment" },
                  { id: "personal", label: "Personal" },
                  { id: "contact", label: "Contact" },
                  { id: "emails", label: "Emails" },
                  { id: "account", label: "Account" },
                  { id: "documents", label: "Documents" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      const targetIdx = TABS.indexOf(t.id);
                      if (targetIdx < currentTabIndex) {
                        setActiveTab(t.id);
                      } else if (targetIdx > currentTabIndex) {
                        if (validateTab(activeTab)) setActiveTab(t.id);
                      }
                    }}
                    className={`flex-shrink-0 min-w-[100px] sm:min-w-0 py-2.5 text-[10px] font-extrabold uppercase tracking-wide rounded-xl transition-all duration-300 ${activeTab === t.id
                      ? "bg-white text-customRed shadow-sm ring-1 ring-black/5"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                      }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-body flex-1 overflow-y-auto min-h-0 custom-scrollbar">
              <form id="add-employee-form" onKeyDown={handleFormKeyDown}>
                {/* Employment Tab */}
                {activeTab === "employment" && (
                  <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="section-divider">
                      <div className="section-indicator" />
                      <h3 className="section-title">Employment Details</h3>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                      <Field label="Employee ID / Code (auto)">
                        <input type="text" className="input bg-slate-100 text-slate-500" value={form.employeeCode || "Will be generated on save"} disabled />
                      </Field>
                      <Field label="Full Name" required>
                        <input type="text" className="input" value={form.fullName} onChange={(e) => updateField("fullName", e.target.value)} />
                      </Field>
                      <Field label="Designation" required>
                        <SharedDropdown
                          options={lookups.designations}
                          value={form.designation}
                          onChange={(val) => updateField("designation", val)}
                          placeholder="Select Designation"
                          searchable={true}
                        />
                      </Field>
                      <Field label="Department" required>
                        <SharedDropdown
                          options={lookups.departments}
                          value={form.department}
                          onChange={(val) => updateField("department", val)}
                          placeholder="Select Department"
                          searchable={true}
                        />
                      </Field>
                      <Field label="Station / Office" required>
                        <SharedDropdown
                          options={lookups.stations}
                          value={form.station}
                          onChange={(val) => updateField("station", val)}
                          placeholder="Select Station"
                          searchable={true}
                        />
                      </Field>
                      <Field label="Status" required>
                        <SharedDropdown
                          options={lookups.statuses.length > 0 ? lookups.statuses : ["Active", "Probation", "Left", "On Hold"]}
                          value={form.status}
                          onChange={(val) => updateField("status", val)}
                          placeholder="Select Status"
                          searchable={true}
                        />
                      </Field>
                      <Field label="Probation Period">
                        <input type="text" placeholder="e.g. 3 Months" className="input" value={form.probation} onChange={(e) => updateField("probation", e.target.value)} />
                      </Field>
                      <Field label="Default Shift" required>
                        <SharedDropdown
                          options={lookups.shifts.map(s => ({ value: s.id, label: `${s.name} (${s.start_time} - ${s.end_time})` }))}
                          value={form.shiftId}
                          onChange={(val) => updateField("shiftId", val)}
                          placeholder="Select Shift"
                          searchable={true}
                        />
                      </Field>
                    </div>
                  </section>
                )}

                {/* Personal Information Tab */}
                {activeTab === "personal" && (
                  <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="section-divider">
                      <div className="section-indicator" />
                      <h3 className="section-title">Personal Information</h3>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                      <Field label="Date of Birth">
                        <input type="date" className="input" value={form.dateOfBirth} onChange={(e) => updateField("dateOfBirth", e.target.value)} />
                      </Field>
                      <Field label="Gender" required>
                        <SharedDropdown
                          options={["Male", "Female", "Other"]}
                          value={form.gender}
                          onChange={(val) => updateField("gender", val)}
                          placeholder="Select Gender"
                          searchable={true}
                        />
                      </Field>
                      <Field label="Blood Group">
                        <SharedDropdown
                          options={lookups.bloodGroups}
                          value={form.bloodGroup}
                          onChange={(val) => updateField("bloodGroup", val)}
                          placeholder="Select Blood Group"
                          searchable={true}
                        />
                      </Field>
                      <Field label="Religion">
                        <SharedDropdown
                          options={lookups.religions}
                          value={form.religion}
                          onChange={(val) => updateField("religion", val)}
                          placeholder="Select Religion"
                          searchable={true}
                        />
                      </Field>
                      <Field label="Marital Status">
                        <SharedDropdown
                          options={lookups.maritalStatuses}
                          value={form.maritalStatus}
                          onChange={(val) => updateField("maritalStatus", val)}
                          placeholder="Select Status"
                          searchable={true}
                        />
                      </Field>
                      <Field label="CNIC">
                        <input type="text" className="input" value={form.cnic} onChange={(e) => updateField("cnic", e.target.value)} />
                      </Field>
                      <Field label="Profile Image">
                        <input type="file" accept="image/*" className="input h-auto py-1" onChange={(e) => updateField("profileImg", e.target.files[0])} />
                      </Field>
                    </div>
                    <div className="mt-6">
                      <Field label="Address">
                        <textarea className="w-full min-h-[70px] rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-customRed focus:outline-none shadow-sm" value={form.address} onChange={(e) => updateField("address", e.target.value)} />
                      </Field>
                    </div>
                  </section>
                )}

                {/* Contact Information Tab */}
                {activeTab === "contact" && (
                  <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="section-divider">
                      <div className="section-indicator" />
                      <h3 className="section-title">Job & Contact Details</h3>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                      <Field label="Date of Joining" required>
                        <input type="date" className="h-9 w-full rounded border border-slate-300 px-3 text-sm focus:border-customRed focus:outline-none" value={form.dateOfJoining} onChange={(e) => updateField("dateOfJoining", e.target.value)} />
                      </Field>
                      <Field label="Personal Contact">
                        <input type="text" className="h-9 w-full rounded border border-slate-300 px-3 text-sm focus:border-customRed focus:outline-none" value={form.personalContact} onChange={(e) => updateField("personalContact", e.target.value)} />
                      </Field>
                      <Field label="Official Contact">
                        <input type="text" className="h-9 w-full rounded border border-slate-300 px-3 text-sm focus:border-customRed focus:outline-none" value={form.officialContact} onChange={(e) => updateField("officialContact", e.target.value)} />
                      </Field>
                      <Field label="Emergency Contact">
                        <input type="text" className="h-9 w-full rounded border border-slate-300 px-3 text-sm focus:border-customRed focus:outline-none" value={form.emergencyContact} onChange={(e) => updateField("emergencyContact", e.target.value)} />
                      </Field>
                      <Field label="Emergency Relation">
                        <input type="text" className="h-9 w-full rounded border border-slate-300 px-3 text-sm focus:border-customRed focus:outline-none" value={form.emergencyRelation} onChange={(e) => updateField("emergencyRelation", e.target.value)} />
                      </Field>
                      <Field label="Reporting To">
                        <SharedDropdown
                          options={lookups.employees.map(emp => ({ value: emp.Employee_Name, label: `${emp.Employee_Name} (${emp.Employee_ID})` }))}
                          value={form.reportingTo}
                          onChange={(val) => updateField("reportingTo", val)}
                          placeholder="Select Manager (Optional)"
                          searchable={true}
                        />
                      </Field>
                    </div>
                  </section>
                )}

                {/* Emails Tab */}
                {activeTab === "emails" && (
                  <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="section-divider">
                      <div className="section-indicator" />
                      <h3 className="section-title">Email Addresses</h3>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="p-6 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                        <Field label="Personal Email Address" required>
                          <input
                            type="email"
                            className="h-10 w-full rounded-xl border border-slate-300 px-4 text-sm focus:border-customRed focus:outline-none shadow-sm"
                            value={form.personalEmail}
                            onChange={(e) => updateField("personalEmail", e.target.value)}
                            placeholder="e.g. user@gmail.com"
                          />
                          <p className="mt-2 text-[10px] text-slate-500 italic">Used for attendance alerts and personal notifications.</p>
                        </Field>
                      </div>

                      <div className="p-6 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                        <Field label="Official Email Address" required>
                          <input
                            type="email"
                            className="h-10 w-full rounded-xl border border-slate-300 px-4 text-sm focus:border-customRed focus:outline-none shadow-sm"
                            value={form.officialEmail}
                            onChange={(e) => updateField("officialEmail", e.target.value)}
                            placeholder="e.g. name@company.com"
                          />
                          <p className="mt-2 text-[10px] text-slate-500 italic">Used for system login and official communications.</p>
                        </Field>
                      </div>
                    </div>
                  </section>
                )}

                {/* Account & Portal Tab */}
                {activeTab === "account" && (
                  <section className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
                    <div className="section-divider">
                      <div className="section-indicator" />
                      <h3 className="section-title">Account & Portal Access</h3>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <Field label="Password" required={form.allowPortalLogin}>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            className="h-10 w-full rounded-xl border border-slate-300 px-4 text-sm pr-10 focus:border-customRed focus:outline-none"
                            value={form.password}
                            onChange={(e) => updateField("password", e.target.value)}
                            disabled={!form.allowPortalLogin}
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                            onClick={() => setShowPassword((s) => !s)}
                            tabIndex={-1}
                          >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                      </Field>
                      <Field label="User Type / Permission Level" required>
                        <SharedDropdown
                          options={lookups.userTypes}
                          value={form.userType}
                          onChange={(val) => updateField("userType", val)}
                          placeholder="Select User Type"
                          disabled={!form.allowPortalLogin}
                          searchable={true}
                        />
                      </Field>
                    </div>
                    <div className="mt-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
                      <input type="checkbox" id="allowLogin" className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500" checked={form.allowPortalLogin} onChange={(e) => updateField("allowPortalLogin", e.target.checked)} />
                      <label htmlFor="allowLogin" className="text-xs font-bold text-emerald-800 uppercase tracking-wider cursor-pointer">Enable Portal Login for this Employee</label>
                    </div>
                  </section>
                )}

                {/* Documents Tab */}
                {activeTab === "documents" && (
                  <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center justify-between section-divider">
                      <div className="flex items-center gap-3">
                        <div className="section-indicator" />
                        <h3 className="section-title">Employee Documents</h3>
                      </div>
                      <button type="button" onClick={addDocumentRow} disabled={!canAddMoreDocs} className="btn-outline h-8 px-4 text-[10px] uppercase font-bold tracking-widest">
                        <FaPlus className="mr-2" />
                        Add Document
                      </button>
                    </div>
                    {documents.length === 0 ? (
                      <p className="text-xs text-slate-500">
                        No documents added yet. You can add up to 10 documents (CNIC,
                        Offer Letter, Contract, etc.).
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {documents.map((doc, idx) => (
                          <div
                            key={idx}
                            className="p-4 sm:p-5 bg-slate-50/50 rounded-2xl border border-slate-200 hover:border-slate-300 transition-colors shadow-sm"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-end">
                              <Field label="Document Title">
                                <input
                                  type="text"
                                  className="h-10 w-full rounded-xl border border-slate-300 px-4 text-xs focus:border-customRed focus:outline-none shadow-sm"
                                  value={doc.title}
                                  onChange={(e) => updateDocumentField(idx, "title", e.target.value)}
                                  placeholder="e.g. CNIC, Contract"
                                />
                              </Field>

                              <Field label="Doc Type">
                                <SharedDropdown
                                  options={DOC_TYPES}
                                  value={doc.type}
                                  onChange={(val) => updateDocumentField(idx, "type", val)}
                                  placeholder="Select Type"
                                  searchable={true}
                                />
                              </Field>

                              <Field label="File Upload">
                                <div className="relative group">
                                  <label className="flex h-10 w-full cursor-pointer items-center justify-between rounded-xl border border-slate-300 bg-white px-4 text-[11px] font-bold text-slate-600 hover:border-customRed hover:bg-slate-50 transition-all shadow-sm">
                                    <span className="truncate max-w-[120px]">
                                      {doc.file ? doc.file.name : "Choose File"}
                                    </span>
                                    <div className="h-6 w-6 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-customRed/10 group-hover:text-customRed">
                                      <FaPlus size={10} />
                                    </div>
                                    <input
                                      type="file"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0] || null;
                                        updateDocumentField(idx, "file", file);
                                        if (file && !doc.title.trim()) {
                                          updateDocumentField(idx, "title", file.name);
                                        }
                                      }}
                                    />
                                  </label>
                                </div>
                              </Field>

                              <Field label="Issued Date">
                                <input
                                  type="date"
                                  className="h-10 w-full rounded-xl border border-slate-300 px-3 text-xs focus:border-customRed focus:outline-none shadow-sm"
                                  value={doc.issuedAt || ""}
                                  onChange={(e) => updateDocumentField(idx, "issuedAt", e.target.value)}
                                />
                              </Field>

                              <Field label="Expiry Date">
                                <input
                                  type="date"
                                  className="h-10 w-full rounded-xl border border-slate-300 px-3 text-xs focus:border-customRed focus:outline-none shadow-sm"
                                  value={doc.expiresAt || ""}
                                  onChange={(e) => updateDocumentField(idx, "expiresAt", e.target.value)}
                                />
                              </Field>

                              <div className="flex h-10 items-center">
                                <button
                                  type="button"
                                  onClick={() => removeDocumentRow(idx)}
                                  className="h-10 w-10 inline-flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 transition-all border border-red-100"
                                  title="Remove document"
                                >
                                  <FaTrash size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                )}
              </form>
            </div>

            {/* Modal Footer Navigation */}
            <div className="modal-footer justify-between shadow-2xl border-t bg-slate-50/50 shrink-0">
              <div className="flex gap-3">
                {currentTabIndex > 0 && (
                  <button type="button" onClick={handleBack} className="btn-outline px-8 h-11 rounded-2xl">Back</button>
                )}
                {currentTabIndex === 0 && (
                  <button type="button" onClick={handleClose} className="btn-outline px-8 h-11 rounded-2xl">Cancel</button>
                )}
              </div>
              <div className="flex gap-3">
                {currentTabIndex < TABS.length - 1 ? (
                  <button type="button" onClick={handleNext} className="btn-primary px-12 h-11 rounded-2xl">Next Step</button>
                ) : (
                  <button type="button" onClick={handleSubmit} disabled={loading} className="btn-success px-12 h-11 rounded-2xl">
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </div>
                    ) : (
                      "Finish & Save"
                    )}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div className="text-sm">
      <Label required={required}>{label}</Label>
      {children}
    </div>
  );
}

function Label({ children, required }) {
  return (
    <label className="block mb-1 text-xs font-medium text-slate-700">
      {children}
      {required && <span className="text-red-500 align-middle ml-0.5">*</span>}
    </label>
  );
}
