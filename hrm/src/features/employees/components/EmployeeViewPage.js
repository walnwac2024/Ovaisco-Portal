// src/features/employees/components/EmployeeViewPage.jsx
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import useEmployee from "../hooks/useEmployee";
import api, { BASE_URL } from "../../../utils/api";

function InfoRow({ label, value, right }) {
  return (
    <div className="flex justify-between gap-4 text-[13px]">
      <dt className="text-slate-500">{label}</dt>
      <dd className={`text-slate-900 ${right ? "text-right min-w-[130px]" : ""}`}>
        {value || "—"}
      </dd>
    </div>
  );
}

export default function EmployeeViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { employee, loading, error } = useEmployee(id);

  // 🔑 Build file base URL (for /uploads/* view)
  const FILE_BASE = BASE_URL;

  const handleDownload = async (doc) => {
    try {
      // Call backend forced-download endpoint (returns attachment)
      const res = await api.get(`/employees/${id}/documents/${doc.id}/download`, {
        responseType: "blob",
      });

      // Try to get filename from Content-Disposition
      const cd = res.headers?.["content-disposition"] || "";
      const match = cd.match(/filename="([^"]+)"/i);
      const fallback = doc?.title ? `${doc.title}` : "document";
      const extFromPath = doc?.path ? doc.path.split(".").pop() : "";
      const fileName =
        match?.[1] || (extFromPath ? `${fallback}.${extFromPath}` : fallback);

      const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.error("Download failed", e);
      alert("Download failed. Check console.");
    }
  };

  if (loading) {
    return <div className="p-8 text-sm text-slate-600">Loading employee…</div>;
  }

  if (error) {
    return (
      <div className="p-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 btn-ghost h-10 px-4"
        >
          ← Back
        </button>

        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">
          {error}
        </div>
      </div>
    );
  }

  if (!employee) {
    return <div className="p-8 text-sm text-slate-600">Employee not found.</div>;
  }

  const initials = employee.name
    ?.split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0])
    .join("")
    .toUpperCase();

  const statusText = employee.status || "—";
  const statusLower = statusText.toLowerCase();

  let statusDotClass = "bg-amber-500";
  if (statusLower === "active") statusDotClass = "bg-emerald-500";
  else if (statusLower === "left" || statusLower === "inactive")
    statusDotClass = "bg-red-500";

  const avatarUrl = employee.profile_picture
    ? `${FILE_BASE}${employee.profile_picture}`
    : null;

  const documents = Array.isArray(employee.documents) ? employee.documents : [];

  // ✅ small helper to clean ISO date -> YYYY-MM-DD
  const fmtDate = (v) => {
    if (!v) return "—";
    const s = String(v);
    const m = s.match(/^\d{4}-\d{2}-\d{2}/);
    return m ? m[0] : s;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-5xl px-4 pt-6 pb-10">
        {/* BACK BUTTON */}
        <button
          onClick={() => navigate(-1)}
          className="mb-4 btn-ghost h-10 px-4"
        >
          ← Back
        </button>

        {/* CARD */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          {/* TOP */}
          <div className="relative px-6 pt-6 pb-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-customRed/10 via-rose-50 to-white dark:from-customRed/20 dark:via-slate-900 dark:to-slate-900">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              {/* Avatar + Name */}
              <div className="flex items-center gap-4">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={employee.name}
                    className="h-14 w-14 rounded-full object-cover border border-slate-200 shadow-md bg-white"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-md text-sm font-semibold text-slate-700 border border-slate-200">
                    {initials || "—"}
                  </div>
                )}

                <div>
                  <div className="flex flex-wrap items-center gap-1">
                    <h1 className="text-lg font-semibold text-slate-900">
                      {employee.name}
                    </h1>
                    {employee.employeeCode && (
                      <span className="text-xs font-medium text-slate-500">
                        ({employee.employeeCode})
                      </span>
                    )}
                  </div>

                  <p className="mt-0.5 text-xs md:text-sm text-slate-600">
                    {employee.designation || "—"}
                    <span className="mx-1 text-slate-400">·</span>
                    {employee.department || "—"}
                    <span className="mx-1 text-slate-400">·</span>
                    {employee.station || "—"}
                  </p>
                </div>
              </div>

              {/* STATUS */}
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full bg-white dark:bg-slate-800 px-3 py-1 border border-slate-200 dark:border-slate-700 text-[11px] font-medium">
                  <span className={`mr-2 h-2 w-2 rounded-full ${statusDotClass}`} />
                  Status:
                  <span className="ml-1 text-slate-900 dark:text-white">{statusText}</span>
                </span>

                {employee.cnic && (
                  <span className="inline-flex items-center rounded-full bg-white dark:bg-slate-800 px-3 py-1 border border-slate-200 dark:border-slate-700 text-[11px] font-medium">
                    CNIC:
                    <span className="ml-1 text-slate-900 dark:text-white">{employee.cnic}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* BODY */}
          <div className="px-6 py-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* PERSONAL */}
              <section>
                <h2 className="mb-3 text-xs font-semibold tracking-wide text-slate-700 uppercase">
                  PERSONAL INFORMATION
                </h2>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-4 py-4 shadow-sm">
                  <div className="grid gap-2">
                    <InfoRow label="Date of Birth" value={employee.dateOfBirth} />
                    <InfoRow label="Gender" value={employee.gender} />
                    <InfoRow label="Blood Group" value={employee.bloodGroup} />
                    <InfoRow label="CNIC" value={employee.cnic} />
                    <InfoRow label="Address" value={employee.address} />
                  </div>
                </div>
              </section>

              {/* JOB */}
              <section>
                <h2 className="mb-3 text-xs font-semibold tracking-wide text-slate-700 uppercase">
                  JOB & CONTACT
                </h2>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-4 py-4 shadow-sm">
                  <div className="grid gap-2">
                    <InfoRow label="Date of Joining" value={employee.dateOfJoining} right />
                    <InfoRow label="Official Email" value={employee.emailOfficial} right />
                    <InfoRow label="Personal Email" value={employee.emailPersonal} right />
                    <InfoRow label="Contact" value={employee.contact} right />
                    <InfoRow
                      label="Emergency Contact"
                      value={employee.emergencyContact}
                      right
                    />
                  </div>
                </div>
              </section>
            </div>

            {/* ✅ DOCUMENTS (ONLY THIS SECTION DESIGN CHANGED) */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold tracking-wide text-slate-700 uppercase">
                  DOCUMENTS
                </h2>
                <span className="text-[11px] text-slate-500">
                  {documents.length} file{documents.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4 shadow-sm">
                {documents.length === 0 ? (
                  <div className="text-xs text-slate-500">No documents uploaded.</div>
                ) : (
                  <div className="space-y-3">
                    {documents.map((doc) => {
                      const viewUrl = doc.path ? `${FILE_BASE}${doc.path}` : "#";

                      return (
                        <div
                          key={doc.id}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            {/* left */}
                            <div className="min-w-0 flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 shrink-0">
                                📄
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="font-semibold text-sm text-slate-900 truncate">
                                    {doc.title || "Document"}
                                  </div>

                                  {doc.type ? (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-slate-200 text-slate-600 bg-white">
                                      {doc.type}
                                    </span>
                                  ) : null}
                                </div>

                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                                  <span>
                                    <span className="text-slate-400">Issued:</span>{" "}
                                    <span className="text-slate-700">{fmtDate(doc.issuedAt)}</span>
                                  </span>
                                  <span className="text-slate-300">•</span>
                                  <span>
                                    <span className="text-slate-400">Expires:</span>{" "}
                                    <span className="text-slate-700">{fmtDate(doc.expiresAt)}</span>
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* right actions */}
                            <div className="shrink-0 flex items-center gap-2">
                              <a
                                href={viewUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="btn-outline h-10 px-4"
                              >
                                View
                              </a>

                              <button
                                type="button"
                                onClick={() => handleDownload(doc)}
                                className="btn-primary h-10 px-4"
                              >
                                Download
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* FOOTER META */}
            <div className="mt-6 border-t border-slate-200 pt-3 flex flex-wrap items-center justify-between text-[11px] text-slate-600">
              <div>
                Employee ID:{" "}
                <span className="font-medium text-slate-900">
                  {employee.employeeCode}
                </span>
              </div>

              <div className="flex flex-wrap gap-4">
                {employee.department && (
                  <span>
                    Department:{" "}
                    <span className="font-medium text-slate-900">
                      {employee.department}
                    </span>
                  </span>
                )}

                {employee.station && (
                  <span>
                    Station:{" "}
                    <span className="font-medium text-slate-900">
                      {employee.station}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
