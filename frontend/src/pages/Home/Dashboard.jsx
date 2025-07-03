import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { Button } from "../../components";
import { useSelector, useDispatch } from "react-redux";
import { fetchEntities } from "../../redux/slices/crudSlice";
import { logo } from "../../assets";

const DashboardHome = ({ role }) => {
  //KAP_EMPLOYEE | GOV_MANAGER | OP_MANAGER | GOV_EMPLOYEE | OP_EMPLOYEE
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { data } = useSelector((state) => state.auth);
  const words = useSelector((state) => state.lang.words);
  const [transferRequestCount, setTransferRequestCount] = useState(0);

  // Get user data from localStorage
  const userData = JSON.parse(localStorage.getItem("user") || "{}");

  // Fetch transfer request count
  const fetchTransferRequestCount = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user) return;

      let queryParams = {
        role: role,
        transferRequestMode: true,
      };

      // Add role-specific parameters
      switch (role) {
        case "GOV_MANAGER":
        case "OP_MANAGER":
          queryParams.userId = user._id;
          queryParams.orgId = user.organization?._id;
          queryParams.departmentId = user.department?._id;
          break;
        case "GOV_EMPLOYEE":
        case "OP_EMPLOYEE":
          queryParams.userId = user._id;
          break;
        default:
          return; // KAP_EMPLOYEE doesn't have transfer requests
      }

      const response = await dispatch(
        fetchEntities({
          entityType: "tickets",
          params: queryParams,
        })
      );

      if (response.payload?.success) {
        setTransferRequestCount(response.payload.data?.length || 0);
      }
    } catch (error) {
      console.error("Error fetching transfer request count:", error);
    }
  };

  useEffect(() => {
    // Only fetch count for roles that have transfer requests
    if (
      ["GOV_MANAGER", "OP_MANAGER", "GOV_EMPLOYEE", "OP_EMPLOYEE"].includes(
        role
      )
    ) {
      fetchTransferRequestCount();
    }
  }, [role, dispatch]);

  // Role-specific configurations
  const roleConfig = {
    KAP_EMPLOYEE: {
      title: words["Kap Employee Dashboard"],
      logo: userData?.organization?.logo?.url || logo,
      name: words["KAP"],
      department: words["KAP Department"],
      buttons: [
        {
          text: words["Manage Tickets"],
          path: "/manage-kap-tickets",
          className: "w-full bg-blue-600 hover:bg-blue-700 text-lg py-3 shadow",
        },
      ],
    },
    GOV_MANAGER: {
      title: words["Government Manager Dashboard"],
      logo: userData?.organization?.logo?.url || logo,
      name: words["Organization"],
      department: words["Department"],
      buttons: [
        {
          text: words["Manage Employees"],
          path: "/manage-org-users",
          className:
            "w-full bg-orange-600 hover:bg-orange-700 text-lg font-semibold py-3 shadow",
        },
        {
          text: words["Manage Tickets"],
          path: "/manage-gov-tickets",
          className:
            "w-full bg-green-600 hover:bg-green-700 text-lg py-3 shadow",
        },
        {
          text: `${words["Transfer Requests"]} (${transferRequestCount})`,
          path: "/manage-gov-tickets?transferRequestMode=true",
          className:
            "w-full bg-purple-600 hover:bg-purple-700 text-lg py-3 shadow",
        },
      ],
    },
    OP_MANAGER: {
      title: words["Operating Manager Dashboard"],
      logo: userData?.organization?.logo?.url || logo,
      name: words["Organization"],
      department: words["Department"],
      buttons: [
        {
          text: words["Manage Employees"],
          path: "/manage-org-users",
          className:
            "w-full bg-orange-600 hover:bg-orange-700 text-lg font-semibold py-3 shadow",
        },
        {
          text: words["Manage Tickets"],
          path: "/manage-op-tickets",
          className: "w-full bg-blue-600 hover:bg-blue-700 text-lg py-3 shadow",
        },
        {
          text: `${words["Transfer Requests"]} (${transferRequestCount})`,
          path: "/manage-op-tickets?transferRequestMode=true",
          className:
            "w-full bg-purple-600 hover:bg-purple-700 text-lg py-3 shadow",
        },
      ],
    },
    GOV_EMPLOYEE: {
      title: words["Government Employee Dashboard"],
      logo: userData?.organization?.logo?.url || logo,
      name: words["Organization"],
      department: words["Department"],
      buttons: [
        {
          text: `${words["Transfer Requests"]} (${transferRequestCount})`,
          path: "/manage-gov-employee-tickets?transferRequestMode=true",
          className:
            "w-full bg-purple-600 hover:bg-purple-700 text-lg py-3 shadow",
        },
        {
          text: words["My Assigned Tickets"],
          path: "/manage-gov-employee-tickets",
          className:
            "w-full bg-green-600 hover:bg-green-700 text-lg py-3 shadow",
        },
      ],
    },
    OP_EMPLOYEE: {
      title: words["Operating Employee Dashboard"],
      logo: userData?.organization?.logo?.url || logo,
      name: words["Organization"],
      department: words["Department"],
      buttons: [
        {
          text: `${words["Transfer Requests"]} (${transferRequestCount})`,
          path: "/manage-op-employee-tickets?transferRequestMode=true",
          className:
            "w-full bg-purple-600 hover:bg-purple-700 text-lg py-3 shadow",
        },
        {
          text: words["My Assigned Tickets"],
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
                {words["Development Data :: User Object ::"]}{" "}
                {import.meta.env.VITE_MODE}
              </h3>
              <button
                onClick={() => {
                  const userData = localStorage.getItem("user");
                  navigator.clipboard.writeText(userData);
                }}
                className="text-xs text-blue-500 hover:text-blue-600"
              >
                {words["Copy"]}
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
      <div className="bg-gray-300 p-6 rounded-lg shadow-lg min-w-[320px] w-full max-w-md md:max-w-lg lg:max-w-xl space-y-6">
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
