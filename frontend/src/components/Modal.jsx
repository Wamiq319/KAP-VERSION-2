import React from "react";

const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
      <div
        className={`bg-white rounded-lg shadow-lg w-full ${sizeClasses[size]} max-h-[97vh] flex flex-col`}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-700">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Modal Body - Scrollable content */}
        <div className="overflow-y-auto flex-1 p-4 pb-8">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
