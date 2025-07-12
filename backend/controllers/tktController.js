import Ticket from "../models/ticket.js";
import User from "../models/user.js";
import {
  createErrorResponse,
  handleModelResponse,
} from "../utils/responseHandler.js";
import { uploadImage } from "../utils/uploadCloudinary.js";
import { sendSms } from "../utils/sendMessage.js";
import dotenv from "dotenv";

dotenv.config();
const BASE_URL = process.env.WEB_URL;

export const createTicket = async (req, res) => {
  try {
    const {
      request,
      description,
      ticketType,
      scheduledDate,
      finishDate,
      requestor,
      operator,
      requestorDepartment,
      operatorDepartment,
      creator,
      priority,
    } = req.body;

    // Validate required fields
    if (
      !request ||
      !ticketType ||
      !requestor ||
      !operator ||
      !creator ||
      !priority
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        data: null,
      });
    }

    if (ticketType === "SCHEDULED" && !scheduledDate) {
      return res.status(400).json({
        success: false,
        message: "Scheduled date is required for scheduled tickets",
        data: null,
      });
    }

    // Step 1: Create the ticket
    const ticketData = {
      request,
      description,
      ticketType,
      scheduledDate,
      finishDate,
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

    const response = await Ticket.createTicket(ticketData);

    // Step 2: If success, fetch necessary data and send SMS
    if (response.success && response.data) {
      const ticket = response.data;
      const ticketId = ticket._id;
      const ticketNumber = ticket.ticketNumber || "N/A";

      // Find the OP_MANAGER for the operatorDepartment
      const opManager = await User.findOne({
        role: "OP_MANAGER",
        department: operatorDepartment,
      }).select("mobile");

      if (opManager && opManager.mobile) {
        const viewUrl = `${BASE_URL}/manage-op-tickets/view/${ticketId}`;
        await sendSms({
          to: opManager.mobile,
          message: `📩 New ticket #${ticketNumber} created for your department. View: ${viewUrl}`,
        });
      }
    }

    // Step 3: Send clean response to frontend (no data)
    return res.status(response.success ? 201 : 400).json({
      success: response.success,
      message: response.message,
      data: null,
    });
  } catch (error) {
    console.error("Error in createTicket controller:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      data: null,
    });
  }
};

export const getTicketById = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const response = await Ticket.getTicketById(ticketId);
    return res.status(200).json(response);
  } catch (error) {
    console.error("Error in getTicketById controller:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error", data: null });
  }
};

export const getTickets = async (req, res) => {
  try {
    const {
      userId,
      role,
      orgId,
      departmentId,
      transferRequestMode,
      archivedMode,
    } = req.query;

    if (!userId || !role) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters: userId and role",
        data: null,
      });
    }

    const response = await Ticket.getTickets({
      userId,
      role,
      orgId,
      departmentId,
      transferRequestMode: transferRequestMode === "true",
      archivedMode: archivedMode === "true",
    });

    return res.status(response.success ? 200 : 400).json(response);
  } catch (error) {
    console.error("Error in getTickets controller:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      data: [],
    });
  }
};

export const deleteTicket = async (req, res) => {
  try {
    const { tktId } = req.params;
    const response = await Ticket.deleteTicketById(tktId);
    return res
      .status(200)
      .json(handleModelResponse(response, "DELETE", "TICKET"));
  } catch (error) {
    console.error("Error in deleteTicket controller:", error);
    return res
      .status(500)
      .json(createErrorResponse("DELETE", "TICKET", "INTERNAL_ERROR"));
  }
};

export const updateTicket = async (req, res) => {
  try {
    const { tktId } = req.params;
    const { actionType, data, userId } = req.body;

    // Validate tktId
    if (!tktId) {
      return res.status(400).json({
        success: false,
        message: "Ticket ID is required",
        data: null,
      });
    }

    let response;

    switch (actionType) {
      case "ADD_NOTE":
        response = await Ticket.addNote({
          Id: tktId,
          noteData: data,
          addedBy: userId,
        });
        break;

      case "ADD_PROGRESS":
        // Parse data from FormData (fields are strings)
        let percentageRaw =
          req.body["data[percentage]"] ?? req.body.data?.percentage;
        let observationRaw =
          req.body["data[observation]"] ?? req.body.data?.observation;

        // Convert percentage to number, handle empty string as undefined
        let percentage =
          percentageRaw !== undefined && percentageRaw !== ""
            ? Number(percentageRaw)
            : undefined;
        let observation =
          observationRaw !== undefined ? observationRaw : undefined;

        let progressData = {
          percentage,
          observation,
        };

        // If an image was uploaded, upload to Cloudinary
        if (req.file) {
          try {
            const uploaded = await uploadImage(req.file.path);
            progressData.imageUrl = uploaded.url;
          } catch (err) {
            return res.status(400).json({
              success: false,
              message: "Error uploading progress image",
              data: null,
            });
          }
        }

        // Validate fields
        if (
          progressData.percentage === undefined ||
          progressData.observation === undefined ||
          progressData.observation === ""
        ) {
          return res.status(400).json({
            success: false,
            message: "Progress percentage and observation are required.",
            data: null,
          });
        }

        if (progressData.percentage < 20 || progressData.percentage > 100) {
          return res.status(400).json({
            success: false,
            message: "Progress percentage must be between 20% and 100%",
            data: null,
          });
        }

        response = await Ticket.updateProgress({
          Id: tktId,
          progressData,
          addedBy: userId,
        });
        break;

      case "UPDATE_STATUS":
        console.log(
          "[UPDATE_STATUS] tktId:",
          tktId,
          "newStatus:",
          data.newStatus,
          "userId:",
          userId
        );

        response = await Ticket.updateStatus({
          Id: tktId,
          newStatus: data.newStatus,
          updatedBy: userId,
        });

        console.log(
          "[UPDATE_STATUS] Response:",
          response.success,
          response.message
        );
        break;

      case "TRANSFER_TICKET":
        console.log("[updateTicket] Entering TRANSFER_TICKET case");
        response = await Ticket.handleTransfer({
          Id: tktId,
          transferData: {
            assignTo: data.assignTo,
            targetOrg: data.targetOrg,
          },
        });
        break;

      case "OPEN_TRANSFER_REQUEST":
        console.log("[updateTicket] Entering OPEN_TRANSFER_REQUEST case");
        response = await Ticket.createTransferRequest({
          ticketId: tktId,
          userId: userId,
          transferData: {
            to: data.to,
            reason: data.reason,
          },
        });
        break;

      case "ACCEPT_TRANSFER_REQUEST":
        console.log("[updateTicket] Entering ACCEPT_TRANSFER_REQUEST case");
        response = await Ticket.acceptTransferRequest({
          ticketId: tktId,
          requestId: data.requestId,
          acceptedBy: userId,
        });
        break;

      case "DECLINE_TRANSFER_REQUEST":
        console.log("[updateTicket] Entering DECLINE_TRANSFER_REQUEST case");
        response = await Ticket.declineTransferRequest({
          ticketId: tktId,
          requestId: data.requestId,
          declinedBy: userId,
        });
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Invalid action type",
          data: null,
        });
    }

    // Send SMS notifications based on action type
    if (response.success && response.data) {
      await handleTicketSMS({
        actionType,
        ticketData: response.data,
        userId,
        data: req.body.data,
      });
    }

    return res.status(200).json(response);
  } catch (error) {
    console.log(error);
    if (
      error instanceof Error &&
      error.message.includes("Only JPEG, PNG, GIF, or WEBP images are allowed")
    ) {
      return res.status(400).json({
        success: false,
        message: "Internal Server error",
        data: null,
      });
    }
    console.error("Error in updateTicket controller:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      data: null,
    });
  }
};

// Helper function to get role-based URL
function getRoleBasedUrl(role, ticketId) {
  const baseUrl = BASE_URL;

  switch (role) {
    case "KAP_EMPLOYEE":
      return `${baseUrl}/manage-kap-tickets/view/${ticketId}`;
    case "GOV_MANAGER":
      return `${baseUrl}/manage-gov-tickets/view/${ticketId}`;
    case "OP_MANAGER":
      return `${baseUrl}/manage-op-tickets/view/${ticketId}`;
    case "OP_EMPLOYEE":
      return `${baseUrl}/manage-op-employee-tickets/view/${ticketId}`;
    case "GOV_EMPLOYEE":
      return `${baseUrl}/manage-gov-employee-tickets/view/${ticketId}`;
    default:
      return `${baseUrl}/manage-kap-tickets/view/${ticketId}`;
  }
}

// SMS notification handler
async function handleTicketSMS({ actionType, ticketData, userId, data }) {
  const ticketId = ticketData._id;
  const ticketNumber = ticketData.ticketNumber || "N/A";

  const requestorManager = ticketData.requestor?.department?.manager || null;
  const operatorManager = ticketData.operator?.department?.manager || null;

  const requestorAssignment = ticketData.assignments?.requestor?.user || null;
  const operatorAssignment = ticketData.assignments?.operator?.user || null;

  const createdBy = ticketData.createdBy || null;

  const requestorOrg = ticketData.requestor?.org || null;
  const operatorOrg = ticketData.operator?.org || null;

  // Example log
  console.log({
    ticketId,
    requestorManager,
    operatorManager,
    requestorAssignment,
    operatorAssignment,
    createdBy,
    requestorOrg,
    operatorOrg,
  });

  try {
    let baseMessage;

    switch (actionType) {
      case "ADD_NOTE":
        baseMessage = `📩 Ticket #${ticketNumber} - Note added. View: `;
        // TODO: Implement SMS for ADD_NOTE
        console.log("SMS: ADD_NOTE action");
        break;

      case "ADD_PROGRESS":
        baseMessage = `📩 Ticket #${ticketNumber} - Progress updated. View: `;
        // TODO: Implement SMS for ADD_PROGRESS
        console.log("SMS: ADD_PROGRESS action");
        break;

      case "UPDATE_STATUS":
        const newStatus = data.newStatus;
        switch (newStatus) {
          case "ACCEPTED":
            baseMessage = `📩 Ticket #${ticketNumber} has been accepted. View: `;
            // Send SMS to requestor manager if exists
            if (requestorManager && requestorManager.mobile) {
              const requestorUrl = getRoleBasedUrl("GOV_MANAGER", ticketId);
              const message = baseMessage + requestorUrl;

              await sendSms({
                to: requestorManager,
                message: message,
              });
            }

            // Send SMS to requestor assignment (employee) if exists
            if (requestorAssignment && requestorAssignment.mobile) {
              const requestorEmployeeUrl = getRoleBasedUrl(
                "GOV_EMPLOYEE",
                ticketId
              );
              const message = baseMessage + requestorEmployeeUrl;

              await sendSms({
                to: requestorAssignment,
                message: message,
              });
            }

            // Send SMS to requestor organization if exists
            if (requestorOrg && requestorOrg.mobile) {
              const requestorOrgUrl = getRoleBasedUrl("GOV_MANAGER", ticketId);
              const message = baseMessage + requestorOrgUrl;

              await sendSms({
                to: requestorOrg,
                message: message,
              });
            }
            break;

          default:
            baseMessage = `📩 Ticket #${ticketNumber} - Status updated to ${newStatus}. View: `;
            console.log("SMS: UPDATE_STATUS - Other status:", newStatus);
            break;
        }
        console.log("SMS: UPDATE_STATUS action");
        break;

      case "TRANSFER_TICKET":
        baseMessage = `📩 Ticket #${ticketNumber} - Ticket transferred. View: `;
        // TODO: Implement SMS for TRANSFER_TICKET
        console.log("SMS: TRANSFER_TICKET action");
        break;

      case "OPEN_TRANSFER_REQUEST":
        baseMessage = `📩 Ticket #${ticketNumber} - Transfer request opened. View: `;
        // TODO: Implement SMS for OPEN_TRANSFER_REQUEST
        console.log("SMS: OPEN_TRANSFER_REQUEST action");
        break;

      case "ACCEPT_TRANSFER_REQUEST":
        baseMessage = `📩 Ticket #${ticketNumber} - Transfer request accepted. View: `;
        // TODO: Implement SMS for ACCEPT_TRANSFER_REQUEST
        console.log("SMS: ACCEPT_TRANSFER_REQUEST action");
        break;

      case "DECLINE_TRANSFER_REQUEST":
        baseMessage = `📩 Ticket #${ticketNumber} - Transfer request declined. View: `;
        // TODO: Implement SMS for DECLINE_TRANSFER_REQUEST
        console.log("SMS: DECLINE_TRANSFER_REQUEST action");
        break;

      default:
        baseMessage = `📩 Ticket #${ticketNumber} - ${actionType} action completed. View: `;
        console.log("SMS: No action type matched for SMS");
        break;
    }

    // Send SMS to creator (KAP_EMPLOYEE) for all actions
    if (createdBy && createdBy.mobile) {
      const creatorUrl = getRoleBasedUrl("KAP_EMPLOYEE", ticketId);
      const creatorMessage = baseMessage + creatorUrl;

      await sendSms({
        to: createdBy,
        message: creatorMessage,
      });
    }
  } catch (error) {
    console.error("Error in handleTicketSMS:", error);
  }
}
