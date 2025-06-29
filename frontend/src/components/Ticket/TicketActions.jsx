import React from "react";
import {
  FaPlus,
  FaTimes,
  FaPrint,
  FaCheck,
  FaExchangeAlt,
} from "react-icons/fa";
import { Button } from "../FormComponents";

const TicketActions = ({
  ticket,
  mode,
  onAddNote,
  onAddProgress,
  onCloseTicket,
  onTransferTicket,
  onAcceptTicket,
  onTransferRequest,
  onPrint,
  onStartWork,
}) => {
  // Disable conditions based on ticket status
  const isClosed = ticket.status === "CLOSED";
  const canAccept = ticket.status === "CREATED" && mode === "OP_MANAGER";
  const isInProgress = ticket.status === "IN_PROGRESS";

  return (
    <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 border-b pb-2 mb-3 sm:mb-4">
        Actions
      </h2>

      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
        {/* Print Action - Always available */}
        <Button
          text="Print"
          onClick={onPrint}
          className="bg-purple-600 hover:bg-purple-700 text-xs sm:text-sm"
          icon={<FaPrint className="w-3 h-3 sm:w-4 sm:h-4" />}
          size="small"
        />

        {/* Status-based actions */}
        {!isClosed && (
          <>
            {/* KAP Employee Actions */}
            {mode === "KAP_EMPLOYEE" && (
              <Button
                text="Add Note"
                onClick={() => onAddNote("KAP_NOTE")}
                className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm"
                icon={<FaPlus className="w-3 h-3 sm:w-4 sm:h-4" />}
                size="small"
              />
            )}

            {/* OP Manager Actions */}
            {mode === "OP_MANAGER" && (
              <>
                {canAccept && (
                  <Button
                    text="Accept"
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
                        text="Progress"
                        onClick={onAddProgress}
                        className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm"
                        icon={<FaCheck className="w-3 h-3 sm:w-4 sm:h-4" />}
                        size="small"
                      />
                    )}
                    {/* Transfer Ticket Button */}
                    <Button
                      text="Transfer"
                      onClick={() => onTransferTicket("TICKET")}
                      className="bg-orange-600 hover:bg-orange-700 text-xs sm:text-sm"
                      icon={<FaExchangeAlt className="w-3 h-3 sm:w-4 sm:h-4" />}
                      size="small"
                    />
                    {/* Transfer Request Button */}
                    <Button
                      text="Request"
                      onClick={() => onTransferRequest("MANAGER")}
                      className="bg-orange-600 hover:bg-orange-700 text-xs sm:text-sm"
                      icon={<FaExchangeAlt className="w-3 h-3 sm:w-4 sm:h-4" />}
                      size="small"
                    />
                  </>
                )}
                {mode === "OP_MANAGER" && ticket.status === "IN_PROGRESS" && (
                  <Button
                    text="Close"
                    onClick={onCloseTicket}
                    className="bg-red-600 hover:bg-red-700 text-xs sm:text-sm"
                    icon={<FaTimes className="w-3 h-3 sm:w-4 sm:h-4" />}
                    size="small"
                  />
                )}
                {mode === "OP_MANAGER" && ticket.status === "ACCEPTED" && (
                  <Button
                    text="Start"
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
                  text="Add Note"
                  onClick={() => onAddNote("ORG_NOTE")}
                  className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm"
                  icon={<FaPlus className="w-3 h-3 sm:w-4 sm:h-4" />}
                  size="small"
                />
                {/* Transfer Ticket Button */}
                <Button
                  text="Transfer"
                  onClick={() => onTransferTicket("TICKET")}
                  className="bg-orange-600 hover:bg-orange-700 text-xs sm:text-sm"
                  icon={<FaExchangeAlt className="w-3 h-3 sm:w-4 sm:h-4" />}
                  size="small"
                />
                {/* Transfer Request Button */}
                <Button
                  text="Request"
                  onClick={() => onTransferRequest("MANAGER")}
                  className="bg-orange-600 hover:bg-orange-700 text-xs sm:text-sm"
                  icon={<FaExchangeAlt className="w-3 h-3 sm:w-4 sm:h-4" />}
                  size="small"
                />
              </>
            )}

            {/* Employee Common Actions */}
            {(mode === "GOV_EMPLOYEE" || mode === "OP_EMPLOYEE") && (
              <>
                {mode === "GOV_EMPLOYEE" && (
                  <Button
                    text="Add Note"
                    onClick={() => onAddNote("ORG_NOTE")}
                    className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm"
                    icon={<FaPlus className="w-3 h-3 sm:w-4 sm:h-4" />}
                    size="small"
                  />
                )}
                {isInProgress && (
                  <Button
                    text="Progress"
                    onClick={onAddProgress}
                    className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm"
                    icon={<FaCheck className="w-3 h-3 sm:w-4 sm:h-4" />}
                    size="small"
                  />
                )}
                {mode === "OP_EMPLOYEE" && ticket.status === "ACCEPTED" && (
                  <Button
                    text="Start"
                    onClick={onStartWork}
                    className="bg-yellow-600 hover:bg-yellow-700 text-xs sm:text-sm"
                    icon={<FaCheck className="w-3 h-3 sm:w-4 sm:h-4" />}
                    size="small"
                  />
                )}
                {mode === "OP_EMPLOYEE" && ticket.status === "IN_PROGRESS" && (
                  <Button
                    text="Close"
                    onClick={onCloseTicket}
                    className="bg-red-600 hover:bg-red-700 text-xs sm:text-sm"
                    icon={<FaTimes className="w-3 h-3 sm:w-4 sm:h-4" />}
                    size="small"
                  />
                )}
                <Button
                  text="Request"
                  onClick={() => onTransferRequest("EMPLOYEE")}
                  className="bg-orange-600 hover:bg-orange-700 text-xs sm:text-sm"
                  icon={<FaExchangeAlt className="w-3 h-3 sm:w-4 sm:h-4" />}
                  size="small"
                />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TicketActions;
