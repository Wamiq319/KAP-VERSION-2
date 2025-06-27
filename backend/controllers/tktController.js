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
const WEB_URL = process.env.WEB_URL || "http://localhost:3000";

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
      const viewUrl = `${WEB_URL}/ticket/${ticketId}`;

      // Notify Creator
      const creatorUser = await User.findById(creator).select("name mobile");
      if (creatorUser?.mobile) {
        await sendSms({
          to: creatorUser.mobile,
          message: `✅ Ticket #${ticketNumber} has been created. View: ${viewUrl}`,
        });
      }

      // Notify GOV Manager(s)
      const govManagers = await User.getUsersRelatedToTicket({
        departmentId: requestorDepartment,
        roles: ["GOV_MANAGER"],
      });

      for (const user of govManagers) {
        await sendSms({
          to: user.mobile,
          message: `🛠️ New ticket #${ticketNumber} created in GOV department. View: ${viewUrl}`,
        });
      }

      // Notify OP Manager(s)
      const opManagers = await User.getUsersRelatedToTicket({
        departmentId: operatorDepartment,
        roles: ["OP_MANAGER"],
      });

      for (const user of opManagers) {
        await sendSms({
          to: user.mobile,
          message: `🛠️ New ticket #${ticketNumber} assigned to OP department. View: ${viewUrl}`,
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
    const { userId, role, orgId, departmentId } = req.query;

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
        response = await Ticket.updateStatus({
          Id: tktId,
          newStatus: data.newStatus,
          updatedBy: userId,
        });
        break;

      case "TRANSFER_TICKET":
        console.log("[updateTicket] Entering TRANSFER_TICKET case");
        response = await Ticket.handleTransfer({
          Id: tktId,
          transferData: {
            assignTo: data.assignTo,
            targetOrg: data.targetOrg,
            transferKind: "TRANSFER_TICKET",
          },
        });
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Invalid action type",
          data: null,
        });
    }

    console.log("Model response:", response);
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
