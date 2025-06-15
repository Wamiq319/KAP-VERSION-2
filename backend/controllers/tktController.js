import Ticket from "../models/ticket.js";
import {
  createErrorResponse,
  createSuccessResponse,
} from "../utils/responseHandler.js";

export const createTicket = async (req, res) => {
  console.log("=== Starting Ticket Creation Process ===");
  console.log("Request body:", req.body);

  try {
    const {
      request,
      description,
      ticketType,
      scheduledDate,
      requestor,
      operator,
      requestorDepartment,
      operatorDepartment,
      creator,
      priority,
    } = req.body;

    console.log("Extracted data:", {
      request,
      ticketType,
      requestor,
      operator,
      creator,
      priority,
    });

    // Validate required fields
    if (
      !request ||
      !ticketType ||
      !requestor ||
      !operator ||
      !creator ||
      !priority
    ) {
      console.log("Validation failed: Missing required fields");
      return res
        .status(400)
        .json(createErrorResponse("CREATE", "TICKET", "REQUIRED_FIELDS"));
    }

    // Validate scheduled date for scheduled tickets
    if (ticketType === "SCHEDULED" && !scheduledDate) {
      console.log(
        "Validation failed: Missing scheduled date for scheduled ticket"
      );
      return res
        .status(400)
        .json(
          createErrorResponse("CREATE", "TICKET", "SCHEDULED_DATE_REQUIRED")
        );
    }

    const ticketData = {
      request,
      description,
      ticketType,
      scheduledDate,
      requestor: {
        org: requestor,
        department: requestorDepartment,
      },
      operator: {
        org: operator,
        department: operatorDepartment,
      },
      createdBy: creator,
      priority,
    };

    console.log("Prepared ticket data for model:", ticketData);

    const response = await Ticket.createTicket(ticketData);
    console.log("Model response:", response);

    return res.status(201).json(response);
  } catch (error) {
    console.error("Error in createTicket controller:", error);
    return res
      .status(500)
      .json(createErrorResponse("CREATE", "TICKET", "INTERNAL_ERROR"));
  }
};

export const getTickets = async (req, res) => {
  try {
    const {
      status,
      ticketType,
      requestor,
      operator,
      priority,
      startDate,
      endDate,
      fields,
      limit,
      skip,
      sortBy,
      sortOrder,
    } = req.query;

    const response = await Ticket.getTickets({
      status,
      ticketType,
      requestor,
      operator,
      priority,
      startDate,
      endDate,
      fields,
      limit,
      skip,
      sortBy,
      sortOrder,
    });

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error in getTickets controller:", error);
    return res
      .status(500)
      .json(createErrorResponse("FETCH", "TICKET", "INTERNAL_ERROR"));
  }
};

export const deleteTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const response = await Ticket.deleteTicketById(ticketId);
    return res.status(200).json(response);
  } catch (error) {
    console.error("Error in deleteTicket controller:", error);
    return res
      .status(500)
      .json(createErrorResponse("DELETE", "TICKET", "INTERNAL_ERROR"));
  }
};

export const updateTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const updateData = req.body;
    const response = await Ticket.updateTicketById(ticketId, updateData);
    return res.status(200).json(response);
  } catch (error) {
    console.error("Error in updateTicket controller:", error);
    return res
      .status(500)
      .json(createErrorResponse("UPDATE", "TICKET", "INTERNAL_ERROR"));
  }
};
