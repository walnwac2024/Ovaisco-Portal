import React, { useState } from "react";
import useTimeline from "../hooks/useTimeline";
import useEmployees from "../hooks/useEmployees";
import {
    FaHistory, FaCalendarAlt, FaSearch,
    FaPlus, FaCheckCircle,
    FaUserEdit, FaTrash, FaAward, FaUserTimes
} from "react-icons/fa";
import { toast } from "react-toastify";
import { useAuth } from "../../../context/AuthContext";

const CATEGORY_MAP = {
    "Status Change": { icon: FaUserEdit, color: "text-blue-500", bg: "bg-blue-500/10" },
    "Disciplinary": { icon: FaUserTimes, color: "text-red-500", bg: "bg-red-500/10" },
    "Recognition": { icon: FaAward, color: "text-amber-500", bg: "bg-amber-500/10" },
    "Documents": { icon: FaTrash, color: "text-slate-500", bg: "bg-slate-500/10" },
    "System": { icon: FaHistory, color: "text-emerald-500", bg: "bg-emerald-500/10" },
};

export default function EmployeeTimeline() {
    const { user } = useAuth();
    const canManage = user?.features?.includes("timeline_manage");

    const { list: employees } = useEmployees(); // For employee selection if needed, or we might need a specific employee context
    const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
    const {
        events, loading, filters, updateFilter, resetFilters, addEvent
    } = useTimeline(selectedEmployeeId);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newEvent, setNewEvent] = useState({
        event_type: "Manual",
        category: "System",
        title: "",
        description: "",
        visibility: "ALL"
    });

    const handleEmployeeChange = (e) => {
        setSelectedEmployeeId(e.target.value);
    };

    const handleAddEvent = async (e) => {
        e.preventDefault();
        if (!selectedEmployeeId) {
            toast.warning("Please select an employee first");
            return;
        }
        const success = await addEvent(newEvent);
        if (success) {
            setIsModalOpen(false);
            setNewEvent({
                event_type: "Manual",
                category: "System",
                title: "",
                description: "",
                visibility: "ALL"
            });
        }
    };

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <FaHistory className="text-customRed" /> Employee <span className="text-customRed">Timeline</span>
                    </h1>
                    <p className="text-slate-500 text-sm">Track employee history, milestones and system events.</p>
                </div>
                {selectedEmployeeId && canManage && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="btn-primary h-10 px-4 flex items-center gap-2"
                    >
                        <FaPlus /> Add Event
                    </button>
                )}
            </div>

            {/* Selection and Filters */}
            <div className="card p-4 grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-4">
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Select Employee</label>
                    <select
                        value={selectedEmployeeId}
                        onChange={handleEmployeeChange}
                        className="input h-10"
                    >
                        <option value="">Select an employee...</option>
                        {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>
                                {emp.employee_name || emp.Employee_Name} ({emp.employee_code || emp.employeeCode})
                            </option>
                        ))}
                    </select>
                </div>

                {selectedEmployeeId && (
                    <>
                        <div className="md:col-span-3">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Category</label>
                            <select
                                value={filters.category}
                                onChange={(e) => updateFilter("category", e.target.value)}
                                className="input h-10"
                            >
                                <option value="">All Categories</option>
                                {Object.keys(CATEGORY_MAP).map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-5 relative group">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Search</label>
                            <div className="relative">
                                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                                <input
                                    type="text"
                                    placeholder="Search events..."
                                    value={filters.search}
                                    onChange={(e) => updateFilter("search", e.target.value)}
                                    className="input h-10 pl-10"
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>

            {!selectedEmployeeId ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <FaHistory className="text-6xl mb-4 opacity-10" />
                    <p>Please select an employee to view their timeline</p>
                </div>
            ) : loading && events.length === 0 ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-customRed"></div>
                </div>
            ) : events.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                    <FaHistory className="text-6xl mb-4 opacity-10" />
                    <p className="font-medium text-slate-500 tracking-wide uppercase text-xs">No events found for this employee</p>
                    <button onClick={resetFilters} className="mt-4 text-customRed text-sm font-bold hover:underline">Clear Filters</button>
                </div>
            ) : (
                <div className="relative max-w-4xl mx-auto pl-8 sm:pl-0">
                    {/* Vertical Line */}
                    <div className="absolute left-1.5 sm:left-1/2 top-4 bottom-4 w-0.5 bg-slate-100 sm:-translate-x-1/2 hidden sm:block" />
                    <div className="absolute left-1.5 top-4 bottom-4 w-0.5 bg-slate-100 sm:hidden" />

                    <div className="space-y-12">
                        {events.map((event, idx) => {
                            const config = CATEGORY_MAP[event.category] || CATEGORY_MAP["System"];
                            const Icon = config.icon;
                            const isOdd = idx % 2 !== 0;

                            return (
                                <div key={event.id} className={`relative flex flex-col ${isOdd ? 'sm:flex-row-reverse' : 'sm:flex-row'} items-center group`}>
                                    {/* Dot */}
                                    <div className={`absolute left-0 sm:left-1/2 top-0 sm:-translate-x-1/2 w-4 h-4 rounded-full border-4 border-white shadow-md z-10 transition-transform group-hover:scale-125 ${config.color.replace('text', 'bg')}`} />

                                    {/* Date */}
                                    <div className={`sm:w-1/2 px-8 mb-2 sm:mb-0 ${isOdd ? 'sm:text-left' : 'sm:text-right'}`}>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 sm:justify-inherit group-hover:text-customRed transition-colors">
                                            <FaCalendarAlt />
                                            {new Date(event.event_date).toLocaleDateString(undefined, {
                                                day: 'numeric', month: 'short', year: 'numeric'
                                            })}
                                        </div>
                                    </div>

                                    {/* Card */}
                                    <div className="sm:w-1/2 px-4 sm:px-8 w-full">
                                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm transition-all group-hover:shadow-md group-hover:-translate-y-1">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${config.bg} ${config.color}`}>
                                                    <Icon />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="text-sm font-bold text-slate-900 truncate">{event.title}</h3>
                                                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{event.category}</span>
                                                </div>
                                            </div>
                                            <p className="text-xs text-slate-600 leading-relaxed mb-4">{event.description}</p>

                                            <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                                                <div className="flex items-center gap-2">
                                                    {event.actioned_by_avatar ? (
                                                        <img src={event.actioned_by_avatar} className="w-5 h-5 rounded-full object-cover" alt="" />
                                                    ) : (
                                                        <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-500">
                                                            {event.actioned_by_name?.[0] || 'S'}
                                                        </div>
                                                    )}
                                                    <span className="text-[10px] text-slate-400 font-medium">By {event.actioned_by_name || 'System'}</span>
                                                </div>
                                                {event.is_system_generated ? (
                                                    <FaCheckCircle className="text-emerald-500 text-xs" title="System Generated" />
                                                ) : (
                                                    <FaPlus className="text-blue-500 text-[10px]" title="Manual Entry" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Manual Event Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b flex items-center justify-between bg-slate-50">
                            <h2 className="font-bold text-slate-900">Record New Event</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        <form onSubmit={handleAddEvent} className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Title</label>
                                <input
                                    required
                                    type="text"
                                    className="input h-10"
                                    placeholder="e.g. Annual Performance Review"
                                    value={newEvent.title}
                                    onChange={(e) => setNewEvent(s => ({ ...s, title: e.target.value }))}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Category</label>
                                    <select
                                        className="input h-10"
                                        value={newEvent.category}
                                        onChange={(e) => setNewEvent(s => ({ ...s, category: e.target.value }))}
                                    >
                                        {Object.keys(CATEGORY_MAP).map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Visibility</label>
                                    <select
                                        className="input h-10"
                                        value={newEvent.visibility}
                                        onChange={(e) => setNewEvent(s => ({ ...s, visibility: e.target.value }))}
                                    >
                                        <option value="ALL">Everyone</option>
                                        <option value="MANAGERS_ONLY">Managers & HR</option>
                                        <option value="HR_ONLY">HR Only</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Description</label>
                                <textarea
                                    className="input py-2 min-h-[100px]"
                                    placeholder="Detailed notes regarding this event..."
                                    value={newEvent.description}
                                    onChange={(e) => setNewEvent(s => ({ ...s, description: e.target.value }))}
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="btn-outline h-10 px-6"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary h-10 px-8"
                                    disabled={loading}
                                >
                                    {loading ? 'Saving...' : 'Record Event'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
