import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute: Enforces authentication and role-based access.
 * @param {string[]} allowedRoles - List of roles permitted to access this route.
 */
const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { isAuthenticated, role } = useAuth();
  
  // 1. If not authenticated, always go to landing page
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // 2. If authenticated but role not in allowed list, redirect to their home dashboard
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    console.warn(`[ProtectedRoute] Access denied for role: ${role}. Required: ${allowedRoles}`);
    
    // Simplified logic: ADMINs go to /admin, others to /dashboard
    if (role === 'ADMIN') {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // 3. Authorized
  return <Outlet />;
};

export default ProtectedRoute;
