// ======================
// Authentication Pages
// ======================
import LoginPage from "./Auth/Login";
import AdminUpdatePage from "./Auth/AdminUpdatePage";

// ======================
// Home/Dashboard Pages
// ======================
import AdminHomePage from "./Home/Admin";
import KAPEmployeeHomePage from "./Home/KapEmployee";
import IntegrationEmployeeHomePage from "./Home/IntegrationEmployee";
import OperatingManagerHomePage from "./Home/OperatingManager.jsx";
import GovSectorManagerHomePage from "./Home/GovSectorManager.jsx";
import OperatingEmployeeHomePage from "./Home/OperatingEmployee.jsx";
import GovEmployeeHomePage from "./Home/GovEmployee.jsx";

// ======================
// Admin Management Pages
// ======================
import AddUserPage from "./Admin/AddUserPage.jsx";
import AddOrgPage from "./Admin/AddOrgPage.jsx";

// ======================
// Operational Pages
// ======================
import AddCompanyEmployeePage from "./OperatingManagers/OpEmployee.jsx";
import AddGovEmployeePage from "./GovernmentManager/GovEmployee.jsx";
import ManageOpTicketsPage from "./OperatingManagers/opTickets.jsx";
import AllOpTicketsPage from "./OpEmployee/CompanyTicket.jsx";
import ManageKapTicketPage from "./kapEmployee/KapTicket.jsx";
import ManageTicketsEmployeePage from "./OpEmployee/ManageTicket.jsx";
import ManageTicketsGovPage from "./GovernmentManager/govTickets.jsx";
import ManageGovTicketsEmployeePage from "./GovEmployee/ManageTicket.jsx";
import AllGovTicketsPage from "./GovEmployee/SectorTickets.jsx";
import TrackKapTicketPage from "./kapEmployee/TicketTracking.jsx";
// ======================
// Export All Components
// ======================
export {
  AddUserPage,
  AddOrgPage,

  // Authentication
  LoginPage,
  AdminUpdatePage,

  // Home/Dashboard
  AdminHomePage,
  KAPEmployeeHomePage,
  IntegrationEmployeeHomePage,
  OperatingManagerHomePage,
  GovSectorManagerHomePage,
  OperatingEmployeeHomePage,
  GovEmployeeHomePage,

  // Admin Management

  // Operational
  AddCompanyEmployeePage,
  AddGovEmployeePage,
  ManageOpTicketsPage,
  AllOpTicketsPage,
  ManageKapTicketPage,
  TrackKapTicketPage,
  ManageTicketsEmployeePage,
  ManageTicketsGovPage,
  ManageGovTicketsEmployeePage,
  AllGovTicketsPage,
};
