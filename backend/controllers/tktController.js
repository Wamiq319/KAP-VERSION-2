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
const BASE_URL = process.env.WEB_URL || "http://localhost:3000";

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

      // Notify GOV Manager(s)
      const govManagers = await User.getUsersRelatedToTicket({
        departmentId: requestorDepartment,
        roles: ["GOV_MANAGER"],
      });

      for (const user of govManagers) {
        const viewUrl = `${BASE_URL}/manage-gov-tickets/view/${ticketId}`;
        await sendSms({
          to: user.mobile,
          message: `📩 New  ticket #${ticketNumber} created for your department. View: ${viewUrl}`,
        });
      }

      // Notify OP Manager(s)
      const opManagers = await User.getUsersRelatedToTicket({
        departmentId: operatorDepartment,
        roles: ["OP_MANAGER"],
      });

      for (const user of opManagers) {
        const viewUrl = `${BASE_URL}/manage-op-tickets/view/${ticketId}`;
        await sendSms({
          to: user.mobile,
          message: `📩 New  ticket #${ticketNumber} created for your department. View: ${viewUrl}`,
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
    const { userId, role, orgId, departmentId, transferRequestMode } =
      req.query;

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

    if (response.success && response.data) {
      const ticket = response.data;
      const ticketId = ticket._id;
      const ticketNumber = ticket.ticketNumber || "N/A";
      const smsList = [];

      const statusMessages = {
        ACCEPTED: "✅ Ticket Accepted By Operator",
        IN_PROGRESS: "🔧 Ticket Work has been Started",
        COMPLETED: "🎉 Work had been completed",
        CLOSED: "🔒 Ticket closed",
        TRANSFER_REQUESTED: "📦 Ticket transfer requested",
      };

      const getPathByRole = (role) => {
        switch (role) {
          case "KAP_EMPLOYEE":
            return "/manage-kap-tickets/view";
          case "GOV_MANAGER":
            return "/manage-gov-tickets/view";
          case "OP_MANAGER":
            return "/manage-op-tickets/view";
          case "OP_EMPLOYEE":
            return "/manage-op-employee-tickets/view";
          case "GOV_EMPLOYEE":
            return "/manage-gov-employee-tickets/view";
          default:
            return "/manage-kap-tickets/view";
        }
      };

      const addSms = (user, role) => {
        if (!user?.mobile) return;
        let message;

        switch (actionType) {
          case "ADD_NOTE":
            message = `📝 A note was added to ticket #${ticketNumber}`;
            break;
          case "ADD_PROGRESS":
            message = `📈 Progress updated for ticket #${ticketNumber}`;
            break;
          case "UPDATE_STATUS":
            message = `${
              statusMessages[ticket.status] || "🔔 Ticket updated"
            } (#${ticketNumber})`;
            break;
          case "TRANSFER_TICKET":
            message = `📦 Ticket #${ticketNumber} has been transferred to you`;
            break;
          case "OPEN_TRANSFER_REQUEST":
            message = `📦 Ticket #${ticketNumber} transfer request opened`;
            break;
          case "ACCEPT_TRANSFER_REQUEST":
            message = `✅ Transfer request for ticket #${ticketNumber} has been accepted`;
            break;
          case "DECLINE_TRANSFER_REQUEST":
            message = `❌ Transfer request for ticket #${ticketNumber} has been declined`;
            break;
          default:
            message = `🔔 Ticket #${ticketNumber} was updated`;
        }

        const path = getPathByRole(role);
        const viewUrl = `${BASE_URL}${path}/${ticketId}`;

        smsList.push({
          to: user.mobile,
          message: `${message}. View: ${viewUrl}`,
        });
      };

      // ✅ TRANSFER: Only send to signed user
      if (actionType === "TRANSFER_TICKET" && data.assignTo) {
        const signedUser = await User.findById(data.assignTo).select(
          "mobile role"
        );
        if (signedUser) addSms(signedUser, signedUser.role);
      }

      // ✅ OTHER actions: notify all relevant users
      else {
        const userSet = new Set();

        // 1. createdBy
        if (ticket.createdBy?._id) {
          const kapUser = await User.findById(ticket.createdBy._id).select(
            "mobile role"
          );
          if (kapUser && !userSet.has(kapUser.mobile)) {
            userSet.add(kapUser.mobile);
            addSms(kapUser, kapUser.role);
          }
        }

        const fetchAndAdd = async ({ departmentId, organizationId, roles }) => {
          const users = await User.getUsersRelatedToTicket({
            departmentId,
            organizationId,
            roles,
          });
          for (const user of users) {
            if (user?.mobile && !userSet.has(user.mobile)) {
              userSet.add(user.mobile);
              addSms(user, user.role);
            }
          }
        };

        // 2. Requestor: assigned + manager
        if (ticket.requestor?.department?.id) {
          await fetchAndAdd({
            departmentId: ticket.requestor.department.id,
            roles: ["GOV_EMPLOYEE", "GOV_MANAGER"],
          });
        }

        // 3. Operator: assigned + manager
        if (ticket.operator?.department?.id) {
          await fetchAndAdd({
            departmentId: ticket.operator.department.id,
            roles: ["OP_EMPLOYEE", "OP_MANAGER"],
          });
        }
      }

      // ✅ Send all SMS
      for (const sms of smsList) {
        await sendSms(sms);
      }
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
