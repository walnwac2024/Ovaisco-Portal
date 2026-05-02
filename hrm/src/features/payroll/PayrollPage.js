import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import MySalaryList from './components/MySalaryList';
import Sidebar from './components/PayrollSidebar';
import SalarySettings from './components/SalarySettings';
import PayrollRun from './components/PayrollRun';
import IncrementManagement from './components/IncrementManagement';
import SalaryOverview from './components/SalaryOverview';
import BulkSalaryImport from './components/BulkSalaryImport';
import './PayrollPage.css';

const PayrollPage = () => {
    const { user } = useAuth();

    const [activeKey, setActiveKey] = useState('my-salary');

    const isAdmin = useMemo(() => {
        return false;
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
                    user={user}
                />

                <section className="flex-1 min-w-0">
                    {activeKey === 'my-salary' && <MySalaryList />}
                    {activeKey === 'payroll-run' && hasAccess('payroll_run_manage') && user.flags.exact_create >= 15 && <PayrollRun />}
                    {activeKey === 'salary-setup' && hasAccess('payroll_salary_setup') && user.flags.exact_create >= 15 && <SalarySettings />}
                    {activeKey === 'increments' && hasAccess('payroll_increment_manage') && user.flags.exact_create >= 15 && <IncrementManagement />}
                    {activeKey === 'salary-overview' && hasAccess('payroll_overview_view') && user.flags.exact_create >= 15 && <SalaryOverview />}
                    {activeKey === 'bulk-import' && hasAccess('payroll_salary_setup') && user.flags.exact_create >= 15 && <BulkSalaryImport />}
                </section>
            </div>
        </div>
    );
};

export default PayrollPage;
