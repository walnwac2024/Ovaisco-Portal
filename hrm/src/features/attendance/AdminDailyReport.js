import React, { useState, useEffect, useCallback, useMemo } from "react";
import { FaUsers, FaUserCheck, FaUserTimes, FaClock, FaFileExcel, FaSync, FaMapMarkerAlt, FaSearch, FaFilter, FaCircle } from "react-icons/fa";
import api from "../../utils/api";

export default function AdminDailyReport() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    summary: { totalEmployees: 0, totalPresent: 0, totalAbsent: 0, totalLate: 0, totalGpsPunches: 0 },
    lists: { all: [], present: [], absent: [], late: [] }
  });
  const [activeTab, setActiveTab] = useState("present");
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Search and Filter States
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [stationFilter, setStationFilter] = useState("All");

  // Generate week days based on selectedDate
  const getWeekDays = useCallback((refDate) => {
    const now = new Date(refDate);
    const currentDay = now.getDay() === 0 ? 7 : now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - (currentDay - 1));

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push({
        name: d.toLocaleDateString('en-US', { weekday: 'short' }),
        date: d.toLocaleDateString('en-CA'),
        day: d.getDate()
      });
    }
    return days;
  }, []);

  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate, getWeekDays]);

  const fetchData = useCallback(async (date = selectedDate) => {
    try {
      setLoading(true);
      const res = await api.get(`/attendance/admin/daily-summary?date=${date}`);
      if (res.data && res.data.summary) {
        setData(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch admin summary:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    let interval;
    const isToday = selectedDate === new Date().toLocaleDateString('en-CA');
    if (autoRefresh && isToday) {
      interval = setInterval(() => {
        api.get(`/attendance/admin/daily-summary?date=${selectedDate}`).then(res => {
          if (res.data && res.data.summary) setData(res.data);
        });
      }, 30000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh, selectedDate]);

  // Derive unique departments and stations for filters
  const departments = useMemo(() => {
    const depts = new Set(["All"]);
    data.lists.all.forEach(emp => { if (emp.department) depts.add(emp.department); });
    return Array.from(depts);
  }, [data.lists.all]);

  const stations = useMemo(() => {
    const st = new Set(["All"]);
    data.lists.all.forEach(emp => { if (emp.station) st.add(emp.station); });
    return Array.from(st);
  }, [data.lists.all]);

  // Filtered List Logic
  const filteredList = useMemo(() => {
    let list = data.lists[activeTab] || [];
    
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(emp => 
        emp.name?.toLowerCase().includes(s) || 
        emp.empCode?.toString().toLowerCase().includes(s)
      );
    }

    if (deptFilter !== "All") {
      list = list.filter(emp => emp.department === deptFilter);
    }

    if (stationFilter !== "All") {
      list = list.filter(emp => emp.station === stationFilter);
    }

    return list;
  }, [data.lists, activeTab, search, deptFilter, stationFilter]);

  const handleExport = () => {
    if (filteredList.length === 0) return alert("No data to export.");

    const headers = ["ID", "Name", "Department", "Station", "Status", "Check In", "Check Out", "Late Mins", "Source"];
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + filteredList.map(row => {
          const att = row.attendance || {};
          return [
            row.empCode || row.id,
            `"${row.name || ''}"`,
            `"${row.department || ''}"`,
            `"${row.station || ''}"`,
            att.status || (activeTab === 'absent' ? 'Absent' : 'Present'),
            att.check_in_time || '',
            att.check_out_time || '',
            att.late_minutes || 0,
            att.source_in || 'N/A'
          ].join(",");
        }).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Attendance_${activeTab}_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isSunday = useMemo(() => {
    return new Date(selectedDate).getDay() === 0;
  }, [selectedDate]);

  const { summary } = data;

  const cards = [
    { id: "all", label: "Total Employees", value: summary.totalEmployees, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-200", icon: <FaUsers /> },
    { id: "present", label: isSunday ? "Present (on OFF Day)" : "Total Present", value: summary.totalPresent, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-200", icon: <FaUserCheck /> },
    { id: "absent", label: isSunday ? "OFF Day" : "Total Absent", value: isSunday ? summary.totalEmployees - summary.totalPresent : summary.totalAbsent, color: isSunday ? "text-slate-500" : "text-rose-500", bg: isSunday ? "bg-slate-500/10" : "bg-rose-500/10", border: isSunday ? "border-slate-200" : "border-rose-200", icon: <FaUserTimes /> },
    { id: "late", label: "Total Late", value: summary.totalLate, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-200", icon: <FaClock /> },
  ];

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Premium Header & Date Selection Bar */}
      <div className="bg-white/70 backdrop-blur-xl border border-slate-200/60 shadow-sm rounded-[2rem] p-4 sm:p-6 mb-8 transition-all hover:shadow-md">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
          {/* Title & Description */}
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-800 flex items-center gap-3">
                <span className="w-1.5 h-8 bg-customRed rounded-full block"></span>
                Attendance Daily Report
              </h1>
              {isSunday ? (
                <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-full uppercase tracking-widest shadow-sm">
                  Weekly Off
                </span>
              ) : (
                autoRefresh && selectedDate === new Date().toLocaleDateString('en-CA') && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full animate-pulse shadow-sm border border-emerald-100 uppercase tracking-widest">
                    <FaSync className="animate-spin-slow" /> Live Tracking
                  </span>
                )
              )}
            </div>
            <p className="text-sm font-medium text-slate-500 max-w-lg pl-4">
              Real-time visualization of presence, punctuality, and performance metrics.
            </p>
          </div>

          {/* Integrated Date Picker & Week Bar */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 bg-slate-50/50 p-2 rounded-3xl border border-slate-100">
            {/* Calendar Picker Wrapper */}
            <div className="relative group">
              <input 
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full lg:w-auto pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-400 transition-all cursor-pointer appearance-none"
              />
              <FaClock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-rose-500 transition-colors" />
            </div>

            <div className="h-8 w-px bg-slate-200 hidden lg:block mx-1"></div>

            {/* Week Navigation */}
            <div className="flex-1 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-1 min-w-max">
                {weekDays.map((day) => (
                  <button
                    key={day.date}
                    onClick={() => setSelectedDate(day.date)}
                    className={`flex flex-col items-center justify-center min-w-[60px] sm:min-w-[75px] py-2 px-3 rounded-2xl transition-all duration-300 ${
                      selectedDate === day.date
                        ? "bg-customRed text-white shadow-lg shadow-rose-200 scale-105"
                        : "text-slate-400 hover:text-slate-600 hover:bg-white"
                    }`}
                  >
                    <span className="text-[9px] font-bold uppercase tracking-widest mb-0.5">{day.name}</span>
                    <span className="text-lg font-black">{day.day}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {cards.map((card) => (
          <div 
            key={card.id}
            onClick={() => setActiveTab(card.id)}
            className={`group relative overflow-hidden cursor-pointer p-6 rounded-[2rem] border transition-all duration-500 ${
              activeTab === card.id 
                ? 'bg-white ring-4 ring-slate-100/50 shadow-2xl shadow-slate-200 ' + card.border 
                : 'bg-white/40 border-slate-100/80 hover:bg-white hover:shadow-xl hover:-translate-y-1'
            }`}
          >
            {/* Background Accent */}
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-10 transition-transform group-hover:scale-150 duration-700 ${card.bg}`}></div>
            
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner ${card.bg} ${card.color}`}>
                {card.icon}
              </div>
              <div className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${activeTab === card.id ? 'bg-slate-50' : 'bg-white/50 opacity-0 group-hover:opacity-100'}`}>
                {activeTab === card.id ? 'Viewing' : 'View List'}
              </div>
            </div>
            
            <div className="relative z-10">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-tight">{card.label}</h3>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-4xl font-black text-slate-800 tracking-tighter">
                  {loading ? (
                    <div className="h-8 w-12 bg-slate-100 animate-pulse rounded-lg"></div>
                  ) : card.value}
                </span>
                {!loading && card.id !== 'all' && (
                  <span className="text-xs font-bold text-slate-300">
                    of {summary.totalEmployees}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Data Section */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/40 border border-slate-100/80 overflow-hidden mt-8 transition-all">
        {/* Advanced Toolbar */}
        <div className="p-6 sm:p-8 bg-gradient-to-b from-slate-50/50 to-transparent border-b border-slate-100 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-6 bg-slate-800 rounded-full hidden sm:block"></div>
              <div>
                <h2 className="text-xl font-black text-slate-800 capitalize tracking-tight">
                  {isSunday && activeTab === 'absent' ? 'Full Weekly Off List' : `${activeTab} Summary View`}
                </h2>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">
                  <FaClock className="text-rose-400" />
                  <span>Report for {selectedDate === new Date().toLocaleDateString('en-CA') ? "Today's Cycle" : selectedDate}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-bold transition-all ${
                  autoRefresh 
                    ? "bg-emerald-50 border-emerald-100 text-emerald-600 shadow-sm" 
                    : "bg-slate-50 border-slate-100 text-slate-400"
                }`}
              >
                <FaSync className={autoRefresh ? "animate-spin-slow" : ""} />
                {autoRefresh ? "Auto Sync On" : "Sync Disabled"}
              </button>
              <button 
                onClick={handleExport}
                className="flex items-center justify-center gap-3 px-6 py-2.5 bg-slate-900 text-white hover:bg-slate-800 font-black rounded-2xl transition-all shadow-lg shadow-slate-200 text-sm active:scale-95"
              >
                <FaFileExcel className="text-emerald-400" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Refined Filters Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 bg-white/50 p-4 rounded-3xl border border-slate-100 shadow-inner">
            {/* Search Input */}
            <div className="relative md:col-span-2">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
              <input 
                type="text"
                placeholder="Search by Employee Name or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200/60 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-300 transition-all placeholder:text-slate-300"
              />
            </div>

            {/* Department Filter */}
            <div className="relative group">
              <FaFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-rose-400 transition-colors" />
              <select 
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="w-full pl-11 pr-10 py-3 bg-white border border-slate-200/60 rounded-2xl text-sm font-bold text-slate-600 appearance-none cursor-pointer focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all"
              >
                <option value="All">All Departments</option>
                {departments.filter(d => d !== "All").map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {/* Station Filter */}
            <div className="relative group">
              <FaMapMarkerAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-rose-400 transition-colors" />
              <select 
                value={stationFilter}
                onChange={(e) => setStationFilter(e.target.value)}
                className="w-full pl-11 pr-10 py-3 bg-white border border-slate-200/60 rounded-2xl text-sm font-bold text-slate-600 appearance-none cursor-pointer focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all"
              >
                <option value="All">All Stations</option>
                {stations.filter(s => s !== "All").map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
        
        {/* Premium Table Layout */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm text-slate-600 min-w-[1000px]">
            <thead className="bg-slate-50/80 text-slate-400 uppercase text-[10px] font-black tracking-widest">
              <tr>
                <th className="px-8 py-5 sticky left-0 bg-slate-50 z-20">Employee Details</th>
                <th className="px-6 py-5">Department</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Attendance Window</th>
                <th className="px-6 py-5">Punctuality</th>
                <th className="px-6 py-5">Log Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="font-bold text-slate-400 animate-pulse">Synchronizing Data...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-20 text-center">
                    <div className="flex flex-col items-center gap-4 text-slate-300">
                      <FaUsers className="text-6xl opacity-20" />
                      <span className="font-bold">No results match your current filters.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map((emp) => {
                  const att = emp.attendance || {};
                  const showOff = isSunday && (!att.status || att.status === 'Absent');
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/50 transition-all group">
                      <td className="px-8 py-4 sticky left-0 bg-white group-hover:bg-slate-50/50 z-20 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="relative flex-shrink-0">
                            {emp.avatar ? (
                              <img src={emp.avatar} alt={emp.name} className="w-11 h-11 rounded-2xl object-cover shadow-sm ring-2 ring-white" />
                            ) : (
                              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-xs font-black text-slate-500 shadow-sm ring-2 ring-white">
                                {emp.name?.charAt(0)}
                              </div>
                            )}
                            <div className={`absolute -right-1 -bottom-1 w-3.5 h-3.5 rounded-full border-2 border-white ${att.status ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                          </div>
                          <div>
                            <div className="font-black text-slate-800 tracking-tight leading-none group-hover:text-customRed transition-colors">{emp.name}</div>
                            <div className="text-[10px] text-slate-400 font-black mt-1.5 uppercase tracking-widest">#{emp.empCode || emp.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-600 text-xs bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                          {emp.department || 'General'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ${
                          showOff ? 'bg-slate-50 text-slate-400 border border-slate-100' :
                          att.status === 'Absent' || !emp.attendance ? 'bg-rose-50 text-rose-500 border border-rose-100' : 
                          att.late_minutes > 0 ? 'bg-amber-50 text-amber-500 border border-amber-100' : 'bg-emerald-50 text-emerald-500 border border-emerald-100'
                        }`}>
                          <FaCircle className="text-[6px]" />
                          {showOff ? 'WEEKLY OFF' : (att.status || (!emp.attendance ? 'Absent' : 'Present'))}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="text-center">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">In</div>
                            <div className="font-mono text-xs font-bold text-slate-700 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">{att.check_in_time || att.first_in || '--:--'}</div>
                          </div>
                          <div className="w-4 h-px bg-slate-200 mt-4"></div>
                          <div className="text-center">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Out</div>
                            <div className="font-mono text-xs font-bold text-slate-700 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">{att.check_out_time || att.last_out || '--:--'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {att.late_minutes > 0 ? (
                          <div className="flex flex-col">
                            <span className="text-rose-500 font-black text-xs">{att.late_minutes} Minutes Late</span>
                            <div className="w-full h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                              <div className="h-full bg-rose-500" style={{ width: `${Math.min(att.late_minutes, 100)}%` }}></div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">On Time</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${att.source_in === 'GPS' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                            {att.source_in === 'GPS' ? <FaMapMarkerAlt /> : <FaClock />}
                          </div>
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{att.source_in || "N/A"}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
