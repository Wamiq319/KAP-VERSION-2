import mongoose from "mongoose";
import {
  createSuccessResponse,
  createErrorResponse,
} from "../utils/responseHandler.js";

import User from "./user.js";

const ticketSchema = new mongoose.Schema({
  ticketNumber: { type: String, unique: true, required: true },

  request: { type: String, required: true },
  description: { type: String, required: true },

  progress: [
    {
      percentage: { type: Number, min: 0, max: 100, required: true },
      observation: { type: String, required: true },
      imageUrl: { type: String, default: null },
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      updatedAt: { type: Date, default: Date.now },
    },
  ],

  requestor: {
    org: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
  },

  operator: {
    org: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
  },

  status: {
    type: String,
    enum: [
      "CREATED",
      "ACCEPTED",
      "IN_PROGRESS",
      "COMPLETED",
      "CLOSED",
      "TRANSFER_REQUESTED",
    ],
    default: "CREATED",
  },

  priority: {
    type: String,
    enum: ["LOW", "MEDIUM", "HIGH"],
    required: true,
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  assignments: {
    requestor: {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      assignedAt: {
        type: Date,
        default: Date.now,
      },
    },
    operator: {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      assignedAt: {
        type: Date,
        default: Date.now,
      },
    },
  },

  kapNotes: [
    {
      text: { type: String, required: true },
      addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      targetOrg: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
      },
      createdAt: { type: Date, default: Date.now },
    },
  ],

  orgNotes: [
    {
      text: { type: String, required: true },
      addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      createdAt: { type: Date, default: Date.now },
    },
  ],

  ticketType: {
    type: String,
    enum: ["INSTANT", "SCHEDULED"],
    required: true,
  },

  scheduledDate: {
    type: Date,
    required: function () {
      return this.ticketType === "SCHEDULED";
    },
    default: null,
  },

  finishDate: {
    type: Date,
    default: null,
  },

  startDate: {
    type: Date,
    default: null,
  },

  closedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  transferRequests: [
    {
      id: { type: String, required: true }, // Unique ID for the request

      type: {
        type: String,
        enum: ["DEPARTMENT", "EMPLOYEE"],
        required: true,
      },

      // From: Department ID (for department transfer) or Employee ID (for employee transfer)
      from: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: "model",
      },

      // To: Department ID (for department transfer) or Employee ID (for employee transfer)
      to: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: "model",
      },

      model: {
        type: String,
        enum: ["Department", "User"],
        required: true,
      },

      // Status
      status: {
        type: String,
        enum: ["PENDING", "ACCEPTED", "DECLINED"],
        default: "PENDING",
      },

      reason: { type: String, required: true },
      declineReason: { type: String },

      // Timestamps
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    },
  ],

  endDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// UTILITY FUNCTION FOR GETTING FORMATTED TICKET #####
// ####################################################
ticketSchema.statics.getFormattedTicket = async function (ticketId) {
  try {
    const ticket = await this.findById(ticketId)
      .populate("requestor.org", "name _id")
      .populate("requestor.department", "name _id")
      .populate("operator.org", "name _id")
      .populate("operator.department", "name _id")
      .populate("createdBy", "name _id role kapRole")
      .populate("assignments.requestor.user", "name _id role department")
      .populate("assignments.operator.user", "name _id role department")
      .populate({
        path: "progress.updatedBy",
        select: "name role department",
        populate: {
          path: "department",
          select: "name",
        },
      })
      .populate("kapNotes.addedBy", "name kapRole")
      .populate("orgNotes.addedBy", "name role")
      .populate("kapNotes.targetOrg", "name _id")
      .populate("transferRequests.from", "name _id")
      .populate("transferRequests.to", "name _id")
      .lean();

    const formattedTicket = {
      _id: ticket._id,
      ticketNumber: ticket.ticketNumber,
      request: ticket.request,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      ticketType: ticket.ticketType,

      // All date fields
      scheduledDate: ticket.scheduledDate,
      finishDate: ticket.finishDate,
      startDate: ticket.startDate,
      endDate: ticket.endDate,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,

      requestor: {
        org: {
          id: ticket.requestor.org?._id,
          name: ticket.requestor.org?.name,
        },
        department: {
          id: ticket.requestor.department?._id,
          name: ticket.requestor.department?.name,
        },
      },

      operator: {
        org: {
          id: ticket.operator.org?._id,
          name: ticket.operator.org?.name,
        },
        department: {
          id: ticket.operator.department?._id,
          name: ticket.operator.department?.name,
        },
      },

      createdBy: {
        id: ticket.createdBy?._id,
        name: ticket.createdBy?.name,
        role: ticket.createdBy?.role,
        kapRole: ticket.createdBy?.kapRole,
      },

      assignments: {
        requestor: {
          user: ticket.assignments?.requestor?.user
            ? {
                id: ticket.assignments.requestor.user._id,
                name: ticket.assignments.requestor.user.name,
                role: ticket.assignments.requestor.user.role,
                department: ticket.assignments.requestor.user.department,
              }
            : null,
          status: ticket.assignments?.requestor?.status,
          assignedAt: ticket.assignments?.requestor?.assignedAt,
        },
        operator: {
          user: ticket.assignments?.operator?.user
            ? {
                id: ticket.assignments.operator.user._id,
                name: ticket.assignments.operator.user.name,
                role: ticket.assignments.operator.user.role,
                department: ticket.assignments.operator.user.department,
              }
            : null,
          status: ticket.assignments?.operator?.status,
          assignedAt: ticket.assignments?.operator?.assignedAt,
        },
      },

      progress:
        ticket.progress?.map((p) => ({
          percentage: p.percentage,
          observation: p.observation,
          imageUrl: p.imageUrl,
          updatedBy: {
            name: p.updatedBy?.name,
            role: p.updatedBy?.role,
            department: p.updatedBy?.department?.name || null,
          },
          updatedAt: p.updatedAt,
        })) || [],

      kapNotes:
        ticket.kapNotes?.map((note) => ({
          text: note.text,
          addedBy: {
            name: note.addedBy?.name,
            role: note.addedBy?.kapRole,
          },
          targetOrg: {
            name: note.targetOrg?.name,
          },
          createdAt: note.createdAt,
        })) || [],

      orgNotes:
        ticket.orgNotes?.map((note) => ({
          id: note._id,
          text: note.text,
          addedBy: {
            id: note.addedBy?._id,
            name: note.addedBy?.name,
            role: note.addedBy?.role,
          },
          createdAt: note.createdAt,
        })) || [],

      transferRequests: ticket.transferRequests?.map((request) => ({
        id: request.id,
        type: request.type,
        from: {
          id: request.from?._id || request.from,
          name: request.from?.name || "Unknown",
        },
        to: {
          id: request.to?._id || request.to,
          name: request.to?.name || "Unknown",
        },
        model: request.model,
        status: request.status,
        reason: request.reason,
        declineReason: request.declineReason,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
      })),
    };
    return formattedTicket;
  } catch (error) {
    console.error("Error in getFormattedTicket:", error);
    return false;
  }
};

/////////############################
// #####################################

ticketSchema.statics.createTicket = async function (ticketData) {
  try {
    const ticketNumber = await this.generateTicketNumber();
    const isInstant = ticketData.ticketType === "INSTANT";

    const newTicketData = {
      ...ticketData,
      ticketNumber,
      scheduledDate: isInstant ? null : ticketData.scheduledDate,
      status: "CREATED",
    };

    const createdTicket = await this.create(newTicketData);

    // ✅ Re-fetch the ticket with all relevant info populated
    const detailedTicket = await this.findById(createdTicket._id)
      .populate("createdBy", "name mobile role")
      .populate("requestor.org", "name")
      .populate("requestor.department", "name")
      .populate("operator.org", "name")
      .populate("operator.department", "name");

    return {
      success: true,
      message: "Ticket created successfully",
      data: detailedTicket,
    };
  } catch (error) {
    console.error("Error in createTicket model:", error);
    return {
      success: false,
      message: "Internal server error",
      data: null,
    };
  }
};

ticketSchema.statics.addNote = async function (data) {
  try {
    const { Id, noteData, addedBy } = data;

    const ticket = await this.findById(Id);
    if (!ticket) {
      return {
        data: null,
        message: "Ticket not found",
        success: false,
      };
    }

    const user = await User.findById(addedBy);
    if (!user) {
      return {
        data: null,
        message: "User not found",
        success: false,
      };
    }

    const note = {
      text: noteData.text,
      addedBy: addedBy,
      createdAt: new Date(),
    };

    if (user.role === "KAP_EMPLOYEE") {
      let targetOrgId = null;

      if (noteData.targetOrg === "requestor") {
        targetOrgId = ticket.requestor.org;
      } else if (noteData.targetOrg === "operator") {
        targetOrgId = ticket.operator.org;
      }

      ticket.kapNotes.push({
        ...note,
        targetOrg: targetOrgId,
      });
    } else {
      ticket.orgNotes.push({
        text: noteData.text,
        addedBy: addedBy,
      });
    }

    ticket.updatedAt = new Date();
    await ticket.save();

    const updatedTicket = await this.findById(Id)
      .populate("requestor.org", "name _id")
      .populate("requestor.department", "name _id")
      .populate("operator.org", "name _id")
      .populate("operator.department", "name _id")
      .populate("createdBy", "name _id role")
      .populate("assignments.requestor.user", "name _id role department")
      .populate("assignments.operator.user", "name _id role department")
      .populate("progress.updatedBy", "name role department")
      .populate("kapNotes.addedBy", "name role")
      .populate("orgNotes.addedBy", "name role")
      .lean();

    return {
      success: true,
      messgae: "Added Succesfully",
      data: updatedTicket,
    };
  } catch (error) {
    console.log("[model]Error updating  note:", error);
    return { data: null, message: "internal server error", success: false };
  }
};

ticketSchema.statics.updateProgress = async function (data) {
  try {
    const { Id, progressData, addedBy } = data;
    const ticket = await this.findById(Id);

    if (!ticket) {
      return { success: false, message: "Ticket not found", data: null };
    }

    const progress = {
      percentage: progressData.percentage,
      observation: progressData.observation,
      imageUrl: progressData.imageUrl || null,
      updatedBy: addedBy,
      updatedAt: new Date(),
    };

    ticket.progress = [...(ticket.progress || []), progress];
    ticket.updatedAt = new Date();
    await ticket.save();

    const updatedTicket = await this.getFormattedTicket(Id);

    return {
      success: true,
      message: "Progress updated successfully",
      data: updatedTicket,
    };
  } catch (error) {
    console.error("Error updating progress:", error);
    return { success: false, message: "Internal server error", data: null };
  }
};

ticketSchema.statics.updateStatus = async function (data) {
  const { Id, newStatus, addedBy } = data;
  try {
    const ticket = await this.findById(Id);
    if (!ticket) {
      return { success: false, message: "Ticket not found", data: null };
    }

    const now = new Date();
    let statusToSet = newStatus;

    // Define allowed status transitions
    const statusTransitions = {
      CREATED: ["ACCEPTED", "TRANSFER_REQUESTED"],
      ACCEPTED: ["IN_PROGRESS", "TRANSFER_REQUESTED", "CREATED"],
      IN_PROGRESS: ["COMPLETED", "TRANSFER_REQUESTED", "ACCEPTED"],
      COMPLETED: ["CLOSED", "IN_PROGRESS"],
      CLOSED: [],
      TRANSFER_REQUESTED: ["ACCEPTED", "CREATED"],
    };

    // Validate the transition
    const currentStatus = ticket.status;
    const allowedNextStatuses = statusTransitions[currentStatus] || [];

    if (!allowedNextStatuses.includes(statusToSet)) {
      return {
        success: false,
        message: `Invalid status transition from ${currentStatus} to ${statusToSet}`,
        data: null,
        allowedTransitions: allowedNextStatuses,
      };
    }

    // Update the status
    ticket.status = statusToSet;
    ticket.updatedAt = new Date();

    // Handle date updates based on status
    if (statusToSet === "COMPLETED") {
      ticket.closedBy = addedBy;
      ticket.endDate = new Date();
    } else if (statusToSet === "IN_PROGRESS") {
      // Set startDate when work begins (for both INSTANT and SCHEDULED)
      // No validation against scheduled date - allow early start
      ticket.startDate = new Date();
    }

    await ticket.save();

    const updatedTicket = await this.getFormattedTicket(Id);
    return {
      success: true,
      message: "Status updated successfully",
      data: updatedTicket,
    };
  } catch (error) {
    console.error("Error updating status:", error);
    return { success: false, message: "Internal server error", data: null };
  }
};

ticketSchema.statics.handleTransfer = async function (data) {
  try {
    const { Id, transferData } = data;
    console.log("[handleTransfer] Id:", Id, "transferData:", transferData);
    const ticket = await this.findById(Id);
    if (!ticket) {
      return { success: false, message: "Ticket not found", data: null };
    }

    if (transferData.transferKind === "TRANSFER_TICKET") {
      // Direct assignment
      const { assignTo, targetOrg } = transferData;
      if (targetOrg === "operator") {
        ticket.assignments.operator = {
          user: assignTo,
          assignedAt: new Date(),
        };
      } else if (targetOrg === "requestor") {
        ticket.assignments.requestor = {
          user: assignTo,
          assignedAt: new Date(),
        };
      } else {
        return {
          success: false,
          message: "Invalid targetOrg for transfer",
          data: null,
        };
      }
    } else if (transferData.transferKind === "TRANSFER_REQUEST") {
      // Add a transfer request
      const transferRequest = {
        type: transferData.type, // e.g., "DEPARTMENT" or "EMPLOYEE"
        requestedBy: transferData.requestedBy,
        organization: transferData.organization,
        currentDepartment: transferData.currentDepartment,
        reason: transferData.reason,
        status: "PENDING",
        createdAt: new Date(),
      };
      if (transferData.type === "DEPARTMENT") {
        transferRequest.targetDepartment = transferData.targetDepartment;
      } else if (transferData.type === "EMPLOYEE") {
        transferRequest.targetEmployee = transferData.targetEmployee;
      }
      ticket.transferRequests = [
        ...(ticket.transferRequests || []),
        transferRequest,
      ];
      ticket.status = "TRANSFER_REQUESTED";
    } else {
      return {
        success: false,
        message: "Invalid transferKind for transfer",
        data: null,
      };
    }

    ticket.updatedAt = new Date();
    await ticket.save();

    // Use getFormattedTicket for consistent response
    const formattedTicket = await this.getFormattedTicket(Id);
    return {
      success: true,
      message: "Ticket transfer handled successfully",
      data: formattedTicket,
    };
  } catch (error) {
    console.error("[handleTransfer] Error handling transfer:", error);
    return { success: false, message: "Internal server error", data: null };
  }
};

// New static methods for transfer requests
ticketSchema.statics.createTransferRequest = async function (data) {
  try {
    const { ticketId, userId, transferData } = data;
    console.log(
      "[createTransferRequest] ticketId:",
      ticketId,
      "userId:",
      userId,
      "transferData:",
      transferData
    );

    const ticket = await this.findById(ticketId);
    if (!ticket) {
      return { success: false, message: "Ticket not found", data: null };
    }

    // Get current user info
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return { success: false, message: "User not found", data: null };
    }

    // Determine request type based on user role
    let requestType = "EMPLOYEE"; // Default
    let fromField = null;
    let modelType = "User"; // Default

    if (
      currentUser.role === "GOV_MANAGER" ||
      currentUser.role === "OP_MANAGER"
    ) {
      // Manager role - Department transfer
      requestType = "DEPARTMENT";
      fromField = currentUser.department; // User's department ID
      modelType = "Department";
    } else {
      // Employee role - Employee transfer
      requestType = "EMPLOYEE";
      fromField = currentUser._id; // User's ID
      modelType = "User";
    }

    // Generate unique ID for the transfer request
    const requestId = `TR-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Create transfer request object
    const transferRequest = {
      id: requestId,
      type: requestType,
      from: fromField,
      to: transferData.to,
      model: modelType,
      status: "PENDING",
      reason: transferData.reason,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add to ticket's transfer requests
    ticket.transferRequests = [
      ...(ticket.transferRequests || []),
      transferRequest,
    ];
    ticket.status = "TRANSFER_REQUESTED";
    ticket.updatedAt = new Date();

    await ticket.save();

    // Return formatted ticket
    const formattedTicket = await this.getFormattedTicket(ticketId);
    return {
      success: true,
      message: "Transfer request created successfully",
      data: formattedTicket,
    };
  } catch (error) {
    console.error("[createTransferRequest] Error:", error);
    return { success: false, message: "Internal server error", data: null };
  }
};

ticketSchema.statics.acceptTransferRequest = async function (data) {
  try {
    const { ticketId, requestId, acceptedBy } = data;
    console.log(
      "[acceptTransferRequest] ticketId:",
      ticketId,
      "requestId:",
      requestId
    );

    const ticket = await this.findById(ticketId);
    if (!ticket) {
      return { success: false, message: "Ticket not found", data: null };
    }

    // Find the transfer request
    const transferRequest = ticket.transferRequests.find(
      (req) => req.id === requestId
    );
    if (!transferRequest) {
      return {
        success: false,
        message: "Transfer request not found",
        data: null,
      };
    }

    if (transferRequest.status !== "PENDING") {
      return {
        success: false,
        message: "Transfer request is not pending",
        data: null,
      };
    }

    // Update transfer request status
    transferRequest.status = "ACCEPTED";
    transferRequest.updatedAt = new Date();

    // Update ticket status back to previous state (remove TRANSFER_REQUESTED)
    // Find the most recent non-transfer status or default to CREATED
    const nonTransferStatuses =
      ticket.progress.length > 0 ? "IN_PROGRESS" : "CREATED";
    ticket.status = nonTransferStatuses;

    // If it's an employee transfer, update the assignment
    if (transferRequest.type === "EMPLOYEE") {
      // Determine which side (requestor/operator) to update based on the transfer
      // This logic needs to be refined based on your business rules
      if (transferRequest.to) {
        // Update assignment based on the transfer direction
        // You might need to add logic here to determine which assignment to update
      }
    }

    // If it's a department transfer, update the department assignment
    if (transferRequest.type === "DEPARTMENT") {
      // Update department assignment based on the transfer
      // This logic needs to be refined based on your business rules
    }

    ticket.updatedAt = new Date();
    await ticket.save();

    // Return formatted ticket
    const formattedTicket = await this.getFormattedTicket(ticketId);
    return {
      success: true,
      message: "Transfer request accepted successfully",
      data: formattedTicket,
    };
  } catch (error) {
    console.error("[acceptTransferRequest] Error:", error);
    return { success: false, message: "Internal server error", data: null };
  }
};

ticketSchema.statics.declineTransferRequest = async function (data) {
  try {
    const { ticketId, requestId, declineReason } = data;
    console.log(
      "[declineTransferRequest] ticketId:",
      ticketId,
      "requestId:",
      requestId
    );

    const ticket = await this.findById(ticketId);
    if (!ticket) {
      return { success: false, message: "Ticket not found", data: null };
    }

    // Find the transfer request
    const transferRequest = ticket.transferRequests.find(
      (req) => req.id === requestId
    );
    if (!transferRequest) {
      return {
        success: false,
        message: "Transfer request not found",
        data: null,
      };
    }

    if (transferRequest.status !== "PENDING") {
      return {
        success: false,
        message: "Transfer request is not pending",
        data: null,
      };
    }

    // Update transfer request status
    transferRequest.status = "DECLINED";
    transferRequest.declineReason = declineReason;
    transferRequest.updatedAt = new Date();

    // Update ticket status back to previous state (remove TRANSFER_REQUESTED)
    // Find the most recent non-transfer status or default to CREATED
    const nonTransferStatuses =
      ticket.progress.length > 0 ? "IN_PROGRESS" : "CREATED";
    ticket.status = nonTransferStatuses;

    ticket.updatedAt = new Date();
    await ticket.save();

    // Return formatted ticket
    const formattedTicket = await this.getFormattedTicket(ticketId);
    return {
      success: true,
      message: "Transfer request declined successfully",
      data: formattedTicket,
    };
  } catch (error) {
    console.error("[declineTransferRequest] Error:", error);
    return { success: false, message: "Internal server error", data: null };
  }
};

ticketSchema.statics.getTicketById = async function (ticketId) {
  try {
    const ticket = await this.findById(ticketId);

    if (!ticket) {
      return { success: false, data: null, message: "Ticket Not Found" };
    }

    const ticketData = await this.getFormattedTicket(ticketId);
    if (ticketData) {
      return { success: true, data: ticketData, message: "Ticket Found" };
    } else {
      return {
        success: false,
        data: null,
        message: "unable to get ticket internal error",
      };
    }
  } catch (error) {
    console.error("Error getting ticket by ID:", error);
    return createErrorResponse("FETCH", "TICKET", "INTERNAL_ERROR");
  }
};

ticketSchema.statics.getTickets = async function ({
  role,
  userId,
  orgId,
  departmentId,
}) {
  try {
    const filter = {};

    switch (role) {
      case "KAP_EMPLOYEE":
        filter["createdBy"] = userId;
        break;

      case "GOV_EMPLOYEE":
        filter.$or = [{ "assignments.requestor.user": userId }];
        break;

      case "OP_EMPLOYEE":
        console.log(userId);
        filter.$or = [{ "assignments.operator.user": userId }];
        break;

      case "GOV_MANAGER":
        if (orgId) filter["requestor.org"] = orgId;
        if (departmentId) filter["requestor.department"] = departmentId;
        break;

      case "OP_MANAGER":
        if (orgId) filter["operator.org"] = orgId;
        if (departmentId) filter["operator.department"] = departmentId;
        break;

      default:
        return { success: false, message: "Invalid role", data: [] };
    }

    const tickets = await this.find(filter)
      .sort({ createdAt: -1 })
      .populate("requestor.org", "name")
      .populate("requestor.department", "name")
      .populate("operator.org", "name")
      .populate("operator.department", "name")
      .populate("createdBy", "name role")
      .populate("assignments.requestor.user", "name role department")
      .populate("assignments.operator.user", "name role department")
      .lean();

    const formattedData = tickets.map((t) => ({
      _id: t._id,
      ticketNumber: t.ticketNumber,
      request: t.request,
      requestor: {
        orgName: t.requestor?.org?.name || null,
        departmentName: t.requestor?.department?.name || null,
      },
      operator: {
        orgName: t.operator?.org?.name || null,
        departmentName: t.operator?.department?.name || null,
      },
    }));

    return {
      success: true,
      message: "Tickets fetched successfully",
      data: formattedData,
    };
  } catch (error) {
    console.error("Error in getTickets:", error);
    return {
      success: false,
      message: "Internal server error",
      data: [],
    };
  }
};

ticketSchema.statics.deleteTicketById = async function (ticketId) {
  try {
    const ticket = await this.findById(ticketId);
    if (!ticket) {
      return { success: false, message: "Ticket not found", data: null };
    }

    await this.findByIdAndDelete(ticketId);
    const allTickets = await this.find({});
    return {
      success: true,
      message: "Ticket deleted successfully",
      data: allTickets,
    };
  } catch (error) {
    console.error("Error deleting ticket:", error);
    return { success: false, message: "Internal server error", data: null };
  }
};

ticketSchema.statics.generateTicketNumber = async function () {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const today = new Date(date.setHours(0, 0, 0, 0));
  const count = await this.countDocuments({
    createdAt: { $gte: today },
  });
  const sequence = (count + 1).toString().padStart(4, "0");
  return `${year}${month}${day}-${sequence}`;
};

const Ticket = mongoose.model("Ticket", ticketSchema);

export default Ticket;
