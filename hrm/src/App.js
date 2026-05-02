// src/App.js
import React, { useEffect, useState, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ProtectedRoute from "./components/pages/ProtectedRoute/ProtectedRoute";
// thiiiiiiiiiiiiiiiiiiiii
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
const AttendancePage = lazy(() => import("./features/attendance").then(m => ({ default: m.AttendancePage })));
const AdminDailyReport = lazy(() => import("./features/attendance/AdminDailyReport"));
const AttendanceSettings = lazy(() => import("./features/attendance/components/AttendanceSettings"));
const ProfilePage = lazy(() => import("./features/profile/ProfilePage"));
const LeavePage = lazy(() => import("./features/leave/LeavePage"));
const PermissionsPage = lazy(() => import("./features/permissions/PermissionsPage"));
const NewsPage = lazy(() => import("./features/news/NewsPage"));
const ReportsPage = lazy(() => import("./features/reports/ReportsPage"));
const LogsPage = lazy(() => import("./features/audit/LogsPage"));
const BrandingPage = lazy(() => import("./features/settings/BrandingPage"));
const SystemSettingsPage = lazy(() => import("./features/settings/SystemSettingsPage"));

const ComingSoon = lazy(() => import("./components/common/ComingSoon"));
const OrganizationPage = lazy(() => import("./features/organization/OrganizationPage"));
const PerformancePage = lazy(() => import("./features/performance/PerformancePage"));
const LeaderboardPage = lazy(() => import("./features/gamification/LeaderboardPage"));
const PayrollPage = lazy(() => import("./features/payroll/PayrollPage"));
const PayrollDetailsView = lazy(() => import("./features/payroll/components/PayrollDetailsView"));
const SalarySettings = lazy(() => import("./features/payroll/components/SalarySettings"));
const OfficePage = lazy(() => import("./features/office/OfficePage"));
const SaaSPage = lazy(() => import("./features/saas/SaaSPage"));


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

  if (!ready) return <div className="p-6 text-gray-600">Loading…</div>;

  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <ToastContainer position="top-right" autoClose={3000} />
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Public */}
              <Route
                path="/login"
                element={
                  <PublicOnly>
                    <Login />
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
                <Route
                  path="/saas"
                  element={
                    <ProtectedRoute requireRole="developer">
                      <SaaSPage />
                    </ProtectedRoute>
                  }
                />
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
