import React from "react";
import {
  FaPlus,
  FaTimes,
  FaPrint,
  FaCheck,
  FaExchangeAlt,
  FaFlagCheckered,
} from "react-icons/fa";
import { Button } from "../FormComponents";
import { useSelector } from "react-redux";

const TicketActions = ({
  ticket,
  mode,
  onAddNote,
  onAddProgress,
  onCloseTicket,
  onMarkComplete,
  onTransferTicket,
  onAcceptTicket,
  onTransferRequest,
  onPrint,
  onStartWork,
  onAcceptTransferRequest,
  onDeclineTransferRequest,
  transferRequestMode,
}) => {
  const { words } = useSelector((state) => state.language);
  // Disable conditions based on ticket status
  const isClosed = ticket.status === "CLOSED";
  const isCompleted = ticket.status === "COMPLETED";
  const canAccept = ticket.status === "CREATED" && mode === "OP_MANAGER";
  const isInProgress = ticket.status === "IN_PROGRESS";

  // Check if there are pending transfer requests
  const hasPendingTransferRequests = ticket.transferRequests?.some(
    (req) => req.status === "PENDING"
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 border-b pb-2 mb-3 sm:mb-4">
        {transferRequestMode
          ? words["Transfer Request Actions"]
          : words["Actions"]}
      </h2>

      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
        {/* Print Action - Always available */}
        <Button
          text={words["Print"]}
          onClick={onPrint}
          className="bg-purple-600 hover:bg-purple-700 text-xs sm:text-sm"
          icon={<FaPrint className="w-3 h-3 sm:w-4 sm:h-4" />}
          size="small"
        />

        {/* Transfer Request Actions - Show when in transfer request mode */}
        {transferRequestMode && hasPendingTransferRequests && (
          <>
            <Button
              text={words["Accept Request"]}
              onClick={onAcceptTransferRequest}
              className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
              icon={<FaCheck className="w-3 h-3 sm:w-4 sm:h-4" />}
              size="small"
            />
            <Button
              text={words["Decline Request"]}
              onClick={onDeclineTransferRequest}
              className="bg-red-600 hover:bg-red-700 text-xs sm:text-sm"
              icon={<FaTimes className="w-3 h-3 sm:w-4 sm:h-4" />}
              size="small"
            />
          </>
        )}

        {/* Regular Actions - Show only when NOT in transfer request mode */}
        {!transferRequestMode && (
          <>
            {/* Status-based actions */}
            {!isClosed && (
              <>
                {/* KAP Employee Actions */}
                {mode === "KAP_EMPLOYEE" && (
                  <>
                    <Button
                      text={words["Add Note"]}
                      onClick={() => onAddNote("KAP_NOTE")}
                      className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm"
                      icon={<FaPlus className="w-3 h-3 sm:w-4 sm:h-4" />}
                      size="small"
                    />
                    {/* KAP Close Button - Only for KAP when ticket is IN_PROGRESS or COMPLETED */}
                    {(isInProgress || isCompleted) && (
                      <Button
                        text={words["Close Ticket"]}
                        onClick={onCloseTicket}
                        className="bg-red-600 hover:bg-red-700 text-xs sm:text-sm"
                        icon={<FaTimes className="w-3 h-3 sm:w-4 sm:h-4" />}
                        size="small"
                      />
                    )}
                  </>
                )}

                {/* OP Manager Actions */}
                {mode === "OP_MANAGER" && (
                  <>
                    {canAccept && (
                      <Button
                        text={words["Accept"]}
                        onClick={onAcceptTicket}
                        className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
                        icon={<FaCheck className="w-3 h-3 sm:w-4 sm:h-4" />}
                        size="small"
                      />
                    )}
                    {!canAccept && (
                      <>
                        {isInProgress && (
                          <Button
                            text={words["Progress"]}
                            onClick={onAddProgress}
                            className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm"
                            icon={<FaCheck className="w-3 h-3 sm:w-4 sm:h-4" />}
                            size="small"
                          />
                        )}
                        {/* Transfer Ticket Button */}
                        <Button
                          text={words["Transfer"]}
                          onClick={() => onTransferTicket("TICKET")}
                          className="bg-indigo-600 hover:bg-indigo-700 text-xs sm:text-sm"
                          icon={
                            <FaExchangeAlt className="w-3 h-3 sm:w-4 sm:h-4" />
                          }
                          size="small"
                        />
                        {/* Transfer Request Button */}
                        <Button
                          text={words["Request"]}
                          onClick={() => onTransferRequest("MANAGER")}
                          className="bg-orange-600 hover:bg-orange-700 text-xs sm:text-sm"
                          icon={
                            <FaExchangeAlt className="w-3 h-3 sm:w-4 sm:h-4" />
                          }
                          size="small"
                        />
                      </>
                    )}
                    {/* Mark Complete Button - Only for OP_MANAGER when ticket is IN_PROGRESS */}
                    {isInProgress && (
                      <Button
                        text={words["Mark Complete"]}
                        onClick={onMarkComplete}
                        className="bg-emerald-600 hover:bg-emerald-700 text-xs sm:text-sm"
                        icon={
                          <FaFlagCheckered className="w-3 h-3 sm:w-4 sm:h-4" />
                        }
                        size="small"
                      />
                    )}
                    {mode === "OP_MANAGER" && ticket.status === "ACCEPTED" && (
                      <Button
                        text={words["Start"]}
                        onClick={onStartWork}
                        className="bg-yellow-600 hover:bg-yellow-700 text-xs sm:text-sm"
                        icon={<FaCheck className="w-3 h-3 sm:w-4 sm:h-4" />}
                        size="small"
                      />
                    )}
                  </>
                )}

                {/* GOV Manager Actions */}
                {mode === "GOV_MANAGER" && (
                  <>
                    <Button
                      text={words["Add Note"]}
                      onClick={() => onAddNote("ORG_NOTE")}
                      className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm"
                      icon={<FaPlus className="w-3 h-3 sm:w-4 sm:h-4" />}
                      size="small"
                    />
                    {/* Transfer Ticket Button */}
                    <Button
                      text={words["Transfer"]}
                      onClick={() => onTransferTicket("TICKET")}
                      className="bg-indigo-600 hover:bg-indigo-700 text-xs sm:text-sm"
                      icon={<FaExchangeAlt className="w-3 h-3 sm:w-4 sm:h-4" />}
                      size="small"
                    />
                    {/* Transfer Request Button */}
                    <Button
                      text={words["Request"]}
                      onClick={() => onTransferRequest("MANAGER")}
                      className="bg-orange-600 hover:bg-orange-700 text-xs sm:text-sm"
                      icon={<FaExchangeAlt className="w-3 h-3 sm:w-4 sm:h-4" />}
                      size="small"
                    />
                  </>
                )}

                {/* Employee Common Actions */}
                {mode === "GOV_EMPLOYEE" && (
                  <Button
                    text={words["Add Note"]}
                    onClick={() => onAddNote("ORG_NOTE")}
                    className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm"
                    icon={<FaPlus className="w-3 h-3 sm:w-4 sm:h-4" />}
                    size="small"
                  />
                )}
                {mode === "OP_EMPLOYEE" && (
                  <>
                    {isInProgress && (
                      <Button
                        text={words["Progress"]}
                        onClick={onAddProgress}
                        className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm"
                        icon={<FaCheck className="w-3 h-3 sm:w-4 sm:h-4" />}
                        size="small"
                      />
                    )}
                    {ticket.status === "ACCEPTED" && (
                      <Button
                        text={words["Start"]}
                        onClick={onStartWork}
                        className="bg-yellow-600 hover:bg-yellow-700 text-xs sm:text-sm"
                        icon={<FaCheck className="w-3 h-3 sm:w-4 sm:h-4" />}
                        size="small"
                      />
                    )}
                    {/* Mark Complete Button - Only for OP_EMPLOYEE when ticket is IN_PROGRESS */}
                    {isInProgress && (
                      <Button
                        text={words["Mark Complete"]}
                        onClick={onMarkComplete}
                        className="bg-emerald-600 hover:bg-emerald-700 text-xs sm:text-sm"
                        icon={
                          <FaFlagCheckered className="w-3 h-3 sm:w-4 sm:h-4" />
                        }
                        size="small"
                      />
                    )}
                    <Button
                      text={words["Request"]}
                      onClick={() => onTransferRequest("EMPLOYEE")}
                      className="bg-orange-600 hover:bg-orange-700 text-xs sm:text-sm"
                      icon={<FaExchangeAlt className="w-3 h-3 sm:w-4 sm:h-4" />}
                      size="small"
                    />
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TicketActions;
