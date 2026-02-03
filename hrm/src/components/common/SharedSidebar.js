import React from "react";

/**
 * SharedSidebar component to ensure consistency across modules.
 * @param {Array} items - Array of { id, label, icon, status, isAdmin, subItems }
 * @param {string} activeKey - Current active key
 * @param {string} title - Heading title for the sidebar
 * @param {function} onNavigate - navigation handler
 * @param {boolean} isAdminUser - flag to show admin-only items
 */
export default function SharedSidebar({
    items = [],
    activeKey = "",
    title = "MENU",
    onNavigate,
    isAdminUser = false,
    userPermissions = [],
}) {
    const badgeSuffix = (
        <span className="ml-auto px-2 py-0.5 rounded bg-slate-100 text-[8px] text-slate-500 font-black uppercase tracking-widest border border-slate-200 shrink-0">
            Coming Soon
        </span>
    );

    const filteredItems = items.filter((it) => {
        // 1. If item has a specific permission code, check it
        if (it.permission) {
            return userPermissions.includes(it.permission);
        }
        // 2. Fallback to isAdmin check for backward compatibility
        if (it.isAdmin) {
            return isAdminUser;
        }
        // 3. Public item
        return true;
    });

    return (
        <aside className="w-full lg:sidebar">
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 lg:overflow-hidden sticky top-6">
                <div className="hidden lg:block px-6 pt-5 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    {title}
                </div>
                <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible px-6 py-2 pb-1 lg:p-3 lg:space-y-1 no-scrollbar snap-x">
                    {filteredItems.map((item) => {
                        const isActive = activeKey === item.id || (item.subItems && activeKey.startsWith(item.id));
                        const isWorking = item.status === "working";
                        const hasSubItems = Array.isArray(item.subItems) && item.subItems.length > 0;

                        return (
                            <div key={item.id} className="shrink-0 snap-start">
                                <button
                                    type="button"
                                    disabled={isWorking}
                                    onClick={() => !isWorking && onNavigate?.(item.id)}
                                    className={`relative flex items-center lg:w-full gap-2 lg:gap-3 rounded-2xl px-5 lg:px-4 h-11 lg:h-11 text-[13px] lg:text-[14px] font-bold transition-all duration-200 whitespace-nowrap outline-none text-left shrink-0 overflow-visible ${isActive
                                        ? "bg-customRed/5 text-customRed"
                                        : isWorking
                                            ? "opacity-60 cursor-not-allowed text-slate-300"
                                            : "text-slate-600 lg:text-slate-600 hover:bg-slate-50 active:scale-95"
                                        }`}
                                >
                                    {isActive && <span className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[4px] rounded-r-full bg-customRed shadow-[2px_0_8px_rgba(239,68,68,0.4)]" />}
                                    {isActive && <span className="lg:hidden absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-20 h-[3px] rounded-t-full bg-customRed shadow-[0_-2px_6px_rgba(239,68,68,0.4)]" />}

                                    {item.icon && (
                                        <span className="shrink-0">
                                            {React.cloneElement(item.icon, {
                                                className: `h-[18px] w-[18px] transition-colors ${isActive ? "text-customRed" : isWorking ? "text-slate-200" : "text-slate-400"}`,
                                            })}
                                        </span>
                                    )}

                                    <span className="truncate">{item.label}</span>
                                    {isWorking && badgeSuffix}
                                </button>

                                {hasSubItems && isActive && (
                                    <div className="hidden lg:block mt-1 ml-9 space-y-1 border-l border-slate-100 pl-4 py-1">
                                        {item.subItems.map((sub) => {
                                            const isSubActive = activeKey === sub.id;
                                            return (
                                                <button
                                                    key={sub.id}
                                                    onClick={() => onNavigate?.(sub.id)}
                                                    className={`block py-1.5 text-[13px] hover:text-customRed transition-colors ${isSubActive ? "text-customRed font-medium" : "text-slate-500"}`}
                                                >
                                                    {sub.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>
            </div>
        </aside>
    );
}
