import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaEye, FaEdit, FaStickyNote, FaExchangeAlt } from "react-icons/fa";
import { fetchEntities, updateEntity } from "../../redux/slices/adminCrudSlice";
import { getUsers } from "../../redux/slices/authSlice";
import {
  DataTable,
  Button,
  ToastNotification,
  Modal,
  Loader,
  InputField,
  Dropdown,
  ConfirmationModal,
} from "../../components";

const ManageTicketsEmployeePage = () => {
  const dispatch = useDispatch();
  const { entities } = useSelector((state) => state.adminCrud);
  const { users } = useSelector((state) => state.auth);
  const user = JSON.parse(localStorage.getItem("user"));

  const [uiState, setUiState] = useState({
    showToast: false,
    toastMessage: "",
    toastType: "success",
    isLoading: false,
  });

  const [modals, setModals] = useState({
    viewProgress: { isOpen: false, ticket: null },
    viewNotes: { isOpen: false, ticket: null },
    updateProgress: {
      isOpen: false,
      ticket: null,
      percentage: 0,
      observation: "",
    },
    transferRequest: {
      isOpen: false,
      ticketId: null,
    },
  });

  const [confirmAction, setConfirmAction] = useState({
    isOpen: false,
    message: "",
    onConfirm: null,
    data: null,
  });

  const tableHeaders = [
    { key: "index", label: "#" },
    { key: "requestType", label: "Request Type" },
    { key: "ticketNumber", label: "Ticket Number" },
    { key: "location", label: "Location" },
    { key: "requestor", label: "Requestor" },
    { key: "expectedCompletionDate", label: "Expected Completion" },
  ];

  const progressHeaders = [
    { key: "index", label: "#" },
    { key: "date", label: "Date" },
    { key: "percentage", label: "Progress" },
    { key: "addedBy", label: "Added By" },
    { key: "observation", label: "Observation" },
  ];

  const notesHeaders = [
    { key: "index", label: "#" },
    { key: "date", label: "Date" },
    { key: "addedBy", label: "Added By" },
    { key: "note", label: "Note" },
  ];

  const percentageOptions = [
    { value: "20", label: "20%" },
    { value: "40", label: "40%" },
    { value: "60", label: "60%" },
    { value: "80", label: "80%" },
    { value: "100", label: "100%" },
  ];

  const fetchData = async () => {
    try {
      setUiState((prev) => ({ ...prev, isLoading: true }));
      await dispatch(
        fetchEntities({
          endpoint: "tkt/tickets",
          params: {
            userRole: "op_employee",
            userId: user.id ?? null,
          },
        })
      );
    } finally {
      setUiState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const fetchEmployees = async () => {
    try {
      console.log(user);
      await dispatch(
        getUsers({
          resource: "employee",
          endpoint: "get-employees",
          queryParams: {
            role: "op_employee",
            entityId: user.entity?.id,
          },
        })
      );
    } catch (error) {
      showToast("Failed to load employees", "error");
    }
  };

  useEffect(() => {
    fetchData();
    fetchEmployees();
  }, [dispatch]);

  const formatTableData = () => {
    return entities?.map((item, index) => ({
      index: index + 1,
      id: item._id,
      requestType: item.requestType,
      ticketNumber: item.ticketNumber,
      location: item.location,
      requestor: item.requestor,
      expectedCompletionDate: item.expectedCompletionDate
        ? new Date(item.expectedCompletionDate).toLocaleDateString()
        : "",
    }));
  };

  const formatProgressData = (progress) => {
    if (!progress || !Array.isArray(progress)) return [];

    const sortedProgress = [...progress].sort((a, b) => {
      const dateA = new Date(a.date || Date.now());
      const dateB = new Date(b.date || Date.now());
      return dateB - dateA;
    });

    return sortedProgress.map((item, index) => ({
      index: index + 1,
      percentage: `${item.percentage}%`,
      date: item.date ? new Date(item.date).toLocaleString() : "Unknown date",
      observation: item.observation || "-",
      addedBy: item.addedBy,
    }));
  };

  const formatNotesData = (notes) => {
    if (!notes || !Array.isArray(notes)) return [];

    const sortedNotes = [...notes].sort((a, b) => {
      const dateA = new Date(a.date || Date.now());
      const dateB = new Date(b.date || Date.now());
      return dateB - dateA;
    });

    return sortedNotes.map((item, index) => ({
      index: index + 1,
      date: item.date ? new Date(item.date).toLocaleString() : "Unknown date",
      addedBy: item.addedBy || "Unknown",
      note: item.text || "-",
    }));
  };

  const handleViewProgress = (tableRow) => {
    const ticket = entities.find((entity) => entity._id === tableRow.id);
    if (!ticket) {
      showToast("Ticket data not found", "error");
      return;
    }
    setModals((prev) => ({
      ...prev,
      viewProgress: {
        isOpen: true,
        ticket,
      },
    }));
  };

  const handleViewNotes = (tableRow) => {
    const ticket = entities.find((entity) => entity._id === tableRow.id);
    if (!ticket) {
      showToast("Ticket data not found", "error");
      return;
    }
    setModals((prev) => ({
      ...prev,
      viewNotes: {
        isOpen: true,
        ticket,
      },
    }));
  };

  const handleUpdateProgress = (tableRow) => {
    const ticket = entities.find((entity) => entity._id === tableRow.id);
    if (!ticket) {
      showToast("Ticket data not found", "error");
      return;
    }
    if (ticket.status === "Completed") {
      showToast("Cannot Add progress for Completed Ticket", "error");
      return;
    }
    setModals((prev) => ({
      ...prev,
      updateProgress: {
        isOpen: true,
        ticket,
        percentage: ticket.progress?.slice(-1)[0]?.percentage || "20",
        observation: "",
      },
    }));
  };

  const handleTransferRequest = (ticket) => {
    const fullTicket = entities.find((e) => e._id === ticket.id);
    if (fullTicket.status === "Completed") {
      showToast("Cannot Transfer Completed Ticket", "error");
      return;
    }
    setModals((prev) => ({
      ...prev,
      transferRequest: {
        isOpen: true,
        ticketId: ticket.id,
        employeeId: "",
        currentAssignee: fullTicket.assignedTo,
      },
    }));
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();

    if (!modals.transferRequest.employeeId) {
      showToast("Please select an employee", "error");
      return;
    }

    const selectedEmployee = employeeOptions.find(
      (emp) => emp.value === modals.transferRequest.employeeId
    );

    showConfirmation(
      "Are you sure you want to request this transfer?",
      async () => {
        try {
          setUiState((prev) => ({ ...prev, isLoading: true }));
          const response = await dispatch(
            updateEntity({
              endpoint: "tkt/transfer-request",
              id: modals.transferRequest.ticketId,
              data: {
                transferType: "op",
                message: `${user.name} wants to transfer ticket to ${selectedEmployee?.label}`,
              },
            })
          ).unwrap();

          if (response.success) {
            showToast("Transfer request submitted successfully", "success");
            fetchData();
            setModals((prev) => ({
              ...prev,
              transferRequest: {
                isOpen: false,
                ticketId: null,
                employeeId: "",
                currentAssignee: null,
              },
            }));
          }
        } catch (error) {
          showToast(error.message || "Transfer request failed", "error");
        } finally {
          setUiState((prev) => ({ ...prev, isLoading: false }));
        }
      }
    );
  };

  const handleProgressSubmit = async (e) => {
    e.preventDefault();
    showConfirmation(
      "Are you sure you want to add this progress update?",
      async () => {
        try {
          setUiState((prev) => ({ ...prev, isLoading: true }));

          const response = await dispatch(
            updateEntity({
              endpoint: "tkt/progress",
              id: modals.updateProgress.ticket._id,
              data: {
                percentage: Number(modals.updateProgress.percentage),
                observation: modals.updateProgress.observation,
              },
            })
          ).unwrap();

          if (response.success) {
            showToast("Progress updated successfully", "success");
            fetchData();
            setModals((prev) => ({
              ...prev,
              updateProgress: {
                ...prev.updateProgress,
                isOpen: false,
                percentage: "20",
                observation: "",
              },
            }));
          }
        } catch (error) {
          showToast(error.message || "Failed to update progress", "error");
        } finally {
          setUiState((prev) => ({ ...prev, isLoading: false }));
        }
      }
    );
  };

  const handleMarkComplete = async () => {
    showConfirmation(
      "Are you sure you want to mark this ticket as complete?",
      async () => {
        try {
          setUiState((prev) => ({ ...prev, isLoading: true }));

          await dispatch(
            updateEntity({
              endpoint: "tkt/status",
              id: modals.updateProgress.ticket._id,
              data: { status: "Completed", acceptedBy: null },
            })
          ).unwrap();

          showToast("Ticket marked as complete", "success");
          fetchData();
          setModals((prev) => ({
            ...prev,
            updateProgress: {
              ...prev.updateProgress,
              isOpen: false,
              percentage: "20",
              observation: "",
            },
          }));
        } catch (error) {
          showToast(error.message || "Failed to mark as complete", "error");
        } finally {
          setUiState((prev) => ({ ...prev, isLoading: false }));
        }
      }
    );
  };

  const showToast = (message, type) => {
    setUiState((prev) => ({
      ...prev,
      toastMessage: message,
      toastType: type,
      showToast: true,
    }));
  };

  const showConfirmation = (message, onConfirm, data = null) => {
    setConfirmAction({
      isOpen: true,
      message,
      onConfirm,
      data,
    });
  };

  const employeeOptions =
    users
      ?.filter((emp) => emp.id !== user.id)
      ?.map((emp) => ({
        value: emp.id,
        label: emp.name,
      })) || [];

  return (
    <div className="p-4">
      {/* View Progress Modal */}
      <Modal
        isOpen={modals.viewProgress.isOpen}
        onClose={() =>
          setModals((prev) => ({
            ...prev,
            viewProgress: { ...prev.viewProgress, isOpen: false },
          }))
        }
        title="Progress History"
        size="lg"
      >
        {modals.viewProgress.ticket && (
          <div className="space-y-4">
            <DataTable
              tableHeader={progressHeaders}
              tableData={formatProgressData(
                modals.viewProgress.ticket.progress
              )}
              emptyMessage="No progress history available"
              className="shadow-sm"
              headerBgColor="bg-blue-100"
              rowsPerPage={5}
            />
            <div className="flex justify-end">
              <Button
                text="Close"
                onClick={() =>
                  setModals((prev) => ({
                    ...prev,
                    viewProgress: { ...prev.viewProgress, isOpen: false },
                  }))
                }
                className="bg-gray-500 hover:bg-gray-600 px-6 py-2"
              />
            </div>
          </div>
        )}
      </Modal>

      {/* View Notes Modal */}
      <Modal
        isOpen={modals.viewNotes.isOpen}
        onClose={() =>
          setModals((prev) => ({
            ...prev,
            viewNotes: { ...prev.viewNotes, isOpen: false },
          }))
        }
        title="Ticket Notes"
        size="lg"
      >
        {modals.viewNotes.ticket && (
          <div className="space-y-4">
            <DataTable
              tableHeader={notesHeaders}
              tableData={formatNotesData(modals.viewNotes.ticket.notes)}
              emptyMessage="No notes available"
              className="shadow-sm"
              headerBgColor="bg-blue-100"
              rowsPerPage={5}
            />
            <div className="flex justify-end">
              <Button
                text="Close"
                onClick={() =>
                  setModals((prev) => ({
                    ...prev,
                    viewNotes: { ...prev.viewNotes, isOpen: false },
                  }))
                }
                className="bg-gray-500 hover:bg-gray-600 px-6 py-2"
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Update Progress Modal */}
      <Modal
        isOpen={modals.updateProgress.isOpen}
        onClose={() =>
          setModals((prev) => ({
            ...prev,
            updateProgress: { ...prev.updateProgress, isOpen: false },
          }))
        }
        title="Update Progress"
      >
        {modals.updateProgress.ticket && (
          <div>
            <form onSubmit={handleProgressSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <Dropdown
                  label="Progress Percentage"
                  options={percentageOptions}
                  selectedValue={modals.updateProgress.percentage.toString()}
                  onChange={(value) =>
                    setModals((prev) => ({
                      ...prev,
                      updateProgress: {
                        ...prev.updateProgress,
                        percentage: value,
                      },
                    }))
                  }
                  required
                />
                <InputField
                  label="Observation Notes"
                  name="observation"
                  type="textarea"
                  rows={3}
                  value={modals.updateProgress.observation}
                  onChange={(e) =>
                    setModals((prev) => ({
                      ...prev,
                      updateProgress: {
                        ...prev.updateProgress,
                        observation: e.target.value,
                      },
                    }))
                  }
                  required
                />
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  onClick={() =>
                    setModals((prev) => ({
                      ...prev,
                      updateProgress: { ...prev.updateProgress, isOpen: false },
                    }))
                  }
                  text="Cancel"
                  className="bg-gray-500 hover:bg-gray-600 px-6 py-2"
                />
                <div className="space-x-2">
                  <Button
                    type="submit"
                    text={uiState.isLoading ? "Updating..." : "Update Progress"}
                    className="bg-blue-600 hover:bg-blue-700 px-6 py-2"
                    disabled={uiState.isLoading}
                  />
                </div>
              </div>
            </form>
            <Button
              type="button"
              onClick={handleMarkComplete}
              text={uiState.isLoading ? "Processing..." : "Mark Complete"}
              className="bg-green-600 hover:bg-green-700 mt-2 px-6 py-2 w-full"
              disabled={uiState.isLoading}
            />
          </div>
        )}
      </Modal>

      {/* Transfer Request Modal */}
      <Modal
        isOpen={modals.transferRequest.isOpen}
        onClose={() =>
          setModals((prev) => ({
            ...prev,
            transferRequest: {
              ...prev.transferRequest,
              isOpen: false,
            },
          }))
        }
        title="Request Ticket Transfer"
      >
        <form onSubmit={handleTransferSubmit} className="space-y-4">
          <Dropdown
            label="Transfer To"
            options={employeeOptions.filter(
              (opt) => opt.value !== modals.transferRequest.currentAssignee?._id
            )}
            selectedValue={modals.transferRequest.employeeId}
            onChange={(value) =>
              setModals((prev) => ({
                ...prev,
                transferRequest: {
                  ...prev.transferRequest,
                  employeeId: value,
                },
              }))
            }
          />

          <div className="flex justify-end gap-2">
            <Button
              text="Cancel"
              type="button"
              onClick={() =>
                setModals((prev) => ({
                  ...prev,
                  transferRequest: {
                    ...prev.transferRequest,
                    isOpen: false,
                  },
                }))
              }
              className="bg-gray-500 hover:bg-gray-700"
            />
            <Button
              text={uiState.isLoading ? "Submitting..." : "Submit Request"}
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={uiState.isLoading}
            />
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmAction.isOpen}
        onClose={() => setConfirmAction({ ...confirmAction, isOpen: false })}
        onConfirm={() => {
          confirmAction.onConfirm();
          setConfirmAction({ ...confirmAction, isOpen: false });
        }}
        title="Confirm Action"
        message={confirmAction.message}
      />

      {/* Toast Notification */}
      {uiState.showToast && (
        <ToastNotification
          message={uiState.toastMessage}
          type={uiState.toastType}
          onClose={() => setUiState((prev) => ({ ...prev, showToast: false }))}
        />
      )}

      {/* Main Tickets Table */}
      {uiState.isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader size={8} opacity={90} />
        </div>
      ) : (
        <DataTable
          heading="Your Assigned Tickets"
          tableHeader={tableHeaders}
          tableData={formatTableData()}
          headerBgColor="bg-gray-200"
          rowHoverEffect={true}
          buttons={[
            {
              text: "View Progress",
              icon: <FaEye className="text-blue-500" />,
              className: "bg-blue-100 hover:bg-blue-200",
              onClick: handleViewProgress,
            },
            {
              text: "View Notes",
              icon: <FaStickyNote className="text-purple-500" />,
              className: "bg-purple-100 hover:bg-purple-200",
              onClick: handleViewNotes,
            },
            {
              text: "Update",
              icon: <FaEdit className="text-green-500" />,
              className: "bg-green-100 hover:bg-green-200",
              onClick: handleUpdateProgress,
            },
            {
              text: "Transfer",
              icon: <FaExchangeAlt className="text-orange-500" />,
              className: "bg-orange-100 hover:bg-orange-200",
              onClick: handleTransferRequest,
            },
          ]}
        />
      )}
    </div>
  );
};

export default ManageTicketsEmployeePage;
