const ticketSchema = new mongoose.Schema({
  ticketNumber: { type: String, unique: true, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },

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
      "ASSIGNED",
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
    default: "MEDIUM",
  },

  // Scheduling
  startDate: { type: Date, required: true },
  endDate: { type: Date },

  // Assignment
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  // Communication
  messages: [
    {
      text: { type: String, required: true },
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      recipients: [
        {
          user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          read: { type: Boolean, default: false },
        },
      ],
      createdAt: { type: Date, default: Date.now },
    },
  ],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
