import { useNavigate } from "react-router-dom";
import React from "react";
import { Button } from "../../components";
import { useSelector } from "react-redux";
import { logo } from "../../assets";

const DashboardHome = ({ role }) => {
  //KAP_EMPLOYEE | GOV_MANAGER | OP_MANAGER | GOV_EMPLOYEE | OP_EMPLOYEE
  const navigate = useNavigate();
  const { data } = useSelector((state) => state.auth);
  const words = useSelector((state) => state.lang.words);

  // Get user data from localStorage
  const userData = JSON.parse(localStorage.getItem("user") || "{}");

  // Role-specific configurations
  const roleConfig = {
    KAP_EMPLOYEE: {
      title: words["Kap Employee Dashboard"] || "Kap Employee Dashboard",
      logo: userData?.organization?.logo?.url || logo,
      name: userData?.organization?.name || "KAP",
      department: userData?.department?.name || "KAP Department",
      buttons: [
        {
          text: words["Manage Tickets"] || "Manage Tickets",
          path: "/manage-kap-tickets",
          className: "w-full bg-blue-600 hover:bg-blue-700 text-lg py-3 shadow",
        },
      ],
    },
    GOV_MANAGER: {
      title:
        words["Government Manager Dashboard"] || "Government Manager Dashboard",
      logo: userData?.organization?.logo?.url || logo,
      name: userData?.organization?.name || "Organization",
      department: userData?.department?.name || "Department",
      buttons: [
        {
          text: words["Manage Employees"] || "Manage Employees",
          path: "/manage-gov-users",
          className:
            "w-full bg-orange-600 hover:bg-orange-700 text-lg font-semibold py-3 shadow",
        },
        {
          text: words["Manage Tickets"] || "Manage Tickets",
          path: "/manage-gov-tickets",
          className:
            "w-full bg-green-600 hover:bg-green-700 text-lg py-3 shadow",
        },
      ],
    },
    OP_MANAGER: {
      title:
        words["Operating Manager Dashboard"] || "Operating Manager Dashboard",
      logo: userData?.organization?.logo?.url || logo,
      name: userData?.organization?.name || "Organization",
      department: userData?.department?.name || "Department",
      buttons: [
        {
          text: words["Manage Employees"] || "Manage Employees",
          path: "/manage-org-users",
          className:
            "w-full bg-orange-600 hover:bg-orange-700 text-lg font-semibold py-3 shadow",
        },
        {
          text: words["Manage Tickets"] || "Manage Tickets",
          path: "/manage-op-tickets",
          className: "w-full bg-blue-600 hover:bg-blue-700 text-lg py-3 shadow",
        },
      ],
    },
    GOV_EMPLOYEE: {
      title:
        words["Government Employee Dashboard"] ||
        "Government Employee Dashboard",
      logo: userData?.organization?.logo?.url || logo,
      name: userData?.organization?.name || "Organization",
      department: userData?.department?.name || "Department",
      buttons: [
        {
          text: words["All Tickets"] || "All Tickets",
          path: "/gov-employee-tickets",
          className:
            "w-full bg-green-600 hover:bg-green-700 text-lg py-3 shadow",
        },
        {
          text: words["My Assigned Tickets"] || "My Assigned Tickets",
          path: "/manage-gov-employee-tickets",
          className:
            "w-full bg-green-600 hover:bg-green-700 text-lg py-3 shadow",
        },
      ],
    },
    OP_EMPLOYEE: {
      title:
        words["Operating Employee Dashboard"] || "Operating Employee Dashboard",
      logo: userData?.organization?.logo?.url || logo,
      name: userData?.organization?.name || "Organization",
      department: userData?.department?.name || "Department",
      buttons: [
        {
          text: words["All Tickets"] || "All Tickets",
          path: "/op-employee-tickets",
          className: "w-full bg-blue-600 hover:bg-blue-700 text-lg py-3 shadow",
        },
        {
          text: words["My Assigned Tickets"] || "My Assigned Tickets",
          path: "/manage-op-employee-tickets",
          className: "w-full bg-blue-600 hover:bg-blue-700 text-lg py-3 shadow",
        },
      ],
    },
  };

  const config = roleConfig[role];

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="flex flex-col items-center justify-center bg-gray-100 p-4">
      {/* Development Mode Raw Data Display */}
      {import.meta.env.VITE_MODE === "development" && (
        <div className="w-full max-w-4xl mb-6">
          <div className="bg-white rounded-lg shadow-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">
                Development Data :: User Object :: {import.meta.env.VITE_MODE}
              </h3>
              <button
                onClick={() => {
                  const userData = localStorage.getItem("user");
                  navigator.clipboard.writeText(userData);
                }}
                className="text-xs text-blue-500 hover:text-blue-600"
              >
                Copy
              </button>
            </div>
            <div className="border rounded p-2 overflow-auto max-h-52">
              <pre className="text-xs text-gray-600">
                {JSON.stringify(userData, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Control Panel Box */}
      <div className="bg-gray-300 p-6 rounded-lg shadow-lg max-w-md md:max-w-lg lg:max-w-xl space-y-6">
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="flex justify-center bg-white rounded-full shadow-lg">
            <img
              src={config.logo}
              alt="Organization Logo"
              className="h-32 w-32 rounded-full object-cover"
              onError={(e) => {
                e.target.onerror = null; // Prevent infinite loop
                e.target.src = logo; // Fallback to default logo
              }}
            />
          </div>

          <div className="text-center">
            <h4 className="text-2xl font-bold text-gray-800">{config.name}</h4>
            <p className="text-lg text-gray-600">{config.department}</p>
            {data?.role && (
              <p className="text-sm text-gray-500 mt-1">{config.title}</p>
            )}
          </div>
        </div>

        {config.buttons.map((button, index) => (
          <Button
            key={index}
            text={button.text}
            onClick={() => handleNavigation(button.path)}
            className={button.className}
          />
        ))}
      </div>
    </div>
  );
};

export default DashboardHome;
