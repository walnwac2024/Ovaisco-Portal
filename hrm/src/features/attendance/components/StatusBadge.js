import React from "react";
import { CircleCheck, CircleX, Clock, CircleMinus, CircleAlert } from "lucide-react";

export default function StatusBadge({ status = "Pending" }) {
  const s = String(status).toUpperCase();

  let cls = "bg-slate-50 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700";
  let Icon = CircleMinus;

  if (s === "APPROVED" || s === "PRESENT") {
    cls = "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20";
    Icon = CircleCheck;
  } else if (s === "REJECTED" || s === "ABSENT") {
    cls = "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20";
    Icon = CircleX;
  } else if (s === "LATE") {
    cls = "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20";
    Icon = Clock;
  } else if (s === "PENDING" || s === "NOT_MARKED") {
    cls = "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20";
    Icon = Clock;
  } else if (s === "UNMARKED") {
    cls = "bg-slate-50 text-slate-500 ring-slate-100 dark:bg-slate-800 dark:text-slate-500 dark:ring-slate-700";
    Icon = CircleMinus;
  } else if (s === "HOLIDAY" || s === "OFF_DAY") {
    cls = "bg-blue-50 text-blue-700 ring-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20";
    Icon = CircleAlert;
  } else if (s === "LEAVE") {
    cls = "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20";
    Icon = CircleCheck;
  } else if (s === "MISSING_CHECKOUT") {
    cls = "bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:ring-orange-500/20";
    Icon = CircleAlert;
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ring-1 ${cls}`}>
      <Icon className="h-3 w-3" />
      {status}
    </span>
  );
}
