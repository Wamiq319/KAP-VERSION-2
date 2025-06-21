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
  },

  finishDate: {
    type: Date,
  },

  startDate: {
    type: Date,
    default: null,
  },

  closedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

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
      scheduledDate: ticket.scheduledDate,
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
        type: request.type,
        requestedBy: request.requestedBy,
        organization: request.organization,
        currentDepartment: request.currentDepartment,
        targetDepartment: request.targetDepartment,
        targetEmployee: request.targetEmployee,
        reason: request.reason,
        status: request.status,
        createdAt: request.createdAt,
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
      scheduledDate: isInstant ? new Date() : ticketData.scheduledDate,
      status: "CREATED",
    };
    const createdTicket = await this.create(newTicketData);

    return {
      success: true,
      message: "Ticket created successfully",
      data: createdTicket,
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
      return createErrorResponse("UPDATE", "TICKET", "NOT_FOUND");
    }

    const progress = {
      percentage: progressData.percentage,
      observation: progressData.observation,
      updatedBy: addedBy,
      updatedAt: new Date(),
    };

    ticket.progress = [...(ticket.progress || []), progress];
    ticket.updatedAt = new Date();
    await ticket.save();

    const updatedTicket = this.getFormattedTicket(Id);

    return createSuccessResponse("UPDATE", "TICKET", updatedTicket);
  } catch (error) {
    console.error("Error updating progress:", error);
    return createErrorResponse("UPDATE", "TICKET", "INTERNAL_ERROR");
  }
};

ticketSchema.statics.updateStatus = async function (data) {
  const { Id, newStatus, addedBy } = data;
  try {
    // 1. Get the ticket

    const ticket = await this.findById(Id);
    if (!ticket) {
      return {
        success: false,
        message: "Ticket not found",
        data: null,
      };
    }

    // 2. Check if scheduled date has passed and should auto-progress
    const now = new Date();
    if (
      newStatus === "ACCEPTED" &&
      ticket.ticketType === "SCHEDULED" &&
      ticket.scheduledDate &&
      ticket.scheduledDate <= now
    ) {
      newStatus = "IN_PROGRESS";
    }

    // 3. Define allowed status transitions
    const statusTransitions = {
      CREATED: ["ACCEPTED", "TRANSFER_REQUESTED"],
      ACCEPTED: ["IN_PROGRESS", "TRANSFER_REQUESTED", "CREATED"],
      IN_PROGRESS: ["COMPLETED", "TRANSFER_REQUESTED", "ACCEPTED"],
      COMPLETED: ["CLOSED", "IN_PROGRESS"],
      CLOSED: [], // No transitions from closed state
      TRANSFER_REQUESTED: ["ACCEPTED", "CREATED"],
    };

    // 4. Validate the transition
    const currentStatus = ticket.status;
    const allowedNextStatuses = statusTransitions[currentStatus] || [];

    if (!allowedNextStatuses.includes(newStatus)) {
      return {
        success: false,
        message: `Invalid status transition from ${currentStatus} to ${newStatus}`,
        data: null,
        allowedTransitions: allowedNextStatuses,
      };
    }

    // 6. Update the status
    ticket.status = newStatus;
    ticket.updatedAt = new Date();

    if (newStatus === "COMPLETED") {
      ticket.closedBy = addedBy;
      ticket.endDate = new Date();
    } else if (newStatus === "IN_PROGRESS") {
      ticket.startDate = ticket.startDate || new Date();
    }

    await ticket.save();

    // 8. Return formatted response
    const updatedTicket = await this.getFormattedTicket(Id);
    return createSuccessResponse("UPDATE", "TICKET", updatedTicket);
  } catch (error) {
    console.error("Error updating status:", error);
    return createErrorResponse("UPDATE", "TICKET", "INTERNAL_ERROR");
  }
};

ticketSchema.statics.assignTo = async function (ticketId, assignmentData) {
  try {
    const ticket = await this.findById(ticketId);
    if (!ticket) {
      return createErrorResponse("UPDATE", "TICKET", "NOT_FOUND");
    }

    const { role, userId, status = "PENDING" } = assignmentData;
    const allowedStatuses = ["PENDING", "ACCEPTED", "REJECTED"];

    if (!allowedStatuses.includes(status)) {
      return createErrorResponse("UPDATE", "TICKET", "INVALID_STATUS");
    }

    if (role === "requestor") {
      ticket.assignments.requestor = {
        user: userId,
        status,
        assignedAt: new Date(),
      };
    } else if (role === "operator") {
      ticket.assignments.operator = {
        user: userId,
        status,
        assignedAt: new Date(),
      };
    }

    ticket.updatedAt = new Date();
    await ticket.save();

    const updatedTicket = await this.findById(ticketId)
      .populate("assignments.requestor.user", "name role department")
      .populate("assignments.operator.user", "name role department");

    return createSuccessResponse("UPDATE", "TICKET", updatedTicket);
  } catch (error) {
    console.error("Error assigning ticket:", error);
    return createErrorResponse("UPDATE", "TICKET", "INTERNAL_ERROR");
  }
};

ticketSchema.statics.openTransferRequest = async function (
  ticketId,
  transferData
) {
  try {
    const ticket = await this.findById(ticketId);
    if (!ticket) {
      return createErrorResponse("UPDATE", "TICKET", "NOT_FOUND");
    }

    const transferRequest = {
      type: transferData.type,
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
    ticket.updatedAt = new Date();
    await ticket.save();

    const updatedTicket = await this.findById(ticketId)
      .populate("transferRequests.requestedBy", "name role")
      .populate("transferRequests.targetEmployee", "name role")
      .populate("transferRequests.targetDepartment", "name");

    return createSuccessResponse("UPDATE", "TICKET", updatedTicket);
  } catch (error) {
    console.error("Error creating transfer request:", error);
    return createErrorResponse("UPDATE", "TICKET", "INTERNAL_ERROR");
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
        filter.$or = [
          { "assignments.operator.user": userId },
          { "requestor.department": departmentId },
        ];
        break;

      case "OP_EMPLOYEE":
        filter.$or = [
          { "assignments.requestor.user": userId },
          { "operator.department": departmentId },
        ];
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
      return createErrorResponse("DELETE", "TICKET", "NOT_FOUND");
    }

    await this.findByIdAndDelete(ticketId);
    const allTickets = await this.find({});
    return createSuccessResponse("DELETE", "TICKET", allTickets);
  } catch (error) {
    console.error("Error deleting ticket:", error);
    return createErrorResponse("DELETE", "TICKET", "INTERNAL_ERROR");
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
