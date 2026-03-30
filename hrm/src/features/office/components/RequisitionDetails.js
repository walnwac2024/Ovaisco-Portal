import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';
import { FaCheck, FaTimes, FaUser, FaBuilding, FaMapMarkerAlt, FaFileAlt } from 'react-icons/fa';

export default function RequisitionDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [req, setReq] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [remarks, setRemarks] = useState('');
    const [issuedQtys, setIssuedQtys] = useState({});

    const features = new Set(user?.features || []);
    const dept = user?.department || user?.Department;
    const role = String(user?.role || '').toLowerCase();
    const isSeniorOrManager = (user?.flags?.level >= 6) || ['manager', 'admin', 'super_admin', 'developer'].includes(role);
    const isAccounts = ['Finance and Accounts Department -HOE', 'Accounts & Finance', 'Accounts', 'Finance'].includes(dept);
    const isHR = (dept === 'Human Resource-HOE (P&C)');

    const canApproveHR = features.has('office_req_approve_hr') || isHR;
    const canApproveAccounts = features.has('office_req_approve_accounts') || (isAccounts && isSeniorOrManager);

    const fetchDetails = async () => {
        try {
            const { data } = await api.get(`/office/requisitions/${id}`);
            setReq(data);
            // Initialize issued qtys with requested qtys
            const initialQtys = {};
            data.items.forEach(it => initialQtys[it.id] = it.qty);
            setIssuedQtys(initialQtys);
        } catch (err) {
            toast.error("Failed to fetch details");
            navigate('/dashboard/office');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetails();
    }, [id]);

    const handleApproval = async (stage, status) => {
        setSubmitting(true);
        try {
            const payload = { status, remarks };
            if (stage === 'accounts' && status === 'approved') {
                payload.items = Object.keys(issuedQtys).map(itemId => ({
                    id: parseInt(itemId),
                    qty_issued: issuedQtys[itemId]
                }));
            }

            const endpoint = stage === 'hr' ? `/office/requisitions/${id}/approve-hr` : `/office/requisitions/${id}/approve-accounts`;
            await api.patch(endpoint, payload);

            toast.success(`Succesfully ${status === 'rejected' ? 'rejected' : 'approved'}`);
            fetchDetails();
        } catch (err) {
            toast.error(err.response?.data?.message || "Operation failed");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <div className="h-8 w-8 border-4 border-customRed border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (!req) return null;

    return (
        <div className="p-6 sm:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Left: Info */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="flex items-start gap-4">
                            <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 shrink-0">
                                <FaUser />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Requester Info</label>
                                <p className="text-sm font-black text-slate-800 dark:text-white uppercase">{req.requester_name}</p>
                                <p className="text-[11px] text-slate-500 font-bold">{req.requester_code} | {req.designation}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 shrink-0">
                                <FaBuilding />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Department</label>
                                <p className="text-sm font-black text-slate-800 dark:text-white uppercase">{req.department}</p>
                                <p className="text-[11px] text-slate-500 font-bold">Manager: {req.line_manager_name || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 shrink-0">
                                <FaMapMarkerAlt />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Location</label>
                                <p className="text-sm font-black text-slate-800 dark:text-white uppercase">{req.office_location}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 shrink-0">
                                <FaFileAlt />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Request Date</label>
                                <p className="text-sm font-black text-slate-800 dark:text-white uppercase">{new Date(req.created_at).toLocaleDateString()}</p>
                                <p className="text-[11px] text-slate-500 font-bold">{new Date(req.created_at).toLocaleTimeString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-100 dark:bg-slate-800">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Sr.</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Particular</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Description</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 text-center">Qty</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 text-center">Qty Issued</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {req.items.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                        <td className="px-6 py-4 text-sm font-bold text-slate-500">{item.sr_no}</td>
                                        <td className="px-6 py-4 text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{item.type_of_particular}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-400">{item.description}</td>
                                        <td className="px-6 py-4 text-sm font-black text-slate-900 dark:text-white text-center">{item.qty}</td>
                                        <td className="px-6 py-4 text-center">
                                            {req.status === 'pending_accounts' && canApproveAccounts ? (
                                                <input
                                                    type="number"
                                                    value={issuedQtys[item.id] || 0}
                                                    onChange={e => setIssuedQtys({ ...issuedQtys, [item.id]: parseInt(e.target.value) })}
                                                    className="w-20 bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl px-3 py-1.5 text-xs font-black text-slate-900 dark:text-white text-center focus:ring-2 focus:ring-customRed focus:border-transparent outline-none"
                                                    min="0"
                                                    max={item.qty}
                                                />
                                            ) : (
                                                <span className={`text-sm font-black ${item.qty_issued ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                    {item.qty_issued || '-'}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right: Approval Actions */}
                <div className="space-y-6">
                    <div className="p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Workflow Status</h4>

                        <div className="space-y-6 relative ml-4 border-l-2 border-slate-200 dark:border-slate-700 pl-8">
                            {/* HR Stage */}
                            <div className="relative">
                                <div className={`absolute -left-[41px] top-0 h-4 w-4 rounded-full border-4 border-white dark:border-slate-900 ${req.hr_approved_by ? 'bg-emerald-500' : (req.status === 'pending_hr' ? 'bg-amber-500 animate-pulse' : 'bg-slate-300')}`} />
                                <h5 className="text-[11px] font-black uppercase tracking-widest text-slate-800 dark:text-white">HR Approval</h5>
                                {req.hr_approver_name && (
                                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                                        By {req.hr_approver_name} on {new Date(req.hr_approved_at).toLocaleString()}
                                    </p>
                                )}
                                {req.hr_remarks && <p className="text-[11px] text-slate-500 mt-1 italic font-medium">"{req.hr_remarks}"</p>}
                                {req.status === 'pending_hr' && canApproveHR && (
                                    <div className="mt-4 space-y-4 animate-slide-up">
                                        <textarea
                                            value={remarks}
                                            onChange={e => setRemarks(e.target.value)}
                                            placeholder="Add HR remarks..."
                                            className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl p-4 text-[11px] font-bold shadow-sm focus:ring-2 focus:ring-customRed/10 min-h-[80px]"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleApproval('hr', 'pending_accounts')}
                                                disabled={submitting}
                                                className="flex-1 py-3 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/10"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleApproval('hr', 'rejected')}
                                                disabled={submitting}
                                                className="flex-1 py-3 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/10"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Accounts Stage */}
                            <div className="relative">
                                <div className={`absolute -left-[41px] top-0 h-4 w-4 rounded-full border-4 border-white dark:border-slate-900 ${req.accounts_approved_by ? 'bg-emerald-500' : (req.status === 'pending_accounts' ? 'bg-blue-500 animate-pulse' : (req.status === 'approved' ? 'bg-emerald-500' : 'bg-slate-300'))}`} />
                                <h5 className="text-[11px] font-black uppercase tracking-widest text-slate-800 dark:text-white">Accounts Approval</h5>
                                {req.accounts_approver_name && (
                                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                                        By {req.accounts_approver_name} on {new Date(req.accounts_approved_at).toLocaleString()}
                                    </p>
                                )}
                                {req.accounts_remarks && <p className="text-[11px] text-slate-500 mt-1 italic font-medium">"{req.accounts_remarks}"</p>}
                                {req.status === 'pending_accounts' && canApproveAccounts && (
                                    <div className="mt-4 space-y-4 animate-slide-up">
                                        <textarea
                                            value={remarks}
                                            onChange={e => setRemarks(e.target.value)}
                                            placeholder="Add accounts remarks..."
                                            className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl p-4 text-[11px] font-bold shadow-sm focus:ring-2 focus:ring-customRed/10 min-h-[80px]"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleApproval('accounts', 'approved')}
                                                disabled={submitting}
                                                className="flex-1 py-3 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/10"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleApproval('accounts', 'rejected')}
                                                disabled={submitting}
                                                className="flex-1 py-3 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/10"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Signature and Official Use Section (Matching Paper Form) */}
                    <div className="mt-12 pt-8 border-t-2 border-dashed border-slate-300 dark:border-slate-700">
                        <div className="flex justify-between mb-16">
                            <div className="text-center w-48">
                                <div className="h-12 border-b border-slate-400 dark:border-slate-500 mb-2 flex items-end justify-center text-[10px] font-bold text-slate-600 italic">
                                    {req.line_manager_name || 'Line Manager Signature'}
                                </div>
                                <div className="text-[9px] font-black uppercase text-slate-600 dark:text-slate-300">Line Manager Signature</div>
                            </div>
                            <div className="text-center w-48">
                                <div className="h-12 border-b border-slate-400 dark:border-slate-500 mb-2 flex items-end justify-center text-[10px] font-bold text-slate-900 dark:text-white uppercase">
                                    {req.requester_name}
                                </div>
                                <div className="text-[9px] font-black uppercase text-slate-600 dark:text-slate-300">Requestor Signature</div>
                            </div>
                        </div>

                        <div className="p-8 border-2 border-slate-300 dark:border-slate-700 rounded-[2.5rem] bg-slate-50 dark:bg-slate-900/30 relative">
                            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 px-6 py-1 border border-slate-300 dark:border-slate-600 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-200">
                                (For Official Use Only)
                            </div>

                            <div className="grid grid-cols-2 gap-12 mt-4">
                                <div>
                                    <div className="mb-8">
                                        <div className="text-[8px] font-black uppercase text-slate-600 dark:text-slate-400 mb-2">Remarks (Admin)</div>
                                        <div className="min-h-[40px] border-b border-slate-300 dark:border-slate-600 text-[11px] font-bold text-slate-800 dark:text-slate-200 italic">
                                            {req.hr_remarks || 'Pending...'}
                                        </div>
                                    </div>
                                    <div className="text-center pt-4">
                                        <div className="h-10 border-b border-slate-300 dark:border-slate-600 mb-1 flex items-end justify-center text-[10px] font-black text-slate-900 dark:text-white uppercase">
                                            {req.hr_approver_name || 'Signature'}
                                        </div>
                                        <div className="text-[8px] font-black uppercase text-slate-600 dark:text-slate-400">Authorized Signatory (HR/Admin)</div>
                                    </div>
                                </div>
                                <div>
                                    <div className="mb-8">
                                        <div className="text-[8px] font-black uppercase text-slate-600 dark:text-slate-400 mb-2">Remarks (Accounts)</div>
                                        <div className="min-h-[40px] border-b border-slate-300 dark:border-slate-600 text-[11px] font-bold text-slate-800 dark:text-slate-200 italic">
                                            {req.accounts_remarks || 'Pending...'}
                                        </div>
                                    </div>
                                    <div className="text-center pt-4">
                                        <div className="h-10 border-b border-slate-300 dark:border-slate-600 mb-1 flex items-end justify-center text-[10px] font-black text-slate-900 dark:text-white uppercase">
                                            {req.accounts_approver_name || 'Signature'}
                                        </div>
                                        <div className="text-[8px] font-black uppercase text-slate-600 dark:text-slate-400">Authorized Signatory (Accounts Approval)</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/dashboard/office')}
                        className="w-full py-6 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-customRed transition-colors"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}
