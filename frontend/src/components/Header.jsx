import React from "react";
import { FiHome, FiLogOut } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import LanguageSwitcher from "./LanguageSwitcher";

const Header = () => {
  const navigate = useNavigate();
  const user =
    useSelector((state) => state.auth.data) ||
    JSON.parse(localStorage.getItem("user"));
  const words = useSelector((state) => state.lang.words);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("data");
    window.location.reload();
    navigate("/login");
  };

  const handleHomeClick = () => {
    if (!user?.role) {
      navigate("/login");
      return;
    }

    const roleRoutes = {
      ADMIN: "/admin-home",
      OP_MANAGER: "/op-manager-home",
      OP_EMPLOYEE: "/employee-home",
      KAP_EMPLOYEE: "/kap-employee-home",
      GOV_MANAGER: "/govsector-manager-home",
      GOV_EMPLYEE: "/gov-employee-home",
    };
    navigate(roleRoutes[user.role] || "/login");
  };

  return (
    <div className="bg-gradient-to-r from-green-700 to-green-500 text-white py-2 px-4 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16">
        {/* Left Section - Home Button */}
        <button
          onClick={handleHomeClick}
          className="p-2 rounded-full bg-white hover:bg-gray-100 transition-colors shadow-sm"
          aria-label="Home"
        >
          <FiHome size={18} className="text-green-700" />
        </button>

        {/* Center Section - User Info with Labels */}
        <div className="flex-1 flex items-center justify-center mx-4 overflow-x-auto scrollbar-hide">
          {user && (
            <div className="flex items-center gap-6">
              {/* Company Logo */}
              {user.organization?.logo?.url && (
                <div className="flex flex-col items-center">
                  <img
                    src={user.organization.logo.url}
                    alt="Company Logo"
                    className="h-8 w-8 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                </div>
              )}

              {/* User Info Sections */}
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-start min-w-[60px]">
                  <span className="text-xs text-green-200">Name:</span>
                  <span className="text-sm font-medium whitespace-nowrap">
                    {user.name}
                  </span>
                </div>

                <div className="h-8 w-px bg-green-200/30"></div>

                <div className="flex flex-col items-start min-w-[60px]">
                  <span className="text-xs text-green-200">Role:</span>
                  <span className="text-sm whitespace-nowrap">{user.role}</span>
                </div>

                <div className="h-8 w-px bg-green-200/30"></div>

                <div className="flex flex-col items-start min-w-[70px]">
                  <span className="text-xs text-green-200">Mobile:</span>
                  <span className="text-sm whitespace-nowrap">
                    {user.mobile}
                  </span>
                </div>

                <div className="h-8 w-px bg-green-200/30"></div>

                <div className="flex flex-col items-start min-w-[80px]">
                  <span className="text-xs text-green-200">Organization:</span>
                  <span className="text-sm whitespace-nowrap">
                    {user.organization?.name || "KAP"}
                  </span>
                </div>

                <div className="h-8 w-px bg-green-200/30"></div>

                <div className="flex flex-col items-start min-w-[80px]">
                  <span className="text-xs text-green-200">Department:</span>
                  <span className="text-sm whitespace-nowrap">
                    {user.department?.name || user.kapRole}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Section - Controls */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-full text-sm transition-colors shadow-sm"
          >
            <FiLogOut size={14} />
            <span className="hidden sm:inline">{words["Logout"]}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;
