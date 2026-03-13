import React, { useState } from 'react';
import api from '../../../utils/api';
import { toast } from 'react-toastify';
import { Upload, Download, FileText, CheckCircle2, AlertCircle, RefreshCcw, Save } from 'lucide-react';
import * as XLSX from 'xlsx';

const ALLOWANCE_FIELDS = [
    { id: 'contractual_pay', label: 'Contractual Pay' },
    { id: 'transport_allowance', label: 'Transport Allowance' },
    { id: 'attendance_bonus', label: 'Attendance Bonus' },
    { id: 'mobile_allowance', label: 'Mobile Allowance' },
    { id: 'tardiness_allowance', label: 'Tardiness Allowance' },
    { id: 'night_allowance', label: 'Night Allowance' },
    { id: 'house_allowance', label: 'House Allowance' },
    { id: 'fuel_allowance', label: 'Fuel Allowance' },
    { id: 'adhoc_allowance', label: 'Ad-Hoc Allowance' },
    { id: 'misc_allowance', label: 'Miscellaneous Allowance' },
    { id: 'relocation_allowance', label: 'Relocation Allowance' },
];

const DEDUCTION_FIELDS = [
    { id: 'food_deduction', label: 'Food Deduction' },
    { id: 'health_deduction', label: 'Health Deduction' },
    { id: 'month_adjustment', label: 'Month Adjustment' },
    { id: 'advance_salary', label: 'Advance Salary' },
    { id: 'eobi', label: 'EOBI' },
    { id: 'asap_allowance', label: 'ASAP Allowance' },
    { id: 'efap', label: 'EFAP' },
    { id: 'unpaid_leaves', label: 'Unpaid Leaves' },
];

const BulkSalaryImport = () => {
    const [previewData, setPreviewData] = useState([]);
    const [importing, setImporting] = useState(false);
    const [fileName, setFileName] = useState('');

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setFileName(file.name);

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                // Map columns to fields
                const mapped = data.map(row => {
                    const obj = { employee_id: row['Employee ID'] || row['employee_id'] };
                    ALLOWANCE_FIELDS.forEach(f => obj[f.id] = row[f.label] || row[f.id] || 0);
                    DEDUCTION_FIELDS.forEach(f => obj[f.id] = row[f.label] || row[f.id] || 0);
                    return obj;
                }).filter(r => r.employee_id);

                setPreviewData(mapped);
                toast.success(`Loaded ${mapped.length} records for preview`);
            } catch (err) {
                toast.error("Error reading file. Please use the template.");
            }
        };
        reader.readAsBinaryString(file);
    };

    const downloadTemplate = () => {
        const headers = [['Employee ID', ...ALLOWANCE_FIELDS.map(f => f.label), ...DEDUCTION_FIELDS.map(f => f.label)]];
        const ws = XLSX.utils.aoa_to_sheet(headers);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, "Bulk_Salary_Import_Template.xlsx");
    };

    const handleImport = async () => {
        if (!previewData.length) return;
        if (!window.confirm(`Import and lock salary for ${previewData.length} employees?`)) return;

        try {
            setImporting(true);
            const res = await api.post('/payroll/import-bulk-salary', { records: previewData });
            toast.success(`Successfully imported ${res.data.success} records. ${res.data.failed} failed.`);
            setPreviewData([]);
            setFileName('');
        } catch (err) {
            toast.error(err.response?.data?.message || "Import failed");
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 mb-1">Bulk Salary Import</h2>
                    <p className="text-sm text-slate-500 font-bold">Upload Excel file to set and lock salaries in one go.</p>
                </div>
                <button
                    onClick={downloadTemplate}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 text-slate-600 rounded-xl border border-slate-200 hover:bg-slate-100 transition-all font-black"
                >
                    <Download className="w-4 h-4" />
                    Download Template
                </button>
            </div>

            <div className="mb-8 p-10 border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50/50 flex flex-col items-center justify-center text-center group hover:border-customRed/30 transition-colors">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8 text-customRed" />
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2">Upload your Excel file</h3>
                <p className="text-xs text-slate-400 font-bold max-w-xs mb-6">Drop your file here or click to browse. Ensure "Employee ID" column matches system records.</p>

                <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="bulk-upload"
                />
                <label
                    htmlFor="bulk-upload"
                    className="px-8 py-3.5 bg-slate-900 text-white rounded-2xl font-black cursor-pointer hover:bg-slate-800 transition-all shadow-xl active:scale-95"
                >
                    {fileName || "Browse Files"}
                </label>
            </div>

            {previewData.length > 0 && (
                <div className="space-y-6 animate-in fade-in zoom-in-95">
                    <div className="flex justify-between items-center px-2">
                        <h4 className="font-black text-slate-900 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-customRed" />
                            Import Preview ({previewData.length} records)
                        </h4>
                        <button
                            onClick={handleImport}
                            disabled={importing}
                            className="flex items-center gap-3 bg-emerald-600 text-white px-8 py-3.5 rounded-2xl hover:bg-emerald-700 transition-all font-black shadow-lg shadow-emerald-100 disabled:opacity-50 active:scale-95"
                        >
                            {importing ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Confirm &amp; Start Import
                        </button>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50">
                                    <th className="p-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Emp ID</th>
                                    <th className="p-4 text-[11px] font-black text-slate-400 uppercase tracking-wider text-right">Contractual</th>
                                    <th className="p-4 text-[11px] font-black text-slate-400 uppercase tracking-wider text-right">Allowances</th>
                                    <th className="p-4 text-[11px] font-black text-slate-400 uppercase tracking-wider text-right">Deductions</th>
                                    <th className="p-4 text-[11px] font-black text-slate-400 uppercase tracking-wider text-right">Gross</th>
                                </tr>
                            </thead>
                            <tbody>
                                {previewData.map((row, idx) => {
                                    const totalAllowances = ALLOWANCE_FIELDS.slice(1).reduce((s, f) => s + Number(row[f.id] || 0), 0);
                                    const totalDeductions = DEDUCTION_FIELDS.reduce((s, f) => s + Number(row[f.id] || 0), 0);
                                    const gross = Number(row.contractual_pay || 0) + totalAllowances;

                                    return (
                                        <tr key={idx} className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4 text-sm font-black text-slate-900">{row.employee_id}</td>
                                            <td className="p-4 text-sm font-bold text-slate-600 text-right">{Number(row.contractual_pay).toLocaleString()}</td>
                                            <td className="p-4 text-sm font-bold text-slate-600 text-right">{totalAllowances.toLocaleString()}</td>
                                            <td className="p-4 text-sm font-bold text-red-500 text-right">-{totalDeductions.toLocaleString()}</td>
                                            <td className="p-4 text-sm font-black text-slate-900 text-right">{gross.toLocaleString()}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BulkSalaryImport;
