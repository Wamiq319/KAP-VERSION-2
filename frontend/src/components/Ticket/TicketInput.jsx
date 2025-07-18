import React, { useState, useEffect, useRef } from "react";
import { Button, InputField, Dropdown, ImageInput } from "../FormComponents";
import { useSelector } from "react-redux";

const API_URL = import.meta.env.VITE_API_URL;

const TicketInput = ({
  type, // 'NOTE' , 'PROGRESS' , 'TRANSFER' , 'TRANSFER_REQUEST', 'ACCEPT', 'DECLINE'
  Role, // 'KAP', 'MANAGER', 'EMPLOYEE'
  onClose,
  onSubmit,
  ticket,
  transferOptions,
}) => {
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user._id;
  const orgId = user.organization?._id;
  const { words } = useSelector((state) => state.language);

  const progressOptions = [
    { value: 20, label: "20%" },
    { value: 40, label: "40%" },
    { value: 60, label: "60%" },
    { value: 80, label: "80%" },
    { value: 100, label: "100%" },
  ];

  // State for department dropdown (empty initially)
  const [departmentOptions, setDepartmentOptions] = useState([]);

  // State for employee dropdown (dynamic)
  const employeeOptions = transferOptions || [];

  const mappedEmployeeOptions = employeeOptions.map((emp) => ({
    value: emp._id,
    label: emp.name,
  }));

  const [inputData, setInputData] = useState({
    addedBy: userId,
    text: "",
    targetOrg: Role === "KAP" ? "" : "operator",
    percentage: type === "PROGRESS" && Role !== "KAP" ? 0 : null,
    observation: type === "PROGRESS" && Role !== "KAP" ? "" : null,
    transferTarget: "",
    department: "",
    employee: "",
    reason: "",
    acceptNote: "", // Add this for accept
  });

  // Add state for progress image
  const [progressImage, setProgressImage] = useState(null);

  // Fetch departments when Role is MANAGER and type is TRANSFER_REQUEST
  useEffect(() => {
    const fetchDepartments = async () => {
      if (Role === "MANAGER" && type === "TRANSFER_REQUEST" && orgId) {
        try {
          // Replace with your actual API endpoint
          const res = await fetch(`/api/organization/${orgId}/departments`);
          const data = await res.json();
          if (Array.isArray(data.departments)) {
            // Filter out the department that the current manager belongs to
            const currentUserDeptId = user.department?._id;
            const filteredDepartments = data.departments.filter(
              (dept) => dept._id !== currentUserDeptId
            );

            setDepartmentOptions(
              filteredDepartments.map((dept) => ({
                value: dept._id,
                label: dept.name,
              }))
            );
          }
        } catch (err) {
          setDepartmentOptions([]);
        }
      }
    };
    fetchDepartments();
  }, [Role, type, orgId]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Update validation to check for 20-100 range
    if (type === "PROGRESS") {
      if (inputData.percentage < 20 || inputData.percentage > 100) {
        alert(words["Progress percentage must be between 20% and 100%"]);
        return;
      }
    }

    const dataToSend = {
      ...inputData,
      type,
    };

    // If progress, add image if present
    if (type === "PROGRESS" && progressImage) {
      dataToSend.image = progressImage;
    }

    if (type === "NOTE" || (type === "PROGRESS" && Role === "KAP")) {
      delete dataToSend.percentage;
      delete dataToSend.observation;
    }

    // For OPEN_TRANSFER_REQUEST, ensure we send the correct field names
    if (type === "OPEN_TRANSFER_REQUEST") {
      // Keep only the fields we need
      const transferData = {
        to: inputData.department || inputData.employee,
        reason: inputData.reason,
      };
      onSubmit(transferData);
      return;
    }

    // For ACCEPT, send the accept note (optional)
    if (type === "ACCEPT") {
      const acceptData = {
        acceptNote: inputData.acceptNote || "",
      };
      onSubmit(acceptData);
      return;
    }

    // For DECLINE, send empty object (no reason needed)
    if (type === "DECLINE") {
      const declineData = {};
      onSubmit(declineData);
      return;
    }

    onSubmit(dataToSend);
  };

  return (
    <>
      {/* Debug view - only in development */}
      {import.meta.env.VITE_MODE === "development" && (
        <div className="p-2 bg-gray-100 rounded mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">
              {words["Development Data :: Ticket Input"]}
            </h3>
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  JSON.stringify(inputData, null, 2)
                );
              }}
              className="text-xs text-blue-500 hover:text-blue-600"
            >
              {words["Copy"]}
            </button>
          </div>
          <div className="space-y-2">
            <div>
              <strong>Type:</strong> <span className="text-xs">{type}</span>
            </div>
            <div>
              <strong>Role:</strong> <span className="text-xs">{Role}</span>
            </div>
            <div>
              <strong>Transfer Options (employeeOptions):</strong>
              <pre className="whitespace-pre-wrap text-xs">
                {JSON.stringify(employeeOptions, null, 2)}
              </pre>
            </div>
            <div>
              <strong>Input Data:</strong>
              <pre className="whitespace-pre-wrap text-xs">
                {JSON.stringify(inputData, null, 2)}
              </pre>
            </div>
            <div>
              <strong>User:</strong>
              <pre className="whitespace-pre-wrap text-xs">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* NOTE */}
        {type === "NOTE" && (
          <>
            <InputField
              label={words["Note Text"]}
              value={inputData.text}
              onChange={(e) =>
                setInputData((prev) => ({ ...prev, text: e.target.value }))
              }
              type="textarea"
              rows={4}
              required={true}
            />
            {Role === "KAP" && (
              <Dropdown
                label={words["Target Organization"]}
                options={[
                  {
                    value: "requestor",
                    label: words["Requestor Organization"],
                  },
                  { value: "operator", label: words["Operator Organization"] },
                ]}
                selectedValue={inputData.targetOrg}
                onChange={(value) =>
                  setInputData((prev) => ({
                    ...prev,
                    targetOrg: value,
                  }))
                }
                required={true}
              />
            )}
          </>
        )}

        {/* PROGRESS */}
        {type === "PROGRESS" && (
          <>
            <Dropdown
              label={words["Progress Percentage"]}
              options={progressOptions}
              selectedValue={inputData.percentage}
              onChange={(value) =>
                setInputData((prev) => ({
                  ...prev,
                  percentage: value,
                }))
              }
              required={true}
            />
            <InputField
              label={words["Observation"]}
              value={inputData.observation}
              onChange={(e) =>
                setInputData((prev) => ({
                  ...prev,
                  observation: e.target.value,
                }))
              }
              type="textarea"
              rows={3}
              required={true}
            />
            {/* Optional image upload for progress */}
            <ImageInput
              label={words["Progress Image (optional)"]}
              onChange={setProgressImage}
              className="mt-2"
              required={false}
            />
          </>
        )}

        {/* TRANSFER */}
        {type === "TRANSFER" && Role === "MANAGER" && (
          <Dropdown
            label={words["Select Employee to Transfer"]}
            options={mappedEmployeeOptions}
            selectedValue={inputData.transferTarget}
            onChange={(value) =>
              setInputData((prev) => ({
                ...prev,
                transferTarget: value,
              }))
            }
            required={true}
          />
        )}
        {type === "TRANSFER" && Role !== "MANAGER" && (
          <Dropdown
            label={words["Select Transfer Target"]}
            options={[
              { value: "target1", label: words["Target 1"] },
              { value: "target2", label: words["Target 2"] },
            ]}
            selectedValue={inputData.transferTarget}
            onChange={(value) =>
              setInputData((prev) => ({
                ...prev,
                transferTarget: value,
              }))
            }
            required={true}
          />
        )}

        {/* OPEN_TRANSFER_REQUEST */}
        {type === "OPEN_TRANSFER_REQUEST" && (
          <>
            {Role === "MANAGER" && (
              <Dropdown
                label={words["Select Department for Transfer Request"]}
                options={transferOptions.map((dept) => ({
                  value: dept._id,
                  label: dept.name,
                }))}
                selectedValue={inputData.department}
                onChange={(value) =>
                  setInputData((prev) => ({
                    ...prev,
                    department: value,
                  }))
                }
                required={true}
              />
            )}
            {Role === "EMPLOYEE" && (
              <Dropdown
                label={words["Select Employee for Transfer Request"]}
                options={transferOptions.map((emp) => ({
                  value: emp._id,
                  label: emp.name,
                }))}
                selectedValue={inputData.employee}
                onChange={(value) =>
                  setInputData((prev) => ({
                    ...prev,
                    employee: value,
                  }))
                }
                required={true}
              />
            )}
            <InputField
              label={words["Reason for Transfer Request"]}
              value={inputData.reason}
              onChange={(e) =>
                setInputData((prev) => ({
                  ...prev,
                  reason: e.target.value,
                }))
              }
              type="textarea"
              rows={3}
              required={true}
            />
          </>
        )}

        {/* ACCEPT */}
        {type === "ACCEPT" && (
          <InputField
            label={words["Accept Note (Optional)"]}
            value={inputData.acceptNote}
            onChange={(e) =>
              setInputData((prev) => ({
                ...prev,
                acceptNote: e.target.value,
              }))
            }
            type="textarea"
            rows={3}
            required={false}
            placeholder={
              words["Optional note for accepting this transfer request..."]
            }
          />
        )}

        {/* DECLINE - No input needed, just confirmation */}
        {type === "DECLINE" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  {words["Confirm Decline"]}
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    {
                      words[
                        "Are you sure you want to decline this transfer request? This action cannot be undone."
                      ]
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <Button
            text={words["Cancel"]}
            onClick={onClose}
            className="bg-gray-500 hover:bg-gray-600 text-white"
          />
          <Button
            text={
              type === "NOTE"
                ? words["Add Note"]
                : type === "PROGRESS"
                ? words["Update Progress"]
                : type === "TRANSFER"
                ? words["Transfer"]
                : type === "OPEN_TRANSFER_REQUEST"
                ? words["Request Transfer"]
                : type === "ACCEPT"
                ? words["Accept Request"]
                : type === "DECLINE"
                ? words["Decline Request"]
                : words["Submit"]
            }
            type="submit"
            className={
              type === "DECLINE"
                ? "bg-red-500 hover:bg-red-600 text-white"
                : type === "ACCEPT"
                ? "bg-green-500 hover:bg-green-600 text-white"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }
          />
        </div>
      </form>
    </>
  );
};

export default TicketInput;
