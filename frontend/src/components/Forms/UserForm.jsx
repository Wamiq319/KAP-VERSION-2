import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { InputField, Dropdown } from "../index";
import { fetchEntities } from "../../redux/slices/crudSlice";

const defaultFormData = {
  name: "",
  username: "",
  mobile: "",
  password: "",
  userType: "ORG_EMPLOYEE", // 'KAP_EMPLOYEE' or 'ORG_EMPLOYEE'
  role: "",
  kapRole: "",
  orgType: undefined,
  organization: undefined,
  department: undefined,
};

const UserForm = ({
  formData = defaultFormData,
  onChange,
  onSubmit,
  onCancel,
  isLoading,
  errorMessage,
  words,
  Mode = "ADMIN", // 'ADMIN' or 'MANAGER'
}) => {
  const dispatch = useDispatch();
  const { entities } = useSelector((state) => state.crud);
  const [localLoading, setLocalLoading] = useState(false);

  // KAP Role options
  const kapRoleOptions = [
    {
      value: "GOVERNMENT_INTEGRATION",
      label: words["Government Integration"] || "Government Integration",
    },
    {
      value: "SECURITY_SAFETY",
      label: words["Security & Safety"] || "Security & Safety",
    },
    {
      value: "PLANNING_DEVELOPMENT",
      label: words["Planning & Development"] || "Planning & Development",
    },
  ];

  // Organization role options based on organization type
  const orgRoleOptions = {
    GOVERNMENT: [
      {
        value: "GOV_MANAGER",
        label: words["Government Manager"] || "Government Manager",
      },
      {
        value: "GOV_EMPLOYEE",
        label: words["Government Employee"] || "Government Employee",
      },
    ],
    COMPANY: [
      {
        value: "OP_MANAGER",
        label: words["Operation Manager"] || "Operation Manager",
      },
      {
        value: "OP_EMPLOYEE",
        label: words["Operation Employee"] || "Operation Employee",
      },
    ],
  };

  // Organization type options
  const orgTypeOptions = [
    { value: "GOVERNMENT", label: words["Government"] || "Government" },
    { value: "COMPANY", label: words["Company"] || "Company" },
  ];

  // Fetch organizations when org type changes
  useEffect(() => {
    if (formData.userType === "ORG_EMPLOYEE" && formData.orgType) {
      const fetchOrgs = async () => {
        setLocalLoading(true);
        try {
          await dispatch(
            fetchEntities({
              entityType: "organizations",
              params: {
                type: formData.orgType,
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
  }, [formData.orgType, formData.userType, dispatch]);

  // Fetch departments when organization changes
  useEffect(() => {
    if (formData.userType === "ORG_EMPLOYEE" && formData.organization) {
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
  }, [formData.organization, formData.userType, dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ target: { name, value } });
  };

  const handleDropdownChange = (name, value) => {
    if (name === "userType" && value !== formData.userType) {
      // Reset all related fields when user type changes
      onChange({
        target: {
          name: "userType",
          value,
          resetFields: true,
        },
      });
    } else if (name === "orgType") {
      // Reset organization and department when org type changes
      onChange({
        target: {
          name: "orgType",
          value,
          resetOrgFields: true,
        },
      });
    } else {
      onChange({ target: { name, value } });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Prepare the final data to submit
    const submitData = {
      ...formData,
      // For KAP employees, set role to KAP_EMPLOYEE and clear org fields
      ...(formData.userType === "KAP_EMPLOYEE" && {
        role: "KAP_EMPLOYEE",
        organization: undefined,
        department: undefined,
        orgType: undefined,
      }),
      // For org employees, clear kapRole
      ...(formData.userType === "ORG_EMPLOYEE" && {
        kapRole: undefined,
      }),
    };

    onSubmit(submitData);
  };

  // Prepare organization options
  const organizationOptions =
    entities.organizations?.map((org) => ({
      value: org._id,
      label: org.name,
    })) || [];

  // Prepare department options
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
      <InputField
        label={words["Full Name"]}
        name="name"
        placeholder={words["Enter full name"]}
        value={formData.name}
        onChange={handleChange}
        required
      />

      <InputField
        label={words["Username"]}
        name="username"
        placeholder={words["Choose a username"]}
        value={formData.username}
        onChange={handleChange}
        required
      />

      <InputField
        label={words["Mobile Number"]}
        name="mobile"
        placeholder="+9665XXXXXXXX"
        type="tel"
        value={formData.mobile}
        onChange={handleChange}
        required
      />

      <InputField
        label={words["Password"]}
        name="password"
        placeholder={words["Set a password"]}
        type="password"
        value={formData.password}
        onChange={handleChange}
        required
      />

      {/* User Type Radio Input */}
      {Mode === "ADMIN" && (
        <div className="space-y-2 col-span-2">
          <label className="block text-sm font-bold text-gray-700">
            {words["User Type"] || "User Type"}
            <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="flex space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="userType"
                value="KAP_EMPLOYEE"
                checked={formData.userType === "KAP_EMPLOYEE"}
                onChange={handleChange}
                className="form-radio h-4 w-4 text-green-600"
                required
              />
              <span className="ml-2 text-gray-700">
                {words["KAP Employee"] || "KAP Employee"}
              </span>
            </label>
            {Mode === "ADMIN" && (
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="userType"
                  value="ORG_EMPLOYEE"
                  checked={formData.userType === "ORG_EMPLOYEE"}
                  onChange={handleChange}
                  className="form-radio h-4 w-4 text-green-600"
                />
                <span className="ml-2 text-gray-700">
                  {words["Org Employee"] || "Org Employee"}
                </span>
              </label>
            )}
          </div>
        </div>
      )}
      {/* KAP Employee Role Dropdown */}
      {formData.userType === "KAP_EMPLOYEE" && (
        <Dropdown
          label={words["KAP Role"] || "KAP Role"}
          options={kapRoleOptions}
          selectedValue={formData.kapRole}
          onChange={(value) => handleDropdownChange("kapRole", value)}
          required
        />
      )}

      {/* Org Employee Fields */}
      {formData.userType === "ORG_EMPLOYEE" && (
        <>
          <Dropdown
            label={words["Organization Type"]}
            options={orgTypeOptions}
            selectedValue={formData.orgType}
            onChange={(value) => handleDropdownChange("orgType", value)}
            required
          />

          {formData.orgType && (
            <Dropdown
              label={words["Organization"]}
              options={organizationOptions}
              selectedValue={formData.organization}
              onChange={(value) => handleDropdownChange("organization", value)}
              required
              isLoading={localLoading}
              disabled={!formData.orgType}
            />
          )}

          {formData.orgType && (
            <Dropdown
              label={words["Role"]}
              options={orgRoleOptions[formData.orgType]}
              selectedValue={formData.role}
              onChange={(value) => handleDropdownChange("role", value)}
              required
            />
          )}

          {formData.organization && formData.role === "OP_EMPLOYEE" && (
            <Dropdown
              label={words["Department"]}
              options={departmentOptions}
              selectedValue={formData.department}
              onChange={(value) => handleDropdownChange("department", value)}
              required
              isLoading={localLoading}
              disabled={!formData.organization}
            />
          )}
        </>
      )}

      {errorMessage && (
        <p className="text-red-500 text-sm col-span-2">{errorMessage}</p>
      )}

      <div className="col-span-2 flex justify-end gap-2 mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-500 hover:bg-gray-700 text-white rounded"
        >
          {words["Cancel"]}
        </button>
        <button
          type="submit"
          disabled={isLoading || localLoading}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded disabled:opacity-50"
        >
          {isLoading || localLoading ? words["Creating..."] : words["Create"]}
        </button>
      </div>
    </form>
  );
};

export default UserForm;
