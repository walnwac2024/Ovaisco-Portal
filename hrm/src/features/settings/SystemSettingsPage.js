// System Settings Page - Manage all dropdowns
import React, { useState } from "react";
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Search } from "lucide-react";
import useSystemSettings from "./hooks/useSystemSettings";
import AddEditModal from "./components/AddEditModal";
import { useAuth } from "../../context/AuthContext";

// Tab configuration
const TABS = [
    { id: "departments", label: "Departments", icon: "🏢" },
    { id: "designations", label: "Designations", icon: "💼" },
    { id: "offices", label: "Offices", icon: "📍" },
    { id: "employment-types", label: "Employment Types", icon: "📋" },
    { id: "blood-groups", label: "Blood Groups", icon: "🩸" },
    { id: "religions", label: "Religions", icon: "🕌" },
    { id: "marital-statuses", label: "Marital Status", icon: "💑" },
];

export default function SystemSettingsPage() {
    const [activeTab, setActiveTab] = useState("departments");
    const [searchQuery, setSearchQuery] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const { user } = useAuth();
    const { data, loading, createItem, updateItem, deleteItem, toggleActive } = useSystemSettings(activeTab);

    const isAdmin = (user?.features || []).some(f => ['system_settings_view'].includes(f.toLowerCase()));

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
            await updateItem(editingItem.id, formData);
        } else {
            await createItem(formData);
        }
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
        <div className="mx-auto w-full max-w-[1180px] px-3 lg:px-4 py-4">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 mb-4">
                <div className="px-6 py-4 border-b border-slate-200">
                    <h1 className="text-xl font-bold text-slate-800">System Settings</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage dropdown options used across the system</p>
                </div>

                {/* Tabs */}
                <div className="px-6 py-3 border-b border-slate-200 overflow-x-auto">
                    <div className="flex gap-2">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    setSearchQuery("");
                                }}
                                className={`px-4 py-2 text-sm font-semibold rounded-lg whitespace-nowrap transition-all ${activeTab === tab.id
                                    ? "bg-customRed text-white shadow-md"
                                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                    }`}
                            >
                                <span className="mr-2">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Actions Bar */}
                <div className="px-6 py-4 flex items-center justify-between gap-4">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-customRed/30 focus:border-customRed outline-none transition-all"
                        />
                    </div>

                    {/* Add Button - Only for Admins */}
                    {isAdmin && (
                        <button
                            onClick={handleAdd}
                            className="flex items-center gap-2 px-4 py-2 bg-customRed text-white font-semibold rounded-lg hover:bg-customRed/90 transition-all shadow-md"
                        >
                            <Plus size={18} />
                            Add New
                        </button>
                    )}
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-customRed"></div>
                    </div>
                ) : filteredData.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        {searchQuery ? "No results found" : "No items yet. Click 'Add New' to create one."}
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    Name
                                </th>
                                {["departments", "designations", "employment-types"].includes(activeTab) && (
                                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                                        Description
                                    </th>
                                )}
                                {activeTab === "offices" && (
                                    <>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                                            Address
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                                            City
                                        </th>
                                    </>
                                )}
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredData.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-slate-800">
                                        {item.name}
                                    </td>
                                    {["departments", "designations", "employment-types"].includes(activeTab) && (
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {item.description || "-"}
                                        </td>
                                    )}
                                    {activeTab === "offices" && (
                                        <>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {item.address || "-"}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {item.city || "-"}
                                            </td>
                                        </>
                                    )}
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => isAdmin && handleToggleActive(item)}
                                            disabled={!isAdmin}
                                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-all ${item.is_active
                                                ? "bg-green-100 text-green-700 hover:bg-green-200"
                                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                                } ${!isAdmin ? "cursor-not-allowed opacity-80" : ""}`}
                                        >
                                            {item.is_active ? (
                                                <>
                                                    <ToggleRight size={14} />
                                                    Active
                                                </>
                                            ) : (
                                                <>
                                                    <ToggleLeft size={14} />
                                                    Inactive
                                                </>
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {isAdmin && (
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
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
