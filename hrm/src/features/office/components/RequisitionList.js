import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';
import { FaEye, FaPrint, FaClock, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

export default function RequisitionList() {
    const [requisitions, setRequisitions] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();

    const fetchRequisitions = async () => {
        try {
            const { data } = await api.get('/office/requisitions');
            setRequisitions(data);
        } catch (err) {
            console.error("fetchRequisitions error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequisitions();
    }, []);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'pending_hr': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'pending_accounts': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'approved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'rejected': return 'bg-rose-100 text-rose-700 border-rose-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'pending_hr': return 'Pending HR';
            case 'pending_accounts': return 'Pending Accounts';
            case 'approved': return 'Approved';
            case 'rejected': return 'Rejected';
            default: return status;
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <div className="h-8 w-8 border-4 border-customRed border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="p-0">
            <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                        <tr>
                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Requester</th>
                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Location</th>
                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {requisitions.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-20 text-center">
                                    <div className="text-slate-300 dark:text-slate-600 mb-2 flex justify-center">
                                        <FaClock size={48} className="opacity-20" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No requisitions found</p>
                                </td>
                            </tr>
                        ) : (
                            requisitions.map((req) => (
                                <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                            {new Date(req.created_at).toLocaleDateString()}
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-medium tracking-tight">
                                            {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-tight">
                                            {req.requester_name}
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-medium">
                                            {req.designation} | {req.department}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-bold text-slate-600 dark:text-slate-400">
                                            {req.office_location}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(req.status)}`}>
                                            {getStatusLabel(req.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 transition-opacity">
                                            <button
                                                onClick={() => navigate(`/dashboard/office/details/${req.id}`)}
                                                className="p-2 text-slate-400 hover:text-customRed hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all"
                                                title="View Details"
                                            >
                                                <FaEye size={16} />
                                            </button>
                                            {req.status === 'approved' && (
                                                <button
                                                    onClick={() => navigate(`/dashboard/office/print/${req.id}`)}
                                                    className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-xl transition-all"
                                                    title="Print"
                                                >
                                                    <FaPrint size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
