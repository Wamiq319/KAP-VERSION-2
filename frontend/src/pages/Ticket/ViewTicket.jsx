import React from "react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchEntities, updateEntity } from "../../redux/slices/crudSlice";
import {
  TicketActions,
  TicketInfo,
  Loader,
  Modal,
  TicketInput,
} from "../../components";
import { formatDate } from "../../utils/dateUtils";
import { useCallback } from "react";

const ViewTicket = ({ mode }) => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [currentUser, setCurrentUser] = useState(null);
  const [showInput, setShowInput] = useState(false);
  const [inputType, setInputType] = useState(null);
  const [inputTarget, setInputTarget] = useState(null);
  const [inputRole, setInputRole] = useState(null);
  const [transferOptions, setTransferOptions] = useState([]);

  const { currentTicket, status, error } = useSelector((state) => state.crud);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    setCurrentUser(user);
  }, []);

  const refreshTicket = useCallback(() => {
    if (id) {
      dispatch(
        fetchEntities({
          entityType: "tickets",
          id,
          isSingleEntity: true,
        })
      );
    }
  }, [dispatch, id]);

  useEffect(() => {
    refreshTicket();
  }, [refreshTicket]);

  // Helper to map mode to Role for TicketInput
  const getRoleFromMode = () => {
    switch (mode) {
      case "KAP_EMPLOYEE":
        return "KAP";
      case "OP_MANAGER":
      case "GOV_MANAGER":
        return "MANAGER";
      case "OP_EMPLOYEE":
      case "GOV_EMPLOYEE":
        return "EMPLOYEE";
      default:
        return currentUser?.role || "EMPLOYEE";
    }
  };

  // Action Handlers
  const handleAddNote = (noteType) => {
    setInputType("NOTE");
    setInputTarget(noteType); // "KAP_NOTE" or "ORG_NOTE"
    setInputRole(getRoleFromMode());
    setShowInput(true);
  };

  const handleAddProgress = () => {
    setInputType("PROGRESS");
    setInputRole(getRoleFromMode());
    setShowInput(true);
  };

  const handleAcceptTicket = async () => {
    try {
      await dispatch(
        updateEntity({
          entityType: "tickets",
          id: currentTicket._id,
          formData: {
            actionType: "UPDATE_STATUS",
            data: {
              newStatus: "ACCEPTED",
              assignedTo: currentUser.id,
            },
            userId: currentUser._id,
          },
        })
      );
      refreshTicket();
    } catch (error) {
      console.error("Accept ticket error:", error);
    }
  };

  const handleCloseTicket = async () => {
    try {
      await dispatch(
        updateEntity({
          entityType: "tickets",
          id: currentTicket._id,
          formData: {
            actionType: "UPDATE_STATUS",
            data: {
              newStatus: "CLOSED",
              reason: "Closed by user",
            },
            userId: currentUser.id,
          },
        })
      );
      refreshTicket();
    } catch (error) {
      console.error("Close ticket error:", error);
    }
  };

  const handleTransfer = async (transferType) => {
    let optionsForTransfer = [];

    if (transferType === "TICKET" && currentUser) {
      let departmentId = currentUser.department?._id;
      let employeeRole = null;

      if (currentUser.role === "OP_MANAGER") {
        employeeRole = "OP_EMPLOYEE";
      } else if (currentUser.role === "GOV_MANAGER") {
        employeeRole = "GOV_EMPLOYEE";
      }

      if (departmentId && employeeRole) {
        console.log("[handleTransfer] Dispatching fetchEntities for users...");
        const result = await dispatch(
          fetchEntities({
            entityType: "users",
            params: {
              role: employeeRole,
              department: departmentId,
              fields: "_id,name",
            },
          })
        );
        console.log("[handleTransfer] fetchEntities result:", result);
        optionsForTransfer = result?.payload?.data || [];
        console.log("[handleTransfer] optionsForTransfer:", optionsForTransfer);
      } else {
        console.log(
          "[handleTransfer] Skipping fetchEntities: missing departmentId or employeeRole"
        );
      }
    }
    setTransferOptions(optionsForTransfer);
    setInputType("TRANSFER");
    setInputTarget(transferType);
    setInputRole(getRoleFromMode());
    setShowInput(true);
  };

  const handleTransferRequest = async (requestType) => {
    let optionsForTransferRequest = [];

    // Check if user is a manager (OP_MANAGER or GOV_MANAGER)
    const isManager =
      currentUser.role === "OP_MANAGER" || currentUser.role === "GOV_MANAGER";

    if (isManager) {
      // For managers, fetch departments of their organization
      const orgId = currentUser.organization?._id;
      if (orgId) {
        console.log(
          "[handleTransferRequest] Dispatching fetchEntities for departments..."
        );
        const result = await dispatch(
          fetchEntities({
            entityType: "departments",
            params: {
              organization: orgId,
              minimal: true,
              fields: "name _id",
            },
          })
        );
        console.log(
          "[handleTransferRequest] fetchEntities result for departments:",
          result
        );
        optionsForTransferRequest = result?.payload?.data || [];
        console.log(
          "[handleTransferRequest] department optionsForTransferRequest:",
          optionsForTransferRequest
        );
      } else {
        console.log(
          "[handleTransferRequest] Skipping fetchEntities: missing orgId for manager"
        );
      }
    } else {
      // For employees, fetch employees in their department
      let departmentId = currentUser.department?._id;
      let employeeRole = null;

      if (currentUser.role === "OP_EMPLOYEE") {
        employeeRole = "OP_EMPLOYEE";
      } else if (currentUser.role === "GOV_EMPLOYEE") {
        employeeRole = "GOV_EMPLOYEE";
      }

      if (departmentId && employeeRole) {
        console.log(
          "[handleTransferRequest] Dispatching fetchEntities for users..."
        );
        const result = await dispatch(
          fetchEntities({
            entityType: "users",
            params: {
              role: employeeRole,
              department: departmentId,
              fields: "_id,name",
            },
          })
        );
        console.log(
          "[handleTransferRequest] fetchEntities result for users:",
          result
        );
        optionsForTransferRequest = result?.payload?.data || [];
        console.log(
          "[handleTransferRequest] employee optionsForTransferRequest:",
          optionsForTransferRequest
        );
      } else {
        console.log(
          "[handleTransferRequest] Skipping fetchEntities: missing departmentId or employeeRole"
        );
      }
    }

    setTransferOptions(optionsForTransferRequest);
    setInputType("OPEN_TRANSFER_REQUEST");
    setInputTarget(requestType);
    setInputRole(getRoleFromMode());
    setShowInput(true);
  };

  const handleSubmitInput = async (data) => {
    try {
      let payload = {
        actionType: "",
        data: {},
        userId: currentUser._id,
      };

      let useFormData = false;
      let formDataToSend = null;

      switch (inputType) {
        case "NOTE":
          payload.actionType = "ADD_NOTE";
          payload.data = {
            text: data.text,
            targetOrg: data.targetOrg,
            noteType: inputTarget,
          };
          break;

        case "PROGRESS":
          if (data.image) {
            // Use FormData if image is present
            formDataToSend = new FormData();
            formDataToSend.append("actionType", "ADD_PROGRESS");
            formDataToSend.append("userId", currentUser._id);
            formDataToSend.append("data[percentage]", data.percentage);
            formDataToSend.append("data[observation]", data.observation);
            formDataToSend.append("image", data.image);
            useFormData = true;
          } else {
            // Use JSON if no image
            payload.actionType = "ADD_PROGRESS";
            payload.data = {
              percentage: data.percentage,
              observation: data.observation,
            };
            useFormData = false;
          }
          break;

        case "TRANSFER":
          payload.actionType = "TRANSFER_TICKET";
          payload.data = {
            assignTo: data.transferTarget,
            targetOrg:
              currentUser.role === "GOV_MANAGER" ? "requestor" : "operator",
          };
          break;

        case "OPEN_TRANSFER_REQUEST":
          payload.actionType = "OPEN_TRANSFER_REQUEST";
          payload.data = {
            to: data.to,
            reason: data.reason || "Transfer request initiated",
          };
          break;

        default:
          throw new Error("Invalid action type");
      }

      // Debug logging
      console.log("Ticket ID:", currentTicket._id);
      console.log("Submitting payload:", payload);
      if (useFormData) {
        console.log("Submitting as FormData");
      }

      const response = await dispatch(
        updateEntity({
          entityType: "tickets",
          id: currentTicket._id,
          formData: useFormData ? formDataToSend : payload,
        })
      );

      // Add detailed logging
      console.log("Full response:", response);
      console.log("Response payload:", response.payload);
      console.log("Response success:", response.payload?.success);

      // If the response is successful, proceed
      if (response.payload?.success) {
        handleCloseInput();
        refreshTicket();
      } else {
        throw new Error(
          response.payload?.message || "Failed to update progress"
        );
      }
    } catch (error) {
      console.error("Action failed:", error);
      alert("Failed to update progress. Please try again.");
    }
  };

  const handleCloseInput = () => {
    setShowInput(false);
    setInputType(null);
    setInputTarget(null);
    setInputRole(null);
  };

  const handleStartWork = async () => {
    try {
      await dispatch(
        updateEntity({
          entityType: "tickets",
          id: currentTicket._id,
          formData: {
            actionType: "UPDATE_STATUS",
            data: {
              newStatus: "IN_PROGRESS",
            },
            userId: currentUser._id,
          },
        })
      );
      refreshTicket();
    } catch (error) {
      console.error("Start work error:", error);
    }
  };

  if (status === "loading") {
    return <Loader fullScreen />;
  }

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  if (!currentTicket) {
    return <div className="empty-state">Ticket not found</div>;
  }

  return (
    <div className="ticket-container">
      {/* Development Raw Data */}
      {import.meta.env.VITE_MODE === "development" && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">
              Development Data :: View Ticket
            </h3>
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  JSON.stringify(
                    {
                      ticket: currentTicket,
                      currentUser: currentUser,
                      mode: mode,
                    },
                    null,
                    2
                  )
                );
              }}
              className="text-xs text-blue-500 hover:text-blue-600"
            >
              Copy
            </button>
          </div>
          <div className="border rounded p-2 overflow-auto max-h-52">
            <pre className="text-xs text-gray-600">
              {JSON.stringify(
                {
                  ticket: currentTicket,
                  currentUser: currentUser,
                  mode: mode,
                },
                null,
                2
              )}
            </pre>
          </div>
        </div>
      )}

      <div className="ticket-header">
        <h1>Ticket Details</h1>
        <p>View and manage ticket information</p>
      </div>

      {/* Top Actions Bar */}
      <div className="mb-6">
        <TicketActions
          ticket={currentTicket}
          mode={mode}
          onAddNote={handleAddNote}
          onAddProgress={handleAddProgress}
          onAcceptTicket={handleAcceptTicket}
          onCloseTicket={handleCloseTicket}
          onTransferTicket={handleTransfer}
          onTransferRequest={handleTransferRequest}
          onPrint={() => window.print()}
          onStartWork={handleStartWork}
        />
      </div>

      {/* Main Content */}
      <div className="ticket-main-content">
        <TicketInfo
          ticket={currentTicket}
          formatDate={formatDate}
          mode={mode}
        />
      </div>

      <Modal
        isOpen={showInput}
        onClose={handleCloseInput}
        title={getModalTitle(inputType)}
        size="md"
      >
        <TicketInput
          type={inputType}
          targetType={inputTarget}
          Role={inputRole}
          ticket={currentTicket}
          onClose={handleCloseInput}
          onSubmit={handleSubmitInput}
          transferOptions={transferOptions}
        />
      </Modal>
    </div>
  );
};

// Helper function for modal titles
const getModalTitle = (type) => {
  switch (type) {
    case "NOTE":
      return "Add Note";
    case "PROGRESS":
      return "Update Progress";
    case "TRANSFER":
      return "Transfer Ticket";
    case "OPEN_TRANSFER_REQUEST":
      return "Request Transfer";
    default:
      return "";
  }
};

export default ViewTicket;
