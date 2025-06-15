import mongoose from "mongoose";
import {
  createSuccessResponse,
  createErrorResponse,
} from "../utils/responseHandler.js";

const ticketSchema = new mongoose.Schema({
  ticketNumber: { type: String, unique: true, required: true },

  request: { type: String, required: true },
  description: { type: String, required: true },

  // Progress tracking array
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

  // Requesting Government Organization
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

  // Operating Company Handling
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

  // Workflow
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

  // Scheduling
  startDate: {
    type: Date,
    required: true,
  },
  endDate: { type: Date },

  // Assignment
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  // Assignments from both organizations
  assignments: {
    requestor: {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      assignedAt: {
        type: Date,
        default: Date.now,
      },
      status: {
        type: String,
        enum: ["PENDING", "ACCEPTED", "REJECTED"],
        default: "PENDING",
      },
    },
    operator: {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      assignedAt: {
        type: Date,
        default: Date.now,
      },
      status: {
        type: String,
        enum: ["PENDING", "ACCEPTED", "REJECTED"],
        default: "PENDING",
      },
    },
  },

  // Transfer Requests
  transferRequests: [
    {
      type: {
        type: String,
        enum: ["DEPARTMENT", "EMPLOYEE"],
        required: true,
      },
      requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
      },
      currentDepartment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
        required: true,
      },
      // For department transfers
      targetDepartment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
        required: function () {
          return this.type === "DEPARTMENT";
        },
      },
      // For employee transfers
      targetEmployee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: function () {
          return this.type === "EMPLOYEE";
        },
      },
      reason: {
        type: String,
        required: true,
      },
      status: {
        type: String,
        enum: ["PENDING", "APPROVED", "REJECTED"],
        default: "PENDING",
      },
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      approvedAt: {
        type: Date,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],

  // KAP Notes
  kapNotes: [
    {
      text: { type: String, required: true },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      kapRole: {
        type: String,
        enum: [
          "GOVERNMENT_INTEGRATION",
          "SECURITY_SAFETY",
          "PLANNING_DEVELOPMENT",
        ],
        required: true,
      },
      targetOrgId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
      },
      createdAt: { type: Date, default: Date.now },
    },
  ],

  // Organization Notes
  orgNotes: [
    {
      text: { type: String, required: true },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
        required: true,
      },
      createdAt: { type: Date, default: Date.now },
    },
  ],

  // Ticket Type and Scheduling
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
  console.log("=== Starting Model Ticket Creation ===");
  console.log("Received ticket data:", JSON.stringify(ticketData, null, 2));

  try {
    // Generate unique ticket number
    const ticketNumber = await this.generateTicketNumber();
    console.log("Generated ticket number:", ticketNumber);

    // Prepare ticket data
    const newTicketData = {
      ...ticketData,
      ticketNumber,
      startDate:
        ticketData.ticketType === "INSTANT"
          ? new Date()
          : ticketData.scheduledDate,
      status: "CREATED",
      assignments: {
        requestor: {
          user: ticketData.createdBy,
          status: "PENDING",
        },
        operator: {
          user: ticketData.createdBy,
          status: "PENDING",
        },
      },
    };

    console.log(
      "Final ticket data to be created:",
      JSON.stringify(newTicketData, null, 2)
    );

    // Create the ticket
    console.log("Attempting to create ticket in database...");
    const createdTicket = await this.create(newTicketData);
    console.log("Ticket created successfully in database:", createdTicket._id);

    // Fetch all tickets with specific fields
    console.log("Fetching all tickets after creation...");
    const allTickets = await this.find({})
      .select("ticketNumber _id request operator requestor status progress")
      .populate("requestor.org", "name")
      .populate("requestor.department", "name")
      .populate("operator.org", "name")
      .populate("operator.department", "name")
      .populate("assignments.requestor.user", "name")
      .populate("assignments.operator.user", "name");

    console.log("Total tickets fetched:", allTickets.length);
    console.log(
      "First ticket in response:",
      allTickets[0] ? allTickets[0]._id : "No tickets found"
    );

    return {
      success: true,
      message: "Ticket created successfully",
      data: allTickets,
    };
  } catch (error) {
    console.error("Error in createTicket model:", error);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    return {
      success: false,
      message: "Internal server error",
      data: null,
    };
  }
};

ticketSchema.statics.generateTicketNumber = async function () {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  // Get count of tickets created today
  const today = new Date(date.setHours(0, 0, 0, 0));
  const count = await this.countDocuments({
    createdAt: { $gte: today },
  });

  // Format: YYMMDD-XXXX (where XXXX is a sequential number)
  const sequence = (count + 1).toString().padStart(4, "0");
  return `${year}${month}${day}-${sequence}`;
};

// Get Tickets with advanced filtering
ticketSchema.statics.getTickets = async function ({
  status,
  ticketType,
  requestor,
  operator,
  priority,
  startDate,
  endDate,
  fields,
  limit = 10,
  skip = 0,
  sortBy = "createdAt",
  sortOrder = "desc",
}) {
  try {
    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (ticketType) filter.ticketType = ticketType;
    if (priority) filter.priority = priority;
    if (requestor) filter["requestor.org"] = requestor;
    if (operator) filter["operator.org"] = operator;
    if (startDate || endDate) {
      filter.startDate = {};
      if (startDate) filter.startDate.$gte = new Date(startDate);
      if (endDate) filter.startDate.$lte = new Date(endDate);
    }

    // Build projection object for fields
    const projection = fields
      ? fields.split(",").reduce((acc, field) => {
          acc[field.trim()] = 1;
          return acc;
        }, {})
      : {};

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const tickets = await this.find(filter, projection)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .populate("requestor.org", "name _id")
      .populate("requestor.department", "name _id")
      .populate("operator.org", "name _id")
      .populate("operator.department", "name _id")
      .populate("createdBy", "name _id");

    const total = await this.countDocuments(filter);

    return {
      success: true,
      message: "Tickets retrieved successfully",
      data: {
        tickets,
        total,
        page: Math.floor(skip / limit) + 1,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error getting tickets:", error);
    return {
      success: false,
      message: "Error retrieving tickets",
      data: null,
    };
  }
};

// Delete Ticket
ticketSchema.statics.deleteTicketById = async function (ticketId) {
  try {
    const ticket = await this.findById(ticketId);
    if (!ticket) {
      return {
        success: false,
        message: "Ticket not found",
        data: null,
      };
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
    return {
      success: false,
      message: "Error deleting ticket",
      data: null,
    };
  }
};

// Update Ticket (comprehensive update function)
ticketSchema.statics.updateTicketById = async function (ticketId, updateData) {
  try {
    const ticket = await this.findById(ticketId);
    if (!ticket) {
      return {
        success: false,
        message: "Ticket not found",
        data: null,
      };
    }

    // Handle different types of updates
    const allowedUpdates = {
      // Basic updates
      status: [
        "CREATED",
        "ACCEPTED",
        "IN_PROGRESS",
        "COMPLETED",
        "CLOSED",
        "TRANSFER_REQUESTED",
      ],
      priority: ["LOW", "MEDIUM", "HIGH"],
      description: String,

      // Assignment updates
      "assignments.requestor.user": mongoose.Schema.Types.ObjectId,
      "assignments.requestor.status": ["PENDING", "ACCEPTED", "REJECTED"],
      "assignments.operator.user": mongoose.Schema.Types.ObjectId,
      "assignments.operator.status": ["PENDING", "ACCEPTED", "REJECTED"],

      // Notes updates
      kapNotes: Array,
      orgNotes: Array,

      // Transfer request updates
      transferRequests: Array,

      // Notification updates
      notifications: Array,
    };

    // Validate and prepare update object
    const updateObject = {};
    for (const [key, value] of Object.entries(updateData)) {
      if (key in allowedUpdates) {
        // Handle nested updates
        if (key.includes(".")) {
          const [parent, child] = key.split(".");
          if (!updateObject[parent]) updateObject[parent] = {};
          updateObject[parent][child] = value;
        } else {
          updateObject[key] = value;
        }
      }
    }

    // Add updatedAt timestamp
    updateObject.updatedAt = new Date();

    const updatedTicket = await this.findByIdAndUpdate(
      ticketId,
      { $set: updateObject },
      { new: true, runValidators: true }
    )
      .populate("requestor.org", "name")
      .populate("requestor.department", "name")
      .populate("operator.org", "name")
      .populate("operator.department", "name")
      .populate("createdBy", "name");

    return {
      success: true,
      message: "Ticket updated successfully",
      data: updatedTicket,
    };
  } catch (error) {
    console.error("Error updating ticket:", error);
    return {
      success: false,
      message: "Error updating ticket",
      data: null,
    };
  }
};

const Ticket = mongoose.model("Ticket", ticketSchema);

export default Ticket;
