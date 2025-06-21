import React, { useState, useEffect } from "react";
import { Button, InputField, Dropdown } from "../FormComponents";

const TicketInput = ({
  type, // 'NOTE' , 'PROGRESS' , 'TRANSFER' , 'TRANSFER_REQUEST'
  Role, // 'KAP', 'MANAGER', 'EMPLOYEE'
  onClose,
  onSubmit,
}) => {
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user._id;
  const orgId = user.organization?._id; // Adjust as per your user object structure

  const progressOptions = [
    { value: 20, label: "20%" },
    { value: 40, label: "40%" },
    { value: 60, label: "60%" },
    { value: 80, label: "80%" },
    { value: 100, label: "100%" },
  ];

  // State for department dropdown (empty initially)
  const [departmentOptions, setDepartmentOptions] = useState([]);

  // Placeholder data for employees
  const employeeOptions = [
    { value: "emp1", label: "Employee 1" },
    { value: "emp2", label: "Employee 2" },
  ];

  const [inputData, setInputData] = useState({
    addedBy: userId,
    text: "",

    targetOrg:
      Role === "KAP"
        ? ""
        : Role === "MANAGER" || Role === "EMPLOYEE"
        ? "requestor"
        : "operator",

    percentage: type === "PROGRESS" && Role !== "KAP" ? 0 : null,

    observation: type === "PROGRESS" && Role !== "KAP" ? "" : null,

    transferTarget: "",

    department: "",

    employee: "",
  });

  // Fetch departments when Role is MANAGER and type is TRANSFER_REQUEST
  useEffect(() => {
    const fetchDepartments = async () => {
      if (Role === "MANAGER" && type === "TRANSFER_REQUEST" && orgId) {
        try {
          // Replace with your actual API endpoint
          const res = await fetch(`/api/organization/${orgId}/departments`);
          const data = await res.json();
          if (Array.isArray(data.departments)) {
            setDepartmentOptions(
              data.departments.map((dept) => ({
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
        alert("Progress percentage must be between 20% and 100%");
        return;
      }
    }

    const dataToSend = {
      ...inputData,
      type,
    };

    if (type === "NOTE" || (type === "PROGRESS" && Role === "KAP")) {
      delete dataToSend.percentage;
      delete dataToSend.observation;
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
              Development Data :: Ticket Input
            </h3>
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  JSON.stringify(inputData, null, 2)
                );
              }}
              className="text-xs text-blue-500 hover:text-blue-600"
            >
              Copy
            </button>
          </div>
          <div className="space-y-2">
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
              label="Note Text"
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
                label="Target Organization"
                options={[
                  { value: "requestor", label: "Requestor Organization" },
                  { value: "operator", label: "Operator Organization" },
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
              label="Progress Percentage"
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
              label="Observation"
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
          </>
        )}

        {/* TRANSFER */}
        {type === "TRANSFER" && (
          <Dropdown
            label="Select Transfer Target"
            options={[
              { value: "target1", label: "Target 1" },
              { value: "target2", label: "Target 2" },
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

        {/* TRANSFER_REQUEST */}
        {type === "TRANSFER_REQUEST" && (
          <>
            {Role === "MANAGER" && (
              <Dropdown
                label="Select Department"
                options={departmentOptions}
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
                label="Select Employee"
                options={employeeOptions}
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
          </>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <Button
            text="Cancel"
            onClick={onClose}
            className="bg-gray-500 hover:bg-gray-600 text-white"
          />
          <Button
            text={
              type === "NOTE"
                ? "Add Note"
                : type === "PROGRESS"
                ? "Update Progress"
                : type === "TRANSFER"
                ? "Transfer"
                : "Request Transfer"
            }
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white"
          />
        </div>
      </form>
    </>
  );
};

export default TicketInput;
