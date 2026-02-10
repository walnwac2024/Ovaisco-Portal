import React, { useState, useEffect } from "react";
import { X, Image as ImageIcon, Trash2, FileText, ImagePlus } from "lucide-react";
import { BASE_URL } from "../../../utils/api";

export default function NewsModal({ isOpen, onClose, onSave, initialData = null }) {
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        is_published: true,
        post_type: "text",
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [removeImage, setRemoveImage] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title || "",
                content: initialData.content || "",
                is_published: !!initialData.is_published,
                post_type: initialData.post_type || "text",
            });
            setImagePreview(initialData.image_url ? `${BASE_URL}${initialData.image_url}` : null);
            setImageFile(null);
            setRemoveImage(false);
        } else {
            setFormData({ title: "", content: "", is_published: true, post_type: "text" });
            setImagePreview(null);
            setImageFile(null);
            setRemoveImage(false);
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            setRemoveImage(false);
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
        setRemoveImage(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            console.log("Submitting News Form:", {
                title: formData.title,
                post_type: formData.post_type,
                hasFile: !!imageFile,
                fileName: imageFile?.name
            });

            const submitData = new FormData();
            submitData.append('title', formData.title);
            submitData.append('content', formData.content);
            submitData.append('is_published', formData.is_published);
            submitData.append('post_type', formData.post_type);

            if (imageFile) {
                submitData.append('image', imageFile);
            }

            if (removeImage) {
                submitData.append('removeImage', 'true');
            }

            await onSave(submitData);
            onClose();
        } catch (err) {
            console.error("Save news error:", err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay backdrop-blur-sm bg-slate-900/40 px-4">
            <div className="modal-content max-w-2xl rounded-[32px] shadow-2xl border-none animate-in zoom-in-95 duration-300">
                <div className="modal-header border-b-0 pb-2 px-8 pt-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">
                            {initialData ? "Edit News" : "Publish News"}
                        </h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Announcement Details</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="h-10 w-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all active:scale-90"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body px-8 py-4 space-y-4 overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Segmented Post Type Selector */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] ml-1">Post Format</label>
                            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/50">
                                {[
                                    { id: 'text', label: 'Text', icon: FileText },
                                    { id: 'image', label: 'Photo', icon: ImagePlus }
                                ].map((type) => (
                                    <button
                                        key={type.id}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, post_type: type.id })}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${formData.post_type === type.id
                                            ? 'bg-white text-customRed shadow-sm border border-slate-200/40'
                                            : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                    >
                                        <type.icon size={14} />
                                        {type.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] ml-1">Title</label>
                            <input
                                required
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-5 py-2.5 h-11 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] font-bold text-slate-700 placeholder:text-slate-300 focus:ring-4 focus:ring-customRed/5 focus:border-customRed/30 focus:bg-white transition-all outline-none"
                                placeholder="Headlines..."
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] ml-1">
                            {formData.post_type === 'text' ? 'Content' : 'Caption (Optional)'}
                        </label>
                        <textarea
                            required={formData.post_type === 'text'}
                            rows={3}
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] font-medium text-slate-700 placeholder:text-slate-300 focus:ring-4 focus:ring-customRed/5 focus:border-customRed/30 focus:bg-white transition-all outline-none resize-none"
                            placeholder={formData.post_type === 'text' ? "What's the update?" : "Add context..."}
                        />
                    </div>

                    {/* Publish Toggle */}
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-white rounded-2xl border border-slate-200">
                        <div>
                            <label className="text-sm font-bold text-slate-700 cursor-pointer">
                                Publish Immediately
                            </label>
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                                {formData.is_published ? 'News will be visible to all employees' : 'Save as draft for later'}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, is_published: !formData.is_published })}
                            className={`relative w-14 h-7 rounded-full transition-all duration-300 ${formData.is_published
                                ? 'bg-customRed shadow-lg shadow-red-500/30'
                                : 'bg-slate-300'
                                }`}
                        >
                            <span
                                className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${formData.is_published ? 'translate-x-7' : 'translate-x-0'
                                    }`}
                            />
                        </button>
                    </div>

                    {/* Enhanced Image field */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] ml-1">
                            Attachment {formData.post_type === 'image' && <span className="text-customRed font-black italic">(REQUIRED)</span>}
                        </label>

                        {imagePreview && !removeImage ? (
                            <div className="relative group rounded-[20px] overflow-hidden border-2 border-slate-100 shadow-inner h-32">
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                        type="button"
                                        onClick={handleRemoveImage}
                                        className="h-9 w-9 bg-white text-rose-500 rounded-xl shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                                        title="Remove Image"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-[20px] cursor-pointer transition-all duration-300 group ${formData.post_type === 'image'
                                ? 'bg-red-50/30 border-customRed/20 hover:border-customRed/40 hover:bg-red-50/50'
                                : 'bg-slate-50/50 border-slate-200 hover:border-customRed/20 hover:bg-slate-50'
                                }`}>
                                <div className={`p-2.5 rounded-xl mb-1.5 transition-all group-hover:scale-110 ${formData.post_type === 'image' ? 'bg-white text-customRed shadow-sm' : 'bg-white text-slate-300 border border-slate-100'
                                    }`}>
                                    <ImageIcon size={18} />
                                </div>
                                <span className={`text-[11px] font-bold ${formData.post_type === 'image' ? 'text-customRed' : 'text-slate-500'}`}>
                                    {imageFile ? imageFile.name : "Click to select a photo"}
                                </span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                            </label>
                        )}
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 h-12 rounded-2xl border-2 border-slate-100 text-slate-400 text-sm font-black uppercase tracking-widest hover:bg-slate-50 hover:text-slate-600 transition-all active:scale-[0.98]"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className={`flex-[1.5] h-12 rounded-2xl bg-customRed text-white text-sm font-black uppercase tracking-widest shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${saving ? 'opacity-70 grayscale' : 'hover:bg-red-600'
                                }`}
                        >
                            {saving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Syncing...</span>
                                </>
                            ) : (
                                <span>{initialData ? "Update News" : "Publish Now"}</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
