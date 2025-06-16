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

  startDate: {
    type: Date,
    required: true,
  },

  endDate: { type: Date },

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

  notifications: [
    {
      type: {
        type: String,
        enum: ["ORGANIZATION", "DEPARTMENT_MANAGER"],
        required: true,
      },
      recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      mobile: {
        type: String,
        required: true,
      },
      sentAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

ticketSchema.statics.createTicket = async function (ticketData) {
  try {
    const ticketNumber = await this.generateTicketNumber();
    const newTicketData = {
      ...ticketData,
      ticketNumber,
      startDate:
        ticketData.ticketType === "INSTANT"
          ? new Date()
          : ticketData.scheduledDate,
      status: "CREATED",
    };
    const createdTicket = await this.create(newTicketData);
    const allTickets = await this.find({})
      .select("ticketNumber _id request operator requestor status progress")
      .populate("requestor.org", "name")
      .populate("requestor.department", "name")
      .populate("operator.org", "name")
      .populate("operator.department", "name")
      .populate("assignments.requestor.user", "name")
      .populate("assignments.operator.user", "name");
    return createSuccessResponse("CREATE", "TICKET", allTickets);
  } catch (error) {
    console.error("Error in createTicket model:", error);
    return createErrorResponse("CREATE", "TICKET", "INTERNAL_ERROR");
  }
};

ticketSchema.statics.addNote = async function (data) {
  try {
    const { Id, noteData } = data;

    const ticket = await this.findById(Id);

    if (!ticket) {
      return {
        data: null,
        message: "ticket not found",
        success: false,
      };
    }

    const user = await User.findById(noteData.addedBy);
    if (!user) {
      return createErrorResponse("UPDATE", "TICKET", "USER_NOT_FOUND");
    }

    const note = {
      text: noteData.text,
      addedBy: noteData.addedBy,
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
      ticket.orgNotes.push(note);
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

ticketSchema.statics.updateProgress = async function (ticketId, progressData) {
  try {
    const ticket = await this.findById(ticketId);
    if (!ticket) {
      return createErrorResponse("UPDATE", "TICKET", "NOT_FOUND");
    }

    const progress = {
      percentage: progressData.percentage,
      observation: progressData.observation,
      updatedBy: progressData.addedBy,
      updatedAt: new Date(),
    };

    ticket.progress = [...(ticket.progress || []), progress];
    ticket.updatedAt = new Date();
    await ticket.save();

    const updatedTicket = await this.findById(ticketId).populate(
      "progress.updatedBy",
      "name role department"
    );

    return createSuccessResponse("UPDATE", "TICKET", updatedTicket);
  } catch (error) {
    console.error("Error updating progress:", error);
    return createErrorResponse("UPDATE", "TICKET", "INTERNAL_ERROR");
  }
};

ticketSchema.statics.updateStatus = async function (ticketId, status) {
  try {
    const ticket = await this.findById(ticketId);
    if (!ticket) {
      return createErrorResponse("UPDATE", "TICKET", "NOT_FOUND");
    }

    const allowedStatuses = [
      "CREATED",
      "ACCEPTED",
      "IN_PROGRESS",
      "COMPLETED",
      "CLOSED",
      "TRANSFER_REQUESTED",
    ];

    if (!allowedStatuses.includes(status)) {
      return createErrorResponse("UPDATE", "TICKET", "INVALID_STATUS");
    }

    ticket.status = status;
    ticket.updatedAt = new Date();
    await ticket.save();

    return createSuccessResponse("UPDATE", "TICKET", ticket);
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
    const ticket = await this.findById(ticketId)
      .populate("requestor.org", "name _id")
      .populate("requestor.department", "name _id")
      .populate("operator.org", "name _id")
      .populate("operator.department", "name _id")
      .populate("createdBy", "name _id role kapRole")
      .populate("assignments.requestor.user", "name _id role department")
      .populate("assignments.operator.user", "name _id role department")
      .populate("progress.updatedBy", "name role department")
      .populate("kapNotes.addedBy", "name kapRole")
      .populate("orgNotes.addedBy", "name role")
      .populate("kapNotes.targetOrg", "name _id")
      .lean();

    if (!ticket) {
      return { success: false, data: null, message: "Ticket Not Found" };
    }

    const formattedTicket = {
      _id: ticket._id,
      ticketNumber: ticket.ticketNumber,
      request: ticket.request,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      startDate: ticket.startDate,
      endDate: ticket.endDate,
      ticketType: ticket.ticketType,
      scheduledDate: ticket.scheduledDate,

      requestor: {
        orgName: ticket.requestor?.org?.name || null,
        orgId: ticket.requestor?.org?._id || null,
      },
      operator: {
        orgName: ticket.operator?.org?.name || null,
        orgId: ticket.operator?.org?._id || null,
      },
      assignments: {
        requestor: {
          user: {
            name: ticket.assignments?.requestor?.user?.name || null,
          },
          status: ticket.assignments?.requestor?.status || null,
          assignedAt: ticket.assignments?.requestor?.assignedAt || null,
        },
        operator: {
          user: {
            name: ticket.assignments?.operator?.user?.name || null,
          },
          status: ticket.assignments?.operator?.status || null,
          assignedAt: ticket.assignments?.operator?.assignedAt || null,
        },
      },
      progress:
        ticket.progress?.map((p) => ({
          percentage: p.percentage,
          observation: p.observation,
          updatedBy: {
            name: p.updatedBy?.name || null,
            role: p.updatedBy?.role?.split("_")[0] || null,
          },
          updatedAt: p.updatedAt,
        })) || [],
      kapNotes:
        ticket.kapNotes?.map((note) => ({
          text: note.text,
          targetOrg: {
            name: note.targetOrg?.name || null,
            id: note.targetOrg?._id || null,
          },
          addedBy: {
            name: note.addedBy?.name || null,
            role: note.addedBy?.kapRole || null,
          },
          createdAt: note.createdAt,
        })) || [],
      orgNotes:
        ticket.orgNotes?.map((note) => ({
          text: note.text,
          addedBy: {
            name: note.addedBy?.name || null,
            role: note.addedBy?.role?.split("_")[0] || null,
          },
          createdAt: note.createdAt,
        })) || [],

      createdBy: {
        name: ticket.createdBy?.name || null,
        role: ticket.createdBy?.kapRole || null,
      },
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
    };

    return { success: true, data: formattedTicket, message: "Ticket Found" };
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
