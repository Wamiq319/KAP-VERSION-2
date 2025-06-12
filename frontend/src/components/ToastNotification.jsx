import React, { useEffect, useState } from "react";
import { arflag } from "../assets";
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaInfoCircle,
  FaTimes,
} from "react-icons/fa";

const ToastNotification = ({ message, type = "success", onClose }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!show) return null;

  const config = {
    success: {
      icon: <FaCheckCircle className="text-green-500" />,
      divider: "border-green-500",
      text: "text-green-700",
    },
    error: {
      icon: <FaExclamationCircle className="text-red-500" />,
      divider: "border-red-500",
      text: "text-red-700",
    },
    info: {
      icon: <FaInfoCircle className="text-blue-500" />,
      divider: "border-blue-500",
      text: "text-blue-700",
    },
    warning: {
      icon: <FaExclamationCircle className="text-yellow-500" />,
      divider: "border-yellow-500",
      text: "text-yellow-700",
    },
  }[type];

  return (
    <div className="fixed top-5 right-5 w-72 bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
      <div className="flex items-start p-4">
        {/* Flag Icon */}
        <div className="mr-3 flex-shrink-0">
          <img
            src={arflag}
            alt="Notification"
            className="h-6 w-6 object-contain"
          />
        </div>

        {/* Divider and Content */}
        <div className={`flex-1 border-l-4 pl-3 ${config.divider}`}>
          <div className="flex justify-between items-start">
            <p className={`text-sm font-medium ${config.text}`}>{message}</p>
            <button
              onClick={() => {
                setShow(false);
                onClose();
              }}
              className="ml-2 text-gray-400 hover:text-gray-500"
            >
              <FaTimes className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToastNotification;
