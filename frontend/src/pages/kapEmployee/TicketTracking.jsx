import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchEntities,
  fetchNames,
  updateEntity,
} from "../../redux/slices/adminCrudSlice";
import {
  DataTable,
  ToastNotification,
  Loader,
  Modal,
  Button,
  InputField,
  ConfirmationModal,
} from "../../components";
import { FaBell } from "react-icons/fa";

const TrackKapTicketPage = () => {
  const dispatch = useDispatch();
  const { entities } = useSelector((state) => state.adminCrud);
  const user = JSON.parse(localStorage.getItem("user"));
  const words = useSelector((state) => state.lang.words);

  const [requestors, setRequestors] = useState([]);
  const [operators, setOperators] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isFollowupModalOpen, setIsFollowupModalOpen] = useState(false);

  const [uiState, setUiState] = useState({
    showToast: false,
    toastMessage: "",
    toastType: "success",
    isLoading: false,
    isSendingReminder: false,
  });

  const [modals, setModals] = useState({
    addNoteModal: {
      isOpen: false,
      ticketId: null,
      note: "",
    },
    confirmAction: {
      isOpen: false,
      message: "",
      onConfirm: null,
    },
    reminderModal: {
      isOpen: false,
      ticketId: null,
    },
  });

  const tableHeaders = [
    { key: "index", label: words["#"] },
    { key: "ticketNumber", label: words["Ticket Number"] },
    { key: "location", label: words["Location"] },
    { key: "operator", label: words["Operator"] },
    { key: "requestor", label: words["Requestor"] },
    { key: "orderDate", label: words["Order Creation"] },
    { key: "attachment", label: words["Attachment"] },
    { key: "completionPercentage", label: words["Completion %"] },
    { key: "followup", label: words["Follow Up"] },
  ];

  const fetchData = async () => {
    try {
      setUiState((prev) => ({ ...prev, isLoading: true }));

      const requestorResponse = await dispatch(
        fetchNames({ endpoint: "gov/sector-names" })
      );
      setRequestors(requestorResponse.payload?.names || []);

      const operatorResponse = await dispatch(
        fetchNames({ endpoint: "op/company-names" })
      );
      setOperators(operatorResponse.payload?.names || []);

      await dispatch(
        fetchEntities({
          endpoint: "tkt/tickets",
          params: {
            userRole: "kap_employee",
            userId: user.company?.id ?? null,
          },
        })
      );
    } finally {
      setUiState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    fetchData();
  }, [dispatch]);

  const tableData = entities?.map((item, index) => ({
    index: index + 1,
    id: item._id,
    requestTime: item.createdAt
      ? new Date(item.createdAt).toLocaleString()
      : "",
    ticketNumber: item.ticketNumber,
    location: item.location,
    operator: item.operator ?? "N/A",
    requestor: item.requestor ?? "N/A",
    orderDate: item.createdAt
      ? new Date(item.createdAt).toLocaleDateString()
      : "",
    attachment: item.attachment ? "File Attached" : "No Attachment",
    completionPercentage: {
      percentage:
        item.progress?.length > 0
          ? Math.max(...item.progress.map((p) => p.percentage))
          : 0,
    },
    followup: {
      onClick: () => {
        setSelectedTicket(item);
        setIsFollowupModalOpen(true);
      },
    },
  }));

  const showToast = (message, type) => {
    setUiState((prev) => ({
      ...prev,
      toastMessage: message,
      toastType: type,
      showToast: true,
    }));
  };

  const showConfirmation = (message, onConfirm) => {
    setModals((prev) => ({
      ...prev,
      confirmAction: {
        isOpen: true,
        message,
        onConfirm,
      },
    }));
  };

  const handlePrint = () => {
    const printContent = document.getElementById("print-content");
    const printWindow = window.open("", "", "width=800,height=600");
    printWindow.document.write(`
      <html>
        <head>
          <title>Ticket Report - ${selectedTicket?.ticketNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
            .ticket-details { margin-bottom: 20px; }
            .detail-row { display: flex; margin-bottom: 8px; }
            .detail-label { font-weight: bold; width: 180px; }
            .progress-item { margin-bottom: 5px; }
            .notes-item { margin-bottom: 5px; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const handleThankYouLetter = async () => {
    showConfirmation(
      words["Are you sure you want to send a thank you letter?"],
      async () => {
        try {
          setUiState((prev) => ({ ...prev, isLoading: true }));

          const thankYouResponse = await dispatch(
            updateEntity({
              endpoint: "tkt/send-thank-you",
              id: selectedTicket._id,
              data: {
                sentBy: user.name,
              },
            })
          ).unwrap();

          if (!thankYouResponse.success) {
            throw new Error("Failed to send thank you letter");
          }

          const closeResponse = await dispatch(
            updateEntity({
              endpoint: "tkt/status",
              id: selectedTicket._id,
              data: {
                status: "Closed",
                closedBy: user.name,
                closedAt: new Date().toISOString(),
              },
            })
          ).unwrap();

          if (closeResponse.success) {
            showToast(
              "Thank you letter sent and ticket closed successfully",
              "success"
            );
            fetchData();
            setIsFollowupModalOpen(false);
          }
        } catch (error) {
          showToast(
            error.message || "Failed to send thank you letter",
            "error"
          );
        } finally {
          setUiState((prev) => ({ ...prev, isLoading: false }));
        }
      }
    );
  };

  const handleAddNote = () => {
    setModals((prev) => ({
      ...prev,
      addNoteModal: {
        isOpen: true,
        ticketId: selectedTicket._id,
        note: "",
      },
    }));
  };

  const handleSubmitNote = async () => {
    const { ticketId, note } = modals.addNoteModal;

    showConfirmation(
      words["Are you sure you want to add this note?"],
      async () => {
        try {
          setUiState((prev) => ({ ...prev, isLoading: true }));

          const response = await dispatch(
            updateEntity({
              endpoint: "tkt/add-note",
              id: ticketId,
              data: {
                text: note,
                addedBy: "KAP:" + user.name,
              },
            })
          ).unwrap();

          if (response.success) {
            showToast("Note added successfully", "success");
            setModals((prev) => ({
              ...prev,
              addNoteModal: {
                isOpen: false,
                ticketId: null,
                note: "",
              },
            }));
            await fetchData();
            if (selectedTicket) {
              setIsFollowupModalOpen(true);
            }
          } else {
            throw new Error(response.message || "Failed to add note");
          }
        } catch (error) {
          showToast(error.message || "Failed to add note", "error");
        } finally {
          setUiState((prev) => ({ ...prev, isLoading: false }));
        }
      }
    );
  };

  const handleCloseTicket = async () => {
    showConfirmation(
      words["Are you sure you want to close this ticket?"],
      async () => {
        try {
          setUiState((prev) => ({ ...prev, isLoading: true }));

          const response = await dispatch(
            updateEntity({
              endpoint: "tkt/status",
              id: selectedTicket._id,
              data: {
                status: "Closed",
                closedBy: user.name,
                closedAt: new Date().toISOString(),
              },
            })
          ).unwrap();

          if (response.success) {
            showToast("Ticket closed successfully", "success");
          } else {
            showToast(response.message, "error");
          }
        } catch (error) {
          showToast(error.message || "Failed to close ticket", "error");
        } finally {
          fetchData();
          setIsFollowupModalOpen(false);
          setUiState((prev) => ({ ...prev, isLoading: false }));
        }
      }
    );
  };

  const handleSendReminder = (ticket) => {
    setSelectedTicket(ticket);
    setModals((prev) => ({
      ...prev,
      reminderModal: {
        isOpen: true,
        ticketId: ticket.id,
      },
    }));
  };

  const confirmSendReminder = async () => {
    try {
      setUiState((prev) => ({ ...prev, isSendingReminder: true }));

      const response = await dispatch(
        updateEntity({
          endpoint: "tkt/send-reminder",
          id: selectedTicket._id,
          data: {
            sentBy: user.name,
          },
        })
      ).unwrap();

      if (response.success) {
        showToast("Reminder sent successfully", "success");
      } else {
        throw new Error(response.message || "Failed to send reminder");
      }
    } catch (error) {
      showToast(error.message || "Failed to send reminder", "error");
    } finally {
      setUiState((prev) => ({ ...prev, isSendingReminder: false }));
      setModals((prev) => ({
        ...prev,
        reminderModal: {
          isOpen: false,
          ticketId: null,
        },
      }));
      fetchData();
    }
  };

  return (
    <div className="p-4">
      {uiState.showToast && (
        <ToastNotification
          message={uiState.toastMessage}
          type={uiState.toastType}
          onClose={() => setUiState((prev) => ({ ...prev, showToast: false }))}
        />
      )}

      {uiState.isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader size={8} opacity={90} />
        </div>
      ) : (
        <DataTable
          heading={words["Tickets"]}
          tableHeader={tableHeaders}
          tableData={tableData}
          headerBgColor="bg-gray-200"
          rowHoverEffect={true}
          showProgressBar={true}
          buttons={[
            {
              text: "Send Reminder",
              icon: <FaBell className="text-yellow-500" />,
              className: "bg-yellow-100 hover:bg-yellow-200",
              onClick: (row) => handleSendReminder(row),
            },
          ]}
        />
      )}

      <ConfirmationModal
        isOpen={modals.reminderModal.isOpen}
        onClose={() =>
          setModals((prev) => ({
            ...prev,
            reminderModal: {
              isOpen: false,
              ticketId: null,
            },
          }))
        }
        onConfirm={confirmSendReminder}
        title="Send Reminder"
        message={`Are you sure you want to send a reminder for ticket #${selectedTicket?.ticketNumber}?`}
        confirmText={uiState.isSendingReminder ? "Sending..." : "Send Reminder"}
        confirmButtonClass="bg-yellow-500 hover:bg-yellow-600"
        icon={<FaBell className="text-yellow-500 mr-2" />}
      />

      <Modal
        isOpen={isFollowupModalOpen}
        onClose={() => setIsFollowupModalOpen(false)}
        title={`${words["Ticket Details"]} - ${
          selectedTicket?.ticketNumber || ""
        }`}
        size="md"
      >
        {selectedTicket && (
          <div>
            <div id="print-content" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="detail-row">
                  <span className="detail-label">
                    {words["Request Type"] + ":"}
                  </span>
                  <span>{selectedTicket.requestType}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">
                    {words["Location"] + ":"}
                  </span>
                  <span>{selectedTicket.location}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">
                    {words["Operator"] + ":"}
                  </span>
                  <span>{selectedTicket.operator}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">
                    {words["Requestor"] + ":"}
                  </span>
                  <span>{selectedTicket.requestor}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">
                    {words["Ticket Number"] + ":"}
                  </span>
                  <span>{selectedTicket.ticketNumber}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">
                    {words["Created At"] + ":"}
                  </span>
                  <span>
                    {new Date(selectedTicket.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">
                    {words["Expected Completion"] + ":"}
                  </span>
                  <span>
                    {selectedTicket.expectedCompletionDate
                      ? new Date(
                          selectedTicket.expectedCompletionDate
                        ).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">{words["Status"] + ":"}</span>
                  <span>{selectedTicket.status}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">
                    {words["TicketBuilder"] + ":"}
                  </span>
                  <span>{selectedTicket.ticketBuilder}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">
                    {words["TicketRecienpt"] + ":"}
                  </span>
                  <span>
                    {selectedTicket.ticketReciept
                      ? selectedTicket.ticketReciept
                      : "N/A"}
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="font-semibold text-lg mb-3 text-gray-700 border-b pb-2">
                  {words["Progress History"]}
                </h3>
                {selectedTicket.progress?.length > 0 ? (
                  <div className="space-y-2">
                    {selectedTicket.progress.map((item, index) => (
                      <div
                        key={index}
                        className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm"
                      >
                        <div className="flex justify-between items-start">
                          <p className="font-medium">
                            {item.percentage}% - {item.observation}
                          </p>
                          <span className=" text-xs text-gray-500">
                            {" "}
                            {new Date(item.date).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>{words["No progress updates yet"]}</p>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-700">Notes</h3>
                </div>
                {selectedTicket.notes?.length > 0 ? (
                  <div className="space-y-4">
                    {[...selectedTicket.notes]
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map((note, index) => (
                        <div
                          key={index}
                          className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm"
                        >
                          <p className="text-gray-800">{note.text}</p>
                          <div className="flex justify-between mt-2 text-xs text-gray-500">
                            <span>Added by: {note.addedBy}</span>
                            <span>{new Date(note.date).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">
                    {words["No notes available"]}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-4 justify-between mt-6 print-hidden">
              <Button
                text={words["Thank You"]}
                className={`flex-1 min-w-[150px] ${
                  selectedTicket.status !== "Closed"
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
                onClick={
                  selectedTicket.status !== "Closed"
                    ? undefined
                    : handleThankYouLetter
                }
              />
              <Button
                text={words["Add Note"]}
                className="bg-gray-600 hover:bg-gray-700 flex-1 min-w-[150px]"
                onClick={handleAddNote}
              />
              <Button
                text={words["Print Report"]}
                className="bg-purple-600 hover:bg-purple-700 flex-1 min-w-[150px]"
                onClick={handlePrint}
              />

              <Button
                text={words["Close Ticket"]}
                className={`flex-1 min-w-[150px] ${
                  selectedTicket.status === "Closed"
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700"
                }`}
                onClick={
                  selectedTicket.status === "Closed"
                    ? undefined
                    : handleCloseTicket
                }
              />
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={modals.addNoteModal?.isOpen || false}
        onClose={() =>
          setModals((prev) => ({
            ...prev,
            addNoteModal: {
              isOpen: false,
              ticketId: null,
              note: "",
            },
          }))
        }
        title={words["Add Note"]}
      >
        <div className="space-y-4">
          <InputField
            label={words["Note"]}
            type="textarea"
            name="textarea"
            rows={4}
            value={modals.addNoteModal?.note || ""}
            onChange={(e) =>
              setModals((prev) => ({
                ...prev,
                addNoteModal: {
                  ...prev.addNoteModal,
                  note: e.target.value,
                },
              }))
            }
            placeholder={words["Enter your note..."]}
          />
          <div className="flex justify-end gap-2">
            <Button
              text={words["Cancel"]}
              type="button"
              onClick={() =>
                setModals((prev) => ({
                  ...prev,
                  addNoteModal: {
                    isOpen: false,
                    ticketId: null,
                    note: "",
                  },
                }))
              }
              className="bg-gray-500 hover:bg-gray-700"
            />
            <Button
              text={words["Add Note"]}
              type="button"
              onClick={handleSubmitNote}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={uiState.isLoading || !modals.addNoteModal?.note.trim()}
            />
          </div>
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={modals.confirmAction.isOpen}
        onClose={() =>
          setModals((prev) => ({
            ...prev,
            confirmAction: {
              ...prev.confirmAction,
              isOpen: false,
            },
          }))
        }
        onConfirm={() => {
          modals.confirmAction.onConfirm();
          setModals((prev) => ({
            ...prev,
            confirmAction: {
              ...prev.confirmAction,
              isOpen: false,
            },
          }));
        }}
        title="Confirm Action"
        message={modals.confirmAction.message}
      />
    </div>
  );
};

export default TrackKapTicketPage;
