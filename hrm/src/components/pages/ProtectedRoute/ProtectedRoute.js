// src/components/pages/ProtectedRoute/ProtectedRoute.js
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

/**
 * ProtectedRoute
 * - Blocks access while auth state is loading
 * - Redirects unauthenticated users to /login (configurable via redirectTo)
 * - (Optional) Role guard via `requireRoles` array
 *
 * Usage:
 * <Route element={<ProtectedRoute />}>
 *   <Route path="/dashboard" element={<Dashboard />} />
 * </Route>
 *
 * With roles:
 * <Route element={<ProtectedRoute requireRoles={['admin','super_admin']} />}>
 *   <Route path="/admin" element={<Admin />} />
 * </Route>
 */
export default function ProtectedRoute({
  children,
  redirectTo = "/login",
  requireRoles, // optional: e.g., ['admin', 'super_admin']
  requireFeatures, // optional: e.g., ['system_settings_view']
}) {
  const { loading, isAuthenticated, user } = useAuth();
  const location = useLocation();

  // Don’t render protected UI until we know the session state
  if (loading) return null; // or your spinner component

  // Bounce unauthenticated users
  if (!isAuthenticated) {
    return (
      <Navigate
        to={redirectTo}
        replace
        state={{ from: location }} // so you can return after login if desired
      />
    );
  }

  // Admin/Super Admin/Developer bypass all route guards
  const fullAccessRoles = ['admin', 'super_admin', 'developer'];
  const hasFullAccess = fullAccessRoles.includes(String(user?.role || '').toLowerCase());

  // Optional: role-based guard (bypassed for full access roles)
  if (!hasFullAccess && requireRoles?.length && !requireRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Optional: feature-based guard (bypassed for full access roles)
  if (!hasFullAccess && requireFeatures?.length) {
    const userFeats = (user?.features || []).map(f => f.toLowerCase());
    const hasRequired = requireFeatures.some(f => userFeats.includes(f.toLowerCase()));
    if (!hasRequired) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Render nested route (Outlet) or provided children
  return children ?? <Outlet />;
}
