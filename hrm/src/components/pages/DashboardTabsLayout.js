import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function DashboardTabsLayout() {
  const { user } = useAuth();
  const { pathname } = useLocation();

  const roleList = user?.roles || [];
  if (user?.role) roleList.push(user.role);
  const isAdmin = roleList.some(r => ["admin", "super_admin", "hr", "developer"].includes(String(r).toLowerCase()));
  const feats = new Set(user?.features || []);

  const allTabs = [
    { label: "Home", to: "/dashboard" },
    { label: "News", to: "/dashboard/news" },
    { label: "Permissions", to: "/dashboard/permissions", adminOnly: true },
    { label: "Logs", to: "/dashboard/logs", adminOnly: true },
    { label: "Branding", to: "/dashboard/branding", adminOnly: true },
  ];

  // Filter tabs: Show if Admin OR has the specific feature code
  const tabs = allTabs.filter(t => !t.adminOnly || isAdmin);

  return (
    <>
      <div className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl mb-8 p-1.5 flex items-center overflow-hidden">
        <div className="flex gap-1 overflow-x-auto no-scrollbar w-full">
          {tabs.map(({ label, to }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/dashboard"}
              className={({ isActive }) =>
                `px-3 sm:px-5 py-2.5 text-[11px] sm:text-[12px] font-bold uppercase tracking-widest rounded-xl transition-all duration-300 whitespace-nowrap 
                 ${isActive
                  ? "bg-customRed text-white shadow-lg shadow-customRed/20 scale-[1.02]"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"}`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      </div>

      <Outlet />
    </>
  );
}
