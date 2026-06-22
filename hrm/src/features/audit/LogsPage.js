import React, { useState, useEffect, useCallback } from "react";
import api, { BASE_URL } from "../../utils/api";
import {
    FaKey,
    FaCog,
    FaSignInAlt,
    FaShieldAlt,
    FaSearch,
    FaFilter,
    FaCalendarAlt,
    FaChevronRight,
    FaUserShield,
    FaExclamationCircle,
    FaCheckCircle,
    FaHistory,
    FaDatabase,
    FaUserLock,
    FaFingerprint
} from "react-icons/fa";
import { toast } from "react-toastify";

const CATEGORY_MAP = {
    "Access Changes": { icon: FaKey, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", glow: "shadow-blue-500/20" },
    "Permission Updates": { icon: FaShieldAlt, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20", glow: "shadow-purple-500/20" },
    "Login Attempts": { icon: FaSignInAlt, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", glow: "shadow-emerald-500/20" },
    "System": { icon: FaCog, color: "text-slate-500", bg: "bg-slate-500/10", border: "border-slate-500/20", glow: "shadow-slate-500/20" },
};

export default function LogsPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterOptions, setFilterOptions] = useState({ categories: [], departments: [] });
    const [filters, setFilters] = useState({
        category: "",
        department: "",
        startDate: "",
        endDate: "",
        search: "",
        page: 1,
    });
    const [pagination, setPagination] = useState({ totalPages: 1 });

    const fetchLogs = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await api.get("/audit/logs", { params: filters });
            setLogs(data.logs);
            setPagination(data.pagination);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load logs");
        } finally {
            setLoading(false);
        }
    }, [filters]);

    const fetchFilters = async () => {
        try {
            const { data } = await api.get("/audit/filters");
            setFilterOptions(data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    useEffect(() => {
        fetchFilters();
    }, []);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
    };

    const getActorAvatar = (log) => {
        if (log.actor_avatar) {
            return log.actor_avatar.startsWith("http")
                ? log.actor_avatar
                : `${BASE_URL}${log.actor_avatar.startsWith("/") ? log.actor_avatar : `/${log.actor_avatar}`}`;
        }
        return null;
    };

    const parseDetails = (details) => {
        if (!details) return {};
        try {
            return typeof details === "string" ? JSON.parse(details) : details;
        } catch (e) {
            console.error("Parse Error", e);
            return {};
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/30 p-4 sm:p-8 animate-in fade-in duration-1000">
            {/* Header Section */}
            <div className="max-w-7xl mx-auto mb-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-2xl bg-customRed flex items-center justify-center text-white shadow-lg shadow-customRed/20">
                                <FaHistory className="animate-pulse" />
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Audit <span className="text-customRed">Logs</span></h1>
                        </div>
                        <p className="text-slate-500 font-medium max-w-lg">Track every system pulse and authority action across the WorkSphere ecosystem.</p>
                    </div>

                    <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white rounded-full shadow-sm border border-slate-100">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            <span className="hidden sm:inline">Live Monitoring Active</span>
                            <span className="sm:hidden">Live</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modern Filter Bar */}
            <div className="max-w-7xl mx-auto mb-16">
                <div className="bg-white/80 backdrop-blur-2xl border border-white shadow-2xl shadow-slate-200/50 rounded-3xl sm:rounded-[40px] p-4 sm:p-6 transition-all hover:shadow-customRed/5">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-center">

                        {/* Search */}
                        <div className="lg:col-span-4 relative group">
                            <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-customRed transition-colors text-xs" />
                            <input
                                type="text"
                                name="search"
                                placeholder="Search actor, action or ID..."
                                value={filters.search}
                                onChange={handleFilterChange}
                                className="w-full pl-12 pr-6 py-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-customRed/5 focus:border-customRed focus:bg-white transition-all outline-none"
                            />
                        </div>

                        {/* Selects Container */}
                        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:flex items-center gap-3 sm:gap-4">
                            <div className="relative">
                                <FaFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none" />
                                <select
                                    name="category"
                                    value={filters.category}
                                    onChange={handleFilterChange}
                                    className="w-full lg:w-48 pl-10 pr-4 py-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-customRed/5 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="">All Categories</option>
                                    {filterOptions.categories.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="relative">
                                <FaDatabase className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none" />
                                <select
                                    name="department"
                                    value={filters.department}
                                    onChange={handleFilterChange}
                                    className="w-full lg:w-48 pl-10 pr-4 py-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-customRed/5 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="">All Departments</option>
                                    {filterOptions.departments.map((dept) => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Date Pickers */}
                            <div className="flex items-center gap-3 bg-slate-50/50 border border-slate-100 rounded-2xl px-5 py-3.5 transition-all hover:bg-white sm:col-span-2 lg:col-auto">
                                <FaCalendarAlt className="text-slate-300 text-xs shrink-0" />
                                <div className="flex items-center gap-2 w-full">
                                    <input
                                        type="date"
                                        name="startDate"
                                        value={filters.startDate}
                                        onChange={handleFilterChange}
                                        className="bg-transparent text-[10px] font-bold outline-none uppercase w-full"
                                    />
                                    <span className="text-slate-200">|</span>
                                    <input
                                        type="date"
                                        name="endDate"
                                        value={filters.endDate}
                                        onChange={handleFilterChange}
                                        className="bg-transparent text-[10px] font-bold outline-none uppercase w-full"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tree Visualization */}
            <div className="relative max-w-6xl mx-auto px-4 pb-32">
                {/* The Vertical Spine */}
                <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-gradient-to-b from-slate-200 via-slate-200 to-transparent -translate-x-1/2 rounded-full hidden md:block" />

                {loading && logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-6">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full border-[6px] border-slate-100 border-t-customRed animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-12 h-12 rounded-full bg-slate-50 shadow-inner" />
                            </div>
                        </div>
                        <p className="text-slate-900 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Syncing Timeline...</p>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-48 bg-white/40 rounded-[60px] border border-dashed border-slate-300">
                        <div className="w-24 h-24 bg-slate-100 rounded-[40px] flex items-center justify-center mx-auto mb-8 animate-bounce transition-transform">
                            <FaFingerprint className="text-4xl text-slate-300" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800">No signals detected</h3>
                        <p className="text-slate-500 font-medium mt-3">Try clearing your filters to see the full timeline.</p>
                        <button
                            onClick={() => setFilters({ category: "", department: "", startDate: "", endDate: "", search: "", page: 1 })}
                            className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-customRed transition-all shadow-xl"
                        >
                            Reset Filters
                        </button>
                    </div>
                ) : (
                    <div className="space-y-24 relative z-10">
                        {logs.map((log, index) => {
                            const meta = CATEGORY_MAP[log.category] || CATEGORY_MAP["System"];
                            const Icon = meta.icon;
                            const isEven = index % 2 === 0;
                            const details = parseDetails(log.details);

                            return (
                                <div
                                    key={log.id}
                                    className={`flex flex-col md:flex-row items-center gap-6 md:gap-12 group transition-all duration-700 perspective-1000 ${isEven ? "md:flex-row" : "md:flex-row-reverse"
                                        }`}
                                >
                                    {/* Central Node Visual */}
                                    <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center z-20 hidden md:flex">
                                        <div className={`w-8 h-8 rounded-full border-4 border-white shadow-2xl transition-all duration-500 group-hover:scale-150 group-hover:rotate-[360deg] ${meta.bg} ${meta.color} flex items-center justify-center z-10 ${meta.glow}`}>
                                            <Icon className="text-[10px]" />
                                        </div>
                                        {/* Pulsing Light */}
                                        <div className={`absolute -top-1 w-10 h-10 rounded-full animate-ping opacity-20 ${meta.bg}`} />
                                    </div>

                                    {/* Date Badge (Floating above cards) */}
                                    <div className={`hidden md:block absolute top-[-40px] text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 group-hover:text-slate-900 transition-colors ${isEven ? "right-[52%]" : "left-[52%]"
                                        }`}>
                                        {new Date(log.created_at).toLocaleDateString([], { month: 'long', day: 'numeric' })}
                                    </div>

                                    {/* Log Content Card */}
                                    <div className={`w-full md:w-[45%] ${isEven ? "md:text-right" : "md:text-left"}`}>
                                        <div className={`relative p-6 sm:p-8 rounded-[32px] sm:rounded-[48px] bg-white/70 backdrop-blur-3xl border border-white shadow-[0_30px_60px_-12px_rgba(0,0,0,0.05)] group-hover:shadow-[0_45px_100px_-20px_rgba(0,0,0,0.08)] md:group-hover:-translate-y-4 group-hover:bg-white/95 transition-all duration-700`}>

                                            {/* Internal Category Tag */}
                                            <div className={`flex items-center gap-2 mb-4 md:absolute md:top-8 ${isEven ? "md:left-8 md:mb-0" : "md:right-8 md:mb-0"} group-hover:scale-110 transition-transform ${isEven ? "justify-start md:justify-end" : "justify-start"}`}>
                                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${meta.bg} ${meta.color} border ${meta.border}`}>
                                                    {log.category}
                                                </span>
                                            </div>

                                            {/* Header Area */}
                                            <div className={`flex items-center gap-5 mb-8 ${isEven ? "md:flex-row-reverse" : ""}`}>
                                                <div className="relative shrink-0">
                                                    <div className={`absolute -inset-1 rounded-3xl blur opacity-0 group-hover:opacity-30 transition-opacity ${meta.bg}`} />
                                                    {getActorAvatar(log) ? (
                                                        <img
                                                            src={getActorAvatar(log)}
                                                            alt={log.actor_name}
                                                            className="relative w-16 h-16 rounded-[24px] object-cover border-2 border-white shadow-xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
                                                        />
                                                    ) : (
                                                        <div className="relative w-16 h-16 rounded-[24px] bg-gradient-to-br from-slate-50 to-slate-200 flex items-center justify-center text-slate-800 text-xl font-black shadow-inner border-2 border-white group-hover:scale-110 transition-all">
                                                            {log.actor_name?.[0] || "?"}
                                                        </div>
                                                    )}
                                                    <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-[12px] flex items-center justify-center shadow-2xl border-2 border-white transition-transform group-hover:scale-125 ${log.status === 'Success' ? 'bg-emerald-500' : 'bg-rose-500'
                                                        }`}>
                                                        {log.status === 'Success' ? <FaCheckCircle className="text-white text-xs" /> : <FaExclamationCircle className="text-white text-xs" />}
                                                    </div>
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <h4 className="text-lg font-black text-slate-900 leading-tight truncate group-hover:text-customRed transition-colors">
                                                        {log.actor_name || "Nexus Authority"}
                                                    </h4>
                                                    <div className={`flex items-center gap-2 mt-1 ${isEven ? "md:justify-end" : ""}`}>
                                                        <FaUserLock className="text-[10px] text-slate-300" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                            {log.actor_department || "System Core"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Detail Area */}
                                            <div className={`flex items-start gap-4 sm:gap-6 pt-6 border-t border-slate-100 ${isEven ? "md:flex-row-reverse" : ""}`}>
                                                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-all duration-700 group-hover:rotate-[20deg] group-hover:bg-slate-900 group-hover:text-white ${meta.bg} ${meta.color} border ${meta.border}`}>
                                                    <Icon className="text-xl" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-[14px] sm:text-[15px] text-slate-600 font-bold leading-relaxed ${isEven ? "md:text-right" : "md:text-left"}`}>
                                                        {log.action}
                                                    </p>

                                                    {/* JSON Details Preview (Optional) */}
                                                    {details && Object.keys(details).length > 0 && (
                                                        <div className={`mt-3 flex flex-wrap gap-2 ${isEven ? "justify-end" : "justify-start"}`}>
                                                            {Object.entries(details).slice(0, 3).map(([k, v]) => (
                                                                <span key={k} className="px-2 py-0.5 bg-slate-50 text-slate-400 text-[8px] font-black uppercase border border-slate-100 rounded">
                                                                    {k}: {String(v).length > 15 ? String(v).substring(0, 12) + '...' : String(v)}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Footer Info */}
                                            <div className={`mt-8 flex items-center gap-4 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] ${isEven ? "md:justify-end" : "justify-start"}`}>
                                                <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-full group-hover:text-slate-900 group-hover:bg-white transition-all">
                                                    <FaCalendarAlt className="opacity-50" />
                                                    {new Date(log.created_at).toLocaleString([], {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                        hour12: true
                                                    })}
                                                </div>
                                                <span className="opacity-30">|</span>
                                                <div className="flex items-center gap-1 group-hover:text-slate-900 transition-colors">
                                                    ID: {String(log.id).padStart(5, '0')}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Horizontal Branch Connector (Decorative) */}
                                    <div className={`hidden md:block absolute top-1/2 -translate-y-1/2 w-16 h-px bg-gradient-to-r from-slate-200 to-transparent z-0 overflow-hidden group-hover:w-24 transition-all duration-500 ${isEven ? "left-1/2" : "right-1/2 rotate-180"
                                        }`}>
                                        <div className="w-full h-full bg-customRed/20 animate-pulse" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Pagination Controller */}
            {pagination.totalPages > 1 && (
                <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 rounded-3xl p-3 flex items-center gap-4 z-50 animate-in slide-in-from-bottom duration-700">
                    <button
                        disabled={filters.page === 1}
                        onClick={() => {
                            setFilters(f => ({ ...f, page: f.page - 1 }));
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white bg-white/10 hover:bg-customRed disabled:opacity-20 transition-all hover:scale-110 active:scale-95"
                    >
                        <FaChevronRight className="rotate-180" />
                    </button>

                    <div className="px-6 flex flex-col items-center">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Temporal Page</span>
                        <span className="text-sm font-black text-white">{filters.page} <span className="text-white/20 mx-1">/</span> {pagination.totalPages}</span>
                    </div>

                    <button
                        disabled={filters.page === pagination.totalPages}
                        onClick={() => {
                            setFilters(f => ({ ...f, page: f.page + 1 }));
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white bg-white/10 hover:bg-customRed disabled:opacity-20 transition-all hover:scale-110 active:scale-95"
                    >
                        <FaChevronRight />
                    </button>
                </div>
            )}

            {/* Styles for smooth tree visualization */}
            <style dangerouslySetInnerHTML={{
                __html: `
        .perspective-1000 { perspective: 1000px; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}} />
        </div>
    );
}
