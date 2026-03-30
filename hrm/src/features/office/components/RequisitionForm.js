import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';
import { FaPlus, FaTrash } from 'react-icons/fa';

export default function RequisitionForm() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        employee_name_manual: user?.name || '',
        employee_code_manual: user?.employeeCode || '',
        designation: user?.designation || '',
        department: user?.Department || '',
        office_location: '',
        line_manager_name: '',
        items: [
            { sr_no: 1, type_of_particular: '', description: '', qty: 1 }
        ]
    });

    const addItem = () => {
        if (formData.items.length >= 6) {
            toast.warn("Maximum 6 items allowed per requisition");
            return;
        }
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { sr_no: prev.items.length + 1, type_of_particular: '', description: '', qty: 1 }]
        }));
    };

    const removeItem = (index) => {
        const newItems = formData.items.filter((_, i) => i !== index).map((it, i) => ({ ...it, sr_no: i + 1 }));
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/office/requisitions', formData);
            toast.success("Requisition submitted successfully");
            navigate('/dashboard/office');
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to submit requisition");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 sm:p-10">
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-600 dark:text-slate-300 ml-1">Requester Name</label>
                        <input
                            type="text"
                            value={formData.employee_name_manual}
                            onChange={e => setFormData({ ...formData, employee_name_manual: e.target.value })}
                            className="w-full bg-slate-100 dark:bg-slate-800/50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-customRed/20 transition-all text-slate-900 dark:text-white"
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-600 dark:text-slate-300 ml-1">Employee ID</label>
                        <input
                            type="text"
                            value={formData.employee_code_manual}
                            onChange={e => setFormData({ ...formData, employee_code_manual: e.target.value })}
                            className="w-full bg-slate-100 dark:bg-slate-800/50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-customRed/20 transition-all text-slate-900 dark:text-white"
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-600 dark:text-slate-300 ml-1">Department</label>
                        <input
                            type="text"
                            value={formData.department}
                            onChange={e => setFormData({ ...formData, department: e.target.value })}
                            className="w-full bg-slate-100 dark:bg-slate-800/50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-customRed/20 transition-all text-slate-900 dark:text-white"
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-600 dark:text-slate-300 ml-1">Designation</label>
                        <input
                            type="text"
                            value={formData.designation}
                            onChange={e => setFormData({ ...formData, designation: e.target.value })}
                            className="w-full bg-slate-100 dark:bg-slate-800/50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-customRed/20 transition-all text-slate-900 dark:text-white"
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-600 dark:text-slate-300 ml-1">Office Location</label>
                        <input
                            type="text"
                            value={formData.office_location}
                            onChange={e => setFormData({ ...formData, office_location: e.target.value })}
                            placeholder="e.g. Head Office"
                            className="w-full bg-slate-100 dark:bg-slate-800/50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-customRed/20 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-600 dark:text-slate-300 ml-1">Line Manager</label>
                        <input
                            type="text"
                            value={formData.line_manager_name}
                            onChange={e => setFormData({ ...formData, line_manager_name: e.target.value })}
                            placeholder="Manager Name"
                            className="w-full bg-slate-100 dark:bg-slate-800/50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-customRed/20 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                        />
                    </div>
                </div>

                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-gray-200 flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-customRed"></span> Details of particulars/services requested
                        </h3>
                        <button
                            type="button"
                            onClick={addItem}
                            className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-customRed hover:text-white transition-all shadow-sm"
                        >
                            <FaPlus />
                        </button>
                    </div>
                    <div className="overflow-x-auto no-scrollbar rounded-3xl border border-slate-100 dark:border-slate-800">
                        <table className="w-full text-left">
                            <thead className="bg-slate-100 dark:bg-slate-800">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Sr. No</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Type of Particular *</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Description</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 text-center">Qty **</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 text-center">Qty Issued</th>
                                    <th className="px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {formData.items.map((item, index) => (
                                    <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                        <td className="px-6 py-4 text-sm font-bold text-slate-500">{item.sr_no}</td>
                                        <td className="px-6 py-4">
                                            <input
                                                type="text"
                                                value={item.type_of_particular}
                                                onChange={e => handleItemChange(index, 'type_of_particular', e.target.value)}
                                                placeholder="e.g. Stationary"
                                                className="w-full bg-transparent border-none p-0 text-sm font-bold focus:ring-0 placeholder:text-slate-500 dark:placeholder:text-slate-400 text-slate-900 dark:text-white"
                                                required
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <input
                                                type="text"
                                                value={item.description}
                                                onChange={e => handleItemChange(index, 'description', e.target.value)}
                                                placeholder="Enter details..."
                                                className="w-full bg-transparent border-none p-0 text-sm font-bold focus:ring-0 placeholder:text-slate-500 dark:placeholder:text-slate-400 text-slate-900 dark:text-white"
                                                required
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <input
                                                type="number"
                                                value={item.qty}
                                                onChange={e => handleItemChange(index, 'qty', e.target.value)}
                                                className="w-20 bg-slate-100 dark:bg-slate-800/50 border-none rounded-lg px-2 py-1 text-sm font-black focus:ring-0 text-center text-slate-900 dark:text-white"
                                                min="1"
                                                required
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="w-full h-8 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center text-[10px] text-slate-400 font-bold italic">
                                                For Admin Use
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {formData.items.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    className="text-slate-400 hover:text-red-500 transition-colors"
                                                >
                                                    <FaTrash size={12} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Signatures Row */}
                <div className="grid grid-cols-2 gap-12 mb-12 pt-8 border-t border-slate-200 dark:border-slate-800">
                    <div className="text-center">
                        <div className="h-16 flex items-end justify-center mb-4 border-b border-slate-300 dark:border-slate-600 italic text-slate-500 text-xs">
                            Line Manager (Signature)
                        </div>
                        <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic">If applicable</div>
                    </div>
                    <div className="text-center">
                        <div className="h-16 flex items-end justify-center mb-4 border-b border-slate-300 dark:border-slate-600 italic text-slate-600 text-xs text-uppercase">
                            {formData.employee_name_manual || 'Employee'}
                        </div>
                        <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic">Requestor Signature</div>
                    </div>
                </div>

                {/* Official Use Placeholder */}
                <div className="mb-12 p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-[2rem] bg-slate-50/50 dark:bg-slate-900/20">
                    <div className="flex items-center justify-center -mt-11 mb-8">
                        <span className="bg-white dark:bg-slate-900 px-6 py-2 border border-slate-300 dark:border-slate-700 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                            (For Official Use Only)
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-12">
                        <div className="space-y-6">
                            <div className="h-10 border-b border-slate-300 dark:border-slate-600 text-[10px] font-bold text-slate-500 flex items-end pb-1 uppercase italic tracking-widest">Authorized Signatory (HR / Admin)</div>
                            <div className="h-10 border-b border-slate-300 dark:border-slate-600 text-[10px] font-bold text-slate-500 flex items-end pb-1 uppercase italic tracking-widest">Authorized Signatory (Account Approval)</div>
                        </div>
                        <div className="space-y-6">
                            <div className="h-10 border-b border-slate-300 dark:border-slate-600 text-[10px] font-bold text-slate-500 flex items-end pb-1 uppercase italic tracking-widest">Remarks (Admin)</div>
                            <div className="h-10 border-b border-slate-300 dark:border-slate-600 text-[10px] font-bold text-slate-500 flex items-end pb-1 uppercase italic tracking-widest">Remarks (Accounts)</div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/dashboard/office')}
                        className="px-8 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold uppercase tracking-widest text-[11px] hover:bg-slate-200 transition-all active:scale-95"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`px-8 py-3 bg-customRed text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 active:scale-95 flex items-center gap-2 ${loading ? 'opacity-70' : ''}`}
                    >
                        {loading && <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                        Submit Form
                    </button>
                </div>
            </form>
        </div>
    );
}
