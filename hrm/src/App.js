// src/App.js
import React, { useEffect, useState, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import ProtectedRoute from "./components/pages/ProtectedRoute/ProtectedRoute";
// Auth context
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { initCsrf } from "./utils/api";
import MainLoader from "./components/common/MainLoader";

// Lazy load all route components for code splitting
const Login = lazy(() => import("./userdetails/Login"));
const Layout = lazy(() => import("./components/pages/Layout/Layout"));
const Dashboard = lazy(() => import("./Dashbord/Dashbord"));
const DashboardTabsLayout = lazy(() => import("./components/pages/DashboardTabsLayout"));
const EmployeesPage = lazy(() => import("./features/employees/EmployeesPage"));
const EmployeeViewPage = lazy(() => import("./features/employees/components/EmployeeViewPage"));
const AttendancePage = lazy(() => import("./features/attendance/AttendancePage"));
const AdminDailyReport = lazy(() => import("./features/attendance/AdminDailyReport"));
const AttendanceSettings = lazy(() => import("./features/attendance/components/AttendanceSettings"));
const PermissionsPage = lazy(() => import("./features/permissions/PermissionsPage"));
const NewsPage = lazy(() => import("./features/news/NewsPage"));
const LogsPage = lazy(() => import("./features/audit/LogsPage"));
const BrandingPage = lazy(() => import("./features/settings/BrandingPage"));
const LeaderboardPage = lazy(() => import("./features/gamification/LeaderboardPage"));
const OfficePage = lazy(() => import("./features/office/OfficePage"));
const LeavePage = lazy(() => import("./features/leave/LeavePage"));
const PayrollPage = lazy(() => import("./features/payroll/PayrollPage"));
const ProfilePage = lazy(() => import("./features/profile/ProfilePage"));
const ReportsPage = lazy(() => import("./features/reports/ReportsPage"));
const OrganizationPage = lazy(() => import("./features/organization/OrganizationPage"));
const PerformancePage = lazy(() => import("./features/performance/PerformancePage"));
const SystemSettingsPage = lazy(() => import("./features/settings/SystemSettingsPage"));

const ComingSoon = lazy(() => import("./components/common/ComingSoon"));
const PayrollDetailsView = lazy(() => import("./features/payroll/components/PayrollDetailsView"));
const SalarySettings = lazy(() => import("./features/payroll/components/SalarySettings"));
const ToastContainer = lazy(() => import("react-toastify").then((m) => ({ default: m.ToastContainer })));
// const SaaSPage = lazy(() => import("./features/saas/SaaSPage"));


// Loading component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-customRed border-r-transparent"></div>
      <p className="mt-2 text-sm text-slate-600">Loading...</p>
    </div>
  </div>
);

/**
 * PublicOnly:
 * If authenticated, redirect to /dashboard (prevents seeing login while signed in)
 */
function PublicOnly({ children }) {
  const { loading, isAuthenticated } = useAuth();
  if (loading) return <MainLoader />; // wait for /me
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [showToasts, setShowToasts] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await initCsrf(); // axios base, withCredentials, csrf interceptor
      } catch (e) {
        console.error("CSRF init failed", e);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!ready) return undefined;

    const loadToasts = () => setShowToasts(true);
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(loadToasts, { timeout: 2000 });
      return () => window.cancelIdleCallback?.(id);
    }

    const id = window.setTimeout(loadToasts, 1000);
    return () => window.clearTimeout(id);
  }, [ready]);

  if (!ready) return <div className="p-6 text-gray-600">Loading...</div>;

  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          {showToasts && (
            <Suspense fallback={null}>
              <ToastContainer position="top-right" autoClose={3000} />
            </Suspense>
          )}
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Public */}
              <Route
                path="/login"
                element={<Navigate to="/login/propeople" replace />}
              />
              <Route
                path="/login/ovisco"
                element={<Navigate to="/login/ovaisco" replace />}
              />
              <Route
                path="/login/:portalCode"
                element={
                  <PublicOnly>
                    <Login />
                  </PublicOnly>
                }
              />
              <Route
                path="/propeople"
                element={
                  <PublicOnly>
                    <Login fixedCompanyCode="propeople" />
                  </PublicOnly>
                }
              />
              <Route
                path="/ovisco"
                element={<Navigate to="/ovaisco" replace />}
              />
              <Route
                path="/ovaisco"
                element={
                  <PublicOnly>
                    <Login fixedCompanyCode="ovisco" />
                  </PublicOnly>
                }
              />

              {/* Protected: EVERYTHING under Layout */}
              <Route
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                {/* redirect root to dashboard */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />

                {/* Dashboard + tabs */}
                <Route path="/dashboard/*" element={<DashboardTabsLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="news" element={<NewsPage />} />
                  <Route path="permissions" element={<PermissionsPage />} />
                  <Route path="logs" element={<LogsPage />} />
                  <Route path="branding" element={<BrandingPage />} />
                  <Route path="leaderboard" element={<LeaderboardPage />} />
                  <Route path="office/*" element={<OfficePage />} />
                  <Route path="procurement" element={<ComingSoon title="Procurement Module" />} />
                  <Route path="store" element={<ComingSoon title="Store Module" />} />
                  <Route path="daily-report" element={<AdminDailyReport />} />
                </Route>

                {/* Other top-level pages */}
                <Route path="/employees" element={<EmployeesPage />} />
                <Route path="/employees/:id" element={<EmployeeViewPage />} />

                {/* Attendance */}
                <Route path="/attendance" element={<AttendancePage />} />

                {/* ✅ NEW: Attendance Settings route */}
                <Route path="/attendance/settings" element={<AttendanceSettings />} />

                {/* Organization / Departments */}
                <Route path="/organization" element={<OrganizationPage />} />
                <Route path="/recruitment" element={<ComingSoon title="Recruitment" />} />
                <Route path="/timesheet" element={<ComingSoon title="Timesheet" />} />
                <Route path="/leave" element={<LeavePage />} />
                <Route path="/performance" element={<PerformancePage />} />
                {/* Minimal Payroll Routes */}
                <Route path="/payroll" element={<PayrollPage />} />
                <Route path="/self-service/my-salary" element={<PayrollPage tab="self" />} />
                <Route path="/self-service/my-salary/:id" element={<PayrollDetailsView />} />
                <Route path="/hr/payroll/run" element={<PayrollPage tab="run" />} />
                <Route path="/hr/employees/:id/increment" element={<ComingSoon title="Increment Management" />} />

                <Route path="/payroll/details/:month/:year" element={<PayrollDetailsView />} />
                <Route path="/payroll/settings" element={<SalarySettings />} />
                <Route path="/reports" element={<ReportsPage />} />

                {/* 👇 NEW: profile route */}
                <Route path="/profile" element={<ProfilePage />} />

                <Route
                  path="/settings/system"
                  element={
                    <ProtectedRoute requireFeatures={['system_settings_view']}>
                      <SystemSettingsPage />
                    </ProtectedRoute>
                  }
                />

                {/* SaaS / Developer Control Plane */}
                {/* <Route
                  path="/saas"
                  element={
                    <ProtectedRoute requireRole="developer">
                      <SaaSPage />
                    </ProtectedRoute>
                  }
                /> */}
              </Route>

              {/* Unauthorized placeholder (used if you add role guards) */}
              <Route path="/unauthorized" element={<div className="p-6">Unauthorized</div>} />

              {/* 404 */}
              <Route path="*" element={<h1 className="p-6">Page Not Found</h1>} />
            </Routes>
          </Suspense>
        </ThemeProvider>
      </AuthProvider>
    </Router >
  );
}
