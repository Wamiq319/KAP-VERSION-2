import React, { useState } from "react";
import { formatDate } from "../../utils/dateUtils";
import { getStatusStyle, getPriorityStyle } from "../../utils/themeUtils.jsx";
import {
  BsClock,
  BsCalendar,
  BsCheckCircle,
  BsPerson,
  BsClipboardData,
  BsTools,
  BsBarChartSteps,
} from "react-icons/bs";
import Modal from "../Modal";

const TicketInfo = ({ ticket, mode }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState(null);

  console.log("Current Ticket In Ticket View:", ticket);

  const renderNote = (note, type) => {
    const borderColor = type === "kap" ? "border-blue-500" : "border-green-500";
    const roleColor = type === "kap" ? "text-blue-400" : "text-green-400";
    const toLabelColor = type === "kap" ? "text-blue-400" : "text-green-400";

    return (
      <div
        key={note.id || Math.random()}
        className={`bg-gray-50 rounded-lg p-3 border-l-4 ${borderColor} mb-2`}
      >
        <div>
          <span className="font-semibold text-gray-700 text-sm">
            {note.addedBy.name || "Unknown"}
          </span>
          <span className={`${roleColor} text-xs ml-2`}>
            ({note.addedBy?.role || "Unknown Role"})
          </span>
        </div>
        <div className="text-xs text-gray-500 mb-1 flex items-center gap-2">
          <span className="text-blue-600 font-medium">Date:</span>
          {formatDate(note.createdAt)}
          <span className={`${toLabelColor} font-medium ml-4`}>To:</span>
          <span className="text-gray-700">
            {note.targetOrg?.name || "OPERATOR"}
          </span>
        </div>
        <p className="text-gray-700 text-sm">{note.text}</p>
      </div>
    );
  };

  const renderKapNotes = () => {
    if (!ticket.kapNotes || ticket.kapNotes.length === 0) {
      return <div className="text-gray-500 italic">No KAP notes available</div>;
    }
    return (
      <div className="space-y-3">
        {ticket.kapNotes.map((note) => renderNote(note, "kap"))}
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
      <div className="space-y-3">
        {ticket.orgNotes.map((note) => renderNote(note, "org"))}
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
    return (
      <div className="space-y-2">
        {ticket.progress.map((update, idx) => (
          <div
            key={idx}
            className="bg-gray-50 rounded-lg border-l-4 border-green-500 relative"
          >
            {/* Date - Top Right Corner */}
            <div className="absolute top-2 right-2">
              <span className="text-xs text-gray-500">
                {formatDate(update.updatedAt)}
              </span>
            </div>

            {/* Top Section: Image on left, info on right - No padding */}
            <div className="flex items-start gap-3 p-3 pb-2 pr-16">
              {/* Progress Image - Left Side */}
              <div
                className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center cursor-pointer"
                onClick={() => {
                  setModalOpen(true);
                  setModalImageUrl(update.imageUrl || null);
                }}
              >
                {update.imageUrl ? (
                  <img
                    src={update.imageUrl}
                    alt="Progress Attachment"
                    className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded border shadow"
                  />
                ) : (
                  <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center bg-gray-100 rounded border shadow">
                    <BsBarChartSteps className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" />
                  </div>
                )}
              </div>

              {/* Info Stack - Right Side */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col space-y-0.5">
                  <span className="font-semibold text-gray-700 text-sm">
                    {update.updatedBy?.name || "Unknown"}
                  </span>
                  <span className="text-green-400 text-xs">
                    ({update.updatedBy?.role || "Unknown Role"})
                  </span>
                  <span className="text-green-700 text-xs font-bold">
                    {update.percentage}% Progress
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Section: Observation/Description - Full Width, Left Aligned */}
            {update.observation && (
              <div className="border-t border-gray-200 px-3 pb-3 pt-2">
                <div className="text-left">
                  <span className="text-gray-700 text-xs sm:text-sm leading-relaxed">
                    {update.observation}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderTransferRequests = () => {
    if (!ticket.transferRequests || ticket.transferRequests.length === 0) {
      return (
        <div className="text-gray-500 italic">
          No transfer requests available
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {ticket.transferRequests.map((request, idx) => (
          <div
            key={request.id || idx}
            className={`bg-gray-50 rounded-lg p-3 border-l-4 ${
              request.status === "PENDING"
                ? "border-yellow-500"
                : request.status === "ACCEPTED"
                ? "border-green-500"
                : "border-red-500"
            } mb-2`}
          >
            <div>
              <span className="font-semibold text-gray-700 text-sm">
                {request.type} Transfer Request
              </span>
              <span
                className={`text-xs ml-2 px-2 py-1 rounded-full ${
                  request.status === "PENDING"
                    ? "bg-yellow-100 text-yellow-800"
                    : request.status === "ACCEPTED"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {request.status}
              </span>
            </div>
            <div className="text-xs text-gray-500 mb-1">
              <span className="text-blue-600 font-medium">Date:</span>
              {formatDate(request.createdAt)}
            </div>
            <div className="text-xs text-gray-500 mb-1">
              <span className="text-green-600 font-medium">From:</span>
              <span className="text-gray-700 ml-1">{request.from.name}</span>
              <span className="text-green-600 font-medium ml-4">To:</span>
              <span className="text-gray-700 ml-1">{request.to.name}</span>
            </div>
            <p className="text-gray-700 text-sm">{request.reason}</p>
            {request.declineReason && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <span className="text-red-500 text-xs font-medium">
                  Declined:{" "}
                </span>
                <span className="text-red-700 text-xs">
                  {request.declineReason}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const statusStyle = getStatusStyle(ticket.status);
  const priorityStyle = getPriorityStyle(ticket.priority);

  return (
    <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
      {/* Main Content */}
      <div className="flex-1 space-y-4 sm:space-y-6">
        {/* Basic Information */}
        <div className="bg-gray-200 rounded-lg shadow p-3 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">
            Ticket Information
          </h2>
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
            {/* Ticket Information */}
            <div className="shadow-lg bg-white p-3 sm:p-4 rounded-lg w-full lg:w-1/3 flex flex-col">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">
                      Ticket ID
                    </p>
                    <p className="font-medium text-sm sm:text-base">
                      {ticket.ticketNumber}
                    </p>
                  </div>
                  <div
                    className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                      ticket.ticketType === "SCHEDULE"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {ticket.ticketType}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">
                      Request Type:
                    </p>
                    <p className="font-medium text-sm sm:text-base">
                      {ticket.request}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:space-x-6 space-y-2 sm:space-y-0">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Status</p>
                    <span className={statusStyle.style}>
                      {statusStyle.icon}
                      {ticket.status}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Priority</p>
                    <div className={priorityStyle.style}>
                      {priorityStyle.icon}
                      {ticket.priority}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Created By</p>
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
              </div>
            </div>

            <div className="flex flex-col gap-4 w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg flex flex-col w-full">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                    Requestor Details
                  </h3>
                  <div className="space-y-2 sm:space-y-3">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">
                        Organization
                      </p>
                      <p className="font-medium text-sm sm:text-base">
                        {ticket.requestor?.org?.name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">
                        Department
                      </p>
                      <p className="font-medium text-sm sm:text-base">
                        {ticket.requestor?.department?.name || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg flex flex-col w-full">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                    Operator Details
                  </h3>
                  <div className="space-y-2 sm:space-y-3">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">
                        Organization
                      </p>
                      <p className="font-medium text-sm sm:text-base">
                        {ticket.operator?.org?.name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">
                        Department
                      </p>
                      <p className="font-medium text-sm sm:text-base">
                        {ticket.operator?.department?.name || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg flex flex-col w-full">
                <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                  Description
                </h3>
                <div className="text-xs sm:text-sm text-gray-700 flex-1 overflow-y-auto">
                  {ticket.description || "No description provided."}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-lg shadow p-3 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">
            Timeline
          </h2>
          <div className="space-y-4 sm:space-y-6">
            {/* Progress Bar */}
            <div className="mb-4 sm:mb-6">
              <div className="flex justify-between items-center mb-1 sm:mb-2">
                <span className="text-xs sm:text-sm font-medium text-gray-700">
                  Progress
                </span>
                <span className="text-xs sm:text-sm text-gray-500">70%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: "70%" }}
                ></div>
              </div>
            </div>

            {/* Timeline Events */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
              {/* Created */}
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <BsClock className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-800">
                    Created
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(ticket.createdAt)}
                  </p>
                </div>
              </div>

              {/* Scheduled (only for SCHEDULED tickets) */}
              {ticket.ticketType === "SCHEDULED" && ticket.scheduledDate && (
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <BsCalendar className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-800">
                      Scheduled
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(ticket.scheduledDate)}
                    </p>
                  </div>
                </div>
              )}

              {/* Started */}
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                  <BsTools className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-800">
                    Started
                  </p>
                  <p className="text-xs text-gray-500">
                    {ticket.startDate
                      ? formatDate(ticket.startDate)
                      : "Not started"}
                  </p>
                </div>
              </div>

              {/* Expected Finish */}
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <BsCalendar className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-800">
                    Expected Finish
                  </p>
                  <p className="text-xs text-gray-500">
                    {ticket.finishDate
                      ? formatDate(ticket.finishDate)
                      : "Not set"}
                  </p>
                </div>
              </div>

              {/* Completed */}
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <BsCheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-800">
                    Completed
                  </p>
                  <p className="text-xs text-gray-500">
                    {ticket.endDate
                      ? formatDate(ticket.endDate)
                      : "Not completed"}
                  </p>
                </div>
              </div>

              {/* Last Updated */}
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <BsClock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-800">
                    Last Updated
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(ticket.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress History and Transfer Requests - Responsive Layout */}
        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:h-[420px]">
          {/* Progress History */}
          <div className="bg-white rounded-lg shadow p-3 sm:p-6 flex flex-col">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
              <BsClock className="w-5 h-5 text-blue-500 mr-2" />
              Progress History
            </h2>
            <div className="max-h-60 sm:max-h-80 overflow-y-auto flex-1">
              {renderProgress()}
            </div>
          </div>

          {/* Transfer Requests */}
          <div className="bg-white rounded-lg shadow p-3 sm:p-6 flex flex-col">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
              <BsClock className="w-5 h-5 text-blue-500 mr-2" />
              Transfer Requests
            </h2>
            <div className="max-h-60 sm:max-h-80 overflow-y-auto flex-1">
              {renderTransferRequests()}
            </div>
          </div>
        </div>
      </div>

      {/* Side Column */}
      <div className="w-full lg:w-[350px] flex flex-col gap-4 mt-4 lg:mt-0">
        {/* Assignments Card */}
        <div className="bg-white rounded-lg shadow-md flex flex-col mb-2 p-3 sm:p-4">
          <div className="border-b border-gray-200 flex items-center pb-2 mb-2">
            <BsPerson className="w-5 h-5 text-indigo-500 mr-2" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-800">
              Assignments
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <div className="flex flex-col items-center">
              <BsPerson className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 mb-1" />
              <p className="text-xs text-gray-500">Requestor</p>
              <p className="font-medium text-xs sm:text-sm">
                {ticket.assignments?.requestor?.user?.name || "N/A"}
              </p>
              <p className="text-xs text-gray-500">
                {ticket.requestor?.department?.name}
              </p>
            </div>
            <div className="flex flex-col items-center">
              <BsPerson className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 mb-1" />
              <p className="text-xs text-gray-500">Operator</p>
              <p className="font-medium text-xs sm:text-sm">
                {ticket.assignments?.operator?.user?.name || "N/A"}
              </p>
              <p className="text-xs text-gray-500">
                {ticket.operator?.department?.name}
              </p>
            </div>
          </div>
        </div>

        {/* KAP Notes Card - Increased Height */}
        <div className="bg-white rounded-lg shadow-md h-64 sm:h-[26rem] flex flex-col">
          <div className="p-3 sm:p-4 border-b border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center">
              <BsClipboardData className="w-5 h-5 text-blue-500 mr-2" />
              Notes by KAP
            </h3>
          </div>
          <div className="p-3 sm:p-4 flex-1 overflow-y-auto">
            {renderKapNotes()}
          </div>
        </div>

        {/* Organization Notes Card - Increased Height */}
        <div className="bg-white rounded-lg shadow-md h-64 sm:h-[26rem] flex flex-col">
          <div className="p-3 sm:p-4 border-b border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center">
              <BsPerson className="w-5 h-5 text-green-500 mr-2" />
              Notes by {ticket.requestor?.org?.name || "Organization"}
            </h3>
          </div>
          <div className="p-3 sm:p-4 flex-1 overflow-y-auto">
            {renderOrgNotes()}
          </div>
        </div>
      </div>
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={"Progress Visual"}
        size="sm"
      >
        {modalImageUrl ? (
          <div className="flex flex-col items-center justify-center">
            <img
              src={modalImageUrl}
              alt="Progress Attachment"
              className="max-h-[80vh] object-contain rounded-lg shadow-lg"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-64">
            <BsBarChartSteps className="w-20 h-20 text-green-400 mb-4" />
            <div className="text-gray-500 text-lg">
              No progress visuals available
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TicketInfo;
