// System Settings Page - Manage all dropdowns
import React, { useState } from "react";
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Search, Info, HelpCircle, LayoutGrid, CheckCircle2 } from "lucide-react";
import useSystemSettings from "./hooks/useSystemSettings";
import AddEditModal from "./components/AddEditModal";
import { useAuth } from "../../context/AuthContext";

// Tab configuration with descriptions and tips
const TABS = [
    { 
        id: "departments", 
        label: "Departments", 
        icon: "🏢", 
        description: "Organize your workforce into functional units like HR, Engineering, or Sales.",
        tip: "Departments are used for leave approvals and reporting."
    },
    { 
        id: "designations", 
        label: "Designations", 
        icon: "💼", 
        description: "Define job titles and hierarchical positions within your organization.",
        tip: "Keep designations clear for better career tracking."
    },
    { 
        id: "offices", 
        label: "Offices", 
        icon: "📍", 
        description: "Manage physical branch locations or remote office hubs.",
        tip: "Used for attendance tracking and office requisitions."
    },
    { 
        id: "employment-types", 
        label: "Employment Types", 
        icon: "📋", 
        description: "Classify staff as Full-time, Contract, Intern, etc.",
        tip: "Helps in payroll and policy filtering."
    },
    { 
        id: "blood-groups", 
        label: "Blood Groups", 
        icon: "🩸", 
        description: "Maintain essential medical data for employee safety.",
        tip: "Crucial for emergency response situations."
    },
    { 
        id: "religions", 
        label: "Religions", 
        icon: "🕌", 
        description: "Track religious affiliations for holiday planning and cultural sensitivity.",
        tip: "Helps in planning religious holiday leaves."
    },
    { 
        id: "marital-statuses", 
        label: "Marital Status", 
        icon: "💑", 
        description: "Record marital status for benefits and emergency contact purposes.",
        tip: "Affects certain payroll benefits in some regions."
    },
];

export default function SystemSettingsPage() {
    const [activeTab, setActiveTab] = useState("departments");
    const [searchQuery, setSearchQuery] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [showGuide, setShowGuide] = useState(true);
    const { user } = useAuth();
    const { data, loading, createItem, updateItem, deleteItem, toggleActive } = useSystemSettings(activeTab);

    const isAdmin = (user?.features || []).some(f => ['system_settings_view', 'permissions_edit'].includes(f.toLowerCase()));

    const currentTabInfo = TABS.find(t => t.id === activeTab);

    // Filter data based on search
    const filteredData = data.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Handle add new
    const handleAdd = () => {
        setEditingItem(null);
        setModalOpen(true);
    };

    // Handle edit
    const handleEdit = (item) => {
        setEditingItem(item);
        setModalOpen(true);
    };

    // Handle save (create or update)
    const handleSave = async (formData) => {
        if (editingItem) {
            return await updateItem(editingItem.id, formData);
        }
        return await createItem(formData);
    };

    // Handle delete with confirmation
    const handleDelete = async (item) => {
        if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
            await deleteItem(item.id);
        }
    };

    // Handle toggle active status
    const handleToggleActive = async (item) => {
        await toggleActive(item.id, item.is_active);
    };

    return (
        <div className="mx-auto w-full max-w-[1180px] px-3 lg:px-4 py-4 space-y-4">
            
            {/* Quick Setup Guide - For New Companies */}
            {showGuide && data.length === 0 && !loading && (
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <CheckCircle2 className="text-blue-200" size={24} />
                            <h2 className="text-xl font-bold">Getting Started with Your Organization</h2>
                        </div>
                        <p className="text-blue-100 mb-4 max-w-2xl">
                            Welcome! To get the most out of WorkSphere, you should first set up your organizational structure. 
                            Add your **Departments** and **Designations** so you can assign them when creating new employee profiles.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/20">
                                <span className="bg-white/20 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold">1</span>
                                <span className="text-sm">Create Departments</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/20">
                                <span className="bg-white/20 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold">2</span>
                                <span className="text-sm">Add Designations</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/20">
                                <span className="bg-white/20 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold">3</span>
                                <span className="text-sm">Setup Office Locations</span>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowGuide(false)}
                        className="absolute top-4 right-4 text-white/60 hover:text-white"
                    >
                        ✕
                    </button>
                    {/* Abstract background shape */}
                    <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                </div>
            )}

            {/* Main Header & Navigation */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="px-6 py-5 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <LayoutGrid className="text-customRed" size={20} />
                            <h1 className="text-xl font-bold text-slate-800">Organizational Settings</h1>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">Configure the core building blocks of your tenant organization.</p>
                    </div>
                    
                    {/* Add Button - Only for Admins */}
                    {isAdmin && (
                        <button
                            onClick={handleAdd}
                            className="flex items-center gap-2 px-6 py-2.5 bg-customRed text-white font-bold rounded-xl hover:bg-customRed/90 transition-all shadow-lg active:scale-95"
                        >
                            <Plus size={20} />
                            Add New {currentTabInfo.label.slice(0, -1)}
                        </button>
                    )}
                </div>

                {/* Info Banner for Active Tab */}
                <div className="mx-6 mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
                    <Info className="text-blue-500 mt-0.5 shrink-0" size={18} />
                    <div>
                        <p className="text-sm font-semibold text-blue-900">{currentTabInfo.description}</p>
                        <p className="text-xs text-blue-700 mt-0.5">💡 {currentTabInfo.tip}</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="px-6 py-4 overflow-x-auto scrollbar-hide">
                    <div className="flex gap-2">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    setSearchQuery("");
                                }}
                                className={`px-5 py-2.5 text-sm font-bold rounded-xl whitespace-nowrap transition-all flex items-center gap-2 ${activeTab === tab.id
                                    ? "bg-customRed text-white shadow-lg scale-105"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    }`}
                            >
                                <span>{tab.icon}</span>
                                {tab.label}
                                {activeTab === tab.id && <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search Bar */}
                <div className="px-6 pb-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={`Search ${currentTabInfo.label.toLowerCase()}...`}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-customRed/20 focus:border-customRed outline-none transition-all text-slate-700"
                        />
                    </div>
                </div>
            </div>

            {/* Data Table Container */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-customRed"></div>
                        <p className="text-slate-500 font-medium animate-pulse">Loading {activeTab}...</p>
                    </div>
                ) : filteredData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                        <div className="bg-slate-100 p-6 rounded-full mb-4">
                            <HelpCircle className="text-slate-400" size={48} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700">No {currentTabInfo.label} Found</h3>
                        <p className="text-slate-500 max-w-sm mt-1">
                            {searchQuery 
                                ? `We couldn't find any match for "${searchQuery}". Try a different term.`
                                : `It looks like you haven't added any ${currentTabInfo.label.toLowerCase()} yet. This is required for organizing your staff.`
                            }
                        </p>
                        {!searchQuery && isAdmin && (
                            <button
                                onClick={handleAdd}
                                className="mt-6 flex items-center gap-2 px-5 py-2 bg-slate-800 text-white font-semibold rounded-lg hover:bg-slate-900 transition-all"
                            >
                                <Plus size={18} />
                                Create First {currentTabInfo.label.slice(0, -1)}
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Name
                                    </th>
                                    {["departments", "designations", "employment-types"].includes(activeTab) && (
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            Description
                                        </th>
                                    )}
                                    {activeTab === "offices" && (
                                        <>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                Address
                                            </th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                City
                                            </th>
                                        </>
                                    )}
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredData.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/80 group transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-slate-800">{item.name}</div>
                                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">ID: #{item.id}</div>
                                        </td>
                                        {["departments", "designations", "employment-types"].includes(activeTab) && (
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-slate-600 max-w-xs truncate" title={item.description}>
                                                    {item.description || <span className="text-slate-300 italic">No description</span>}
                                                </div>
                                            </td>
                                        )}
                                        {activeTab === "offices" && (
                                            <>
                                                <td className="px-6 py-4 text-sm text-slate-600">{item.address || "-"}</td>
                                                <td className="px-6 py-4 text-sm text-slate-600">{item.city || "-"}</td>
                                            </>
                                        )}
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => isAdmin && handleToggleActive(item)}
                                                disabled={!isAdmin}
                                                title={isAdmin ? "Click to toggle status" : "View only"}
                                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all shadow-sm ${item.is_active
                                                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100"
                                                    : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200"
                                                    } ${!isAdmin ? "cursor-not-allowed opacity-80" : ""}`}
                                            >
                                                {item.is_active ? (
                                                    <>
                                                        <ToggleRight size={14} />
                                                        ACTIVE
                                                    </>
                                                ) : (
                                                    <>
                                                        <ToggleLeft size={14} />
                                                        INACTIVE
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {isAdmin && (
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleEdit(item)}
                                                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                        title="Modify details"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item)}
                                                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                        title="Permanently remove"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            <AddEditModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSave={handleSave}
                item={editingItem}
                type={activeTab}
            />
        </div>
    );
}
