import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import MySalaryList from './components/MySalaryList';
import Sidebar from './components/PayrollSidebar';
import SalarySettings from './components/SalarySettings';
import PayrollRun from './components/PayrollRun';
import IncrementManagement from './components/IncrementManagement';
import SalaryOverview from './components/SalaryOverview';
import './PayrollPage.css';

const PayrollPage = () => {
    const { user } = useAuth();
    const [activeKey, setActiveKey] = useState('my-salary');

    const isAdmin = useMemo(() => {
        const roles = user?.roles || [];
        if (user?.role) roles.push(user.role);
        return roles.some(r => ['admin', 'super_admin', 'hr', 'developer'].includes(String(r).toLowerCase()));
    }, [user]);

    const userPermissions = user?.features || [];

    // Helper to check if user has access (either isAdmin or has specific feature)
    const hasAccess = (feature) => isAdmin || userPermissions.includes(feature);

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-4">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Financial Hub</h1>
                <p className="text-sm text-slate-500">Securely manage and view your payroll information</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 mt-8">
                <Sidebar
                    activeKey={activeKey}
                    onNavigate={setActiveKey}
                    isAdmin={isAdmin}
                    userPermissions={userPermissions}
                />

                <section className="flex-1 min-w-0">
                    {activeKey === 'my-salary' && <MySalaryList />}
                    {activeKey === 'payroll-run' && hasAccess('payroll_run_manage') && <PayrollRun />}
                    {activeKey === 'salary-setup' && hasAccess('payroll_salary_setup') && <SalarySettings />}
                    {activeKey === 'increments' && hasAccess('payroll_increment_manage') && <IncrementManagement />}
                    {activeKey === 'salary-overview' && hasAccess('payroll_overview_view') && <SalaryOverview />}
                </section>
            </div>
        </div>
    );
};

export default PayrollPage;
