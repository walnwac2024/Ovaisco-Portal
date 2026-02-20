import React, { useState, useEffect, useMemo } from 'react';
import api from '../../../utils/api';
import { toast } from 'react-toastify';
import { Lock, Unlock, Save, User, CreditCard, CircleAlert, CircleHelp, Search, X } from 'lucide-react';

const ALLOWANCE_FIELDS = [
    { id: 'contractual_pay', label: 'Contractual Pay', description: 'Base salary as per contract' },
    { id: 'transport_allowance', label: 'Transport Allowance', description: 'Conveyance/Transport support' },
    { id: 'attendance_bonus', label: 'Attendance Bonus', description: 'Bonus for perfect attendance' },
    { id: 'mobile_allowance', label: 'Mobile Allowance', description: 'Communication allowance' },
    { id: 'tardiness_allowance', label: 'Tardiness Allowance', description: 'Buffer for late arrivals' },
    { id: 'night_allowance', label: 'Night Allowance', description: 'Shift allowance for night duties' },
    { id: 'house_allowance', label: 'House Allowance', description: 'Rent/Housing support' },
    { id: 'fuel_allowance', label: 'Fuel Allowance', description: 'Fuel/Maintenance support' },
    { id: 'adhoc_allowance', label: 'Ad-Hoc Allowance', description: 'Special one-time or recurring ad-hoc' },
    { id: 'misc_allowance', label: 'Miscellaneous Allowance', description: 'Other miscellaneous supports' },
    { id: 'relocation_allowance', label: 'Relocation Allowance', description: 'One-time relocation support' },
];

const DEDUCTION_FIELDS = [
    { id: 'food_deduction', label: 'Food Deduction', description: 'Fixed monthly food deduction' },
    { id: 'health_deduction', label: 'Health / Medical Deduction', description: 'Fixed monthly health/medical deduction' },
];

const ALL_FIELDS = [...ALLOWANCE_FIELDS, ...DEDUCTION_FIELDS];

const SalarySettings = () => {
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [allowances, setAllowances] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        fetchEmployees();
    }, []);

    const filteredEmployees = useMemo(() => {
        return employees.filter(emp => {
            const matchesSearch =
                emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                emp.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFilter =
                filterStatus === 'all' ||
                (filterStatus === 'locked' && emp.salary_locked) ||
                (filterStatus === 'unlocked' && !emp.salary_locked);
            return matchesSearch && matchesFilter;
        });
    }, [employees, searchTerm, filterStatus]);

    const stats = useMemo(() => {
        const total = employees.length;
        const locked = employees.filter(e => e.salary_locked).length;
        return { total, locked, pending: total - locked };
    }, [employees]);

    const fetchEmployees = async () => {
        try {
            const res = await api.get('/employees');
            setEmployees(res.data);
        } catch (err) {
            toast.error("Failed to fetch employees");
        } finally {
            setLoading(false);
        }
    };

    const handleSelectEmployee = async (emp) => {
        setSelectedEmployee(emp);
        setAllowances({});
        try {
            const res = await api.get(`/payroll/base-settings/${emp.id}`);
            if (res.data) {
                const loaded = {};
                ALL_FIELDS.forEach(f => {
                    loaded[f.id] = res.data[f.id] || 0;
                });
                setAllowances(loaded);
            } else {
                setAllowances({ contractual_pay: emp.monthly_salary || '' });
            }
        } catch (err) {
            console.error("Failed to load salary details", err);
            setAllowances({ contractual_pay: emp.monthly_salary || '' });
        }
    };

    const handleAllowanceChange = (field, value) => {
        setAllowances(prev => ({ ...prev, [field]: value }));
    };

    const calculateTotal = () => {
        return ALLOWANCE_FIELDS.reduce((sum, f) => sum + (Number(allowances[f.id]) || 0), 0);
    };

    const handleLock = async () => {
        if (!selectedEmployee) return;
        const total = calculateTotal();
        if (total <= 0) {
            toast.warn("Total salary must be greater than 0");
            return;
        }
        if (!window.confirm(`Are you sure you want to lock the salary for ${selectedEmployee.name} at Rs. ${total}? This cannot be edited directly later.`)) return;
        try {
            setSaving(true);
            await api.post('/payroll/lock-salary', {
                employee_id: selectedEmployee.id,
                ...allowances
            });
            toast.success("Salary locked successfully!");
            fetchEmployees();
            setSelectedEmployee({ ...selectedEmployee, salary_locked: 1, monthly_salary: total });
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to lock salary");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Loading employees...</div>;

    const totalSalary = calculateTotal();

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
            {/* Employee List */}
            <div className="md:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                            <User className="w-4 h-4 text-customRed" />
                            Employees
                        </h3>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold bg-slate-200 px-1.5 py-0.5 rounded text-slate-600">
                                {stats.locked}/{stats.total} Set
                            </span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search Name or ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-customRed transition-colors shadow-sm"
                            />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                                    <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                                </button>
                            )}
                        </div>

                        <div className="flex p-1 bg-slate-100 rounded-xl">
                            {['all', 'unlocked', 'locked'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`flex-1 text-[11px] font-bold py-2 rounded-lg transition-all uppercase tracking-tight
                                        ${filterStatus === status ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {filteredEmployees.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 italic text-xs">No employees found.</div>
                    ) : (
                        filteredEmployees.map(emp => (
                            <div
                                key={emp.id}
                                onClick={() => handleSelectEmployee(emp)}
                                className={`p-4 border-b border-slate-50 cursor-pointer flex justify-between items-center hover:bg-slate-50 transition-all ${selectedEmployee?.id === emp.id ? 'bg-red-50 border-customRed/20' : ''}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shadow-sm">
                                        <User className="w-5 h-5 text-slate-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-slate-900 truncate">{emp.name}</p>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold">{emp.employeeCode}</p>
                                    </div>
                                </div>
                                {emp.salary_locked ? (
                                    <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100 shadow-sm">
                                        <Lock className="w-3.5 h-3.5 text-emerald-500" />
                                    </div>
                                ) : (
                                    <div className="w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center border border-amber-100 shadow-sm">
                                        <Unlock className="w-3.5 h-3.5 text-amber-500/50" />
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Salary Setup Form */}
            <div className="md:col-span-2 flex flex-col h-full overflow-hidden">
                {selectedEmployee ? (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full animate-in fade-in zoom-in-95 duration-300">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm">
                                    <User className="w-8 h-8 text-slate-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900">{selectedEmployee.name}</h2>
                                    <p className="text-xs font-bold text-slate-500 flex items-center gap-1">
                                        {selectedEmployee.designation} <span className="text-slate-300 font-normal">•</span> {selectedEmployee.department}
                                    </p>
                                </div>
                            </div>
                            {selectedEmployee.salary_locked ? (
                                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-5 py-2.5 rounded-2xl border border-emerald-100 text-[11px] font-black tracking-wider uppercase shadow-sm">
                                    <Lock className="w-4 h-4" />
                                    LOCKED
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-5 py-2.5 rounded-2xl border border-amber-100 text-[11px] font-black tracking-wider uppercase shadow-sm">
                                    <Unlock className="w-4 h-4" />
                                    UNLOCKED
                                </div>
                            )}
                        </div>

                        {/* Form Content */}
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50/30">

                            {/* Earnings & Allowances */}
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">
                                Earnings &amp; Allowances
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {ALLOWANCE_FIELDS.map(field => (
                                    <div key={field.id} className="group transition-all duration-300">
                                        <div className="flex items-center justify-between mb-2 px-1">
                                            <label className="text-[13px] font-black text-slate-700 group-focus-within:text-customRed transition-colors">
                                                {field.label}
                                            </label>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <CircleHelp className="w-4 h-4 text-slate-400 cursor-help" title={field.description} />
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                                <span className="text-slate-400 text-xs font-black">Rs.</span>
                                            </div>
                                            <input
                                                type="number"
                                                value={allowances[field.id] || ''}
                                                onChange={(e) => handleAllowanceChange(field.id, e.target.value)}
                                                disabled={selectedEmployee.salary_locked}
                                                placeholder="0.00"
                                                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-customRed/5 focus:border-customRed outline-none transition-all font-black text-sm disabled:bg-slate-100/50 disabled:text-slate-400 shadow-sm"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Fixed Deductions */}
                            <div className="mt-6 pt-5 border-t border-slate-200">
                                <p className="text-[11px] font-black text-red-400 uppercase tracking-widest mb-4">
                                    Fixed Monthly Deductions
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {DEDUCTION_FIELDS.map(field => (
                                        <div key={field.id} className="group transition-all duration-300">
                                            <div className="flex items-center justify-between mb-2 px-1">
                                                <label className="text-[13px] font-black text-red-500 group-focus-within:text-red-700 transition-colors">
                                                    {field.label}
                                                </label>
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <CircleHelp className="w-4 h-4 text-slate-400 cursor-help" title={field.description} />
                                                </div>
                                            </div>
                                            <div className="relative">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                                    <span className="text-red-400 text-xs font-black">-Rs.</span>
                                                </div>
                                                <input
                                                    type="number"
                                                    value={allowances[field.id] || ''}
                                                    onChange={(e) => handleAllowanceChange(field.id, e.target.value)}
                                                    disabled={selectedEmployee.salary_locked}
                                                    placeholder="0.00"
                                                    className="w-full pl-14 pr-4 py-3.5 rounded-2xl border border-red-100 focus:ring-4 focus:ring-red-50 focus:border-red-400 outline-none transition-all font-black text-sm disabled:bg-slate-100/50 disabled:text-slate-400 shadow-sm"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Info Box if locked */}
                            {selectedEmployee.salary_locked && (
                                <div className="mt-8 p-6 bg-white border border-slate-200 rounded-[2.5rem] flex gap-5 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
                                        <Lock className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-base font-black text-slate-900 leading-tight mb-1">Salary Breakdown is Fixed</p>
                                        <p className="text-sm text-slate-500 leading-relaxed font-bold">
                                            This setup has been locked. To make changes, use the Increment Management module or ask an administrator to unlock this record.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer / Summary */}
                        <div className="p-6 border-t border-slate-100 bg-white shrink-0">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-2xl bg-customRed/10 text-customRed flex items-center justify-center shadow-inner border border-customRed/5">
                                        <CreditCard className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Monthly Gross Salary</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-sm font-black text-slate-400">Rs.</span>
                                            <span className="text-3xl font-black text-slate-900 leading-none tracking-tight">
                                                {totalSalary.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {!selectedEmployee.salary_locked ? (
                                    <button
                                        onClick={handleLock}
                                        disabled={saving || totalSalary <= 0}
                                        className="flex items-center gap-3 bg-slate-900 text-white px-12 py-5 rounded-[2rem] hover:bg-slate-800 transition-all font-black shadow-2xl shadow-slate-200 disabled:opacity-50 active:scale-95 group overflow-hidden relative"
                                    >
                                        {saving ?
                                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> :
                                            <Save className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                                        }
                                        <span>Save &amp; Lock Salary</span>
                                    </button>
                                ) : (
                                    <div className="text-sm font-black text-emerald-600 bg-emerald-50 px-8 py-4 rounded-2xl border border-emerald-200 shadow-sm flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">✓</div>
                                        RECORD VALIDATED
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center p-12 text-center shadow-lg">
                        <div className="group relative">
                            <div className="absolute -inset-4 bg-slate-100 rounded-[3rem] blur-xl opacity-50 group-hover:opacity-75 transition duration-500"></div>
                            <div className="relative w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center mb-8 border border-slate-100 shadow-2xl">
                                <User className="w-12 h-12 text-slate-200 group-hover:text-customRed transition-colors duration-500" />
                            </div>
                        </div>
                        <h3 className="text-slate-900 text-2xl font-black mb-3">Configure Employee Payroll</h3>
                        <p className="text-slate-500 text-base max-w-sm mx-auto font-bold leading-relaxed">
                            Select an employee from the workspace to begin setting up their monthly gross salary and recurring allowances.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SalarySettings;
