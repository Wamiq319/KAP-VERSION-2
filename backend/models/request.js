const transferRequestSchema = new mongoose.Schema({
  ticket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ticket",
    required: true,
  },

  entityType: {
    type: String,
    enum: ["DEPARTMENT", "EMPLOYEE"],
    required: true,
  },

  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
  },

  // Who initiated the request (employee or manager)
  openedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  // FROM: current department or employee
  from: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "fromModel",
    required: true,
  },
  fromModel: {
    type: String,
    enum: ["Department", "User"],
    required: true,
  },

  // TO: target department or employee
  to: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "toModel",
    required: true,
  },
  toModel: {
    type: String,
    enum: ["Department", "User"],
    required: true,
  },

  openReason: {
    type: String,
  },

  // EMPLOYEE transfer only: needs approval
  approval: {
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    rejectionReason: String,
  },

  // ALL transfers: must be accepted by the recipient (department manager or employee)
  acceptance: {
    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    acceptedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "DECLINED"],
      default: "PENDING",
    },
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});
