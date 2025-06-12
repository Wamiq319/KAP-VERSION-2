import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaEye, FaStickyNote, FaRegStickyNote } from "react-icons/fa";
import { fetchEntities, updateEntity } from "../../redux/slices/adminCrudSlice";
import {
  DataTable,
  Button,
  ToastNotification,
  Modal,
  Loader,
  InputField,
} from "../../components";

const ManageGovTicketsEmployeePage = () => {
  const dispatch = useDispatch();
  const { entities } = useSelector((state) => state.adminCrud);
  const user = JSON.parse(localStorage.getItem("user"));
  const words = useSelector((state) => state.lang.words);

  const [uiState, setUiState] = useState({
    showToast: false,
    toastMessage: "",
    toastType: "success",
    isLoading: false,
  });

  const [modals, setModals] = useState({
    viewProgress: { isOpen: false, ticket: null },
    viewNotes: { isOpen: false, ticket: null },
    addNote: {
      isOpen: false,
      ticket: null,
      note: "",
    },
  });

  const tableHeaders = [
    { key: "index", label: words["#"] },
    { key: "requestType", label: words["Request Type"] },
    { key: "ticketNumber", label: words["Ticket Number"] },
    { key: "location", label: words["Location"] },
    { key: "requestor", label: words["Requestor"] },
    { key: "expectedCompletionDate", label: words["Expected Completion"] },
  ];

  const progressHeaders = [
    { key: "index", label: words["#"] },
    { key: "percentage", label: words["Progress"] },
    { key: "date", label: words["Date"] },
    { key: "observation", label: words["Observation"] },
  ];

  const notesHeaders = [
    { key: "index", label: words["#"] },
    { key: "date", label: words["Date"] },
    { key: "addedBy", label: words["Added By"] },
    { key: "note", label: words["Note"] },
  ];

  const fetchData = async () => {
    try {
      setUiState((prev) => ({ ...prev, isLoading: true }));
      await dispatch(
        fetchEntities({
          endpoint: "tkt/tickets",
          params: {
            userRole: "gov_employee",
            userId: user.id ?? null,
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

  const handleAddNote = (tableRow) => {
    const ticket = entities.find((entity) => entity._id === tableRow.id);
    if (!ticket) {
      showToast("Ticket data not found", "error");
      return;
    }
    setModals((prev) => ({
      ...prev,
      addNote: {
        isOpen: true,
        ticket,
        note: "",
      },
    }));
  };

  const handleNoteSubmit = async (e) => {
    e.preventDefault();

    if (!modals.addNote.note.trim()) {
      showToast("Please enter a note", "error");
      return;
    }

    try {
      setUiState((prev) => ({ ...prev, isLoading: true }));

      const response = await dispatch(
        updateEntity({
          endpoint: "tkt/add-note",
          id: modals.addNote.ticket._id,
          data: {
            text: modals.addNote.note,
            addedBy: "Gov:" + user.name,
          },
        })
      ).unwrap();

      if (response.success) {
        showToast("Note added successfully", "success");
        fetchData();
        setModals((prev) => ({
          ...prev,
          addNote: {
            ...prev.addNote,
            isOpen: false,
            note: "",
          },
        }));
      }
    } catch (error) {
      showToast(error.message || "Failed to add note", "error");
    } finally {
      setUiState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const showToast = (message, type) => {
    setUiState((prev) => ({
      ...prev,
      toastMessage: message,
      toastType: type,
      showToast: true,
    }));
  };

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
        title={words["Progress History"]}
        size="lg"
      >
        {modals.viewProgress.ticket && (
          <div className="space-y-4">
            <DataTable
              tableHeader={progressHeaders}
              tableData={formatProgressData(
                modals.viewProgress.ticket.progress
              )}
              emptyMessage={words["No progress history available"]}
              className="shadow-sm"
              headerBgColor="bg-gray-100"
              rowsPerPage={5}
            />
            <div className="flex justify-end">
              <Button
                text={words["Close"]}
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
        title={words["Ticket Notes"]}
        size="lg"
      >
        {modals.viewNotes.ticket && (
          <div className="space-y-4">
            <DataTable
              tableHeader={notesHeaders}
              tableData={formatNotesData(modals.viewNotes.ticket.notes)}
              emptyMessage={words["No notes available"]}
              className="shadow-sm"
              headerBgColor="bg-gray-100"
              rowsPerPage={5}
            />
            <div className="flex justify-end">
              <Button
                text={words["Close"]}
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

      {/* Add Note Modal */}
      <Modal
        isOpen={modals.addNote.isOpen}
        onClose={() =>
          setModals((prev) => ({
            ...prev,
            addNote: { ...prev.addNote, isOpen: false },
          }))
        }
        title={words["Add Note"]}
      >
        {modals.addNote.ticket && (
          <form onSubmit={handleNoteSubmit} className="space-y-4">
            <InputField
              label={words["Note"]}
              type="textarea"
              name="textarea"
              rows={5}
              value={modals.addNote.note}
              onChange={(e) =>
                setModals((prev) => ({
                  ...prev,
                  addNote: {
                    ...prev.addNote,
                    note: e.target.value,
                  },
                }))
              }
              placeholder={words["Enter your note here..."]}
              required
            />

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                onClick={() =>
                  setModals((prev) => ({
                    ...prev,
                    addNote: { ...prev.addNote, isOpen: false },
                  }))
                }
                text={words["Cancel"]}
                className="bg-gray-500 hover:bg-gray-600 px-6 py-2"
              />
              <Button
                type="submit"
                text={uiState.isLoading ? words["Saving..."] : words["Save Note"]}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-2"
                disabled={uiState.isLoading}
              />
            </div>
          </form>
        )}
      </Modal>

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
          heading={words["Your Assigned Tickets"]}
          tableHeader={tableHeaders}
          tableData={formatTableData()}
          headerBgColor="bg-green-200"
          rowHoverEffect={true}
          buttons={[
            {
              text: words["View Progress"],
              icon: <FaEye className="text-blue-500" />,
              className: "bg-blue-100 hover:bg-blue-200",
              onClick: handleViewProgress,
            },
            {
              text: words["View Notes"],
              icon: <FaStickyNote className="text-green-500" />,
              className: "bg-green-100 hover:bg-green-200",
              onClick: handleViewNotes,
            },
            {
              text: words["Add Note"],
              icon: <FaRegStickyNote className="text-purple-500" />,
              className: "bg-purple-100 hover:bg-purple-200",
              onClick: handleAddNote,
            },
          ]}
        />
      )}
    </div>
  );
};

export default ManageGovTicketsEmployeePage;
