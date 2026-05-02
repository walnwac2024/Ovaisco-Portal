import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import ReportsSidebar from './components/ReportsSidebar';
import MonthlyReport from '../attendance/components/MonthlyReport';
import { REPORTS_NAV } from './constants';

import ReportsList from './components/ReportsList';

export default function ReportsPage() {
    const { user } = useAuth();

    // Permissions
    const isAdmin = useMemo(() => {
        const roles = (user?.roles || []).map(r => String(r).toLowerCase());
        return roles.includes('admin') || roles.includes('super_admin') || roles.includes('hr');
    }, [user]);

    const safeNav = useMemo(() => {
        const base = Array.isArray(REPORTS_NAV) ? REPORTS_NAV : [];
        const features = user?.features || [];

        return base.filter(item => {
            if (item.id === 'attendance-report') {
                return features.includes('reports_view') || features.includes('attendance_report') || isAdmin;
            }
            return true;
        });
    }, [user]);

    const [nav, setNav] = useState(safeNav);

    // View state for Admin drill-down
    // mode: 'list' | 'detail'
    const [view, setView] = useState({ mode: 'list', employeeId: null, year: null, month: null });

    // ✅ Sync nav when user/permissions load
    React.useEffect(() => {
        setNav(safeNav);
    }, [safeNav]);
    console.log("safeNav is here", safeNav)
    const activeId = nav.find(n => n.active)?.id || (nav[0]?.id || '');

    const handleNavigate = (id) => {
        setNav(prev => prev.map(n => ({ ...n, active: n.id === id })));
        // Reset view when changing tabs
        setView({ mode: 'list', employeeId: null, year: null, month: null });
    };

    if (nav.length === 0) {
        return (
            <div className="p-6 text-slate-500 italic">
                You do not have permission to view any reports.
            </div>
        );
    }

    return (
        <main className="grid grid-cols-1 gap-6 lg:grid-cols-[16rem_1fr]">
            <ReportsSidebar items={nav} onNavigate={handleNavigate} />

            <section className="flex-1 min-w-0">
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 leading-tight">Reports Center</h2>
                            <p className="text-sm text-gray-500 mt-1">Select and view comprehensive organizational reports.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1">
                        {activeId === 'attendance-report' && (
                            isAdmin ? (
                                view.mode === 'list' ? (
                                    <ReportsList
                                        onView={(empId, year, month) => setView({ mode: 'detail', employeeId: empId, year, month })}
                                    />
                                ) : (
                                    <MonthlyReport
                                        employeeId={view.employeeId}
                                        initialYear={view.year}
                                        initialMonth={view.month}
                                        onBack={() => setView({ mode: 'list', employeeId: null })}
                                    />
                                )
                            ) : (
                                <MonthlyReport />
                            )
                        )}
                    </div>
                </div>
            </section>
        </main>
    );
}
