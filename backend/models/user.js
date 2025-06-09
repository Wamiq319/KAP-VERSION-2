const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
  mobile: { type: String, required: true, unique: true },
  role: {
    type: String,
    enum: [
      "KAP_EMPLOYEE",
      "GOV_MANAGER",
      "OP_MANAGER",
      "GOV_EMPLOYEE",
      "OP_EMPLOYEE",
    ],
    required: true,
  },
  kapRole: { type: String },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
  },
  department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  createdAt: { type: Date, default: Date.now },
});

userSchema.path("department").required(function () {
  return !this.role.includes("KAP_EMPLOYEE");
});

// Enhanced getUserSmsData to accept filter criteria
userSchema.statics.getUserSmsData = async function (criteria = {}) {
  try {
    // If criteria is a user object (existing behavior)
    if (criteria._id || criteria.mobile) {
      return {
        name: criteria.name,
        username: criteria.username,
        mobile: criteria.mobile,
        role: criteria.role,
        kapRole: criteria.kapRole,
        password: criteria.password,
      };
    }

    // If criteria is a filter object (new behavior)
    const users = await this.find(criteria)
      .select("name username mobile role kapRole password")
      .lean();

    return users.map((user) => ({
      name: user.name,
      username: user.username,
      mobile: user.mobile,
      role: user.role,
      kapRole: user.kapRole,
      password: user.password,
    }));
  } catch (error) {
    console.error("Error getting user SMS data:", error);
    return null;
  }
};

userSchema.statics.createUser = async function (userData) {
  try {
    if (await this.findOne({ username: userData.username })) {
      return {
        success: false,
        message: "Username already exists",
        data: [],
      };
    }

    if (await this.findOne({ mobile: userData.mobile })) {
      return {
        success: false,
        message: "Mobile number already exists",
        data: [],
      };
    }

    if (!userData.role.includes("KAP_EMPLOYEE") && !userData.department) {
      return {
        success: false,
        message: "Department is required for this role",
        data: [],
      };
    }

    const newUser = await this.create(userData);
    const allUsers = await this.find({})
      .populate("organization", "name")
      .populate("department", "name");

    return {
      success: true,
      message: "User created successfully",
      data: allUsers,
    };
  } catch (error) {
    console.error("Error creating user:", error);
    return {
      success: false,
      message: "Error creating user",
      data: [],
    };
  }
};

userSchema.statics.deleteUserById = async function (userId) {
  try {
    if (!ObjectId.isValid(userId)) {
      return {
        success: false,
        message: "Invalid user ID",
        data: [],
      };
    }

    const deletedUser = await this.findByIdAndDelete(userId);
    if (!deletedUser) {
      return {
        success: false,
        message: "User not found",
        data: [],
      };
    }

    const allUsers = await this.find({})
      .populate("organization", "name")
      .populate("department", "name");
    return {
      success: true,
      message: "User deleted successfully",
      data: allUsers,
    };
  } catch (error) {
    console.error("Error deleting user:", error);
    return {
      success: false,
      message: "Error deleting user",
      data: [],
    };
  }
};

userSchema.statics.updatePasswordById = async function (userId, newPassword) {
  try {
    if (!ObjectId.isValid(userId)) {
      return {
        success: false,
        message: "Invalid user ID",
        data: [],
      };
    }

    const updatedUser = await this.findByIdAndUpdate(
      userId,
      { password: newPassword },
      { new: true }
    )
      .populate("organization", "name")
      .populate("department", "name");

    if (!updatedUser) {
      return {
        success: false,
        message: "User not found",
        data: [],
      };
    }

    const allUsers = await this.find({})
      .populate("organization", "name")
      .populate("department", "name");
    return {
      success: true,
      message: "Password updated successfully",
      data: allUsers,
    };
  } catch (error) {
    console.error("Error updating password:", error);
    return {
      success: false,
      message: "Error updating password",
      data: [],
    };
  }
};

userSchema.statics.getUsers = async function (options = {}) {
  try {
    const {
      role = null, // any role from the enum
      organization = null, // organization ID
      department = null, // department ID
      fields = null, // 'name _id' or any other field names
      limit = null, // for pagination
      skip = null, // for pagination
    } = options;

    const query = {};

    if (role) {
      query.role = role;
    }

    if (organization) {
      query.organization = ObjectId.isValid(organization) ? organization : null;
    }

    if (department) {
      query.department = ObjectId.isValid(department) ? department : null;
    }

    const projection = {};
    if (fields) {
      fields.split(" ").forEach((field) => {
        projection[field] = 1;
      });
    }

    const data = await this.find(query, projection)
      .limit(Number(limit) || 0)
      .skip(Number(skip) || 0)
      .populate("organization", "name type")
      .populate("department", "name")
      .sort({ createdAt: -1 });

    return {
      success: true,
      message: data.length ? "Users retrieved successfully" : "No users found",
      data,
    };
  } catch (error) {
    console.error("Error getting users:", error);
    return {
      success: false,
      message: "Error getting users",
      data: [],
    };
  }
};
