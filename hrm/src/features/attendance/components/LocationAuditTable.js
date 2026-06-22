import React, { useEffect, useState } from 'react';
import { MapPin, ExternalLink, Clock, Building } from 'lucide-react';
import { getAuditLocations } from '../services/attendanceService';
import { io } from 'socket.io-client';
import { BASE_URL } from '../../../utils/api';

const LocationAuditTable = () => {
    const [punches, setPunches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAuditData = async () => {
            try {
                const data = await getAuditLocations();
                setPunches(data);
                setLoading(false);
            } catch (err) {
                console.error('Failed to fetch audit data:', err);
                setError('Failed to load audit records');
                setLoading(false);
            }
        };

        fetchAuditData();

        // Real-time updates
        const socket = io(BASE_URL, {
            withCredentials: true,
            transports: ['websocket', 'polling']
        });

        socket.on('punch-recorded', (newPunch) => {
            setPunches(prev => {
                // Check if already in list to avoid duplicates
                if (prev.some(p => p.id === newPunch.id)) return prev;
                return [newPunch, ...prev].slice(0, 100); // Keep top 100
            });
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const getGoogleMapsLink = (lat, lng) => {
        if (!lat || !lng) return null;
        return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 text-rose-500 bg-rose-50 dark:bg-rose-900/10 rounded-xl border border-rose-100 dark:border-rose-900/20">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Attendance Audit</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Real-time tracking of employee attendance punches.</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Employee</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Office</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type / Time</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {punches.map((punch) => (
                                <tr key={punch.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-customRed flex items-center justify-center text-white font-bold text-xs uppercase shadow-sm">
                                                {punch.name?.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-slate-900 dark:text-white">{punch.name}</div>
                                                <div className="text-xs text-slate-500">{punch.employeeCode}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                            <Building className="w-4 h-4 text-slate-400" />
                                            {punch.officeName}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-1 ${punch.punch_type === 'IN'
                                                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                                                : 'bg-rose-100 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'
                                                }`}>
                                                {punch.punch_type}
                                            </span>
                                            <div className="text-xs text-slate-500 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(punch.punched_at).toLocaleString()}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {punch.latitude ? (
                                            <div className="text-xs text-slate-600 dark:text-slate-400 flex flex-col gap-0.5">
                                                <span className="flex items-center gap-1">Lat: {parseFloat(punch.latitude).toFixed(5)}</span>
                                                <span className="flex items-center gap-1">Lng: {parseFloat(punch.longitude).toFixed(5)}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-400 italic">No GPS data</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {punch.latitude && (
                                            <a
                                                href={getGoogleMapsLink(punch.latitude, punch.longitude)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors border border-primary/20"
                                            >
                                                <MapPin className="w-3.5 h-3.5" />
                                                View on Map
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {punches.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 italic">
                                        No punch records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LocationAuditTable;
