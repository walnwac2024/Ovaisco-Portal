// Add/Edit Modal for System Settings
import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function AddEditModal({ isOpen, onClose, onSave, item, type }) {
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        address: "",
        city: "",
        country: "",
    });
    const [saving, setSaving] = useState(false);

    // Reset form when modal opens/closes or item changes
    useEffect(() => {
        if (isOpen) {
            if (item) {
                // Edit mode
                setFormData({
                    name: item.name || "",
                    description: item.description || "",
                    address: item.address || "",
                    city: item.city || "",
                    country: item.country || "",
                });
            } else {
                // Add mode
                setFormData({
                    name: "",
                    description: "",
                    address: "",
                    city: "",
                    country: "",
                });
            }
        }
    }, [isOpen, item]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            return;
        }

        setSaving(true);
        await onSave(formData);
        setSaving(false);
        onClose();
    };

    if (!isOpen) return null;

    // Determine which fields to show based on type
    const showDescription = ["departments", "designations", "employment-types"].includes(type);
    const showAddress = type === "offices";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-800">
                        {item ? "Edit" : "Add"} {type?.replace("-", " ")}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Name Field */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Name <span className="text-customRed">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-customRed/30 focus:border-customRed outline-none transition-all"
                            placeholder="Enter name"
                            required
                            autoFocus
                        />
                    </div>

                    {/* Description Field */}
                    {showDescription && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-customRed/30 focus:border-customRed outline-none transition-all resize-none"
                                placeholder="Enter description (optional)"
                                rows={3}
                            />
                        </div>
                    )}

                    {/* Office-specific fields */}
                    {showAddress && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Address
                                </label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-customRed/30 focus:border-customRed outline-none transition-all"
                                    placeholder="Enter address (optional)"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        City
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-customRed/30 focus:border-customRed outline-none transition-all"
                                        placeholder="City"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Country
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.country}
                                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-customRed/30 focus:border-customRed outline-none transition-all"
                                        placeholder="Country"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Footer Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                            disabled={saving}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-customRed hover:bg-customRed/90 rounded-lg transition-colors disabled:opacity-50"
                            disabled={saving || !formData.name.trim()}
                        >
                            {saving ? "Saving..." : item ? "Update" : "Create"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
