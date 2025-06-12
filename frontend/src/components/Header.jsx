import React, { useState, useEffect } from "react";
import { FaHome } from "react-icons/fa";
import { FiLogOut } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import LanguageSwitcher from "./LanguageSwitcher";

const Header = () => {
  const navigate = useNavigate();
  const user =
    useSelector((state) => state.auth.data) ||
    JSON.parse(localStorage.getItem("user"));
  const words = useSelector((state) => state.lang.words);
  const [headerText, setHeaderText] = useState(words["Control Panel"]);

  useEffect(() => {
    if (!user?.role) {
      setHeaderText(words["Control Panel"]);
      return;
    }

    switch (user.role) {
      case "admin":
      case "kap_employee":
        setHeaderText("KAP");
        break;
      case "gov_manager":
      case "gov_employee":
        setHeaderText(user.sector?.name);
        break;
      case "op_manager":
        setHeaderText(user.company?.name || words["Operating"]);
        break;
      case "op_employee":
        setHeaderText(user.entity?.name || words["Operating"]);
        break;
      default:
        setHeaderText(words["Control Panel"]);
    }
  }, [user, words]);

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
      admin: "/admin-home",
      op_manager: "/op-manager-home",
      op_employee: "/employee-home",
      kap_employee: "/kap-employee-home",
      gov_manager: "/govsector-manager-home",
      gov_employee: "/gov-employee-home",
    };
    navigate(roleRoutes[user.role] || "/login");
  };

  return (
    <div className="bg-gradient-to-r from-green-700 to-green-500 text-white py-3 px-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left Section - Home Button */}
        <div className="flex-1   flex justify-start">
          <button
            onClick={handleHomeClick}
            className="p-2 bg-white rounded-full hover:bg-gray-100 transition-all duration-300 shadow-md"
          >
            <FaHome size={20} className="text-green-700" />
          </button>
        </div>

        {/* Center Section - Title */}
        <div className="flex-1 flex justify-center">
          <h1 className="text-base md:text-xl font-bold text-center whitespace-nowrap text-white tracking-tight px-4">
            {headerText}
          </h1>
        </div>

        {/* Right Section - Language & Logout */}
        <div className="flex-1 flex justify-end items-center gap-3">
          <LanguageSwitcher />
          <button
            onClick={handleLogout}
            className="bg-white text-green-700 hover:bg-gray-100 px-4 py-2 rounded-full font-medium shadow-md transition-all duration-300 flex items-center gap-2"
          >
            <span className="hidden md:block">{words["Logout"]}</span>
            <FiLogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;
