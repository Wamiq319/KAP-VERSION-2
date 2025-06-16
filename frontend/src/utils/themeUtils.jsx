import React from "react";
import {
  FaCircle,
  FaExclamationCircle,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
} from "react-icons/fa";

// Status styles with icons
export const getStatusStyle = (status) => {
  const baseStyle =
    "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium";
  const styles = {
    CREATED: {
      icon: React.createElement(FaCircle, {
        className: "mr-1.5 text-green-500",
      }),
      style: `${baseStyle} bg-green-100 text-green-800`,
    },
    IN_PROGRESS: {
      icon: React.createElement(FaClock, { className: "mr-1.5 text-blue-500" }),
      style: `${baseStyle} bg-blue-100 text-blue-800`,
    },
    COMPLETED: {
      icon: React.createElement(FaCheckCircle, {
        className: "mr-1.5 text-gray-500",
      }),
      style: `${baseStyle} bg-gray-100 text-gray-800`,
    },
    CANCELLED: {
      icon: React.createElement(FaTimesCircle, {
        className: "mr-1.5 text-red-500",
      }),
      style: `${baseStyle} bg-red-100 text-red-800`,
    },
    TRANSFER_REQUESTED: {
      icon: React.createElement(FaExclamationCircle, {
        className: "mr-1.5 text-orange-500",
      }),
      style: `${baseStyle} bg-orange-100 text-orange-800`,
    },
  };
  return (
    styles[status] || {
      icon: React.createElement(FaCircle, {
        className: "mr-1.5 text-gray-500",
      }),
      style: `${baseStyle} bg-gray-100 text-gray-800`,
    }
  );
};

// Priority styles with icons
export const getPriorityStyle = (priority) => {
  const baseStyle =
    "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium";
  const styles = {
    LOW: {
      icon: React.createElement(FaCircle, {
        className: "mr-1.5 text-green-500",
      }),
      style: `${baseStyle} bg-green-100 text-green-800`,
    },
    MEDIUM: {
      icon: React.createElement(FaCircle, {
        className: "mr-1.5 text-yellow-500",
      }),
      style: `${baseStyle} bg-yellow-100 text-yellow-800`,
    },
    HIGH: {
      icon: React.createElement(FaExclamationCircle, {
        className: "mr-1.5 text-orange-500",
      }),
      style: `${baseStyle} bg-orange-100 text-orange-800`,
    },
    CRITICAL: {
      icon: React.createElement(FaExclamationCircle, {
        className: "mr-1.5 text-red-500",
      }),
      style: `${baseStyle} bg-red-100 text-red-800`,
    },
  };
  return (
    styles[priority] || {
      icon: React.createElement(FaCircle, {
        className: "mr-1.5 text-gray-500",
      }),
      style: `${baseStyle} bg-gray-100 text-gray-800`,
    }
  );
};
