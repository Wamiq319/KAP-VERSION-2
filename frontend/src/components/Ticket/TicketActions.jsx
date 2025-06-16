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
  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">
        Actions
      </h2>

      {/* Print Action - Available to all */}
      <Button
        text="Print Ticket"
        onClick={onPrint}
        className="w-full bg-purple-600 hover:bg-purple-700"
        icon={<FaPrint />}
      />

      {/* KAP Employee Actions */}
      {mode === "KAP_EMPLOYEE" && (
        <>
          <Button
            text="Add Note"
            onClick={() => onAddNote()}
            className="w-full bg-blue-600 hover:bg-blue-700"
            icon={<FaPlus />}
          />

          <Button
            text="Close Ticket"
            onClick={() => onCloseTicket()}
            className="w-full bg-red-600 hover:bg-red-700"
            icon={<FaTimes />}
          />
        </>
      )}

      {/* OP Manager Actions */}
      {mode === "OP_MANAGER" && (
        <>
          {ticket.status === "CREATED" ? (
            <Button
              text="Accept Ticket"
              onClick={() => onAcceptTicket()}
              className="w-full bg-green-600 hover:bg-green-700"
              icon={<FaCheck />}
            />
          ) : (
            <>
              <Button
                text="Update Progress"
                onClick={() => onAddProgress()}
                className="w-full bg-blue-600 hover:bg-blue-700"
                icon={<FaCheck />}
              />
              <Button
                text="Transfer Ticket"
                onClick={() => onTransferTicket()}
                className="w-full bg-orange-600 hover:bg-orange-700"
                icon={<FaExchangeAlt />}
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
            onClick={() => onAddNote()}
            className="w-full bg-blue-600 hover:bg-blue-700"
            icon={<FaPlus />}
          />
          <Button
            text="Transfer Ticket"
            onClick={() => onTransferTicket()}
            className="w-full bg-orange-600 hover:bg-orange-700"
            icon={<FaExchangeAlt />}
          />
        </>
      )}

      {/* GOV Employee Actions */}
      {mode === "GOV_EMPLOYEE" && (
        <>
          <Button
            text="Add Note"
            onClick={() => onAddNote()}
            className="w-full bg-blue-600 hover:bg-blue-700"
            icon={<FaPlus />}
          />
          <Button
            text="Transfer Request"
            onClick={() => onTransferRequest()}
            className="w-full bg-orange-600 hover:bg-orange-700"
            icon={<FaExchangeAlt />}
          />
        </>
      )}

      {/* OP Employee Actions */}
      {mode === "OP_EMPLOYEE" && (
        <>
          <Button
            text="Update Progress"
            onClick={() => onAddProgress()}
            className="w-full bg-blue-600 hover:bg-blue-700"
            icon={<FaCheck />}
          />
          <Button
            text="Transfer Request"
            onClick={() => onTransferRequest()}
            className="w-full bg-orange-600 hover:bg-orange-700"
            icon={<FaExchangeAlt />}
          />
        </>
      )}
    </div>
  );
};

export default TicketActions;
