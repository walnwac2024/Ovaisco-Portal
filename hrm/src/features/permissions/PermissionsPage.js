import React, { useState, useEffect, useMemo } from "react";
import api from "../../utils/api";
import { toast } from "react-toastify";
import { FaShieldAlt, FaCheckCircle, FaLayerGroup, FaSave, FaUserShield, FaSearch, FaChevronRight } from "react-icons/fa";

export default function PermissionsPage() {
    const [userTypes, setUserTypes] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [selectedType, setSelectedType] = useState(null);
    const [typePermissions, setTypePermissions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchInitialData();
    }, []);

    async function fetchInitialData() {
        setLoading(true);
        try {
            const [uRes, pRes] = await Promise.all([
                api.get("/permissions/user-types"),
                api.get("/permissions/all"),
            ]);
            setUserTypes(uRes.data);
            setPermissions(pRes.data);
            if (uRes.data.length > 0) {
                handleSelectType(uRes.data[0]);
            }
        } catch (err) {
            console.error("fetchInitialData error", err);
            toast.error("Failed to load permissions data");
        } finally {
            setLoading(false);
        }
    }

    async function handleSelectType(type) {
        setSelectedType(type);
        try {
            const { data } = await api.get(`/permissions/type/${type.id}`);
            setTypePermissions(data);
        } catch (err) {
            console.error("handleSelectType error", err);
            toast.error("Failed to load type permissions");
        }
    }

    function handleTogglePermission(permId) {
        setTypePermissions((prev) =>
            prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
        );
    }

    const groupedPermissions = useMemo(() => {
        const groups = {};
        permissions.forEach(p => {
            const mod = p.module || "General";
            if (!groups[mod]) groups[mod] = [];
            groups[mod].push(p);
        });
        return groups;
    }, [permissions]);

    const handleSelectAllInModule = (moduleName, check) => {
        const modulePermIds = groupedPermissions[moduleName].map(p => p.id);
        if (check) {
            // Add all missing ones
            setTypePermissions(prev => [...new Set([...prev, ...modulePermIds])]);
        } else {
            // Remove all
            setTypePermissions(prev => prev.filter(id => !modulePermIds.includes(id)));
        }
    };

    async function handleSave() {
        if (!selectedType) return;
        setSaving(true);
        try {
            await api.post(`/permissions/type/${selectedType.id}`, {
                permissionIds: typePermissions,
            });
            toast.success("Permissions updated successfully");
        } catch (err) {
            console.error("handleSave error", err);
            toast.error("Failed to update permissions");
        } finally {
            setSaving(false);
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-customRed border-t-transparent"></div>
        </div>
    );

    return (
        <div className="max-w-[1400px] mx-auto p-4 sm:p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-customRed/10 text-customRed rounded-2xl flex items-center justify-center text-xl shadow-inner">
                            <FaShieldAlt />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Access Control Center</h1>
                            <p className="text-sm font-medium text-slate-400 mt-0.5">Define what each role can see and do in the system.</p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving || !selectedType}
                    className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white hover:bg-slate-800 font-black rounded-2xl transition-all shadow-lg shadow-slate-200 active:scale-95 disabled:opacity-50"
                >
                    <FaSave className={saving ? "animate-pulse" : ""} />
                    {saving ? "Deploying Changes..." : "Publish Permissions"}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Sidebar: Role Selection */}
                <div className="lg:col-span-3 space-y-4">
                    <div className="bg-white rounded-[2rem] shadow-lg shadow-slate-200/40 border border-slate-100 overflow-hidden">
                        <div className="p-6 bg-slate-50/50 border-b border-slate-100">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Available Roles</h2>
                        </div>
                        <div className="p-3 space-y-1">
                            {userTypes.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => handleSelectType(t)}
                                    className={`w-full group flex items-center justify-between px-5 py-4 text-[13px] rounded-2xl transition-all duration-300 ${selectedType?.id === t.id
                                        ? "bg-slate-900 text-white shadow-xl shadow-slate-300"
                                        : "text-slate-600 hover:bg-slate-50"
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <FaUserShield className={selectedType?.id === t.id ? "text-rose-400" : "text-slate-300"} />
                                        <span className="font-bold">{t.type}</span>
                                    </div>
                                    <FaChevronRight className={`text-[10px] transition-transform duration-300 ${selectedType?.id === t.id ? "rotate-90 text-white" : "text-slate-200 group-hover:translate-x-1"}`} />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Stats Widget */}
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-[2rem] text-white shadow-xl">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Quick Stats</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <span className="text-xs text-slate-400">Selected Role</span>
                                <span className="text-sm font-black text-rose-400">{selectedType?.type || '--'}</span>
                            </div>
                            <div className="flex justify-between items-end">
                                <span className="text-xs text-slate-400">Active Permissions</span>
                                <span className="text-2xl font-black">{typePermissions.length}</span>
                            </div>
                            <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                                <div 
                                    className="h-full bg-rose-500 transition-all duration-500" 
                                    style={{ width: `${(typePermissions.length / (permissions.length || 1)) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content: Permissions Groups */}
                <div className="lg:col-span-9 space-y-6">
                    {!selectedType ? (
                        <div className="bg-white rounded-[3rem] border-2 border-dashed border-slate-200 p-20 text-center space-y-4">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-3xl text-slate-200">
                                <FaLayerGroup />
                            </div>
                            <h3 className="text-xl font-bold text-slate-400">Select a role to start managing access</h3>
                        </div>
                    ) : (
                        <div className="space-y-8 pb-10">
                            {/* Search Filter */}
                            <div className="relative group">
                                <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-customRed transition-colors" />
                                <input 
                                    type="text"
                                    placeholder="Search permissions by name or module..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-14 pr-8 py-5 bg-white border border-slate-200 rounded-[2rem] text-sm font-medium shadow-sm focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all"
                                />
                            </div>

                            {/* Grouped Permissions Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {Object.entries(groupedPermissions).map(([moduleName, perms]) => {
                                    const filteredPerms = perms.filter(p => 
                                        p.name?.toLowerCase().includes(search.toLowerCase()) || 
                                        p.module?.toLowerCase().includes(search.toLowerCase()) ||
                                        p.code?.toLowerCase().includes(search.toLowerCase())
                                    );

                                    if (search && filteredPerms.length === 0) return null;

                                    const moduleActiveCount = perms.filter(p => typePermissions.includes(p.id)).length;
                                    const isAllSelected = moduleActiveCount === perms.length;

                                    return (
                                        <div key={moduleName} className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/30 overflow-hidden flex flex-col">
                                            {/* Group Header */}
                                            <div className="p-5 sm:p-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-400">
                                                        <FaLayerGroup className="text-xs" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-black text-slate-800 tracking-tight">{moduleName}</h3>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{perms.length} Permissions</p>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => handleSelectAllInModule(moduleName, !isAllSelected)}
                                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                                        isAllSelected 
                                                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                                            : 'bg-white text-slate-400 border border-slate-200 hover:border-slate-300'
                                                    }`}
                                                >
                                                    {isAllSelected ? 'Full Access' : 'Grant All'}
                                                </button>
                                            </div>

                                            {/* Group Body: Checklist */}
                                            <div className="p-4 sm:p-6 space-y-3 flex-1">
                                                {perms.map((p) => {
                                                    const isActive = typePermissions.includes(p.id);
                                                    const matchesSearch = !search || 
                                                        p.name?.toLowerCase().includes(search.toLowerCase()) || 
                                                        p.code?.toLowerCase().includes(search.toLowerCase());
                                                    
                                                    if (!matchesSearch) return null;

                                                    return (
                                                        <label
                                                            key={p.id}
                                                            className={`group flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${isActive
                                                                ? "border-emerald-100 bg-emerald-50/30"
                                                                : "border-slate-50 bg-slate-50/30 hover:border-slate-200"
                                                                }`}
                                                        >
                                                            <div className="relative flex items-center justify-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isActive}
                                                                    onChange={() => handleTogglePermission(p.id)}
                                                                    className="peer sr-only"
                                                                />
                                                                <div className={`w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center ${
                                                                    isActive 
                                                                        ? 'bg-emerald-500 border-emerald-500 scale-110 shadow-lg shadow-emerald-200' 
                                                                        : 'bg-white border-slate-200 group-hover:border-slate-300'
                                                                }`}>
                                                                    {isActive && <FaCheckCircle className="text-white text-xs" />}
                                                                </div>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className={`text-xs font-black truncate ${isActive ? "text-emerald-700" : "text-slate-700"}`}>
                                                                    {p.action || p.name}
                                                                </div>
                                                                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5 truncate">{p.code}</div>
                                                            </div>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
