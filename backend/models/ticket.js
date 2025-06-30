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
    enum: ["CREATED", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "CLOSED"],
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
      },

      // To: Department ID (for department transfer) or Employee ID (for employee transfer)
      to: {
        type: mongoose.Schema.Types.ObjectId,
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

      transferRequests: await Promise.all(
        ticket.transferRequests?.map(async (request) => {
          // Populate from and to fields based on type
          let fromName = "Unknown";
          let toName = "Unknown";

          try {
            if (request.type === "DEPARTMENT") {
              // For department transfers, populate department names
              if (request.from) {
                const fromDept = await mongoose
                  .model("Department")
                  .findById(request.from)
                  .select("name");
                fromName = fromDept?.name || "Unknown";
              }
              if (request.to) {
                const toDept = await mongoose
                  .model("Department")
                  .findById(request.to)
                  .select("name");
                toName = toDept?.name || "Unknown";
              }
            } else if (request.type === "EMPLOYEE") {
              // For user transfers, populate user names
              if (request.from) {
                const fromUser = await mongoose
                  .model("User")
                  .findById(request.from)
                  .select("name");
                fromName = fromUser?.name || "Unknown";
              }
              if (request.to) {
                const toUser = await mongoose
                  .model("User")
                  .findById(request.to)
                  .select("name");
                toName = toUser?.name || "Unknown";
              }
            }
          } catch (populateError) {
            console.error("Error populating transfer request:", populateError);
          }

          return {
            id: request.id,
            type: request.type,
            from: {
              id: request.from,
              name: fromName,
            },
            to: {
              id: request.to,
              name: toName,
            },
            status: request.status,
            reason: request.reason,
            declineReason: request.declineReason,
            createdAt: request.createdAt,
            updatedAt: request.updatedAt,
          };
        }) || []
      ),
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

  console.log(
    "[updateStatus] ID:",
    Id,
    "Current->New:",
    newStatus,
    "User:",
    addedBy
  );

  try {
    const ticket = await this.findById(Id);

    if (!ticket) {
      console.log("[updateStatus] ❌ Ticket not found");
      return { success: false, message: "Ticket not found", data: null };
    }

    console.log(
      "[updateStatus] Found ticket:",
      ticket.ticketNumber,
      "Status:",
      ticket.status
    );

    // Updated status transitions - allow ACCEPTED and CLOSED from any status
    const statusTransitions = {
      CREATED: ["ACCEPTED", "CLOSED"],
      ACCEPTED: ["IN_PROGRESS", "CREATED", "CLOSED", "COMPLETED"],
      IN_PROGRESS: ["COMPLETED", "ACCEPTED", "CLOSED"],
      COMPLETED: ["CLOSED", "IN_PROGRESS", "ACCEPTED"],
      CLOSED: ["ACCEPTED"], // Allow reopening from CLOSED to ACCEPTED
    };

    // Validate the transition
    const currentStatus = ticket.status;
    const allowedNextStatuses = statusTransitions[currentStatus] || [];

    if (!allowedNextStatuses.includes(newStatus)) {
      console.log(
        "[updateStatus] ❌ Invalid transition:",
        currentStatus,
        "->",
        newStatus,
        "Allowed:",
        allowedNextStatuses
      );
      return {
        success: false,
        message: `Invalid status transition from ${currentStatus} to ${newStatus}`,
        data: null,
        allowedTransitions: allowedNextStatuses,
      };
    }

    console.log("[updateStatus] ✅ Valid transition, updating...");

    // Update the status
    ticket.status = newStatus;
    ticket.updatedAt = new Date();

    // Handle date updates based on status
    if (newStatus === "COMPLETED") {
      ticket.closedBy = addedBy;
      ticket.endDate = new Date();
    } else if (newStatus === "CLOSED") {
      ticket.closedBy = addedBy;
      ticket.endDate = new Date();
    } else if (newStatus === "IN_PROGRESS") {
      ticket.startDate = new Date();
    }

    await ticket.save();
    console.log("[updateStatus] ✅ Status updated to:", newStatus);

    const updatedTicket = await this.getFormattedTicket(Id);
    return {
      success: true,
      message: "Status updated successfully",
      data: updatedTicket,
    };
  } catch (error) {
    console.error("[updateStatus] ❌ Error:", error.message);
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

    // Direct assignment - simplified without transferKind logic
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

    if (
      currentUser.role === "GOV_MANAGER" ||
      currentUser.role === "OP_MANAGER"
    ) {
      // Manager role - Department transfer
      requestType = "DEPARTMENT";
      fromField = currentUser.department; // User's department ID
    } else {
      // Employee role - Employee transfer
      requestType = "EMPLOYEE";
      fromField = currentUser._id; // User's ID
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
      requestId,
      "acceptedBy:",
      acceptedBy
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

    // Handle the transfer based on type
    if (transferRequest.type === "DEPARTMENT") {
      // For department transfers, update the operator department
      ticket.operator.department = transferRequest.to;
      // Clear operator assignment
      ticket.assignments.operator = {
        user: null,
        assignedAt: new Date(),
      };
    } else if (transferRequest.type === "EMPLOYEE") {
      // For employee transfers, update the operator assignment
      ticket.assignments.operator = {
        user: transferRequest.to,
        assignedAt: new Date(),
      };
    }

    // Update ticket status to ACCEPTED if it was in a different state
    if (ticket.status !== "ACCEPTED") {
      ticket.status = "ACCEPTED";
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
    const { ticketId, requestId, declinedBy } = data;
    console.log(
      "[declineTransferRequest] ticketId:",
      ticketId,
      "requestId:",
      requestId,
      "declinedBy:",
      declinedBy
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

    // Update transfer request status to DECLINED
    transferRequest.status = "DECLINED";
    transferRequest.updatedAt = new Date();

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
  transferRequestMode = false, // New parameter
}) {
  try {
    const filter = {};

    if (transferRequestMode) {
      // Transfer request filtering logic
      filter["transferRequests"] = { $exists: true, $ne: [] };
      filter["transferRequests.status"] = "PENDING";

      switch (role) {
        case "GOV_MANAGER":
        case "OP_MANAGER":
          // Managers see department transfer requests TO their department
          filter["transferRequests.type"] = "DEPARTMENT";
          filter["transferRequests.to"] = departmentId;
          break;

        case "GOV_EMPLOYEE":
        case "OP_EMPLOYEE":
          // Employees see employee transfer requests TO them
          filter["transferRequests.type"] = "EMPLOYEE";
          filter["transferRequests.to"] = userId;
          break;

        default:
          return {
            success: false,
            message: "Invalid role for transfer requests",
            data: [],
          };
      }
    } else {
      // Existing regular ticket filtering logic
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
    }

    const tickets = await this.find(filter).sort({ createdAt: -1 }).lean();

    // Use getFormattedTicket for each ticket to maintain consistency
    const formattedTickets = await Promise.all(
      tickets.map(async (ticket) => {
        const formattedTicket = await this.getFormattedTicket(ticket._id);
        if (formattedTicket) {
          // For list view, we only need essential fields
          return {
            _id: formattedTicket._id,
            ticketNumber: formattedTicket.ticketNumber,
            request: formattedTicket.request,
            status: formattedTicket.status,
            priority: formattedTicket.priority,
            createdAt: formattedTicket.createdAt,
            requestor: formattedTicket.requestor,
            operator: formattedTicket.operator,
            // Include transfer requests for transfer request mode
            transferRequests: transferRequestMode
              ? formattedTicket.transferRequests
              : undefined,
          };
        }
        return null;
      })
    );

    // Filter out any null values (tickets that couldn't be formatted)
    const validTickets = formattedTickets.filter((ticket) => ticket !== null);

    return {
      success: true,
      message: transferRequestMode
        ? "Transfer requests fetched successfully"
        : "Tickets fetched successfully",
      data: validTickets,
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
