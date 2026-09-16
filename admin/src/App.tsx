import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";

import LoginScreen from "./screens/LoginScreen";
import DashboardScreen from "./screens/DashboardScreen";
import OrdersScreen from "./screens/OrdersScreen";
import DriversScreen from "./screens/DriversScreen";
import RatesScreen from "./screens/RatesScreen";
import ReviewsScreen from "./screens/ReviewsScreen";
import SOSScreen from "./screens/SOSScreen";
import ReportsScreen from "./screens/ReportsScreen";
import SettingsScreen from "./screens/SettingsScreen";
import VehiclesScreen from "./screens/VehiclesScreen";
/*
 * Force a fresh login when a new browser tab/session starts.
 *
 * sessionStorage survives page refreshes but is cleared when
 * the browser tab is closed.
 */
const SESSION_KEY = "fuelnow_admin_session";

function initialiseAdminSession() {
  const existingSession = sessionStorage.getItem(SESSION_KEY);

  if (!existingSession) {
    localStorage.removeItem("admin_token");
    sessionStorage.setItem(SESSION_KEY, "active");
  }
}

initialiseAdminSession();

function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        width: "100%",
      }}
    >
      <Sidebar />

      <div
        style={{
          flex: 1,
          marginLeft: "var(--sidebar-width)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <TopBar />

        <main
          style={{
            flex: 1,
            padding: 32,
            background: "var(--warm-ash)",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  const isAuthenticated = Boolean(localStorage.getItem("admin_token"));

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <AdminLayout>{children}</AdminLayout>;
}

function LoginRoute() {
  const isAuthenticated = Boolean(localStorage.getItem("admin_token"));

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <LoginScreen />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login */}
        <Route path="/login" element={<LoginRoute />} />

        {/* Protected admin routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardScreen />
            </ProtectedRoute>
          }
        />

        <Route
          path="/vehicles"
          element={
            <ProtectedRoute>
              <VehiclesScreen />
            </ProtectedRoute>
            }
        />

        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <OrdersScreen />
            </ProtectedRoute>
          }
        />

        <Route
          path="/drivers"
          element={
            <ProtectedRoute>
              <DriversScreen />
            </ProtectedRoute>
          }
        />

        <Route
          path="/rates"
          element={
            <ProtectedRoute>
              <RatesScreen />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reviews"
          element={
            <ProtectedRoute>
              <ReviewsScreen />
            </ProtectedRoute>
          }
        />

        <Route
          path="/sos"
          element={
            <ProtectedRoute>
              <SOSScreen />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <ReportsScreen />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsScreen />
            </ProtectedRoute>
          }
        />

        {/* Root */}
        <Route
          path="/"
          element={
            localStorage.getItem("admin_token") ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
