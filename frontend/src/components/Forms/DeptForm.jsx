import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { InputField, Dropdown } from "../index";
import { fetchEntities } from "../../redux/slices/crudSlice";

const DepartmentForm = ({
  onSubmit,
  onCancel,
  isLoading,
  errorMessage,
  words,
}) => {
  const dispatch = useDispatch();
  const { entities } = useSelector((state) => state.crud);
  const [localLoading, setLocalLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    organization: "",
  });
  const [orgTypeFilter, setOrgTypeFilter] = useState("");

  // Organization type options for filtering
  const orgTypeOptions = [
    { value: "", label: words["All Types"] || "All Types" },
    { value: "GOVERNMENT", label: words["Government"] || "Government" },
    { value: "COMPANY", label: words["Company"] || "Company" },
  ];

  // Fetch organizations when org type filter changes
  useEffect(() => {
    const fetchOrganizations = async () => {
      setLocalLoading(true);
      try {
        await dispatch(
          fetchEntities({
            entityType: "organizations",
            params: {
              ...(orgTypeFilter && { type: orgTypeFilter }),
              fields: "name _id type",
            },
          })
        );
      } finally {
        setLocalLoading(false);
      }
    };
    fetchOrganizations();
  }, [orgTypeFilter, dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleOrgTypeFilterChange = (value) => {
    setOrgTypeFilter(value);
    // Reset organization selection when filter changes
    setFormData((prev) => ({
      ...prev,
      organization: "",
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Prepare organization options based on filter
  const organizationOptions = [
    { value: "", label: words["Select Organization"] || "Select Organization" },
    ...(entities.organizations
      ?.filter((org) => !orgTypeFilter || org.type === orgTypeFilter)
      ?.map((org) => ({
        value: org._id,
        label: org.name,
      })) || []),
  ];

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 pb-4">
      {/* Department Name Field */}
      <div className="w-full">
        <InputField
          label={words["Department Name"] || "Department Name"}
          name="name"
          placeholder={
            words["Enter department name"] || "Enter department name"
          }
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full"
        />
      </div>

      {/* Organization Type Filter (not submitted) */}
      <div className="w-full">
        <Dropdown
          label={
            words["Filter by Organization Type"] ||
            "Filter by Organization Type"
          }
          options={orgTypeOptions}
          selectedValue={orgTypeFilter}
          onChange={handleOrgTypeFilterChange}
          className="w-full"
        />
      </div>

      {/* Organization Selection */}
      <div className="w-full">
        <Dropdown
          label={words["Organization"] || "Organization"}
          options={organizationOptions}
          selectedValue={formData.organization}
          onChange={(value) =>
            handleChange({
              target: { name: "organization", value },
            })
          }
          required
          isLoading={localLoading}
          className="w-full"
        />
      </div>

      {errorMessage && (
        <p className="text-red-500 text-sm col-span-1">{errorMessage}</p>
      )}

      {/* Form Actions - Stack vertically on mobile */}
      <div className="flex flex-col sm:flex-row gap-2 mt-4 w-full">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-500 hover:bg-gray-700 text-white rounded w-full sm:w-auto"
        >
          {words["Cancel"] || "Cancel"}
        </button>
        <button
          type="submit"
          disabled={isLoading || localLoading}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded disabled:opacity-50 w-full sm:w-auto"
        >
          {isLoading || localLoading
            ? words["Creating..."] || "Creating..."
            : words["Create"] || "Create"}
        </button>
      </div>
    </form>
  );
};

export default DepartmentForm;
