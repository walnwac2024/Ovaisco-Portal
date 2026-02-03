import React, { useState, useEffect, useCallback } from "react";
import api from "../../utils/api";
import { Users, Building2, Gift, PartyPopper, ChevronDown, ChevronRight, Search, Network } from "lucide-react"; // Added Network icon if available, else fallback
import { BASE_URL } from "../../utils/api";
import BirthdayCelebration from "../../components/common/BirthdayCelebration";
import OrgTree from "./components/OrgTree";

const BACKEND_URL = BASE_URL;

export default function OrganizationPage() {
    const [departments, setDepartments] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    // Changed from Set to string | null for accordion behavior
    const [expandedDept, setExpandedDept] = useState(null);
    const [search, setSearch] = useState("");
    const [viewMode, setViewMode] = useState('directory'); // 'directory' | 'chart'

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [deptRes, empRes] = await Promise.all([
                api.get("/employees/lookups/departments"),
                api.get("/employees") // Get all active employees
            ]);
            setDepartments(deptRes.data);
            setEmployees(Array.isArray(empRes.data) ? empRes.data : []);
        } catch (e) {
            console.error("Failed to fetch organization data", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const toggleDept = (dept) => {
        setExpandedDept(prev => prev === dept ? null : dept);
    };

    // Helper: Birthday check (robust)
    const isBirthdayToday = (dob) => {
        if (!dob) return false;
        const now = new Date();
        const currentDay = now.getDate();
        const currentMonthIndex = now.getMonth();

        if (dob instanceof Date) {
            return dob.getDate() === currentDay && dob.getMonth() === currentMonthIndex;
        }

        const dobStr = String(dob);
        if (dobStr.includes('-') && dobStr.length > 7 && !isNaN(Date.parse(dobStr))) {
            const d = new Date(dobStr);
            return d.getDate() === currentDay && d.getMonth() === currentMonthIndex;
        }

        const parts = dobStr.split('-');
        if (parts.length < 2) return false;
        const day = parseInt(parts[0], 10);
        const monthStr = parts[1].toLowerCase();
        const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
        const birthMonthIndex = months.indexOf(monthStr);
        return day === currentDay && birthMonthIndex === currentMonthIndex;
    };

    const getAvatarUrl = (imgPath) => {
        if (!imgPath) return null;
        if (imgPath.startsWith("http")) return imgPath;
        return `${BACKEND_URL}${imgPath.startsWith("/") ? imgPath : `/${imgPath}`}`;
    };

    // Helper: Identify Managers/Leads
    const isLeadership = (designation) => {
        if (!designation) return false;
        const leadershipTerms = ['manager', 'head', 'ceo', 'director', 'lead', 'chief', 'supervisor', 'admin'];
        return leadershipTerms.some(term => designation.toLowerCase().includes(term));
    };

    // Helper: Get Expertise Tags
    const getExpertiseTags = (emp) => {
        const tags = [];
        const combined = `${emp.designation} ${emp.department}`.toLowerCase();

        if (combined.includes('dev') || combined.includes('software') || combined.includes('code')) tags.push('Development');
        if (combined.includes('design') || combined.includes('ui') || combined.includes('ux') || combined.includes('creative')) tags.push('Creative');
        if (combined.includes('hr') || combined.includes('people') || combined.includes('culture')) tags.push('HR');
        if (combined.includes('admin') || combined.includes('office') || combined.includes('ops')) tags.push('Operations');
        if (combined.includes('sale') || combined.includes('market') || combined.includes('growth')) tags.push('Growth');
        if (combined.includes('manage') || combined.includes('head') || combined.includes('lead')) tags.push('Leadership');

        return tags.slice(0, 2); // Limit to 2 tags
    };

    const groupedData = departments.map(dept => {
        const members = employees
            .filter(e => e.department === dept)
            .sort((a, b) => {
                // Leadership first
                const aLead = isLeadership(a.designation);
                const bLead = isLeadership(b.designation);
                if (aLead && !bLead) return -1;
                if (!aLead && bLead) return 1;
                return a.name.localeCompare(b.name);
            });
        const birthdaysToday = members.filter(m => isBirthdayToday(m.dateOfBirth));
        return { name: dept, members, birthdaysToday };
    }).filter(d => d.members.length > 0);

    const filteredData = groupedData.filter(d =>
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.members.some(m => m.name.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="space-y-6 animate-fade-in p-4 sm:p-6 max-w-7xl mx-auto">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                        <Building2 className="text-customRed drop-shadow-sm" size={28} />
                        Organization Directory
                    </h1>
                    <p className="text-sm text-slate-500 font-medium">Manage and view all departments and team members.</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    {/* View Toggle */}
                    <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
                        <button
                            onClick={() => setViewMode('directory')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'directory' ? 'bg-white text-customRed shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            title="List View"
                        >
                            <Users size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('chart')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'chart' ? 'bg-white text-customRed shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            title="Chart View"
                        >
                            <Network size={18} />
                        </button>
                    </div>

                    <div className="relative w-full md:w-80 group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-customRed transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search department or name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-customRed/5 focus:border-customRed outline-none transition-all text-sm font-medium shadow-sm bg-white/80 backdrop-blur-sm"
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="relative">
                        <div className="h-12 w-12 border-4 border-slate-100 rounded-full" />
                        <div className="absolute top-0 left-0 h-12 w-12 border-4 border-customRed border-t-transparent rounded-full animate-spin" />
                    </div>
                </div>
            ) : viewMode === 'chart' ? (
                // CHART VIEW
                <div className="grid grid-cols-1 gap-8">
                    {filteredData.length === 0 ? (
                        <div className="bg-white/50 backdrop-blur-sm border-2 border-dashed border-slate-200 rounded-[2rem] text-center py-24">
                            <Network size={56} className="mx-auto text-slate-200 mb-6" />
                            <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-sm">No departments found for chart</p>
                        </div>
                    ) : (
                        filteredData.map(dept => (
                            <OrgTree
                                key={dept.name}
                                department={dept.name}
                                members={dept.members}
                                isExpanded={expandedDept === dept.name}
                                onToggle={() => toggleDept(dept.name)}
                            />
                        ))
                    )}
                </div>
            ) : (
                // DIRECTORY VIEW (Original)
                <div className="grid grid-cols-1 gap-6">
                    {filteredData.length === 0 ? (
                        <div className="bg-white/50 backdrop-blur-sm border-2 border-dashed border-slate-200 rounded-[2rem] text-center py-24">
                            <Users size={56} className="mx-auto text-slate-200 mb-6" />
                            <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-sm">No departments or members found</p>
                        </div>
                    ) : (
                        filteredData.map((dept) => (
                            <div key={dept.name} className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/40">
                                {/* Department Header */}
                                <div
                                    onClick={() => toggleDept(dept.name)}
                                    className={`px-8 py-6 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 transition-all
                                        ${expandedDept === dept.name ? 'bg-slate-50/50 border-b border-slate-100' : ''}`}
                                >
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 rounded-[1rem] bg-gradient-to-br from-customRed to-red-600 flex items-center justify-center text-white shadow-lg shadow-red-500/20">
                                            <Building2 size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-black text-slate-800 uppercase tracking-wider">{dept.name}</h2>
                                            <div className="flex items-center gap-3">
                                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1.5">
                                                    <Users size={12} className="text-slate-300" />
                                                    {dept.members.length} Members
                                                </p>
                                                <span className="w-1 h-1 bg-slate-200 rounded-full mx-1" />
                                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1.5">
                                                    <Gift size={12} className={dept.birthdaysToday.length > 0 ? "text-amber-400" : "text-slate-300"} />
                                                    {dept.birthdaysToday.length > 0 ? `${dept.birthdaysToday.length} Celebrations` : 'No Birthdays'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {dept.birthdaysToday.length > 0 && (
                                            <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-amber-50 text-amber-600 rounded-full border border-amber-100 shadow-sm shadow-amber-500/5">
                                                <div className="relative">
                                                    <PartyPopper size={14} className="animate-bounce" />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-wider">Department Party</span>
                                            </div>
                                        )}
                                        <div className={`p-2 rounded-xl transition-all ${expandedDept === dept.name ? 'bg-slate-100 text-slate-600 rotate-180' : 'bg-slate-50 text-slate-400'}`}>
                                            <ChevronDown size={20} />
                                        </div>
                                    </div>
                                </div>

                                {/* Department Content */}
                                {expandedDept === dept.name && (
                                    <div className="p-8">
                                        {dept.birthdaysToday.length > 0 && (
                                            <div className="mb-8 space-y-4">
                                                {dept.birthdaysToday.map(m => (
                                                    <BirthdayCelebration key={m.id} isBirthday={true} name={m.name} />
                                                ))}
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                            {dept.members.map((m) => (
                                                <div key={m.id} className="relative group p-4 rounded-3xl border border-slate-100 bg-white hover:border-customRed/20 hover:bg-slate-50/30 hover:shadow-2xl hover:shadow-red-500/5 transition-all duration-500">
                                                    {isLeadership(m.designation) && (
                                                        <div className="absolute -top-2 -right-1 z-10">
                                                            <div className="px-3 py-1 bg-gradient-to-r from-slate-800 to-slate-900 text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-lg shadow-lg">
                                                                Lead
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="flex flex-col gap-4">
                                                        <div className="flex items-start justify-between">
                                                            <div className="relative">
                                                                <div className={`w-16 h-16 rounded-[1.25rem] overflow-hidden border-2 transition-transform duration-500 group-hover:scale-105 shadow-md
                                                                    ${isLeadership(m.designation) ? 'border-slate-800' : 'border-slate-100'}`}>
                                                                    {m.profile_picture ? (
                                                                        <img src={getAvatarUrl(m.profile_picture)} alt={m.name} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-400 text-lg font-black">
                                                                            {m.name.charAt(0).toUpperCase()}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {/* Online Status Dot */}
                                                                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-white rounded-full p-0.5 shadow-sm">
                                                                    <div className={`w-full h-full rounded-full ${m.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                                                </div>
                                                                {isBirthdayToday(m.dateOfBirth) && (
                                                                    <div className="absolute -top-2 -left-2 bg-white rounded-xl shadow-lg p-1.5 border border-amber-100">
                                                                        <span className="text-[18px] leading-none">🎂</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="flex flex-col gap-2">
                                                                {m.officialEmail && (
                                                                    <a
                                                                        href={`mailto:${m.officialEmail}`}
                                                                        className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-customRed hover:text-white transition-all shadow-sm"
                                                                        title="Send Email"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        <Users size={14} />
                                                                    </a>
                                                                )}
                                                                {m.contact && (
                                                                    <a
                                                                        href={`https://wa.me/${m.contact.replace(/\D/g, '')}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                                                                        title="WhatsApp Message"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        <Gift size={14} />
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="min-w-0">
                                                            <h3 className="text-sm font-black text-slate-800 truncate leading-none mb-2 group-hover:text-customRed transition-colors">
                                                                {m.name}
                                                            </h3>
                                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate leading-none mb-3">
                                                                {m.designation || 'Teammate'}
                                                            </p>

                                                            {/* Expertise Tags */}
                                                            <div className="flex flex-wrap gap-1.5 mt-auto">
                                                                {getExpertiseTags(m).map((tag, idx) => (
                                                                    <span key={idx} className="px-2 py-0.5 bg-slate-100/60 text-slate-500 text-[8px] font-black uppercase tracking-wider rounded-md group-hover:bg-customRed/5 group-hover:text-customRed transition-colors">
                                                                        {tag}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}

            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(15px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                }
            `}</style>
        </div>
    );
}
