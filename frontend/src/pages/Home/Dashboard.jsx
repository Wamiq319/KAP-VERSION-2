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

  // Role-specific configurations
  const roleConfig = {
    KAP_EMPLOYEE: {
      title: words["Kap Employee Dashboard"] || "Kap Employee Dashboard",
      logo: logo,
      name: data?.jobTitle,
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
      logo: data?.sector?.logo,
      name: data?.sector?.name,
      buttons: [
        {
          text: words["Manage Employees"] || "Manage Employees",
          path: "/add-gov-employee",
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
      logo: data?.company?.logo,
      name: data?.company?.name,
      buttons: [
        {
          text: words["Manage Employees"] || "Manage Employees",
          path: "/add-op-employee",
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
      logo: data?.sector?.logo,
      name: data?.sector?.name,
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
      logo: data?.entity?.logo,
      name: data?.entity?.name,
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
      {/* Control Panel Box */}
      <div className="bg-gray-300 p-6 rounded-lg shadow-lg max-w-md md:max-w-lg lg:max-w-xl space-y-6">
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="flex justify-center bg-white rounded-full shadow-lg">
            <img
              src={config.logo}
              alt="Organization Logo"
              className="h-32 w-32 rounded-full"
            />
          </div>

          <div className="text-center">
            <h4 className="text-2xl font-bold text-gray-800">
              {config.name || "Organization"}
            </h4>
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
