import { useState, useEffect, useCallback } from 'react';
import { getAttendanceLogs, getAttendanceLogsExcelUrl } from '../services/attendanceService';

export default function useAttendanceLogs({ date, autoRefresh = true, refreshInterval = 30000 }) {
    const [logs, setLogs] = useState([]);
    const [summary, setSummary] = useState({ total: 0, present: 0, late: 0, notMarked: 0 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchLogs = useCallback(async () => {
        if (!date) return;

        try {
            setLoading(true);
            setError(null);
            const data = await getAttendanceLogs(date);
            setLogs(data.logs || []);
            setSummary(data.summary || { total: 0, present: 0, late: 0, notMarked: 0 });
        } catch (err) {
            console.error('Failed to fetch attendance logs:', err);
            setError(err.response?.data?.message || 'Failed to load attendance logs');
        } finally {
            setLoading(false);
        }
    }, [date]);

    // Initial fetch
    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    // Auto-refresh
    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(() => {
            fetchLogs();
        }, refreshInterval);

        return () => clearInterval(interval);
    }, [autoRefresh, refreshInterval, fetchLogs]);

    const downloadExcel = useCallback(async () => {
        if (!date) return;

        try {
            const url = getAttendanceLogsExcelUrl(date);
            const link = document.createElement('a');
            link.href = url;
            // Note: for cross-origin downloads, we usually need the server to send Content-Disposition
            // Our backend does this correctly.
            link.setAttribute('download', `Attendance_Logs_${date}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error('Failed to download Excel:', err);
            alert('Failed to download Excel file');
        }
    }, [date]);

    return {
        logs,
        summary,
        loading,
        error,
        refetch: fetchLogs,
        downloadExcel,
    };
}
