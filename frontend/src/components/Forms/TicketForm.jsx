import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { InputField, Dropdown, DatePicker } from "../index";
import { fetchEntities, createEntity } from "../../redux/slices/crudSlice";
import { HiFlag } from "react-icons/hi";

const defaultFormData = {
  request: "",
  description: "",
  ticketType: "INSTANT", // Options: INSTANT , SCHEDULED
  priority: "MEDIUM",
  scheduledDate: "",
  requestor: "",
  operator: "",
  requestorDepartment: "",
  operatorDepartment: "",
  creator: "",
};

const priorityOptions = [
  {
    value: "LOW",
    label: "Low",
    color: "text-green-600",
    icon: <HiFlag className="w-5 h-5" />,
  },
  {
    value: "MEDIUM",
    label: "Medium",
    color: "text-yellow-600",
    icon: <HiFlag className="w-5 h-5" />,
  },
  {
    value: "HIGH",
    label: "High",
    color: "text-red-600",
    icon: <HiFlag className="w-5 h-5" />,
  },
];

const TicketForm = ({
  initialFormData = defaultFormData,
  onCancel,
  onSubmit,
  words,
}) => {
  const dispatch = useDispatch();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});

  // Organization state variables
  const [requestorOrganizations, setRequestorOrganizations] = useState([]);
  const [operatorOrganizations, setOperatorOrganizations] = useState([]);
  const [requestorDepartments, setRequestorDepartments] = useState([]);
  const [operatorDepartments, setOperatorDepartments] = useState([]);

  // Set creator from localStorage on mount
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user?._id) {
      setFormData((prev) => ({ ...prev, creator: user._id }));
    }
  }, []);

  // Fetch requestors and operators when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch both types of organizations simultaneously
        const [govResponse, companyResponse] = await Promise.all([
          dispatch(
            fetchEntities({
              entityType: "organizations",
              params: {
                type: "GOVERNMENT",
                fields: "name _id",
              },
            })
          ),
          dispatch(
            fetchEntities({
              entityType: "organizations",
              params: {
                type: "COMPANY",
                fields: "name _id",
              },
            })
          ),
        ]);

        if (govResponse.payload?.data) {
          setRequestorOrganizations(govResponse.payload.data);
        }
        if (companyResponse.payload?.data) {
          setOperatorOrganizations(companyResponse.payload.data);
        }
      } catch (error) {
        setErrorMessage("Failed to fetch organizations");
      }
    };
    fetchData();
  }, [dispatch]);

  // Fetch departments when requestor/operator changes
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        if (formData.requestor) {
          const requestorResponse = await dispatch(
            fetchEntities({
              entityType: "departments",
              params: {
                organization: formData.requestor,
                minimal: true,
                fields: "name _id",
              },
            })
          );
          if (requestorResponse.payload?.data) {
            setRequestorDepartments(requestorResponse.payload.data);
          }
        }

        if (formData.operator) {
          const operatorResponse = await dispatch(
            fetchEntities({
              entityType: "departments",
              params: {
                organization: formData.operator,
                minimal: true,
                fields: "name _id",
              },
            })
          );
          if (operatorResponse.payload?.data) {
            setOperatorDepartments(operatorResponse.payload.data);
          }
        }
      } catch (error) {
        setErrorMessage("Failed to fetch departments");
      }
    };
    fetchDepartments();
  }, [formData.requestor, formData.operator, dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleDropdownChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "requestor") {
      setFormData((prev) => ({ ...prev, requestorDepartment: "" }));
      setFormErrors((prev) => ({ ...prev, requestorDepartment: "" }));
    } else if (name === "operator") {
      setFormData((prev) => ({ ...prev, operatorDepartment: "" }));
      setFormErrors((prev) => ({ ...prev, operatorDepartment: "" }));
    }
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    let errors = {};
    const requiredFields = [
      "request",
      "ticketType",
      "priority",
      "requestor",
      "operator",
    ];
    if (formData.ticketType === "SCHEDULED") {
      requiredFields.push("scheduledDate");
    }

    requiredFields.forEach((field) => {
      if (!formData[field]) {
        errors[field] =
          words["This field is required"] || "This field is required";
      }
    });

    if (formData.requestor && !formData.requestorDepartment) {
      errors.requestorDepartment =
        words["This field is required"] || "This field is required";
    }
    if (formData.operator && !formData.operatorDepartment) {
      errors.operatorDepartment =
        words["This field is required"] || "This field is required";
    }

    if (formData.ticketType === "SCHEDULED") {
      const scheduledDate = new Date(formData.scheduledDate);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      if (scheduledDate < now) {
        errors.scheduledDate =
          words["Scheduled date must be in the future"] ||
          "Scheduled date must be in the future";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    // Clean up form data before submission
    const cleanedFormData = {
      ...formData,
      request: formData.request.trim(),
      description: formData.description.trim(),
      requestorDepartment: formData.requestorDepartment?.trim() || undefined,
      operatorDepartment: formData.operatorDepartment?.trim() || undefined,
    };

    try {
      setIsLoading(true);
      setErrorMessage("");
      onSubmit(cleanedFormData);
    } catch (error) {
      setErrorMessage(error.message || "Failed to submit form");
    } finally {
      setIsLoading(false);
    }
  };

  // Requestor options
  const requestorOptions = requestorOrganizations.map((org) => ({
    value: org._id,
    label: org.name,
  }));

  // Operator options
  const operatorOptions = operatorOrganizations.map((org) => ({
    value: org._id,
    label: org.name,
  }));

  // Department options - Update to show correct departments based on selection
  const departmentOptions =
    formData.requestor && requestorDepartments.length > 0
      ? requestorDepartments.map((dept) => ({
          value: dept._id,
          label: dept.name,
        }))
      : formData.operator && operatorDepartments.length > 0
      ? operatorDepartments.map((dept) => ({
          value: dept._id,
          label: dept.name,
        }))
      : [];

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-10"
    >
      {/* Debug view - only in development */}
      {process.env.NODE_ENV === "development" && (
        <div className="col-span-1 md:col-span-2 p-2 bg-gray-100 rounded">
          <p className="text-sm">
            <strong>Requestor Data:</strong>{" "}
            <pre className="whitespace-pre-wrap text-xs">
              {JSON.stringify(
                {
                  organizations: requestorOrganizations,
                  departments: requestorDepartments,
                  selectedOrg: formData.requestor,
                  selectedDept: formData.requestorDepartment,
                },
                null,
                2
              )}
            </pre>
            <br />
            <strong>Operator Data:</strong>{" "}
            <pre className="whitespace-pre-wrap text-xs">
              {JSON.stringify(
                {
                  organizations: operatorOrganizations,
                  departments: operatorDepartments,
                  selectedOrg: formData.operator,
                  selectedDept: formData.operatorDepartment,
                },
                null,
                2
              )}
            </pre>
            <br />
            <strong>User:</strong>{" "}
            <pre className="whitespace-pre-wrap text-xs">
              {JSON.stringify(
                JSON.parse(localStorage.getItem("user")),
                null,
                2
              )}
            </pre>
            <br />
            <strong>Form Data:</strong>{" "}
            <pre className="whitespace-pre-wrap text-xs">
              {JSON.stringify(formData, null, 2)}
            </pre>
            <br />
            <strong>Form Errors:</strong>{" "}
            <pre className="whitespace-pre-wrap text-xs">
              {JSON.stringify(formErrors, null, 2)}
            </pre>
          </p>
        </div>
      )}

      {/* Left Column: Request Type and Ticket Type */}
      <div className="space-y-4">
        <InputField
          label={words["Request Type"] || "Request Type"}
          name="request"
          placeholder={words["Enter request type"] || "Enter request type"}
          value={formData.request}
          onChange={handleChange}
          required
          className="w-full"
          error={formErrors.request}
        />

        {/* Ticket Type Radio Buttons */}
        <div>
          <label className="block text-sm font-bold mb-2 text-gray-700">
            {words["Ticket Type"] || "Ticket Type"}
            <span className="text-red-500 ml-1">*</span>
          </label>
          {/* Ticket Type Options:
              - INSTANT: For immediate processing
              - SCHEDULED: For future scheduled processing */}
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="ticketType"
                value="INSTANT" // Options: INSTANT , SCHEDULED
                checked={formData.ticketType === "INSTANT"}
                onChange={handleChange}
                className="mr-2"
                required
              />
              {words["Instant"] || "Instant"}
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="ticketType"
                value="SCHEDULED" // Options: INSTANT (immediate), SCHEDULED (future)
                checked={formData.ticketType === "SCHEDULED"}
                onChange={handleChange}
                className="mr-2"
              />
              {words["Scheduled"] || "Scheduled"}
            </label>
          </div>
          {formErrors.ticketType && (
            <p className="mt-1 text-sm text-red-600">{formErrors.ticketType}</p>
          )}
        </div>

        {/* Priority Selection */}
        <div>
          <label className="block text-sm font-bold mb-2 text-gray-700">
            {words["Priority"] || "Priority"}
            <span className="text-red-500 ml-1">*</span>
          </label>

          <div className="flex gap-4">
            {priorityOptions.map((option) => (
              <label
                key={option.value}
                className={`flex items-center cursor-pointer ${
                  formData.priority === option.value
                    ? option.color
                    : "text-gray-500"
                }`}
              >
                <input
                  type="radio"
                  name="priority"
                  value={option.value} // Options: LOW (green), MEDIUM (yellow), HIGH (red)
                  checked={formData.priority === option.value}
                  onChange={handleChange}
                  className="mr-2"
                  required
                />
                <span className="flex items-center gap-1">
                  {option.icon}
                  {option.label}
                </span>
              </label>
            ))}
          </div>
          {formErrors.priority && (
            <p className="mt-1 text-sm text-red-600">{formErrors.priority}</p>
          )}
        </div>
      </div>

      {/* Right Column: Description */}
      <div>
        <InputField
          label={words["Description"] || "Description"}
          name="description"
          placeholder={words["Enter description"] || "Enter description"}
          value={formData.description}
          onChange={handleChange}
          required={false}
          type="textarea"
          className="w-full h-full"
          error={formErrors.description}
        />
      </div>

      {/* Scheduled Date (only show if SCHEDULED type) */}
      {formData.ticketType === "SCHEDULED" && (
        <DatePicker
          label={words["Scheduled Date"] || "Scheduled Date"}
          name="scheduledDate"
          value={formData.scheduledDate}
          onChange={handleChange}
          required
          className="w-full"
          minDate={new Date()} // Can't schedule in the past
          error={formErrors.scheduledDate}
        />
      )}

      {/* Requestor and Department */}
      <Dropdown
        label={words["Requestor"] || "Requestor"}
        options={requestorOptions}
        selectedValue={formData.requestor}
        onChange={(value) => handleDropdownChange("requestor", value)}
        required
        isLoading={false}
        className="w-full"
        error={formErrors.requestor}
      />

      {formData.requestor && (
        <Dropdown
          label={words["Requestor Department"] || "Requestor Department"}
          options={departmentOptions}
          selectedValue={formData.requestorDepartment}
          onChange={(value) =>
            handleDropdownChange("requestorDepartment", value)
          }
          required
          isLoading={false}
          className="w-full"
          error={formErrors.requestorDepartment}
        />
      )}

      {/* Operator and Department */}
      <Dropdown
        label={words["Operator"] || "Operator"}
        options={operatorOptions}
        selectedValue={formData.operator}
        onChange={(value) => handleDropdownChange("operator", value)}
        required
        isLoading={false}
        className="w-full"
        error={formErrors.operator}
      />

      {formData.operator && (
        <Dropdown
          label={words["Operator Department"] || "Operator Department"}
          options={departmentOptions}
          selectedValue={formData.operatorDepartment}
          onChange={(value) =>
            handleDropdownChange("operatorDepartment", value)
          }
          required
          isLoading={false}
          className="w-full"
          error={formErrors.operatorDepartment}
        />
      )}

      {/* Error display */}
      {(errorMessage || Object.keys(formErrors).length > 0) && (
        <div className="col-span-1 md:col-span-2">
          <p className="text-red-500 text-sm">
            {errorMessage || Object.values(formErrors).find((e) => e) || ""}
          </p>
        </div>
      )}

      {/* Form actions */}
      <div className="col-span-1 md:col-span-2 flex justify-end gap-2 mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-500 hover:bg-gray-700 text-white rounded w-full sm:w-auto"
        >
          {words["Cancel"] || "Cancel"}
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded disabled:opacity-50 w-full sm:w-auto"
        >
          {isLoading
            ? words["Creating..."] || "Creating..."
            : words["Create"] || "Create"}
        </button>
      </div>
    </form>
  );
};

export default TicketForm;
