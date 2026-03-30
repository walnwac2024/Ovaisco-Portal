import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../utils/api';

export default function RequisitionPrint() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [req, setReq] = useState(null);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const { data } = await api.get(`/office/requisitions/${id}`);
                setReq(data);
            } catch (err) {
                console.error(err);
                navigate('/dashboard/office');
            }
        };
        fetchDetails();
    }, [id, navigate]);

    const handlePrint = () => {
        window.print();
    };

    if (!req) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="p-8 bg-slate-50 min-h-screen print:p-0 print:bg-white">
            <div className="max-w-4xl mx-auto bg-white shadow-2xl p-12 print:shadow-none print:p-0">
                {/* Header */}
                <div className="text-center border-b-4 border-slate-900 pb-4 mb-8">
                    <h1 className="text-3xl font-black uppercase tracking-[0.1em] text-slate-900">General Requisition Form</h1>
                </div>

                {/* Top Section */}
                <div className="grid grid-cols-2 gap-x-12 gap-y-6 mb-8 text-[11px]">
                    <div className="flex items-end gap-3 border-b border-slate-400 pb-1">
                        <span className="font-bold text-slate-600 uppercase whitespace-nowrap">Employee Name (Requested by):</span>
                        <span className="font-black text-slate-900 uppercase truncate">{req.requester_name}</span>
                    </div>
                    <div className="flex items-end gap-3 border-b border-slate-400 pb-1">
                        <span className="font-bold text-slate-600 uppercase whitespace-nowrap">Employee ID:</span>
                        <span className="font-black text-slate-900 uppercase truncate">{req.requester_code}</span>
                    </div>
                    <div className="flex items-end gap-3 border-b border-slate-400 pb-1">
                        <span className="font-bold text-slate-600 uppercase whitespace-nowrap">Designation:</span>
                        <span className="font-black text-slate-900 uppercase truncate">{req.designation}</span>
                    </div>
                    <div className="flex items-end gap-3 border-b border-slate-400 pb-1">
                        <span className="font-bold text-slate-600 uppercase whitespace-nowrap">Department:</span>
                        <span className="font-black text-slate-900 uppercase truncate">{req.department}</span>
                    </div>
                    <div className="flex items-end gap-3 border-b border-slate-400 pb-1">
                        <span className="font-bold text-slate-600 uppercase whitespace-nowrap">Office Location:</span>
                        <span className="font-black text-slate-900 uppercase truncate">{req.office_location}</span>
                    </div>
                    <div className="flex items-end gap-3 border-b border-slate-400 pb-1">
                        <span className="font-bold text-slate-600 uppercase whitespace-nowrap">Name (Line Manager) <span className="text-[8px] italic font-normal">if applicable</span>:</span>
                        <span className="font-black text-slate-900 uppercase truncate">{req.line_manager_name || 'N/A'}</span>
                    </div>
                </div>

                {/* Table Section */}
                <div className="mb-8">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Details of particulars/services requested:</p>
                    <table className="w-full border-collapse border border-slate-900">
                        <thead>
                            <tr className="bg-slate-50 print:bg-transparent">
                                <th className="border border-slate-900 px-2 py-2 text-[10px] font-black uppercase text-center w-12">Sr No.</th>
                                <th className="border border-slate-900 px-4 py-2 text-[10px] font-black uppercase text-left">Type of Particular *</th>
                                <th className="border border-slate-900 px-4 py-2 text-[10px] font-black uppercase text-left">Description</th>
                                <th className="border border-slate-900 px-2 py-2 text-[10px] font-black uppercase text-center w-16">Qty **</th>
                                <th className="border border-slate-900 px-2 py-2 text-[10px] font-black uppercase text-center w-20">Qty Issued</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...Array(Math.max(req.items.length, 6))].map((_, idx) => {
                                const item = req.items[idx];
                                return (
                                    <tr key={idx} className="h-10">
                                        <td className="border border-slate-900 text-center font-bold text-slate-500 text-xs">{idx + 1}</td>
                                        <td className="border border-slate-900 px-4 text-xs font-black uppercase text-slate-900">{item?.type_of_particular || ''}</td>
                                        <td className="border border-slate-900 px-4 text-xs font-medium text-slate-700">{item?.description || ''}</td>
                                        <td className="border border-slate-900 text-center font-black text-slate-900 text-xs">{item?.qty || ''}</td>
                                        <td className="border border-slate-900 text-center font-black text-emerald-600 text-xs">{item?.qty_issued || ''}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Signature Middle Section */}
                <div className="grid grid-cols-2 gap-20 mb-8 mt-12">
                    <div className="text-center">
                        <div className="h-12 border-b-2 border-slate-400 mb-2 flex items-end justify-center text-[10px] font-bold text-slate-500 italic uppercase">
                            {req.line_manager_name ? 'Electronically Approved' : ''}
                        </div>
                        <p className="text-[10px] font-black uppercase text-slate-700">Line Manager (Signature) <br /><span className="text-[8px] italic font-normal">if applicable</span></p>
                    </div>
                    <div className="text-center">
                        <div className="h-12 border-b-2 border-slate-400 mb-2 flex items-end justify-center text-[10px] font-bold text-slate-900 uppercase">
                            {req.requester_name}
                        </div>
                        <p className="text-[10px] font-black uppercase text-slate-700">Employee (Requestor Signature)</p>
                    </div>
                </div>

                {/* Remarks Section */}
                <div className="mb-8">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-700 mb-1">Remarks:</p>
                    <div className="border-b border-slate-400 min-h-[40px] text-xs py-2 italic font-medium text-slate-900 uppercase">
                        {req.hr_remarks || req.accounts_remarks || ''}
                    </div>
                </div>

                {/* Official Use Section */}
                <div className="border-t-2 border-dashed border-slate-500 pt-4 mt-8">
                    <p className="text-center text-[11px] font-black uppercase tracking-[0.3em] text-slate-600 mb-8 italic">(for official use only)</p>

                    <div className="grid grid-cols-2 gap-x-12 gap-y-12">
                        <div className="space-y-12">
                            <div className="text-center">
                                <div className="h-12 border-b-2 border-slate-400 mb-2 flex flex-col items-center justify-end text-[10px] font-black text-slate-900 uppercase">
                                    <span>{req.hr_approver_name}</span>
                                    {req.hr_approved_at && (
                                        <span className="text-[7px] text-slate-500 font-bold normal-case">
                                            {new Date(req.hr_approved_at).toLocaleString()}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[10px] font-black uppercase text-slate-700">Authorized Signatory (HR/Admin)</p>
                            </div>
                            <div className="text-center">
                                <div className="h-12 border-b-2 border-slate-400 mb-2 flex flex-col items-center justify-end text-[10px] font-black text-slate-900 uppercase">
                                    <span>{req.accounts_approver_name}</span>
                                    {req.accounts_approved_at && (
                                        <span className="text-[7px] text-slate-500 font-bold normal-case">
                                            {new Date(req.accounts_approved_at).toLocaleString()}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[10px] font-black uppercase text-slate-700">Authorized Signatory (Accounts Approval)</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-700 mb-1">Remarks (Admin)</p>
                                <div className="border border-slate-400 rounded-lg h-24 p-3 text-[11px] font-bold italic uppercase text-slate-900 bg-slate-50">
                                    {req.hr_remarks}
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-700 mb-1">Remarks (Accounts)</p>
                                <div className="border border-slate-400 rounded-lg h-24 p-3 text-[11px] font-bold italic uppercase text-slate-900 bg-slate-50">
                                    {req.accounts_remarks}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 text-[8px] text-slate-400 flex justify-between uppercase font-bold tracking-widest">
                    <span>* A particular can be any product or a service</span>
                    <span>** Qty to be considered N/A if particular is a service</span>
                </div>

                {/* Print Button - Hidden on Print */}
                <div className="mt-12 flex justify-end gap-3 print:hidden border-t pt-8">
                    <button
                        onClick={() => navigate('/dashboard/office')}
                        className="px-8 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold uppercase tracking-widest text-[11px] hover:bg-slate-200 transition-all active:scale-95"
                    >
                        Go Back
                    </button>
                    <button
                        onClick={handlePrint}
                        className="px-8 py-3 bg-customRed text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 active:scale-95 flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Print Form
                    </button>
                </div>
            </div>
        </div>
    );
}
