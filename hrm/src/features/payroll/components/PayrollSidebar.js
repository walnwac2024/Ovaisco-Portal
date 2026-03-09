import React from 'react';
import SharedSidebar from '../../../components/common/SharedSidebar';
import { FaHistory, FaUserEdit, FaCalculator } from 'react-icons/fa';

const PayrollSidebar = ({ activeKey, onNavigate, isAdmin, userPermissions = [], user }) => {
    const canManagePayroll = user?.flags?.exact_create >= 15;

    const items = [
        {
            id: 'my-salary',
            label: 'My Payslips',
            icon: <FaHistory />,
            permission: 'payroll_view_own',
        },
        {
            id: 'payroll-run',
            label: 'Payroll Run',
            icon: <FaCalculator />,
            permission: 'payroll_run_manage',
        },
        {
            id: 'salary-setup',
            label: 'Salary Setup',
            icon: <FaUserEdit />,
            permission: 'payroll_salary_setup',
        },
        {
            id: 'increments',
            label: 'Increments',
            icon: <FaCalculator />,
            permission: 'payroll_increment_manage',
        },
        {
            id: 'salary-overview',
            label: 'Salary Overview',
            icon: <FaCalculator />,
            permission: 'payroll_overview_view',
        }
    ].filter(item => {
        if (item.id === 'my-salary') return true;
        return canManagePayroll;
    });

    return (
        <SharedSidebar
            items={items}
            activeKey={activeKey}
            onNavigate={onNavigate}
            userPermissions={userPermissions}
            isAdminUser={isAdmin}
        />
    );
};

export default PayrollSidebar;
