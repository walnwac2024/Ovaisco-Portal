import React, { useState, useEffect } from 'react';

const SuperAdminDashboard = () => {
    // Basic UI for Super Admin to manage companies
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(false);

    // This would fetch from a new endpoint like /api/v1/superadmin/companies
    useEffect(() => {
        // Mock fetch or actual API fetch can be implemented here
        setCompanies([
            { id: 1, name: 'Main Company (Default)', status: 'active' }
        ]);
    }, []);

    return (
        <div style={{ padding: '2rem', background: '#0f172a', color: 'white', minHeight: '100vh', fontFamily: 'sans-serif' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#38bdf8' }}>Super Admin Center</h1>
            <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
                Manage all your SaaS tenants from here. 
                Data from one company is strictly isolated from others.
            </p>

            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Registered Companies</h2>
                    <button style={{ 
                        background: '#38bdf8', color: '#0f172a', border: 'none', 
                        padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer',
                        fontWeight: 'bold'
                    }}>
                        + Add New Company
                    </button>
                </div>
                
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                    <thead>
                        <tr style={{ background: '#334155', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem' }}>ID</th>
                            <th style={{ padding: '0.75rem' }}>Company Name</th>
                            <th style={{ padding: '0.75rem' }}>Status</th>
                            <th style={{ padding: '0.75rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {companies.map(c => (
                            <tr key={c.id} style={{ borderBottom: '1px solid #334155' }}>
                                <td style={{ padding: '0.75rem' }}>{c.id}</td>
                                <td style={{ padding: '0.75rem' }}>{c.name}</td>
                                <td style={{ padding: '0.75rem' }}>
                                    <span style={{ 
                                        padding: '0.25rem 0.5rem', 
                                        background: c.status === 'active' ? '#065f46' : '#7f1d1d',
                                        borderRadius: '4px', fontSize: '0.8rem', color: '#fff'
                                    }}>
                                        {c.status.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ padding: '0.75rem' }}>
                                    <button style={{ background: 'transparent', color: '#38bdf8', border: '1px solid #38bdf8', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer' }}>Manage</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SuperAdminDashboard;
