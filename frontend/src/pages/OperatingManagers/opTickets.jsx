import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaExchangeAlt, FaCheck, FaEye } from "react-icons/fa";
import { fetchEntities, updateEntity } from "../../redux/slices/adminCrudSlice";
import { getUsers } from "../../redux/slices/authSlice";
import {
  DataTable,
  Button,
  ToastNotification,
  Modal,
  Loader,
  Dropdown,
  ConfirmationModal,
  InputField,
  DatePicker,
} from "../../components";

const ManageOpTicketsPage = () => {
  const dispatch = useDispatch();
  const { entities } = useSelector((state) => state.adminCrud);
  const { users } = useSelector((state) => state.auth);
  const user = JSON.parse(localStorage.getItem("user"));
const words = useSelector((state) => state.lang.words);

  const [uiState, setUiState] = useState({
    showToast: false,
    toastMessage: "",
    toastType: "success",
    isLoading: false,
  });

  const [modals, setModals] = useState({
    assign: {
      isOpen: false,
      ticketId: null,
      employeeId: "",
      currentAssignee: null,
      ticketStatus: null,
    },
    ticketDetails: {
      isOpen: false,
      ticket: null,
      progressPercentage: 0,
      progressObservation: "",
    },
  });

  const [confirmAction, setConfirmAction] = useState({
    isOpen: false,
    message: "",
    onConfirm: null,
    data: null,
  });

  const [expectedCompletionDate, setExpectedCompletionDate] = useState(null);

  const tableHeaders = [
    { key: "index", label: words["#"] },
    { key: "requestType", label: words["Request Type"] },
    { key: "ticketNumber", label: words["Ticket Number"] },
    { key: "location", label: words["Location"] },
    { key: "requestor", label: words["Requestor"] },
    { key: "expectedCompletionDate", label: words["Expected Completion"] },
    { key: "completionPercentage", label: words["Completion %"] },
    { key: "followup", label: words["Follow Up"] },
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
            userRole: "op_manager",
            userId: user.company?.id ?? null,
          },
        })
      );
    } finally {
      setUiState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const fetchEmployees = async () => {
    try {
      await dispatch(
        getUsers({
          resource: "employee",
          endpoint: "get-employees",
          queryParams: {
            role: "op_employee",
            entityId: user.company?.id,
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
    return entities?.map((item, index) => {
      const percentage =
        item.progress?.length > 0
          ? Math.max(...item.progress.map((p) => p.percentage))
          : 0;

      return {
        index: index + 1,
        id: item._id,
        requestType: item.requestType,
        ticketNumber: item.ticketNumber,
        location: item.location,
        requestor: item.requestor,
        expectedCompletionDate: item.expectedCompletionDate
          ? new Date(item.expectedCompletionDate).toLocaleDateString()
          : "",
        completionPercentage: {
          percentage,
          label: `${percentage}%`,
        },
        followup: {
          onClick: () => {
            setModals((prev) => ({
              ...prev,
              ticketDetails: {
                isOpen: true,
                ticket: item,
                progressPercentage: percentage,
                progressObservation: "",
              },
            }));
          },
        },
      };
    });
  };

  const handleAssign = (ticket) => {
    const fullTicket = entities.find((e) => e._id === ticket.id);

    if (fullTicket.status === "Completed") {
      showToast("Cannot assign completed ticket", "error");
      return;
    }

    setModals((prev) => ({
      ...prev,
      assign: {
        isOpen: true,
        ticketId: ticket.id,
        employeeId: fullTicket?.assignedTo?._id || "",
        currentAssignee: fullTicket?.assignedTo || null,
        ticketStatus: fullTicket.status,
        opTransferRequest: fullTicket.opTransferReq,
      },
    }));
  };

  const handleProgressSubmit = async () => {
    const { ticket, progressPercentage, progressObservation } =
      modals.ticketDetails;

    if (!progressObservation) {
      showToast("Please enter observation notes", "error");
      return;
    }

    showConfirmation(
      "Are you sure you want to update the progress?",
      async () => {
        try {
          setUiState((prev) => ({ ...prev, isLoading: true }));

          const response = await dispatch(
            updateEntity({
              endpoint: "tkt/progress",
              id: ticket._id,
              data: {
                percentage: progressPercentage,
                observation: progressObservation,
                addedBy: user.name,
              },
            })
          ).unwrap();

          if (response.success) {
            showToast("Progress updated successfully", "success");
          }
        } catch (error) {
          showToast(error.message || "Failed to update progress", "error");
        } finally {
          fetchData();
          setModals((prev) => ({
            ...prev,
            ticketDetails: {
              ...prev.ticketDetails,
              isOpen: false,
              progressObservation: "",
            },
          }));

          setUiState((prev) => ({ ...prev, isLoading: false }));
        }
      }
    );
  };

  const handleMarkComplete = async () => {
    showConfirmation(
      words["Are you sure you want to mark this ticket as complete?"],
      async () => {
        try {
          setUiState((prev) => ({ ...prev, isLoading: true }));

          const response = await dispatch(
            updateEntity({
              endpoint: "tkt/status",
              id: modals.ticketDetails.ticket._id,
              data: {
                status: "Completed",
                completedBy: user.name,
              },
            })
          ).unwrap();

          if (response.success) {
            showToast("Ticket marked as complete", "success");
            fetchData();
            setModals((prev) => ({
              ...prev,
              ticketDetails: {
                ...prev.ticketDetails,
                isOpen: false,
              },
            }));
          }
        } catch (error) {
          showToast(error.message || "Failed to mark as complete", "error");
        } finally {
          setUiState((prev) => ({ ...prev, isLoading: false }));
        }
      }
    );
  };

  const handleAcceptTicket = async () => {
    if (!expectedCompletionDate) {
      showToast("Please select expected completion date", "error");
      return;
    }

    try {
      setUiState((prev) => ({ ...prev, isLoading: true }));

      // Extract the date value from the event object
      const completionDate = expectedCompletionDate.target
        ? new Date(expectedCompletionDate.target.value)
        : expectedCompletionDate;

      const response = await dispatch(
        updateEntity({
          endpoint: "tkt/status",
          id: modals.assign.ticketId,
          data: {
            status: "In Progress",
            acceptedBy: user.name,
            expectedCompletionDate: completionDate.toISOString(),
          },
        })
      ).unwrap();

      if (response.success) {
        showToast("Ticket accepted successfully", "success");
        fetchData();
        setModals((prev) => ({
          ...prev,
          assign: {
            isOpen: false,
            ticketId: null,
            employeeId: "",
            currentAssignee: null,
            ticketStatus: null,
          },
        }));
        setExpectedCompletionDate(null);
      }
    } catch (error) {
      showToast(error.message || "Failed to accept ticket", "error");
    } finally {
      setUiState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();

    if (!modals.assign.employeeId) {
      showToast("Please select an employee", "error");
      return;
    }

    showConfirmation(
      "Are you sure you want to assign this ticket?",
      async () => {
        try {
          setUiState((prev) => ({ ...prev, isLoading: true }));
          const response = await dispatch(
            updateEntity({
              endpoint: "tkt/assign",
              id: modals.assign.ticketId,
              data: {
                assignedToId: modals.assign.employeeId,
                assigneeType: "opEmployee",
              },
            })
          ).unwrap();

          if (response.success) {
            showToast(response.message, "success");
            fetchData();
            setModals((prev) => ({
              ...prev,
              assign: {
                isOpen: false,
                ticketId: null,
                employeeId: "",
                currentAssignee: null,
                ticketStatus: null,
              },
            }));
          }
        } catch (error) {
          showToast(error.message || "Assignment failed", "error");
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

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const employeeOptions =
    users?.map((user) => ({
      value: user.id,
      label: user.name,
    })) || [];

  return (
    <div className="p-4">
      {/* Assign Modal */}
      <Modal
        isOpen={modals.assign.isOpen}
        onClose={() => {
          setModals((prev) => ({
            ...prev,
            assign: {
              isOpen: false,
              ticketId: null,
              employeeId: "",
              currentAssignee: null,
              ticketStatus: null,
            },
          }));
          setExpectedCompletionDate(null);
        }}
        title={
          modals.assign.ticketStatus === "Open"
            ? words["Accept Ticket"]
            : words["Transfer Ticket"]
        }
      >
        {modals.assign.ticketStatus === "Open" ? (
          <div className="space-y-4">
            <DatePicker
              label="Expected Completion Date"
              selected={
                expectedCompletionDate?.target?.value
                  ? new Date(expectedCompletionDate.target.value)
                  : expectedCompletionDate
              }
              onChange={(date) => setExpectedCompletionDate(date)}
              minDate={new Date()}
              required
            />
            <div className="flex justify-end gap-2">
              <Button
                text={words["Cancel"]}
                type="button"
                onClick={() => {
                  setModals((prev) => ({
                    ...prev,
                    assign: {
                      isOpen: false,
                      ticketId: null,
                      employeeId: "",
                      currentAssignee: null,
                      ticketStatus: null,
                    },
                  }));
                  setExpectedCompletionDate(null);
                }}
                className="bg-gray-500 hover:bg-gray-700"
              />
              <Button
                text={uiState.isLoading ? words["Processing..."] : words["Accept Ticket"]}
                type="button"
                onClick={handleAcceptTicket}
                className="bg-green-600 hover:bg-green-700"
                disabled={uiState.isLoading || !expectedCompletionDate}
                icon={<FaCheck className="mr-2" />}
              />
            </div>
          </div>
        ) : (
          <form onSubmit={handleAssignSubmit} className="space-y-4">
            {modals.assign?.opTransferRequest && (
              <div className="mb-4 p-3 bg-red-50 rounded border border-red-200">
                <h3 className="font-semibold text-red-700">
                  Transfer Request: {modals.assign.opTransferRequest}
                </h3>
              </div>
            )}
            {modals.assign.currentAssignee && (
              <div className="mb-4 p-3 bg-gray-100 rounded">
                <h3 className="font-semibold">
                  Currently Assigned: {modals.assign.currentAssignee}
                </h3>
              </div>
            )}

            <Dropdown
              label={
                modals.assign.currentAssignee ? words["Reassign to"] : words["Assign to"]
              }
              options={employeeOptions}
              selectedValue={modals.assign.employeeId}
              onChange={(value) =>
                setModals((prev) => ({
                  ...prev,
                  assign: { ...prev.assign, employeeId: value },
                }))
              }
            />

            <div className="flex justify-end gap-2">
              <Button
                text={words["Cancel"]}
                type="button"
                onClick={() =>
                  setModals((prev) => ({
                    ...prev,
                    assign: {
                      isOpen: false,
                      ticketId: null,
                      employeeId: "",
                      currentAssignee: null,
                      ticketStatus: null,
                    },
                  }))
                }
                className="bg-gray-500 hover:bg-gray-700"
              />
              <Button
                text={
                  uiState.isLoading ? words["Processing..."] : words["Confirm Assignment"]
                }
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={uiState.isLoading}
              />
            </div>
          </form>
        )}
      </Modal>

      {/* Ticket Details Modal with Progress Update */}
      <Modal
        isOpen={modals.ticketDetails.isOpen}
        onClose={() =>
          setModals((prev) => ({
            ...prev,
            ticketDetails: { ...prev.ticketDetails, isOpen: false },
          }))
        }
        title={`Ticket #${modals.ticketDetails.ticket?.ticketNumber || ""}`}
        size="lg"
      >
        {modals.ticketDetails.ticket && (
          <div className="space-y-6">
            {/* Ticket Summary Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-semibold text-gray-600">Request Type</p>
                <p className="text-lg font-medium">
                  {modals.ticketDetails.ticket.requestType}
                </p>
              </div>
              <div>
                <p className="font-semibold text-gray-600">Ticket Number</p>
                <p className="text-lg font-medium">
                  {modals.ticketDetails.ticket.ticketNumber}
                </p>
              </div>
              <div>
                <p className="font-semibold text-gray-600">Status</p>
                <p
                  className={`text-lg font-medium ${
                    modals.ticketDetails.ticket.status === "Completed"
                      ? "text-green-600"
                      : modals.ticketDetails.ticket.status === "Open"
                      ? "text-red-600"
                      : "text-blue-600"
                  }`}
                >
                  {modals.ticketDetails.ticket.status}
                </p>
              </div>
            </div>

            {/* Progress Update Section */}
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <h3 className="font-semibold text-lg mb-3 text-gray-700 border-b pb-2">
        {words["Update Progress"]}
              </h3>
              <div className="space-y-4">
                <Dropdown
                  label={words["Progress Percentage"]}
                  options={percentageOptions}
                  selectedValue={modals.ticketDetails.progressPercentage.toString()}
                  onChange={(value) =>
                    setModals((prev) => ({
                      ...prev,
                      ticketDetails: {
                        ...prev.ticketDetails,
                        progressPercentage: parseInt(value),
                      },
                    }))
                  }
                />

                <InputField
                  label={words["Observation Notes"]}
                  name="observation"
                  type="textarea"
                  rows={3}
                  value={modals.ticketDetails.progressObservation}
                  onChange={(e) =>
                    setModals((prev) => ({
                      ...prev,
                      ticketDetails: {
                        ...prev.ticketDetails,
                        progressObservation: e.target.value,
                      },
                    }))
                  }
                  required
                />

                <div className="space-y-4 pt-2">
                  {/* Top row with two buttons */}
                  <div className="flex justify-between gap-2">
                    <Button
                      text={uiState.isLoading ? words["Updating..."] : words["Update"]}
                      className="bg-blue-600 hover:bg-blue-700 flex-1"
                      onClick={handleProgressSubmit}
                      disabled={uiState.isLoading}
                    />
                    <Button
                      text={words["Cancel"]}
                      className="bg-gray-500 hover:bg-gray-600 flex-1"
                      onClick={() =>
                        setModals((prev) => ({
                          ...prev,
                          ticketDetails: {
                            ...prev.ticketDetails,
                            isOpen: false,
                          },
                        }))
                      }
                    />
                  </div>

                  {/* Full-width bottom button */}
                  <Button
                    type="button"
                    onClick={handleMarkComplete}
                    text={uiState.isLoading ? words["Processing..."] : words["Mark Complete"]}
                    className="bg-red-600 hover:bg-red-700 w-full py-2"
                    disabled={uiState.isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Progress History */}
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <h3 className="font-semibold text-lg mb-3 text-gray-700 border-b pb-2">
                {words["Progress History"]}
              </h3>
              {modals.ticketDetails.ticket.progress?.length > 0 ? (
                <div className="space-y-3">
                  {[...modals.ticketDetails.ticket.progress]
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((item, index) => (
                      <div
                        key={index}
                        className="border-b pb-3 last:border-b-0"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">
                              {item.percentage}% - {item.observation}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              Updated by: {item.addedBy || "System"}
                            </p>
                          </div>
                          <p className="text-sm text-gray-500">
                            {formatDate(item.date)}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">
                  No progress history available
                </p>
              )}
            </div>

            {/* Notes Section */}
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <h3 className="font-semibold text-lg mb-3 text-gray-700 border-b pb-2">
                {words["Notes"]}
              </h3>
              {modals.ticketDetails.ticket.notes?.length > 0 ? (
                <div className="space-y-3">
                  {[...modals.ticketDetails.ticket.notes]
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((note, index) => (
                      <div
                        key={index}
                        className="border-b pb-3 last:border-b-0"
                      >
                        <p className="text-gray-800">{note.text}</p>
                        <div className="flex justify-between mt-1">
                          <span className="text-sm text-gray-500">
                            <em>{note.addedBy}</em>
                          </span>
                          <span className="text-sm text-gray-500">
                            {formatDate(note.date)}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No notes available</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmAction.isOpen}
        onClose={() => setConfirmAction({ ...confirmAction, isOpen: false })}
        onConfirm={() => {
          confirmAction.onConfirm();
          setConfirmAction({ ...confirmAction, isOpen: false });
        }}
        title={words["Confirm Action"]}
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
          heading={words["Tickets Assigned to your Company"]}
          tableHeader={tableHeaders}
          tableData={formatTableData()}
          headerBgColor="bg-gray-200"
          rowHoverEffect={true}
          showProgressBar={true}
          buttons={[
            {
              text: words["Transfer"],
              icon: (row) => (
                <div className="relative">
                  <FaExchangeAlt className="text-orange-500" />
                  {row.opTransferReq && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500"></span>
                  )}
                </div>
              ),
              className: "bg-orange-100 hover:bg-orange-200 relative",
              onClick: handleAssign,
            },
          ]}
        />
      )}
    </div>
  );
};

export default ManageOpTicketsPage;
