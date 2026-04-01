import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';
import { FaPlus, FaTrash, FaCalculator } from 'react-icons/fa';

export default function RequisitionForm() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [accountsEmployees, setAccountsEmployees] = useState([]);

    const [formData, setFormData] = useState({
        employee_name_manual: user?.name || '',
        employee_code_manual: user?.employeeCode || '',
        designation: user?.designation || '',
        department: user?.Department || '',
        office_location: '',
        line_manager_name: '',
        assigned_accounts_id: '',
        title: '',
        items: [
            { sr_no: 1, type_of_particular: '', description: '', qty: 1, unit_price: 0 }
        ]
    });

    useEffect(() => {
        const fetchAccountsEmployees = async () => {
            try {
                const { data } = await api.get('/office/accounts-employees');
                setAccountsEmployees(data);
            } catch (err) {
                console.error("Error fetching accounts employees:", err);
            }
        };
        fetchAccountsEmployees();
    }, []);

    const addItem = () => {
        if (formData.items.length >= 6) {
            toast.warn("Maximum 6 items allowed per requisition");
            return;
        }
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { sr_no: prev.items.length + 1, type_of_particular: '', description: '', qty: 1, unit_price: 0 }]
        }));
    };

    const removeItem = (index) => {
        const newItems = formData.items.filter((_, i) => i !== index).map((it, i) => ({ ...it, sr_no: i + 1 }));
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        if (field === 'qty' || field === 'unit_price') {
            // Keep the raw value for the input, but parse for calculations
            newItems[index][field] = value;
        } else {
            newItems[index][field] = value;
        }
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const calculateGrandTotal = () => {
        return formData.items.reduce((sum, item) => sum + ((parseFloat(item.qty) || 0) * (parseFloat(item.unit_price) || 0)), 0);
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-10">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-600 dark:text-slate-300 ml-1">Requester Name</label>
                        <input
                            type="text"
                            value={formData.employee_name_manual}
                            onChange={e => setFormData({ ...formData, employee_name_manual: e.target.value })}
                            className="w-full bg-slate-100 dark:bg-slate-800/50 border-none rounded-2xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-customRed/20 transition-all text-slate-900 dark:text-white"
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-600 dark:text-slate-300 ml-1">Employee ID</label>
                        <input
                            type="text"
                            value={formData.employee_code_manual}
                            onChange={e => setFormData({ ...formData, employee_code_manual: e.target.value })}
                            className="w-full bg-slate-100 dark:bg-slate-800/50 border-none rounded-2xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-customRed/20 transition-all text-slate-900 dark:text-white"
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-600 dark:text-slate-300 ml-1">Department</label>
                        <input
                            type="text"
                            value={formData.department}
                            onChange={e => setFormData({ ...formData, department: e.target.value })}
                            className="w-full bg-slate-100 dark:bg-slate-800/50 border-none rounded-2xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-customRed/20 transition-all text-slate-900 dark:text-white"
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-600 dark:text-slate-300 ml-1">Designation</label>
                        <input
                            type="text"
                            value={formData.designation}
                            onChange={e => setFormData({ ...formData, designation: e.target.value })}
                            className="w-full bg-slate-100 dark:bg-slate-800/50 border-none rounded-2xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-customRed/20 transition-all text-slate-900 dark:text-white"
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
                            className="w-full bg-slate-100 dark:bg-slate-800/50 border-none rounded-2xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-customRed/20 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
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
                            className="w-full bg-slate-100 dark:bg-slate-800/50 border-none rounded-2xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-customRed/20 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-[0.15em] text-customRed ml-1">Assign to Accounts Person *</label>
                        <select
                            value={formData.assigned_accounts_id}
                            onChange={e => setFormData({ ...formData, assigned_accounts_id: e.target.value })}
                            className="w-full bg-slate-100 dark:bg-slate-800/50 border-none rounded-2xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-customRed/20 transition-all text-slate-900 dark:text-white"
                            required
                        >
                            <option value="">Select Person</option>
                            {accountsEmployees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.Employee_Name} ({emp.Employee_ID})</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="mb-10 p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-[0.15em] text-customRed ml-1">Nature of Requisition / Subject *</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g. Monthly Stationary Supply or Purchase of Office Equipment"
                            className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-5 py-4 text-sm font-bold shadow-sm focus:ring-2 focus:ring-customRed/20 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                            required
                        />
                    </div>
                </div>

                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-800 dark:text-gray-200 flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-customRed"></span> <span className="hidden sm:inline">Details of particulars/services requested</span><span className="sm:hidden">Request Details</span>
                        </h3>
                        <button
                            type="button"
                            onClick={addItem}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-customRed hover:text-white transition-all shadow-sm text-[10px] font-black uppercase tracking-widest"
                        >
                            <FaPlus /> <span>Add Item</span>
                        </button>
                    </div>

                    {/* Mobile Card Layout */}
                    <div className="md:hidden space-y-4">
                        {formData.items.map((item, index) => (
                            <div key={index} className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 relative group">
                                <div className="absolute top-4 right-4 flex items-center gap-3">
                                    <span className="text-[10px] font-black text-slate-300">#{item.sr_no}</span>
                                    {formData.items.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeItem(index)}
                                            className="h-8 w-8 flex items-center justify-center bg-white dark:bg-slate-800 text-slate-400 hover:text-rose-500 rounded-full border border-slate-100 dark:border-slate-700 transition-colors shadow-sm"
                                        >
                                            <FaTrash size={12} />
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Particular *</label>
                                        <input
                                            type="text"
                                            value={item.type_of_particular}
                                            onChange={e => handleItemChange(index, 'type_of_particular', e.target.value)}
                                            placeholder="e.g. Stationary"
                                            className="w-full bg-white dark:bg-slate-900 border-none rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-customRed/10 transition-all"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Description</label>
                                        <textarea
                                            value={item.description}
                                            onChange={e => handleItemChange(index, 'description', e.target.value)}
                                            placeholder="Enter details..."
                                            className="w-full bg-white dark:bg-slate-900 border-none rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-customRed/10 transition-all min-h-[60px] resize-none"
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Qty **</label>
                                            <input
                                                type="number"
                                                value={item.qty}
                                                onChange={e => handleItemChange(index, 'qty', e.target.value)}
                                                className="w-full bg-white dark:bg-slate-900 border-none rounded-xl px-4 py-2.5 text-sm font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-customRed/10 transition-all"
                                                min="1"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Price</label>
                                            <input
                                                type="number"
                                                value={item.unit_price}
                                                onChange={e => handleItemChange(index, 'unit_price', e.target.value)}
                                                className="w-full bg-white dark:bg-slate-900 border-none rounded-xl px-4 py-2.5 text-sm font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-customRed/10 transition-all"
                                                min="0"
                                                step="0.01"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Item Total</label>
                                        <div className="w-full h-[41px] bg-emerald-50 dark:bg-emerald-900/10 rounded-xl flex items-center px-4 text-sm text-emerald-600 font-black border border-emerald-100 dark:border-emerald-800/30">
                                            Rs. {((parseFloat(item.qty) || 0) * (parseFloat(item.unit_price) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop Table Layout */}
                    <div className="hidden md:block overflow-x-auto no-scrollbar rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <table className="w-full text-left">
                            <thead className="bg-slate-100 dark:bg-slate-800">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Sr. No</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Type of Particular *</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Description</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 text-center">Qty **</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 text-center">Price</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 text-right">Total</th>
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
                                                className="w-16 bg-slate-100 dark:bg-slate-800/50 border-none rounded-lg px-2 py-1 text-sm font-black focus:ring-0 text-center text-slate-900 dark:text-white"
                                                min="1"
                                                required
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <input
                                                type="number"
                                                value={item.unit_price}
                                                onChange={e => handleItemChange(index, 'unit_price', e.target.value)}
                                                className="w-24 bg-slate-100 dark:bg-slate-800/50 border-none rounded-lg px-2 py-1 text-sm font-black focus:ring-0 text-center text-slate-900 dark:text-white"
                                                min="0"
                                                step="0.01"
                                                required
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                                                Rs. {((parseFloat(item.qty) || 0) * (parseFloat(item.unit_price) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {formData.items.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full transition-all"
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

                <div className="mb-10 flex justify-end">
                    <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 min-w-[300px]">
                        <div className="flex items-center justify-between gap-10">
                            <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                                <FaCalculator className="text-customRed" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Grand Total</span>
                            </div>
                            <div className="text-2xl font-black text-slate-900 dark:text-white">
                                <span className="text-xs mr-2 text-slate-400">Rs.</span>
                                {calculateGrandTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Signatures Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12 mb-12 pt-8 border-t border-slate-200 dark:border-slate-800">
                    <div className="text-center">
                        <div className="h-14 sm:h-16 flex items-end justify-center mb-4 border-b border-slate-300 dark:border-slate-600 italic text-slate-500 text-[11px]">
                            Line Manager (Signature)
                        </div>
                        <div className="text-[9px] font-black uppercase text-slate-500 tracking-[0.2em] italic">If applicable</div>
                    </div>
                    <div className="text-center">
                        <div className="h-14 sm:h-16 flex items-end justify-center mb-4 border-b border-slate-300 dark:border-slate-600 italic text-slate-700 dark:text-slate-300 text-[11px] uppercase font-bold">
                            {formData.employee_name_manual || 'Employee'}
                        </div>
                        <div className="text-[9px] font-black uppercase text-slate-500 tracking-[0.2em] italic">Requestor Signature</div>
                    </div>
                </div>

                {/* Official Use Placeholder */}
                <div className="mb-12 p-6 sm:p-10 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-[2.5rem] bg-slate-50/50 dark:bg-slate-900/10 relative">
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-900 px-6 py-1 border border-slate-300 dark:border-slate-700 rounded-full text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                        (For Official Use Only)
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 mt-4">
                        <div className="space-y-8">
                            <div className="h-10 border-b border-slate-300 dark:border-slate-600 text-[9px] font-bold text-slate-400 flex items-end pb-1 uppercase italic tracking-widest whitespace-nowrap">Authorized Signatory (HR / Admin)</div>
                            <div className="h-10 border-b border-slate-300 dark:border-slate-600 text-[9px] font-bold text-slate-400 flex items-end pb-1 uppercase italic tracking-widest whitespace-nowrap">Authorized Signatory (Accounts)</div>
                        </div>
                        <div className="space-y-8">
                            <div className="h-10 border-b border-slate-300 dark:border-slate-600 text-[9px] font-bold text-slate-400 flex items-end pb-1 uppercase italic tracking-widest">Remarks (Admin)</div>
                            <div className="h-10 border-b border-slate-300 dark:border-slate-600 text-[9px] font-bold text-slate-400 flex items-end pb-1 uppercase italic tracking-widest">Remarks (Accounts)</div>
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
