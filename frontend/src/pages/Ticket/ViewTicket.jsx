import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchEntities, updateEntity } from "../../redux/slices/crudSlice";
import TicketActions from "../../components/Ticket/TicketActions";
import TicketInfo from "../../components/Ticket/TicketInfo";
import TicketInput from "../../components/Ticket/TicketInput";
import { formatDate } from "../../utils/dateUtils";
import Loader from "../../components/Loader";
import Modal from "../../components/Modal";

const ViewTicket = ({ mode }) => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [showInput, setShowInput] = useState(false);
  const [inputType, setInputType] = useState(null);
  const [inputTarget, setInputTarget] = useState(null);

  const { currentTicket, status, error } = useSelector((state) => state.crud);

  useEffect(() => {
    if (id) {
      dispatch(
        fetchEntities({
          entityType: "tickets",
          id,
          isSingleEntity: true,
        })
      )
        .then((response) => {
          // Keep this log as it shows the direct response from the fetch action
          console.log("Ticket fetch response:", response);
        })
        .catch((error) => {
          console.error("Ticket fetch error:", error);
        });
    }
  }, [dispatch, id]);

  const handleAddNote = (type, target) => {
    setInputType("NOTE");
    setInputTarget(target);
    setShowInput(true);
  };

  const handleAddProgress = () => {
    setInputType("PROGRESS");
    setShowInput(true);
  };

  const handleCloseInput = () => {
    setShowInput(false);
    setInputType(null);
    setInputTarget(null);
  };

  const handleSubmitInput = async (data) => {
    try {
      let actionType;
      let payload = {};

      switch (data.type) {
        case "NOTE":
          actionType = "ADD_NOTE";
          payload = {
            text: data.text,
            targetOrg: data.targetOrg,
            addedBy: data.addedBy,
          };
          break;

        case "PROGRESS":
          actionType = "ADD_PROGRESS";
          payload = {
            text: data.text,
            observation: data.observation,
            percentage: data.percentage,
            addedBy: data.addedBy,
          };
          break;

        default:
          throw new Error("Invalid input type.");
      }

      const updatePayload = {
        actionType,
        data: payload,
      };

      console.log("Data prepared for backend update:", updatePayload);

      await dispatch(
        updateEntity({
          entityType: "tickets",
          id: currentTicket._id,
          formData: updatePayload,
        })
      );

      handleCloseInput();

      // Refresh the ticket
      await dispatch(
        fetchEntities({
          entityType: "tickets",
          id,
          isSingleEntity: true,
        })
      );
    } catch (error) {
      console.error("Error submitting input:", error);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!currentTicket) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Ticket not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Ticket Details</h1>
        <p className="text-gray-600">View and manage ticket information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <TicketInfo
            ticket={currentTicket}
            formatDate={formatDate}
            mode={mode}
          />
        </div>

        {/* Actions Sidebar */}
        <div className="lg:col-span-1">
          <TicketActions
            ticket={currentTicket}
            mode={mode}
            onAddNote={handleAddNote}
            onAddProgress={handleAddProgress}
          />
        </div>
      </div>

      {/* Input Modal */}
      <Modal
        isOpen={showInput}
        onClose={handleCloseInput}
        title={inputType === "NOTE" ? "Add New Note" : "Update Ticket Progress"}
        size="md"
      >
        <TicketInput
          type={inputType}
          userRole={mode}
          requestorId={currentTicket.requestor?._id}
          operatorId={currentTicket.operator?._id}
          ticketId={currentTicket._id}
          onClose={handleCloseInput}
          onSubmit={handleSubmitInput}
        />
      </Modal>
    </div>
  );
};

export default ViewTicket;
