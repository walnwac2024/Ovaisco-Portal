import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { toast } from 'react-toastify';
import { TrendingUp, History, User, Save, Calendar, Search, Users, CheckSquare, Square } from 'lucide-react';

const IncrementManagement = () => {
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState([]); // For bulk selection

    // Form state
    const [formData, setFormData] = useState({
        increment_type: 'FIXED',
        value: '',
        notes: '',
        effective_date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const res = await api.get('/employees');
            // Filter only those with locked salaries
            setEmployees(res.data.filter(e => Number(e.salary_locked) === 1));
        } catch (err) {
            toast.error("Failed to fetch employees");
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async (empId) => {
        try {
            // We use the new controller endpoint or the existing one if compatible
            // For minimalist, let's assume we can fetch history
            const res = await api.get(`/payroll/increment/history/${empId}`);
            setHistory(res.data.history || res.data);
        } catch (err) {
            console.error("History fetch failed");
        }
    };

    const handleSelectEmployee = (emp) => {
        setSelectedEmployee(emp);
        fetchHistory(emp.id);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.value) return;

        try {
            setSaving(true);
            let res;
            if (selectedIds.length > 0) {
                // Bulk (handles 1 or many)
                res = await api.post('/payroll/bulk-increment', {
                    employee_ids: selectedIds,
                    ...formData
                });
            } else if (selectedEmployee) {
                // Single (fallback if someone only clicked the row)
                res = await api.post('/payroll/increment', {
                    employee_id: selectedEmployee.id,
                    ...formData
                });
            } else {
                toast.warning("Please select at least one employee");
                setSaving(false);
                return;
            }

            toast.success(res.data.message);
            if (selectedEmployee) fetchHistory(selectedEmployee.id);
            fetchEmployees();
            setFormData({ ...formData, value: '', notes: '' });
            setSelectedIds([]);
            setSelectedEmployee(null);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to apply increment");
        } finally {
            setSaving(false);
        }
    };

    const toggleSelection = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
        // If we select multiple, clear the single view to focus on bulk form
        if (!selectedIds.includes(id) && selectedIds.length >= 0) {
            // keep it if we want to show someone specific, but usually bulk hides history
        }
    };

    const handleSelectAll = () => {
        if (selectedIds.length === filteredEmployees.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredEmployees.map(e => e.id));
        }
    };

    const filteredEmployees = employees.filter(e =>
        e.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center text-slate-500">Loading increment portal...</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">

            {/* Left: Employee Selection */}
            <div className="md:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <div className="flex-1 mr-4 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-customRed/5 focus:border-customRed outline-none transition-all"
                        />
                    </div>
                    <div className="bg-customRed text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                        {filteredEmployees.length}
                    </div>
                </div>

                <div className="p-3 bg-white border-b border-slate-100 flex items-center justify-between">
                    <button
                        onClick={handleSelectAll}
                        className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 hover:text-customRed transition-colors"
                    >
                        {selectedIds.length > 0 && selectedIds.length === filteredEmployees.length ? <CheckSquare className="w-3 h-3" /> : <Square className="w-3 h-3" />}
                        {selectedIds.length > 0 && selectedIds.length === filteredEmployees.length ? 'Unselect All' : 'Select All Filtered'}
                    </button>
                    {selectedIds.length > 0 && (
                        <button
                            onClick={() => setSelectedIds([])}
                            className="text-[10px] font-black text-customRed uppercase hover:underline"
                        >
                            Clear ({selectedIds.length})
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto">
                    {filteredEmployees.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-sm italic">
                            No employees found.
                        </div>
                    ) : (
                        filteredEmployees.map(emp => (
                            <div
                                key={emp.id}
                                className={`p-4 border-b border-slate-50 cursor-pointer flex items-center justify-between hover:bg-slate-50 transition-colors ${selectedEmployee?.id === emp.id ? 'bg-red-50' : ''}`}
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0" onClick={() => handleSelectEmployee(emp)}>
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                        <User className="w-4 h-4 text-slate-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-slate-900 truncate">{emp.name}</p>
                                        <p className="text-[10px] text-slate-600">Rs. {Number(emp.monthly_salary).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleSelection(emp.id);
                                        }}
                                        className={`p-1 rounded-md transition-colors ${selectedIds.includes(emp.id) ? 'text-customRed' : 'text-slate-300'}`}
                                    >
                                        {selectedIds.includes(emp.id) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Right: Actions & History */}
            <div className="md:col-span-2 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                {selectedEmployee || (selectedIds.length > 0) ? (
                    <>
                        {/* Increment Form */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                                {selectedIds.length > 1 ? <Users className="w-5 h-5 text-customRed" /> : <TrendingUp className="w-5 h-5 text-customRed" />}
                                {selectedIds.length > 1 ? `Bulk Increment (${selectedIds.length} Selected)` : `Apply Salary Increment`}
                            </h3>
                            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Increment Type</label>
                                    <select
                                        value={formData.increment_type}
                                        onChange={(e) => setFormData({ ...formData, increment_type: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-4 focus:ring-customRed/5 focus:border-customRed font-bold text-slate-700 bg-slate-50"
                                    >
                                        <option value="FIXED">Fixed Amount (Rs.)</option>
                                        <option value="PERCENTAGE">Percentage (%)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Value</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.value}
                                        onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                        placeholder={formData.increment_type === 'FIXED' ? "e.g. 5000" : "e.g. 10"}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-4 focus:ring-customRed/5 focus:border-customRed font-bold text-slate-700"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Reason / Notes</label>
                                    <textarea
                                        rows="2"
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder="Performance appraisal, annual review, etc."
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-4 focus:ring-customRed/5 focus:border-customRed font-medium text-slate-700"
                                    ></textarea>
                                </div>
                                <div className="md:col-span-2 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex items-center gap-2 bg-customRed text-white px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-red-100 disabled:opacity-50"
                                    >
                                        {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save className="w-4 h-4" />}
                                        {selectedIds.length > 1 ? 'Process Bulk Update' : 'Update Salary'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* History Table */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                                <History className="w-4 h-4 text-slate-400" />
                                <h3 className="font-bold text-slate-900 text-sm italic">Increment History</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50/50 text-slate-500 uppercase tracking-widest font-bold">
                                        <tr>
                                            <th className="px-6 py-3">Date</th>
                                            <th className="px-6 py-3">Type</th>
                                            <th className="px-6 py-3">Change</th>
                                            <th className="px-6 py-3">New Salary</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-medium">
                                        {history.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="px-6 py-8 text-center text-slate-400">No previous changes recorded.</td>
                                            </tr>
                                        ) : (
                                            history.map(row => (
                                                <tr key={row.id}>
                                                    <td className="px-6 py-4">{new Date(row.created_at || row.effective_date).toLocaleDateString()}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-0.5 rounded-full font-bold ${row.increment_type === 'FIXED' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                                                            {row.increment_type}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-emerald-600">
                                                        +{row.increment_type === 'FIXED' ? `Rs. ${row.increment_value}` : `${row.increment_value}%`}
                                                    </td>
                                                    <td className="px-6 py-4 font-bold text-slate-900">
                                                        Rs. {Number(row.new_salary).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="h-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-12 text-center opacity-70">
                        <TrendingUp className="w-12 h-12 text-slate-300 mb-4" />
                        <h3 className="text-slate-900 font-bold">Salary Adjustments</h3>
                        <p className="text-slate-500 text-xs max-w-xs mx-auto">
                            Only employees with a locked initial salary will appear here for further increments.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default IncrementManagement;
