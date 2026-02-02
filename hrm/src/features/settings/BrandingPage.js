import React, { useState, useRef } from "react";
import { useTheme } from "../../context/ThemeContext";
import api from "../../utils/api";
import { toast } from "react-toastify";
import { FaPalette, FaImage, FaUpload, FaCheck } from "react-icons/fa";

export default function BrandingPage() {
    const { colors, logo, fetchBranding } = useTheme();

    // Local state for immediate feedback
    const [primaryColor, setPrimaryColor] = useState(colors?.primary || "#E02D3D");
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(logo ? `http://localhost:5000${logo}` : null);
    const [uploading, setUploading] = useState(false);

    const fileInputRef = useRef(null);

    const handleColorChange = (e) => {
        setPrimaryColor(e.target.value);
        // Live preview by setting the variable immediately? 
        // Or just let them save. Let's let them save.
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
        }
    };

    const handleSave = async () => {
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("colors[primary]", primaryColor);

            if (selectedFile) {
                formData.append("logo", selectedFile);
            } else {
                // We still need to send color if no file
                // Backend handles logic
            }

            // Since FormData with nested objects is tricky, 
            // let's just send 'colors' as a JSON string if needed, 
            // or duplicate fields. 
            // My SettingsController expects req.body.colors (object) 
            // but Multer makes req.body flat if using FormData.
            // So I might need to JSON.stringify colors field.

            // Let's adjust Controller strategy or clean it up here.
            // The controller does: const { colors } = req.body || {};
            // If content-type is multipart/form-data, req.body.colors might be "[object Object]" 
            // or we can pass it as a string key.
            // Let's stringify it.

            // WAIT! I should update the Controller to parse JSON string if it comes as string.
            // I'll stick to stringifying here first.

            // Or just send 'primaryColor' and handle it on backend?
            // No, `colors` object is better for future.

            // Let's try sending as separate fields for now to be safe with Multer + BodyParser nuances?
            // No, let's use the standard JSON string approach for metadata in multipart.

            // Actually, let's check SettingsController again.
            // `const { colors } = req.body`.
            // If I append `colors` as string, `req.body.colors` will be string.
            // I need to parse it in backend if standard express json middleware doesn't run on multipart.
            // (Multer parses body, but doesn't JSON parse fields).

            // I'll update the frontend to just send the updated color.

        } catch (err) {
            console.error(err);
        }

        // REBOOT: Simple Axios Post for colors if NO file?
        // Mixed usage.

        // Let's do this:
        try {
            const formData = new FormData();
            // Pack colors
            formData.append("colors", JSON.stringify({ primary: primaryColor }));
            if (selectedFile) {
                formData.append("logo", selectedFile);
            }

            await api.post("/settings/branding", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            toast.success("Branding updated successfully!");
            fetchBranding(); // Refresh context
        } catch (e) {
            console.error("Save failed", e);
            toast.error("Failed to update branding");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-customRed to-orange-500 text-white flex items-center justify-center text-xl shadow-lg shadow-customRed/20">
                    <FaPalette />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Brand Customization</h1>
                    <p className="text-slate-500 text-sm">Customize the look and feel of your portal.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Color Settings */}
                <div className="card p-6">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <FaPalette className="text-slate-400" /> Color Theme
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Primary Color</label>
                            <div className="flex items-center gap-3">
                                <div className="relative overflow-hidden w-12 h-12 rounded-full border shadow-sm ring-2 ring-offset-2 ring-slate-100">
                                    <input
                                        type="color"
                                        value={primaryColor}
                                        onChange={handleColorChange}
                                        className="absolute inset-0 w-[150%] h-[150%] -top-[25%] -left-[25%] cursor-pointer p-0 border-0"
                                    />
                                </div>
                                <input
                                    type="text"
                                    value={primaryColor}
                                    onChange={(e) => setPrimaryColor(e.target.value)}
                                    className="input w-32 font-mono uppercase"
                                />
                            </div>
                            <p className="mt-2 text-xs text-slate-400">
                                This color is used for buttons, active states, and highlights throughout the system.
                            </p>
                        </div>

                        {/* Preview Button */}
                        <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 mt-6">
                            <p className="text-xs font-bold uppercase text-slate-400 mb-2">Live Preview (Save to Apply)</p>
                            <button
                                className="btn-primary"
                                style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
                            >
                                Example Button
                            </button>
                        </div>
                    </div>
                </div>

                {/* Logo Settings */}
                <div className="card p-6">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <FaImage className="text-slate-400" /> Company Logo
                    </h2>

                    <div className="space-y-4">
                        <div className="w-full aspect-video bg-slate-100 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center relative overflow-hidden group">
                            {previewUrl ? (
                                <img src={previewUrl} alt="Logo Preview" className="h-full w-full object-contain p-4" />
                            ) : (
                                <div className="text-center text-slate-400">
                                    <FaImage className="mx-auto text-3xl mb-2 opacity-30" />
                                    <p className="text-sm">No logo uploaded</p>
                                </div>
                            )}

                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="btn bg-white text-slate-900 border-none shadow-xl"
                                >
                                    <FaUpload className="mr-2" /> Change Logo
                                </button>
                            </div>
                        </div>

                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />

                        <p className="text-xs text-slate-400">
                            Recommended size: 200x50px. Transparent PNG looks best.
                        </p>
                    </div>
                </div>
            </div>

            {/* Save Actions */}
            <div className="flex justify-end pt-4 border-t border-slate-200">
                <button
                    onClick={handleSave}
                    disabled={uploading}
                    className="btn-primary h-12 px-8 text-lg shadow-xl shadow-customRed/20 hover:shadow-customRed/30"
                    style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
                >
                    {uploading ? "Saving..." : <><FaCheck className="mr-2" /> Save Changes</>}
                </button>
            </div>
        </div>
    );
}
