import React from "react";
import { formatDate } from "../../utils/dateUtils";
import { getStatusStyle, getPriorityStyle } from "../../utils/themeUtils.jsx";
import {
  BsClock,
  BsCalendar,
  BsCheckCircle,
  BsPerson,
  BsClipboardData,
} from "react-icons/bs";

const TicketInfo = ({ ticket, mode }) => {
  // Helper function to format status and priority for display
  const formatStatus = (status) => {
    return status
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };
  console.log("Current Ticket In Ticket View:", ticket);
  const renderKapNotes = () => {
    if (!ticket.kapNotes || ticket.kapNotes.length === 0) {
      return <div className="text-gray-500 italic">No KAP notes available</div>;
    }

    return (
      <div className="h-[300px] overflow-y-auto pr-2">
        {ticket.kapNotes.map((note, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow p-3 mb-3 border-l-4 border-blue-500"
          >
            <div className="flex justify-between items-start mb-1">
              <div>
                <span className="font-semibold text-gray-700 text-sm">
                  {note.addedBy.name || "Unknown"}
                </span>
                <span className="text-gray-500 text-xs ml-2">
                  ({note.addedBy?.role || "Unknown Role"})
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {formatDate(note.createdAt)}
              </span>
            </div>
            <div className="mb-2">
              <span className="text-xs text-gray-500">
                Target Organization: {note.targetOrg?.name || "N/A"}
              </span>
            </div>
            <p className="text-gray-700 text-sm">{note.text}</p>
          </div>
        ))}
      </div>
    );
  };

  const renderOrgNotes = () => {
    if (!ticket.orgNotes || ticket.orgNotes.length === 0) {
      return (
        <div className="text-gray-500 italic">
          No organization notes available
        </div>
      );
    }

    return (
      <div className="h-[300px] overflow-y-auto pr-2">
        {ticket.orgNotes.map((note, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow p-3 mb-3 border-l-4 border-green-500"
          >
            <div className="flex justify-between items-start mb-1">
              <div>
                <span className="font-semibold text-gray-700 text-sm">
                  {note.addedBy.name || "Unknown"}
                </span>
                <span className="text-gray-500 text-xs ml-2">
                  ({note.addedBy?.role || "Unknown Role"})
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {formatDate(note.createdAt)}
              </span>
            </div>
            <p className="text-gray-700 text-sm">{note.text}</p>
          </div>
        ))}
      </div>
    );
  };

  const renderNotes = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <BsClipboardData className="w-5 h-5 text-blue-500 mr-2" />
            Notes by KAP
          </h3>
          {renderKapNotes()}
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <BsPerson className="w-5 h-5 text-green-500 mr-2" />
            Notes by Organization
          </h3>
          {renderOrgNotes()}
        </div>
      </div>
    );
  };

  const renderProgress = () => {
    if (!ticket.progress || ticket.progress.length === 0) {
      return (
        <div className="text-gray-500 italic">
          No progress updates available
        </div>
      );
    }

    return ticket.progress.map((update, index) => (
      <div
        key={index}
        className="bg-white rounded-lg shadow p-4 mb-4 border-l-4 border-green-500"
      >
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className="font-semibold text-gray-700">
              {update.operator?.name || "Unknown"}
            </span>
            <span className="text-gray-500 text-sm ml-2">
              ({update.operator?.role || "Unknown Role"})
            </span>
          </div>
          <span className="text-sm text-gray-500">
            {formatDate(update.timestamp)}
          </span>
        </div>
        <div className="mb-2">
          <span className="text-sm font-medium text-gray-600">Progress:</span>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
            <div
              className="bg-green-600 h-2.5 rounded-full"
              style={{ width: `${update.percentage}%` }}
            ></div>
          </div>
          <span className="text-sm text-gray-500">{update.percentage}%</span>
        </div>
        {update.observation && (
          <p className="text-gray-700 mt-2">{update.observation}</p>
        )}
      </div>
    ));
  };

  const statusStyle = getStatusStyle(ticket.status);
  const priorityStyle = getPriorityStyle(ticket.priority);

  return (
    <div className="space-y-6">
      {/* Development Raw Data */}
      {import.meta.env.VITE_MODE === "development" && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">
              Development Data :: Ticket Info
            </h3>
            <button
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(ticket, null, 2));
              }}
              className="text-xs text-blue-500 hover:text-blue-600"
            >
              Copy
            </button>
          </div>
          <div className="border rounded p-2 overflow-auto max-h-52">
            <pre className="text-xs text-gray-600">
              {JSON.stringify(ticket, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Ticket Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Ticket Information */}
          <div className="bg-gray-50 p-4 rounded-lg h-full">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Ticket ID</p>
                  <p className="font-medium">{ticket.ticketNumber}</p>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    ticket.ticketType === "SCHEDULE"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {ticket.ticketType}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Status</p>
                <div className={statusStyle.style}>
                  {statusStyle.icon}
                  {ticket.status}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Priority</p>
                <div className={priorityStyle.style}>
                  {priorityStyle.icon}
                  {ticket.priority}
                </div>
              </div>
              {ticket.createdBy && (
                <div>
                  <p className="text-sm text-gray-500">Created By</p>
                  <div className="flex items-center space-x-2">
                    <BsPerson className="w-4 h-4 text-green-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {ticket.createdBy.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {ticket.createdBy.role}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Requestor Details */}
          <div className="bg-gray-50 p-4 rounded-lg h-full">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Requestor Details
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Organization</p>
                <p className="font-medium">
                  {ticket.requestor?.orgName || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Department</p>
                <p className="font-medium">
                  {ticket.requestor?.departmentName || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Operator Details */}
          <div className="bg-gray-50 p-4 rounded-lg h-full">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Operator Details
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Organization</p>
                <p className="font-medium">
                  {ticket.operator?.orgName || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Department</p>
                <p className="font-medium">
                  {ticket.operator?.departmentName || "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Timeline</h2>
        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                Progress
              </span>
              <span className="text-sm text-gray-500">70%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: "70%" }}
              ></div>
            </div>
          </div>

          {/* Timeline Events */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <BsClock className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Created</p>
                <p className="text-xs text-gray-500">
                  {formatDate(ticket.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                <BsCalendar className="w-4 h-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Started</p>
                <p className="text-xs text-gray-500">
                  {formatDate(ticket.startDate || ticket.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <BsClock className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Updated</p>
                <p className="text-xs text-gray-500">
                  {formatDate(ticket.updatedAt || ticket.createdAt)}
                </p>
              </div>
            </div>

            {ticket.completedAt && (
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <BsCheckCircle className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Completed</p>
                  <p className="text-xs text-gray-500">
                    {formatDate(ticket.completedAt)}
                  </p>
                </div>
              </div>
            )}

            {ticket.scheduledDate && (
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <BsCalendar className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Scheduled</p>
                  <p className="text-xs text-gray-500">
                    {formatDate(ticket.scheduledDate)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assignments */}
      {mode !== "KAP_EMPLOYEE" && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Assignments
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Requestor</p>
              <p className="font-medium">{ticket.requestor?.name || "N/A"}</p>
              <p className="text-sm text-gray-500">
                {ticket.requestor?.role || "Unknown Role"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Operator</p>
              <p className="font-medium">{ticket.operator?.name || "N/A"}</p>
              <p className="text-sm text-gray-500">
                {ticket.operator?.role || "Unknown Role"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Progress History */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <BsClock className="w-5 h-5 text-blue-500 mr-2" />
          Progress History
        </h2>
        {renderProgress()}
      </div>

      {/* Notes */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Notes</h2>
        {renderNotes()}
      </div>
    </div>
  );
};

export default TicketInfo;
