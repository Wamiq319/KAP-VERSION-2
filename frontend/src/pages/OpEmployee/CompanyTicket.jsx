import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaEye } from "react-icons/fa";
import { fetchEntities } from "../../redux/slices/adminCrudSlice";
import { DataTable, Loader, Modal } from "../../components";

const AllOpTicketsPage = () => {
  const dispatch = useDispatch();
  const { entities } = useSelector((state) => state.adminCrud);
  const user = JSON.parse(localStorage.getItem("user"));

  const [uiState, setUiState] = useState({
    isLoading: false,
  });

  const [ticketDetails, setTicketDetails] = useState({
    isOpen: false,
    ticket: null,
  });

  const tableHeaders = [
    { key: "index", label: "#" },
    { key: "requestType", label: "Request Type" },
    { key: "ticketNumber", label: "Ticket Number" },
    { key: "location", label: "Location" },
    { key: "requestor", label: "Requestor" },
    { key: "status", label: "Status" },
    { key: "assignedTo", label: "Assigned To" },

    {
      key: "completionPercentage",
      label: "Completion %",
      showProgressBar: true,
    },

    { key: "followup", label: "Details" },
  ];

  const fetchData = async () => {
    try {
      setUiState((prev) => ({ ...prev, isLoading: true }));
      await dispatch(
        fetchEntities({
          endpoint: "tkt/tickets",
          params: {
            userRole: "op_manager",
            userId: user.entity?.id ?? null,
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

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const formatTableData = () => {
    return entities?.map((item, index) => {
      const percentage =
        item.progress?.length > 0
          ? Math.max(...item.progress.map((p) => p.percentage))
          : 0;

      return {
        index: index + 1,
        requestType: item.requestType,
        ticketNumber: item.ticketNumber,
        location: item.location,
        requestor: item.requestor,
        status: item.status,
        assignedTo: item.assignedTo || "notAssiged",

        completionPercentage: {
          percentage,
          label: `${percentage}%`,
        },

        followup: {
          onClick: () => setTicketDetails({ isOpen: true, ticket: item }),
          icon: <FaEye className="text-blue-500" />,
        },
      };
    });
  };

  return (
    <div className="p-4">
      {/* Ticket Details Modal */}
      <Modal
        isOpen={ticketDetails.isOpen}
        onClose={() => setTicketDetails({ isOpen: false, ticket: null })}
        title={`Ticket #${ticketDetails.ticket?.ticketNumber || ""}`}
        size="lg"
      >
        {ticketDetails.ticket && (
          <div className="space-y-6">
            {/* Ticket Summary Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-semibold text-gray-600">Request Type</p>
                <p className="text-lg font-medium">
                  {ticketDetails.ticket.requestType}
                </p>
              </div>

              <div>
                <p className="font-semibold text-gray-600">Status</p>
                <p
                  className={`text-lg font-medium ${
                    ticketDetails.ticket.status === "Completed"
                      ? "text-green-600"
                      : ticketDetails.ticket.status === "Open"
                      ? "text-red-600"
                      : "text-blue-600"
                  }`}
                >
                  {ticketDetails.ticket.status}
                </p>
              </div>

              <div>
                <p className="font-semibold text-gray-600">
                  Expected Completion
                </p>
                <p className="text-lg font-medium">
                  {formatDate(ticketDetails.ticket.expectedCompletionDate)}
                </p>
              </div>
            </div>

            {/* Progress History */}
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <h3 className="font-semibold text-lg mb-3 text-gray-700 border-b pb-2">
                Progress History
              </h3>
              {ticketDetails.ticket.progress?.length > 0 ? (
                <div className="space-y-3">
                  {[...ticketDetails.ticket.progress]
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
                Notes
              </h3>
              {ticketDetails.ticket.notes?.length > 0 ? (
                <div className="space-y-3">
                  {[...ticketDetails.ticket.notes]
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

      {/* Main Tickets Table */}
      {uiState.isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader size={8} opacity={90} />
        </div>
      ) : (
        <DataTable
          heading="Tickets Assigned to your Company"
          tableHeader={tableHeaders}
          tableData={formatTableData()}
          headerBgColor="bg-gray-200"
          rowHoverEffect={true}
          showProgressBar={true}
        />
      )}
    </div>
  );
};

export default AllOpTicketsPage;
