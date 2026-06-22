import React, { useEffect, useState } from "react";
import api, { BASE_URL } from "../../utils/api";
import { ChevronLeft, Crown, ArrowUp, ArrowDown, User, Loader2, Timer, Trophy } from "lucide-react";

/**
 * LeaderboardPage - System Theme Redesign (Red/White/Dark)
 * Uses customRed and aligns with the WorkSphere system's aesthetic.
 * Includes dummy data fallback for testing.
 */
const LeaderboardPage = () => {
    const [leaderboard, setLeaderboard] = useState({ punctuality: [], performance: [] });
    const [loading, setLoading] = useState(true);
    const [activeType, setActiveType] = useState('punctuality');
    const [activeFilter, setActiveFilter] = useState('Month');

    // Dummy Mockup Data for testing
    const mockupData = {
        punctuality: [
            { id: 101, name: "Arsalan Khan", on_time_count: 28, total_late_minutes: 5, profile_picture: null },
            { id: 102, name: "Doris Klein", on_time_count: 27, total_late_minutes: 12, profile_picture: null },
            { id: 103, name: "Sher234", on_time_count: 26, total_late_minutes: 15, profile_picture: null },
            { id: 104, name: "Adam Smith", on_time_count: 24, total_late_minutes: 20, profile_picture: null },
            { id: 105, name: "Sara Julian", on_time_count: 22, total_late_minutes: 25, profile_picture: null },
            { id: 106, name: "John Doe", on_time_count: 20, total_late_minutes: 30, profile_picture: null },
            { id: 107, name: "Emma Watson", on_time_count: 18, total_late_minutes: 40, profile_picture: null },
        ],
        performance: [
            { id: 201, name: "Fatima Zehra", total_score: 98, grade: "A+", profile_picture: null },
            { id: 202, name: "Lord 0980", total_score: 95, grade: "A", profile_picture: null },
            { id: 203, name: "Hamza Malik", total_score: 92, grade: "A", profile_picture: null },
            { id: 204, name: "Zainab Ali", total_score: 88, grade: "B+", profile_picture: null },
            { id: 205, name: "Usman Ghani", total_score: 85, grade: "B", profile_picture: null },
            { id: 206, name: "Ayesha Noor", total_score: 82, grade: "B-", profile_picture: null },
        ]
    };

    useEffect(() => {
        api.get("/gamification/leaderboard")
            .then(res => {
                // If backend data is empty, use mockup data for demonstration
                const backendData = res.data;
                const finalPunctuality = backendData.punctuality?.length > 0 ? backendData.punctuality : mockupData.punctuality;
                const finalPerformance = backendData.performance?.length > 0 ? backendData.performance : mockupData.performance;

                setLeaderboard({
                    punctuality: finalPunctuality,
                    performance: finalPerformance
                });
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch leaderboard, using mockups", err);
                setLeaderboard(mockupData);
                setLoading(false);
            });
    }, []);

    const data = activeType === 'punctuality' ? leaderboard.punctuality : leaderboard.performance;
    const top3 = data.slice(0, 3);
    const others = data.slice(3, 10);

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 gap-4 bg-slate-50 dark:bg-slate-900 min-h-[600px] rounded-[40px]">
            <Loader2 className="animate-spin text-customRed" size={40} />
            <p className="text-slate-400 font-medium tracking-widest uppercase text-xs">Loading Rankings...</p>
        </div>
    );

    return (
        <div className="bg-white dark:bg-slate-950 min-h-screen rounded-[40px] overflow-hidden shadow-2xl animate-in fade-in duration-700">
            {/* Header Section - Matches System Red */}
            <div className="bg-gradient-to-b from-customRed to-[#a81622] p-8 pb-12 pt-10 text-white relative">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32" />

                <div className="flex items-center justify-between mb-8 relative z-10">
                    <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className="text-xl font-bold tracking-tight">Leaderboard</h1>
                    <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center overflow-hidden bg-white/10">
                        {activeType === 'punctuality' ? <Timer size={18} /> : <Trophy size={18} />}
                    </div>
                </div>

                {/* Filters / Tabs */}
                <div className="flex justify-center mb-12 relative z-10">
                    <div className="flex bg-black/10 p-1 rounded-full backdrop-blur-md border border-white/10">
                        {['Today', 'Week', 'Month'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveFilter(tab)}
                                className={`px-8 py-2 rounded-full text-sm font-medium transition-all duration-300 ${activeFilter === tab
                                        ? 'bg-white text-customRed shadow-lg'
                                        : 'text-white/60 hover:text-white'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Metric Switcher */}
                <div className="flex justify-center gap-6 mb-10 relative z-10">
                    <button
                        onClick={() => setActiveType('punctuality')}
                        className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all ${activeType === 'punctuality' ? 'text-white underline underline-offset-8' : 'text-white/40 hover:text-white/60'}`}
                    >
                        <Timer size={14} /> Punctuality
                    </button>
                    <button
                        onClick={() => setActiveType('performance')}
                        className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all ${activeType === 'performance' ? 'text-white underline underline-offset-8' : 'text-white/40 hover:text-white/60'}`}
                    >
                        <Trophy size={14} /> Performance
                    </button>
                </div>

                {/* Podium Section */}
                <div className="flex items-end justify-center gap-2 sm:gap-4 mt-4 relative pt-10 pb-4">
                    {/* Rank 2 */}
                    {top3[1] && (
                        <div className="flex flex-col items-center animate-in slide-in-from-left-10 duration-1000">
                            <div className="text-sm font-bold mb-1 opacity-70">2</div>
                            <ArrowUp size={14} className="text-white/60 mb-2" />
                            <div className="relative group">
                                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full border-[3px] border-white/30 p-1 transition-transform group-hover:scale-110">
                                    <div className="h-full w-full rounded-full overflow-hidden bg-white/20">
                                        {top3[1].profile_picture ? (
                                            <img
                                                src={`${BASE_URL}${top3[1].profile_picture}`}
                                                className="h-full w-full object-cover"
                                                alt={top3[1].name}
                                            />
                                        ) : <User className="h-full w-full p-4 opacity-30 text-white" />}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 text-center">
                                <div className="text-xs font-medium opacity-60">@{top3[1].name.toLowerCase().replace(/\s/g, '')}</div>
                                <div className="text-lg font-bold text-white">
                                    {activeType === 'punctuality' ? top3[1].on_time_count : top3[1].total_score}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Rank 1 (Center) */}
                    {top3[0] && (
                        <div className="flex flex-col items-center -mt-8 translate-y-[-20px] animate-in zoom-in duration-1000 relative z-20">
                            <div className="text-base font-bold mb-1">1</div>
                            <div className="relative mb-3 group cursor-pointer">
                                <Crown size={32} className="text-amber-400 fill-amber-400 absolute -top-8 left-1/2 -translate-x-1/2 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)] animate-bounce" />
                                <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full border-[4px] border-white p-1.5 shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all group-hover:scale-110 group-hover:shadow-[0_0_40px_rgba(255,255,255,0.4)]">
                                    <div className="h-full w-full rounded-full overflow-hidden bg-white">
                                        {top3[0].profile_picture ? (
                                            <img
                                                src={`${BASE_URL}${top3[0].profile_picture}`}
                                                className="h-full w-full object-cover"
                                                alt={top3[0].name}
                                            />
                                        ) : <div className="h-full w-full flex items-center justify-center text-customRed font-bold text-3xl">{top3[0].name[0]}</div>}
                                    </div>
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-sm font-bold tracking-wide">@{top3[0].name.toLowerCase().replace(/\s/g, '')}</div>
                                <div className="text-2xl font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
                                    {activeType === 'punctuality' ? top3[0].on_time_count : top3[0].total_score}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Rank 3 */}
                    {top3[2] && (
                        <div className="flex flex-col items-center animate-in slide-in-from-right-10 duration-1000">
                            <div className="text-sm font-bold mb-1 opacity-70">3</div>
                            <ArrowDown size={14} className="text-white/40 mb-2" />
                            <div className="relative group">
                                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full border-[3px] border-white/30 p-1 transition-transform group-hover:scale-110">
                                    <div className="h-full w-full rounded-full overflow-hidden bg-white/20">
                                        {top3[2].profile_picture ? (
                                            <img
                                                src={`${BASE_URL}${top3[2].profile_picture}`}
                                                className="h-full w-full object-cover"
                                                alt={top3[2].name}
                                            />
                                        ) : <User className="h-full w-full p-4 opacity-30 text-white" />}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 text-center">
                                <div className="text-xs font-medium opacity-60">@{top3[2].name.toLowerCase().replace(/\s/g, '')}</div>
                                <div className="text-lg font-bold text-white">
                                    {activeType === 'punctuality' ? top3[2].on_time_count : top3[2].total_score}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* List Row Section - Clean White/Dark Contrast */}
            <div className="bg-slate-50 dark:bg-black p-6 pt-10 -mt-6 rounded-t-[40px] flex-1 space-y-4 relative z-20 min-h-[400px]">
                {others.length > 0 ? (
                    others.map((emp, i) => (
                        <div key={emp.id} className="bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900 p-4 rounded-[24px] flex items-center justify-between group transition-all duration-300 border border-slate-200/50 dark:border-slate-800 shadow-sm hover:shadow-md">
                            <div className="flex items-center gap-5">
                                <div className="flex flex-col items-center w-6">
                                    <span className="text-sm font-bold text-slate-400">{i + 4}</span>
                                    {i % 2 === 0 ? <ArrowUp size={10} className="text-emerald-500 mt-1" /> : <ArrowDown size={10} className="text-slate-300 mt-1" />}
                                </div>
                                <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-slate-100 dark:border-slate-800 shadow-inner">
                                    {emp.profile_picture ? (
                                        <img
                                            src={`${BASE_URL}${emp.profile_picture}`}
                                            className="h-full w-full object-cover"
                                            alt={emp.name}
                                        />
                                    ) : <div className="h-full w-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-400 dark:text-slate-600">{emp.name[0]}</div>}
                                </div>
                                <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 group-hover:text-customRed transition-colors">
                                    @{emp.name.toLowerCase().replace(/\s/g, '')}
                                </div>
                            </div>
                            <div className="text-lg font-bold text-customRed pr-2">
                                {activeType === 'punctuality' ? emp.on_time_count : emp.total_score}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 opacity-30">
                        <User size={64} className="mb-4 text-slate-400" />
                        <p className="text-slate-500 font-medium">No other participants yet</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeaderboardPage;
