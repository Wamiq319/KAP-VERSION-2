import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useSelector } from "react-redux";
import {
  // New V2
  UserPage,
  OrganizationPage,
  DepartmentPage,
  // Authentication Routes
  LoginPage,

  // Admin Routes
  AdminUpdatePage,
  AdminHomePage,

  // KAP Employee Routes
  KAPEmployeeHomePage,
  ManageKapTicketPage,
  TrackKapTicketPage,

  // Government Employee Routes
  GovEmployeeHomePage,
  ManageGovTicketsEmployeePage,
  AllGovTicketsPage,

  // Integration Employee Routes
  IntegrationEmployeeHomePage,

  // Government Manager Routes
  GovSectorManagerHomePage,
  AddGovEmployeePage,
  ManageTicketsGovPage,

  // Operating Manager Routes
  OperatingManagerHomePage,
  AddCompanyEmployeePage,
  ManageOpTicketsPage,

  // Operating Employee Routes
  OperatingEmployeeHomePage,
  ManageTicketsEmployeePage,
  AllOpTicketsPage,
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
  OP_MANAGER: "OP-MANAGER",
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
    <div className="h-screen overflow-y-auto  bg-gray-100" dir={direction}>
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
                    <KAPEmployeeHomePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manage-kap-tickets"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.KAP_EMPLOYEE]}>
                    <ManageKapTicketPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/track-kap-tickets"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.KAP_EMPLOYEE]}>
                    <TrackKapTicketPage />
                  </ProtectedRoute>
                }
              />

              {/* Government Employee Routes */}
              <Route
                path="/gov-employee-home"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.GOV_EMPLOYEE]}>
                    <GovEmployeeHomePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manage-gov-employee-tickets"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.GOV_EMPLOYEE]}>
                    <ManageGovTicketsEmployeePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/gov-employee-tickets"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.GOV_EMPLOYEE]}>
                    <AllGovTicketsPage />
                  </ProtectedRoute>
                }
              />

              {/* Company Employee Routes */}

              {/* Integration Employee Routes */}
              <Route
                path="/integration-employee-home"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.INTEGRATION_EMPLOYEE]}>
                    <IntegrationEmployeeHomePage />
                  </ProtectedRoute>
                }
              />

              {/* Government Manager Routes */}
              <Route
                path="/govsector-manager-home"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.GOV_MANAGER]}>
                    <GovSectorManagerHomePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/add-gov-employee"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.GOV_MANAGER]}>
                    <AddGovEmployeePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manage-gov-tickets"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.GOV_MANAGER]}>
                    <ManageTicketsGovPage />
                  </ProtectedRoute>
                }
              />

              {/* Operating Manager Routes */}
              <Route
                path="/op-manager-home"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.OP_MANAGER]}>
                    <OperatingManagerHomePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/add-op-employee"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.OP_MANAGER]}>
                    <AddCompanyEmployeePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manage-op-tickets"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.OP_MANAGER]}>
                    <ManageOpTicketsPage />
                  </ProtectedRoute>
                }
              />

              {/* Operating Employee Routes */}
              <Route
                path="/op-employee-home"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.OP_EMPLOYEE]}>
                    <OperatingEmployeeHomePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manage-op-employee-tickets"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.OP_EMPLOYEE]}>
                    <ManageTicketsEmployeePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/op-employee-tickets"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.OP_EMPLOYEE]}>
                    <AllOpTicketsPage />
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
