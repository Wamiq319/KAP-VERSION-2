import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useSelector } from "react-redux";
import {
  // Authentication
  LoginPage,
  AdminUpdatePage,

  // Home/Dashboard
  AdminHomePage,
  DashboardHome, //role: KAP_EMPLOYEE | GOV_MANAGER | OP_MANAGER | GOV_EMPLOYEE | OP_EMPLOYEE

  // Admin Management
  UserPage, //buttonText, buttonClassName, tableHeaderBgColor, tableBorderColor, Mode: ADMIN | MANAGER
  OrganizationPage,
  DepartmentPage,

  // Ticket Management
  TicketPage,
  ViewTicket,
} from "./pages";
import Header from "./components/Header";

// ======================
// Route Protection Component
// ======================
const ProtectedRoute = ({ allowedRoles, children }) => {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role))
    return <Navigate to="/admin-update" replace />;

  return children;
};

// ======================
// Role Constants
// ======================
const ROLES = {
  ADMIN: "ADMIN",
  KAP_EMPLOYEE: "KAP_EMPLOYEE",
  GOV_MANAGER: "GOV_MANAGER",
  OP_MANAGER: "OP_MANAGER",
  GOV_EMPLOYEE: "GOV_EMPLOYEE",
  OP_EMPLOYEE: "OP_EMPLOYEE",
};

// ======================
// Main App Component
// ======================
const App = () => {
  const user =
    useSelector((state) => state.auth.data) ||
    JSON.parse(localStorage.getItem("user"));
  const lang = useSelector((state) => state.lang.lang);
  const direction = lang === "ar" ? "rtl" : "ltr";

  return (
    <div className="h-screen overflow-y-auto bg-gray-100" dir={direction}>
      <Router>
        <div className="flex flex-col align-middle">
          <Header />
          <div className="flex-grow p-1">
            <Routes>
              {/* Authentication Routes */}
              <Route
                path="/login"
                element={
                  user ? <Navigate to="/admin-update" replace /> : <LoginPage />
                }
              />
              <Route
                path="/"
                element={
                  user ? (
                    <Navigate to="/admin-update" replace />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin-update"
                element={
                  <ProtectedRoute allowedRoles={Object.values(ROLES)}>
                    <AdminUpdatePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin-home"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                    <AdminHomePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manage-admin-users"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                    <UserPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manage-admin-orgs"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                    <OrganizationPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manage-admin-depts"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                    <DepartmentPage />
                  </ProtectedRoute>
                }
              />

              {/* KAP Employee Routes */}
              <Route
                path="/kap-employee-home"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.KAP_EMPLOYEE]}>
                    <DashboardHome role="KAP_EMPLOYEE" />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/manage-kap-tickets"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.KAP_EMPLOYEE]}>
                    <TicketPage mode="KAP_EMPLOYEE" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manage-kap-tickets/view/:id"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.KAP_EMPLOYEE]}>
                    <ViewTicket mode="KAP_EMPLOYEE" />
                  </ProtectedRoute>
                }
              />

              {/* Government Employee Routes */}
              <Route
                path="/gov-employee-home"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.GOV_EMPLOYEE]}>
                    <DashboardHome role="GOV_EMPLOYEE" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manage-gov-employee-tickets"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.GOV_EMPLOYEE]}>
                    <TicketPage mode="GOV_EMPLOYEE" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manage-gov-employee-tickets/view/:id"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.GOV_EMPLOYEE]}>
                    <ViewTicket mode="GOV_EMPLOYEE" />
                  </ProtectedRoute>
                }
              />

              {/* Government Manager Routes */}
              <Route
                path="/govsector-manager-home"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.GOV_MANAGER]}>
                    <DashboardHome role="GOV_MANAGER" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manage-gov-tickets"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.GOV_MANAGER]}>
                    <TicketPage mode="GOV_MANAGER" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manage-gov-tickets/view/:id"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.GOV_MANAGER]}>
                    <ViewTicket mode="GOV_MANAGER" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manage-org-users"
                element={
                  <ProtectedRoute
                    allowedRoles={[ROLES.GOV_MANAGER, ROLES.OP_MANAGER]}
                  >
                    <UserPage Mode="MANAGER" />
                  </ProtectedRoute>
                }
              />

              {/* Operating Manager Routes */}
              <Route
                path="/op_manager-home"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.OP_MANAGER]}>
                    <DashboardHome role="OP_MANAGER" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manage-op-tickets"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.OP_MANAGER]}>
                    <TicketPage mode="OP_MANAGER" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manage-op-tickets/view/:id"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.OP_MANAGER]}>
                    <ViewTicket mode="OP_MANAGER" />
                  </ProtectedRoute>
                }
              />

              {/* Operating Employee Routes */}
              <Route
                path="/op-employee-home"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.OP_EMPLOYEE]}>
                    <DashboardHome role="OP_EMPLOYEE" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manage-op-employee-tickets"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.OP_EMPLOYEE]}>
                    <TicketPage mode="OP_EMPLOYEE" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manage-op-employee-tickets/view/:id"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.OP_EMPLOYEE]}>
                    <ViewTicket mode="OP_EMPLOYEE" />
                  </ProtectedRoute>
                }
              />

              {/* Ticket View Route - Handles all roles */}
              <Route
                path="/tickets/:id"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      ROLES.KAP_EMPLOYEE,
                      ROLES.GOV_EMPLOYEE,
                      ROLES.GOV_MANAGER,
                      ROLES.OP_MANAGER,
                      ROLES.OP_EMPLOYEE,
                    ]}
                  >
                    <ViewTicket mode={user?.role} />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all Route */}
              <Route
                path="*"
                element={
                  user ? (
                    <Navigate to="/admin-update" replace />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
            </Routes>
          </div>
        </div>
      </Router>
    </div>
  );
};

export default App;
