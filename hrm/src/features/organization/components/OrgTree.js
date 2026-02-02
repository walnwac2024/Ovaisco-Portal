
import React from 'react';
import { BASE_URL } from "../../../utils/api";
import { ChevronDown, Building2, Users } from "lucide-react";

const getAvatarUrl = (imgPath) => {
    if (!imgPath) return null;
    if (imgPath.startsWith("http")) return imgPath;
    return `${BASE_URL}${imgPath.startsWith("/") ? imgPath : `/${imgPath}`}`;
};

const OrgNode = ({ member, isLead }) => (
    <div className={`relative flex flex-col items-center group ${isLead ? 'mb-10' : 'mx-3'}`}>
        <div className={`
            relative flex flex-col items-center bg-white rounded-2xl p-4 border transition-all duration-300
            ${isLead
                ? 'w-56 border-customRed/20 shadow-xl shadow-customRed/5 z-10'
                : 'w-40 border-slate-100/80 shadow-sm hover:border-customRed/20 hover:shadow-lg hover:shadow-customRed/5'
            }
        `}>
            {/* Avatar */}
            <div className={`
                rounded-xl overflow-hidden mb-3 shrink-0 relative
                ${isLead ? 'w-20 h-20 ring-4 ring-customRed/5' : 'w-14 h-14 bg-slate-50'}
            `}>
                {member.profile_picture ? (
                    <img
                        src={getAvatarUrl(member.profile_picture)}
                        alt={member.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300 font-black text-xl">
                        {member.name.charAt(0)}
                    </div>
                )}
                {/* Online Indicator (Optional) */}
                {member.isActive && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                )}
            </div>

            {/* Info */}
            <div className="text-center w-full">
                <h4 className={`font-bold text-slate-800 truncate ${isLead ? 'text-base' : 'text-xs'}`}>
                    {member.name}
                </h4>
                <p className={`text-slate-400 truncate uppercase mt-1 ${isLead ? 'text-[10px] font-bold tracking-widest' : 'text-[9px] font-bold tracking-wider'}`}>
                    {member.designation || 'Team Member'}
                </p>
            </div>

            {/* Lead Badge */}
            {isLead && (
                <div className="absolute -top-3 px-4 py-1 bg-gradient-to-r from-customRed to-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-customRed/20">
                    Lead
                </div>
            )}
        </div>
    </div>
);

export default function OrgTree({ department, members, isExpanded, onToggle }) {
    // 1. Separate Leads vs Members
    const isLeadership = (designation) => {
        if (!designation) return false;
        const terms = ['manager', 'head', 'ceo', 'director', 'lead', 'chief', 'supervisor', 'admin'];
        return terms.some(t => designation.toLowerCase().includes(t));
    };

    const leads = members.filter(m => isLeadership(m.designation));
    const team = members.filter(m => !isLeadership(m.designation));

    return (
        <div className={`bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden transition-all duration-300 ${isExpanded ? 'shadow-xl shadow-slate-200/40 ring-1 ring-slate-900/5' : ''}`}>
            {/* Header / Clickable Toggle */}
            <div
                onClick={onToggle}
                className={`px-8 py-6 flex items-center justify-between cursor-pointer transition-colors ${isExpanded ? 'bg-slate-50/50 border-b border-slate-100' : 'hover:bg-slate-50/50'}`}
            >
                <div className="flex items-center gap-5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${isExpanded ? 'bg-gradient-to-br from-customRed to-red-600 text-white shadow-lg shadow-red-500/20' : 'bg-slate-100 text-slate-400'}`}>
                        <Building2 size={22} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{department}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                            <Users size={12} />
                            {members.length} Members
                        </p>
                    </div>
                </div>
                <div className={`p-2.5 rounded-xl transition-all duration-300 ${isExpanded ? 'bg-slate-200 text-slate-700 rotate-180' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>
                    <ChevronDown size={20} />
                </div>
            </div>

            {/* Expandable Chart Content */}
            {isExpanded && (
                <div className="p-10 bg-slate-50/30 overflow-x-auto custom-scrollbar">
                    <div className="min-w-max flex flex-col items-center">

                        {/* Level 1: Leads */}
                        <div className="flex gap-12 relative z-10 mb-2">
                            {leads.length > 0 ? (
                                leads.map(lead => <OrgNode key={lead.id} member={lead} isLead={true} />)
                            ) : (
                                <div className="flex flex-col items-center opacity-50 mb-8">
                                    <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center mb-3">
                                        <Users className="text-slate-300" size={24} />
                                    </div>
                                    <span className="px-4 py-1.5 bg-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-widest rounded-full">
                                        No Designated Lead
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Connector Lines (Only if there are both leads/placeholder and team) */}
                        {team.length > 0 && (
                            <div className="flex flex-col items-center w-full">
                                {/* Vertical Stem from Lead */}
                                <div className="w-px h-8 bg-slate-300 -mt-2"></div>

                                {/* Horizontal Bar */}
                                <div className="relative h-px bg-slate-300 w-[calc(100%-80px)] max-w-[90%]">
                                    {/* Left Corner Rounding (Visual trick or just simple line) */}
                                </div>

                                {/* Vertical Stems to Members */}
                                <div className="flex justify-center gap-6 w-full pt-0">
                                    {team.map((member, idx) => (
                                        <div key={member.id} className="relative flex flex-col items-center">
                                            {/* Connector from horizontal bar down to card */}
                                            <div className="w-px h-8 bg-slate-300 absolute -top-0"></div>
                                            <div className="pt-8">
                                                <OrgNode member={member} isLead={false} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
