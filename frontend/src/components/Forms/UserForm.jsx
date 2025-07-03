import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { InputField, Dropdown, Button } from "../index";
import { fetchEntities } from "../../redux/slices/crudSlice";
import Loader from "../Loader";

const defaultFormData = {
  name: "",
  username: "",
  mobile: "",
  password: "",
  role: "", // Will be one of: GOV_MANAGER, OP_MANAGER, GOV_EMPLOYEE, OP_EMPLOYEE
  kapRole: "", // Only for KAP employees
  organization: "",
  department: "",
};

const UserForm = ({
  initialFormData = defaultFormData,
  onSubmit,
  onCancel,
  isLoading,
  errorMessage,
  words,
  Mode = "ADMIN",
}) => {
  const dispatch = useDispatch();
  const { entities } = useSelector((state) => state.crud);
  const [localLoading, setLocalLoading] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});
  const [localUser, setLocalUser] = useState(null); // For debug card

  // UI state (not sent to backend)
  const [uiState, setUiState] = useState({
    userType: "", // 'KAP_EMPLOYEE' or 'ORG_EMPLOYEE'
    orgType: "", // 'GOVERNMENT' or 'COMPANY'
    selectedRole: "", // 'MANAGER' or 'EMPLOYEE' (UI selection)
  });

  // KAP Role options
  const kapRoleOptions = [
    {
      value: "GOVERNMENT_INTEGRATION",
      label: words["Government Integration"],
    },
    {
      value: "SECURITY_SAFETY",
      label: words["Security & Safety"],
    },
    {
      value: "PLANNING_DEVELOPMENT",
      label: words["Planning & Development"],
    },
  ];

  // Simplified UI role options
  const uiRoleOptions = [
    { value: "MANAGER", label: words["Manager"] },
    { value: "EMPLOYEE", label: words["Employee"] },
  ];

  // On mount, if Mode is MANAGER, get user from localStorage and set org/department/role
  useEffect(() => {
    if (Mode === "MANAGER") {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          setLocalUser(user); // For debug card
          setFormData((prev) => ({
            ...prev,
            organization: user.organization?._id || "",
            department: user.department?._id || "",
            role: user.role === "OP_MANAGER" ? "OP_EMPLOYEE" : prev.role,
          }));
          setUiState((prev) => ({
            ...prev,
            userType: "ORG_EMPLOYEE",
            orgType: user.role === "GOV_MANAGER" ? "GOVERNMENT" : "COMPANY",
            selectedRole: "EMPLOYEE",
          }));
        } catch (e) {
          // ignore
        }
      }
    }
  }, [Mode]);

  // Fetch organizations when org type changes
  useEffect(() => {
    if (uiState.userType === "ORG_EMPLOYEE" && uiState.orgType) {
      const fetchOrgs = async () => {
        setLocalLoading(true);
        try {
          await dispatch(
            fetchEntities({
              entityType: "organizations",
              params: {
                type: uiState.orgType,
                fields: "name _id",
              },
            })
          );
        } finally {
          setLocalLoading(false);
        }
      };
      fetchOrgs();
    }
  }, [uiState.orgType, uiState.userType, dispatch]);

  // Fetch departments when organization changes
  useEffect(() => {
    if (uiState.userType === "ORG_EMPLOYEE" && formData.organization) {
      const fetchDepts = async () => {
        setLocalLoading(true);
        try {
          await dispatch(
            fetchEntities({
              entityType: "departments",
              params: {
                organization: formData.organization,
                minimal: true,
              },
            })
          );
        } finally {
          setLocalLoading(false);
        }
      };
      fetchDepts();
    }
  }, [formData.organization, uiState.userType, dispatch]);

  // Update the actual role based on UI selections
  useEffect(() => {
    if (uiState.userType === "KAP_EMPLOYEE") {
      setFormData((prev) => ({ ...prev, role: "KAP_EMPLOYEE" }));
    } else if (
      uiState.userType === "ORG_EMPLOYEE" &&
      uiState.orgType &&
      uiState.selectedRole
    ) {
      const roleMap = {
        GOVERNMENT: {
          MANAGER: "GOV_MANAGER",
          EMPLOYEE: "GOV_EMPLOYEE",
        },
        COMPANY: {
          MANAGER: "OP_MANAGER",
          EMPLOYEE: "OP_EMPLOYEE",
        },
      };
      setFormData((prev) => ({
        ...prev,
        role: roleMap[uiState.orgType][uiState.selectedRole],
      }));
    }
  }, [uiState.userType, uiState.orgType, uiState.selectedRole]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "userType" || name === "orgType") {
      setUiState((prev) => ({ ...prev, [name]: value }));
      // Clear specific error for the UI state field being changed
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
      // Reset dependent fields
      if (name === "userType") {
        setFormData((prev) => ({
          ...prev,
          kapRole: "",
          organization: "",
          department: "",
          role: "",
        }));
        setFormErrors((prev) => ({
          ...prev,
          kapRole: "",
          organization: "",
          department: "",
          role: "",
        }));
      } else if (name === "orgType") {
        setFormData((prev) => ({
          ...prev,
          organization: "",
          department: "",
          role: "",
        }));
        setFormErrors((prev) => ({
          ...prev,
          organization: "",
          department: "",
          role: "",
        }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
      // Clear specific error for the form data field being changed
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleDropdownChange = (name, value) => {
    if (name === "selectedRole") {
      setUiState((prev) => ({ ...prev, selectedRole: value }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
      // Reset dependent fields
      if (name === "organization") {
        setFormData((prev) => ({ ...prev, department: "" }));
        setFormErrors((prev) => ({ ...prev, department: "" }));
      }
    }
    // Clear specific error for the dropdown field
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Helper function to validate Saudi mobile number format
  const validateSaudiMobile = (number) => {
    const saudiRegex = /^9665\d{8}$/;
    return saudiRegex.test(number);
  };

  const validateForm = () => {
    let errors = {};
    const requiredFields = ["name", "username", "mobile", "password"];

    requiredFields.forEach((field) => {
      if (!formData[field]) {
        errors[field] = words["This field is required"];
      }
    });

    // Validate mobile number format
    if (formData.mobile && !validateSaudiMobile(formData.mobile)) {
      errors.mobile =
        words["Please enter a valid Saudi mobile number (e.g. 9665XXXXXXXX)"];
    }

    if (!uiState.userType) {
      errors.userType = words["Please select user type"];
    }

    if (uiState.userType === "KAP_EMPLOYEE" && !formData.kapRole) {
      errors.kapRole = words["Please select a KAP Role"];
    }

    if (uiState.userType === "ORG_EMPLOYEE") {
      if (!uiState.orgType)
        errors.orgType = words["Please select organization type"];
      if (!formData.organization)
        errors.organization = words["Please select an organization"];
      if (!uiState.selectedRole)
        errors.selectedRole = words["Please select a role"];
      if (!formData.department && formData.organization)
        // Department is required if an organization is selected
        errors.department = words["Please select a department"];
    }

    // Ensure the final 'role' is set, as it's derived
    if (
      !formData.role &&
      (uiState.userType === "KAP_EMPLOYEE" ||
        (uiState.userType === "ORG_EMPLOYEE" &&
          uiState.orgType &&
          uiState.selectedRole))
    ) {
      // This case should ideally not happen if other fields are valid and useEffect runs correctly,
      // but as a safeguard, we check if a derived role is missing.
      errors.role = words["A role must be assigned"];
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    // No need to clear errors here explicitly, as validateForm sets the full error object
    onSubmit(formData);
  };

  // Get filtered organizations based on selected type
  const organizationOptions =
    entities.organizations?.map((org) => ({
      value: org._id,
      label: org.name,
    })) || [];

  // Get department options
  const departmentOptions =
    entities.departments?.map((dept) => ({
      value: dept._id,
      label: dept.name,
    })) || [];

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-10"
    >
      {/* Common fields - will automatically adjust columns based on screen size */}
      <div className="space-y-4 md:space-y-0">
        <InputField
          label={words["Full Name"]}
          name="name"
          placeholder={words["Enter full name"]}
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full"
          error={formErrors.name}
        />

        <InputField
          label={words["Username"]}
          name="username"
          placeholder={words["Choose a username"]}
          value={formData.username}
          onChange={handleChange}
          required
          className="w-full"
          error={formErrors.username}
        />
      </div>

      <div className="space-y-4 md:space-y-0">
        <InputField
          label={words["Mobile Number"]}
          name="mobile"
          placeholder="9665XXXXXXXX"
          type="mobile"
          value={formData.mobile}
          onChange={handleChange}
          required
          error={formErrors.mobile}
        />

        <InputField
          label={words["Password"]}
          name="password"
          placeholder={words["Set a password"]}
          type="password"
          value={formData.password}
          onChange={handleChange}
          required
          className="w-full"
          error={formErrors.password}
        />
      </div>

      {/* Only show the rest of the form if not in MANAGER mode */}
      {Mode !== "MANAGER" && (
        <>
          {/* User Type Radio Buttons - full width on mobile, then normal on desktop */}
          <div className="col-span-1 md:col-span-2 space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {words["User Type"]} <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="userType"
                  value="KAP_EMPLOYEE"
                  checked={uiState.userType === "KAP_EMPLOYEE"}
                  onChange={handleChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500"
                  required
                />
                <span className="ml-2 text-gray-700">
                  {words["KAP Employee"]}
                </span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="userType"
                  value="ORG_EMPLOYEE"
                  checked={uiState.userType === "ORG_EMPLOYEE"}
                  onChange={handleChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500"
                />
                <span className="ml-2 text-gray-700">
                  {words["Organization Employee"]}
                </span>
              </label>
            </div>
            {formErrors.userType && (
              <p className="mt-1 text-sm text-red-600">{formErrors.userType}</p>
            )}
          </div>

          {/* KAP Employee Fields - full width */}
          {uiState.userType === "KAP_EMPLOYEE" && (
            <div className="col-span-1 md:col-span-2">
              <Dropdown
                label={words["KAP Role"]}
                options={kapRoleOptions}
                selectedValue={formData.kapRole}
                onChange={(value) => handleDropdownChange("kapRole", value)}
                required
                className="w-full"
                error={formErrors.kapRole}
              />
            </div>
          )}

          {/* Organization Employee Fields */}
          {uiState.userType === "ORG_EMPLOYEE" && (
            <>
              {/* Organization Type Radio Buttons - full width */}
              <div className="col-span-1 md:col-span-2 space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {words["Organization Type"]}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="orgType"
                      value="GOVERNMENT"
                      checked={uiState.orgType === "GOVERNMENT"}
                      onChange={handleChange}
                      className="h-4 w-4 text-green-600 focus:ring-green-500"
                      required
                    />
                    <span className="ml-2 text-gray-700">
                      {words["Government"]}
                    </span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="orgType"
                      value="COMPANY"
                      checked={uiState.orgType === "COMPANY"}
                      onChange={handleChange}
                      className="h-4 w-4 text-green-600 focus:ring-green-500"
                    />
                    <span className="ml-2 text-gray-700">
                      {words["Company"]}
                    </span>
                  </label>
                </div>
                {formErrors.orgType && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.orgType}
                  </p>
                )}
              </div>

              {/* Organization Dropdown - full width on mobile, normal on desktop */}
              {uiState.orgType && (
                <div className="col-span-1 md:col-span-1">
                  <Dropdown
                    label={words["Organization"]}
                    options={organizationOptions}
                    selectedValue={formData.organization}
                    onChange={(value) =>
                      handleDropdownChange("organization", value)
                    }
                    required
                    isLoading={localLoading}
                    className="w-full"
                    error={formErrors.organization}
                  />
                </div>
              )}

              {/* Role Dropdown - full width on mobile, normal on desktop */}
              {formData.organization && (
                <div className="col-span-1 md:col-span-1">
                  <Dropdown
                    label={words["Role"]}
                    options={uiRoleOptions}
                    selectedValue={uiState.selectedRole}
                    onChange={(value) =>
                      handleDropdownChange("selectedRole", value)
                    }
                    required
                    className="w-full"
                    error={formErrors.selectedRole}
                  />
                </div>
              )}

              {/* Department Dropdown - full width */}
              {formData.organization && (
                <div className="col-span-1 md:col-span-2">
                  <Dropdown
                    label={words["Department"]}
                    options={departmentOptions}
                    selectedValue={formData.department}
                    onChange={(value) =>
                      handleDropdownChange("department", value)
                    }
                    required
                    isLoading={localLoading}
                    className="w-full"
                    error={formErrors.department}
                  />
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Debug view - always full width */}
      {process.env.NODE_ENV === "development" && (
        <div className="col-span-1 md:col-span-2 p-2 bg-gray-100 rounded">
          <p className="text-sm">
            <strong>UI State:</strong>{" "}
            <pre className="whitespace-pre-wrap text-xs">
              {JSON.stringify(uiState, null, 2)}
            </pre>
            <strong>Form Data:</strong>{" "}
            <pre className="whitespace-pre-wrap text-xs">
              {JSON.stringify(formData, null, 2)}
            </pre>
            {/* Show user from localStorage if Mode is MANAGER */}
            {Mode === "MANAGER" && localUser && (
              <>
                <strong>User (from localStorage):</strong>{" "}
                <pre className="whitespace-pre-wrap text-xs">
                  {JSON.stringify(localUser, null, 2)}
                </pre>
              </>
            )}
          </p>
        </div>
      )}

      {/* Error display - always full width */}
      {(errorMessage || Object.keys(formErrors).length > 0) && (
        <div className="col-span-1 md:col-span-2">
          <p className="text-red-500 text-sm">
            {errorMessage || Object.values(formErrors).find((e) => e) || ""}
          </p>
        </div>
      )}

      {/* Form actions - always full width */}
      <div className="col-span-1 md:col-span-2 flex justify-end gap-2 mt-4">
        <Button
          text={words["Cancel"]}
          onClick={onCancel}
          className="bg-gray-500 hover:bg-gray-700 w-full sm:w-auto"
        />
        <Button
          text={
            isLoading || localLoading ? words["Creating..."] : words["Create"]
          }
          onClick={handleSubmit}
          isLoading={isLoading || localLoading}
          className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
        />
      </div>
    </form>
  );
};

export default UserForm;
