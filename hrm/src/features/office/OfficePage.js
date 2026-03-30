import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import RequisitionList from './components/RequisitionList';
import RequisitionForm from './components/RequisitionForm';
import RequisitionDetails from './components/RequisitionDetails';
import RequisitionPrint from './components/RequisitionPrint';
import { useAuth } from '../../context/AuthContext';

export default function OfficePage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Check permissions
    const features = new Set(user?.features || []);
    const role = String(user?.role || '').toLowerCase();
    const dept = user?.department || user?.Department;
    const canApply = (features.has('office_req_apply') || ['FNSD', 'Administration-HOE'].includes(dept)) && !['hr', 'accounts'].includes(role);
    const canApproveHR = features.has('office_req_approve_hr');
    const canApproveAccounts = features.has('office_req_approve_accounts');
    const canViewAll = features.has('office_req_view_all');

    const activeTab = location.pathname.split('/').pop();

    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                        Office Management
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                        General Requisition & Approval Workflow
                    </p>
                </div>

                {canApply && (
                    <button
                        onClick={() => navigate('/dashboard/office/apply')}
                        className="px-6 py-2.5 bg-customRed text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 active:scale-95"
                    >
                        New Requisition
                    </button>
                )}
            </div>

            {/* Sub Tabs */}
            {canApply && (
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-2xl mb-8 w-fit overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => navigate('/dashboard/office')}
                        className={`px-6 py-2 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'office' || !activeTab ? 'bg-white dark:bg-slate-700 text-customRed shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        Dashboard
                    </button>
                    <button
                        onClick={() => navigate('/dashboard/office/apply')}
                        className={`px-6 py-2 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'apply' ? 'bg-white dark:bg-slate-700 text-customRed shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        Apply
                    </button>
                </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden min-h-[500px]">
                <Routes>
                    <Route index element={<RequisitionList />} />
                    <Route path="apply" element={<RequisitionForm />} />
                    <Route path="details/:id" element={<RequisitionDetails />} />
                    <Route path="print/:id" element={<RequisitionPrint />} />
                </Routes>
            </div>
        </div>
    );
}
