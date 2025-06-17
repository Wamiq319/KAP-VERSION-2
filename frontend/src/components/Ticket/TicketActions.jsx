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
}) => {
  // Disable conditions based on ticket status
  const isClosed = ticket.status === "CLOSED";
  const isTransferRequested = ticket.status === "TRANSFER_REQUESTED";
  const canAccept = ticket.status === "CREATED" && mode === "OP_MANAGER";

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">
        Actions
      </h2>

      <div className="flex flex-wrap gap-2">
        {/* Print Action - Always available */}
        <Button
          text="Print Ticket"
          onClick={onPrint}
          className="bg-purple-600 hover:bg-purple-700"
          icon={<FaPrint />}
          size="medium"
        />

        {/* Status-based actions */}
        {!isClosed && (
          <>
            {/* KAP Employee Actions */}
            {mode === "KAP_EMPLOYEE" && (
              <Button
                text="Add Note"
                onClick={() => onAddNote("KAP_NOTE")}
                className="bg-blue-600 hover:bg-blue-700"
                icon={<FaPlus />}
                size="medium"
              />
            )}

            {/* OP Manager Actions */}
            {mode === "OP_MANAGER" && (
              <>
                {canAccept && (
                  <Button
                    text="Accept Ticket"
                    onClick={onAcceptTicket}
                    className="bg-green-600 hover:bg-green-700"
                    icon={<FaCheck />}
                    size="medium"
                  />
                )}
                {!canAccept && (
                  <>
                    <Button
                      text="Update Progress"
                      onClick={onAddProgress}
                      className="bg-blue-600 hover:bg-blue-700"
                      icon={<FaCheck />}
                      size="medium"
                      disabled={isTransferRequested}
                    />
                    <Button
                      text={
                        isTransferRequested
                          ? "Transfer Pending"
                          : "Transfer Ticket"
                      }
                      onClick={onTransferTicket}
                      className={`${
                        isTransferRequested
                          ? "bg-gray-400"
                          : "bg-orange-600 hover:bg-orange-700"
                      }`}
                      icon={<FaExchangeAlt />}
                      size="medium"
                      disabled={isTransferRequested}
                    />
                  </>
                )}
              </>
            )}

            {/* GOV Manager Actions */}
            {mode === "GOV_MANAGER" && (
              <>
                <Button
                  text="Add Note"
                  onClick={() => onAddNote("ORG_NOTE")}
                  className="bg-blue-600 hover:bg-blue-700"
                  icon={<FaPlus />}
                  size="medium"
                />
                <Button
                  text="Transfer to Department"
                  onClick={() => onTransferTicket("DEPARTMENT")}
                  className="bg-orange-600 hover:bg-orange-700"
                  icon={<FaExchangeAlt />}
                  size="medium"
                  disabled={isTransferRequested}
                />
              </>
            )}

            {/* Employee Common Actions */}
            {(mode === "GOV_EMPLOYEE" || mode === "OP_EMPLOYEE") && (
              <>
                <Button
                  text="Add Note"
                  onClick={() => onAddNote("ORG_NOTE")}
                  className="bg-blue-600 hover:bg-blue-700"
                  icon={<FaPlus />}
                  size="medium"
                />
                <Button
                  text="Request Transfer"
                  onClick={() => onTransferRequest("EMPLOYEE")}
                  className={`${
                    isTransferRequested
                      ? "bg-gray-400"
                      : "bg-orange-600 hover:bg-orange-700"
                  }`}
                  icon={<FaExchangeAlt />}
                  size="medium"
                  disabled={isTransferRequested}
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
