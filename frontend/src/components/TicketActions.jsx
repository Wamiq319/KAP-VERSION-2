{
  mode === "OP_EMPLOYEE" && ticket.status === "IN_PROGRESS" && (
    <Button
      text="Close Ticket"
      onClick={onCloseTicket}
      className="bg-red-600 hover:bg-red-700"
      icon={<FaTimes />}
      size="medium"
      disabled={isTransferRequested}
    />
  );
}
{
  mode === "OP_MANAGER" && ticket.status === "ACCEPTED" && (
    <Button
      text="Start Work"
      onClick={onStartWork}
      className="bg-yellow-600 hover:bg-yellow-700"
      icon={<FaCheck />}
      size="medium"
    />
  );
}
