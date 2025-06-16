import React, { useState } from "react";
import { Button, InputField, Dropdown } from "../FormComponents";

const TicketInput = ({
  type, // 'NOTE' or 'PROGRESS'
  userRole,
  onClose,
  onSubmit,
}) => {
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user._id;

  const progressOptions = [
    { value: 0, label: "0%" },
    { value: 20, label: "20%" },
    { value: 40, label: "40%" },
    { value: 60, label: "60%" },
    { value: 80, label: "80%" },
    { value: 100, label: "100%" },
  ];

  const [inputData, setInputData] = useState({
    addedBy: userId,
    text: "",

    targetOrg:
      userRole === "KAP_EMPLOYEE"
        ? ""
        : userRole === "GOVERNMENT_EMPLOYEE" || userRole === "GOVE_MANAGER"
        ? "requestor"
        : "operator",

    percentage: type === "PROGRESS" && userRole !== "KAP_EMPLOYEE" ? 0 : null,

    observation: type === "PROGRESS" && userRole !== "KAP_EMPLOYEE" ? "" : null,
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    // Create a new object to send, cleaning up irrelevant fields
    const dataToSend = {
      ...inputData,
      type,
    };

    if (
      type === "NOTE" ||
      (type === "PROGRESS" && userRole === "KAP_EMPLOYEE")
    ) {
      delete dataToSend.percentage;
      delete dataToSend.observation;
    }

    onSubmit(dataToSend);
  };

  return (
    <>
      {/* Debug view - only in development */}
      {process.env.NODE_ENV === "development" && (
        <div className="p-2 bg-gray-100 rounded mb-4">
          <strong>Input Data:</strong>{" "}
          <pre className="whitespace-pre-wrap text-xs">
            {JSON.stringify(inputData)}
          </pre>
          <strong>User:</strong>{" "}
          <pre className="whitespace-pre-wrap text-xs">
            {JSON.stringify(
              typeof user === "string" ? JSON.parse(user) : user,
              null,
              2
            )}
          </pre>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {type === "PROGRESS" && userRole !== "KAP_EMPLOYEE" && (
          <>
            <div>
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
            </div>
            <div>
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
            </div>
          </>
        )}

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

            {userRole === "KAP_EMPLOYEE" && (
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

        <div className="flex justify-end gap-2 mt-6">
          <Button
            text="Cancel"
            onClick={onClose}
            className="bg-gray-500 hover:bg-gray-600 text-white"
          />
          <Button
            text={type === "NOTE" ? "Add Note" : "Update Progress"}
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white"
          />
        </div>
      </form>
    </>
  );
};

export default TicketInput;
