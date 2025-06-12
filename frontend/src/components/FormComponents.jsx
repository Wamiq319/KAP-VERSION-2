import React, { useState, useEffect, useRef } from "react";
import Loader from "./Loader";
import {
  FaEye,
  FaEyeSlash,
  FaChevronDown,
  FaChevronUp,
  FaCheck,
} from "react-icons/fa";
import { FiCalendar, FiUpload } from "react-icons/fi";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

/* ---------------------------------------------
   InputField Component with Saudi UI enhancements
--------------------------------------------- */

export const InputField = ({
  required = true,
  label,
  name,
  placeholder,
  value,
  onChange,
  className = "",
  type = "text",
  rows = 6,
  error,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [internalError, setInternalError] = useState(null);

  // Mobile number validation for Saudi numbers
  const validateMobile = (number) => {
    if (!number) return true;
    const saudiRegex = /^9665\d{8}$/;
    return saudiRegex.test(number);
  };

  const handleChange = (e) => {
    let value = e.target.value;

    // Special handling for mobile numbers
    if (type === "mobile") {
      // Auto-format Saudi numbers
      if (value.startsWith("05")) {
        value = "966" + value.substring(1);
      } else if (value.startsWith("5")) {
        value = "966" + value;
      }

      // Validate Saudi mobile format
      if (value && !validateMobile(value)) {
        setInternalError(
          "Please enter a valid Saudi mobile number (e.g. 9665XXXXXXXX)"
        );
      } else {
        setInternalError(null);
      }
    }

    onChange(e);
  };

  const getInputType = () => {
    if (type === "password" && showPassword) return "text";
    if (type === "mobile") return "tel";
    return type;
  };

  const getPlaceholder = () => {
    if (type === "mobile") return "9665XXXXXXXX";
    return placeholder;
  };

  const getLabel = () => {
    if (type === "mobile") return "Saudi Mobile Number";
    return label;
  };

  const inputClasses = `
    w-full p-3 border-b-2 border-green-500 rounded-md
    focus:outline-dashed focus:outline-2 focus:outline-green-600
    transition-all duration-200 bg-white text-gray-800  focus:bg-green-50
  `;

  const renderInput = () => {
    if (type === "textarea") {
      return (
        <textarea
          name={name}
          placeholder={getPlaceholder()}
          value={value}
          onChange={handleChange}
          rows={rows}
          className={inputClasses}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      );
    }

    return (
      <div className="relative">
        <input
          type={getInputType()}
          name={name}
          placeholder={getPlaceholder()}
          value={value}
          onChange={handleChange}
          className={inputClasses}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          // Mobile-specific attributes
          {...(type === "mobile" && {
            pattern: "9665[0-9]{8}",
            maxLength: 12,
            inputMode: "numeric",
          })}
        />
        {type === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <FaEyeSlash className="h-5 w-5 text-gray-500 hover:text-green-600" />
            ) : (
              <FaEye className="h-5 w-5 text-gray-500 hover:text-green-600" />
            )}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className={`w-full mb-4 ${className}`}>
      <label className="block text-sm font-bold mb-2 text-gray-700">
        {getLabel()}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderInput()}
      {(error || internalError) && (
        <p className="mt-1 text-sm text-red-600">{error || internalError}</p>
      )}
    </div>
  );
};

/* ---------------------------------------------
   Enhanced Dropdown Component with Saudi UI
--------------------------------------------- */
export const Dropdown = ({
  required = true,
  label,
  options,
  selectedValue,
  onChange,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const dropdownRef = useRef(null);

  const handleSelect = (value) => {
    onChange(value);
    setIsOpen(false);
  };

  const selectedLabel =
    options.find((opt) => opt.value === selectedValue)?.label ||
    "Select an option";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`w-full relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-bold mb-1 text-gray-700">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
      )}
      <div
        className={`w-full p-3 border ${
          isFocused
            ? "border-green-500 ring-1 ring-green-200 bg-green-50"
            : "border-gray-300"
        } rounded-md cursor-pointer flex items-center justify-between transition-all duration-200`}
        onClick={() => {
          setIsOpen(!isOpen);
          setIsFocused(true);
        }}
      >
        <span className="truncate">{selectedLabel}</span>
        {isOpen ? (
          <FaChevronUp className="h-4 w-4 text-gray-500" />
        ) : (
          <FaChevronDown className="h-4 w-4 text-gray-500" />
        )}
      </div>
      {isOpen && (
        <div className="absolute w-full mt-1 border border-green-200 rounded-md bg-white shadow-lg z-10 max-h-[100px] overflow-hidden">
          <div className="overflow-y-auto max-h-[100px]">
            {options.map((option, index) => (
              <div
                key={index}
                className={`p-3 hover:bg-green-50 cursor-pointer transition-colors duration-150 ${
                  selectedValue === option.value
                    ? "bg-green-100 text-green-700 font-medium"
                    : "text-gray-700"
                }`}
                onClick={() => handleSelect(option.value)}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate">{option.label}</span>
                  {selectedValue === option.value && (
                    <FaCheck className="h-4 w-4 text-green-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ---------------------------------------------
   Saudi-themed Button Component
--------------------------------------------- */
export const Button = ({
  text,
  onClick,
  className = "",
  icon = null,
  isLoading = false,
  size = "medium", // 'small' | 'medium' | 'large'
}) => {
  const sizeClasses = {
    small: "px-3 py-1.5 text-sm",
    medium: "px-4 py-2 text-base",
    large: "px-6 py-3 text-lg",
  };

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`
        rounded-md font-medium transition-all duration-200 
        flex items-center justify-center gap-2 text-white
        ${sizeClasses[size]} 
        ${className}
        ${isLoading ? "opacity-75 cursor-not-allowed" : ""}
      `}
    >
      {isLoading ? (
        <Loader size={1} opacity={75} />
      ) : (
        <>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {text && <span>{text}</span>}
        </>
      )}
    </button>
  );
};

/* ---------------------------------------------
   Enhanced ImageInput Component
--------------------------------------------- */
export const ImageInput = ({
  label,
  onChange,
  className = "",
  required = false,
}) => {
  const [preview, setPreview] = useState(null);
  const [isFocused, setIsFocused] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file (JPEG, PNG, etc.)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target.result);
    };
    reader.readAsDataURL(file);

    onChange(file);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-bold  text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div
        className={`border ${
          isFocused
            ? "border-green-500 ring-1 ring-green-200 bg-green-50"
            : "border-gray-300"
        } rounded-md transition-all duration-200 p-1`}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-green-100 file:text-green-700
            hover:file:bg-green-200"
        />
      </div>

      {preview && (
        <div className="mt-2 border border-gray-200 rounded-md overflow-hidden">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover"
          />
        </div>
      )}
    </div>
  );
};

/* ---------------------------------------------
   Enhanced DatePicker Component
--------------------------------------------- */
export const DatePicker = ({
  label,
  name,
  value,
  onChange,
  className = "",
  required = false,
  minDate = null,
  maxDate = null,
}) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (value) {
      setSelectedDate(new Date(value));
    }
  }, [value]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
    const formattedDate = date ? date.toISOString().split("T")[0] : "";
    onChange({ target: { name, value: formattedDate } });
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-bold mb-1 text-gray-700">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
      )}
      <div
        className={`relative border-none border ${
          isFocused
            ? "border-green-500 ring-1 ring-green-200 bg-green-50"
            : "border-gray-300"
        } rounded-md transition-all duration-200`}
      >
        <ReactDatePicker
          selected={selectedDate}
          onChange={handleDateChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          dateFormat="yyyy-MM-dd"
          className="w-full p-3 bg-transparent rounded-md pl-10"
          placeholderText="Select date"
          minDate={minDate}
          maxDate={maxDate}
        />
        <FiCalendar className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
      </div>
    </div>
  );
};

// TODO:Need to remove later

/* ---------------------------------------------
   Enhanced FileInput Component 
--------------------------------------------- */
export const FileInput = ({
  required = true,
  label,
  name,
  onChange,
  className = "",
  accept = "*",
  multiple = false,
}) => {
  const [fileName, setFileName] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onChange(files);
      setFileName(
        files.length === 1 ? files[0].name : `${files.length} files selected`
      );
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-bold mb-1 text-gray-700">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
      )}

      <div
        className={`flex items-center gap-4 border ${
          isFocused
            ? "border-green-500 ring-1 ring-green-200 bg-green-50"
            : "border-gray-300"
        } rounded-md p-1 transition-all duration-200`}
      >
        <label
          className="cursor-pointer bg-green-100 hover:bg-green-200 px-4 py-2 rounded-md text-green-700 font-medium transition flex items-center gap-2"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        >
          <FiUpload />
          Choose File
          <input
            type="file"
            name={name}
            accept={accept}
            multiple={multiple}
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
        {fileName && (
          <span className="text-sm text-gray-600 truncate flex-1">
            {fileName}
          </span>
        )}
      </div>
    </div>
  );
};
