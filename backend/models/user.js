import mongoose from "mongoose";
const { ObjectId } = mongoose.Types;

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  mobile: { type: String, required: true, unique: true },
  role: {
    type: String,
    enum: [
      "ADMIN",
      "KAP_EMPLOYEE",
      "GOV_MANAGER",
      "OP_MANAGER",
      "GOV_EMPLOYEE",
      "OP_EMPLOYEE",
    ],
    required: true,
  },
  kapRole: {
    type: String,
    enum: ["GOVERNMENT_INTEGRATION", "SECURITY_SAFETY", "PLANNING_DEVELOPMENT"],
    required: function () {
      return this.role === "KAP_EMPLOYEE";
    },
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: function () {
      return this.role !== "KAP_EMPLOYEE" && this.role !== "ADMIN";
    },
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
    required: function () {
      return this.role !== "KAP_EMPLOYEE" && this.role !== "ADMIN";
    },
  },
  createdAt: { type: Date, default: Date.now },
});

// Generate user data for response
userSchema.statics.getUserData = function (user) {
  if (!user) return null;

  return {
    _id: user._id,
    name: user.name,
    username: user.username,
    mobile: user.mobile,
    role: user.role,
    kapRole: user.kapRole || null,
    organization: user.organization
      ? { _id: user.organization._id, name: user.organization.name }
      : null,
    department: user.department
      ? { _id: user.department._id, name: user.department.name }
      : null,
    password: user.password,
  };
};

// Get users with filtering options
userSchema.statics.getUsers = async function (options = {}) {
  try {
    const {
      role = null,
      organization = null,
      department = null,
      fields = null,
      limit = null,
      skip = null,
    } = options;

    // Build query
    const query = { role: { $ne: "ADMIN" } };
    if (role) query.role = { $eq: role, $ne: "ADMIN" };
    if (organization) query.organization = organization;
    if (department) query.department = department;

    let projection = {};
    if (fields) {
      // Always include _id
      fields
        .split(",")
        .concat("_id")
        .forEach((field) => {
          projection[field.trim()] = 1;
        });
    } else {
      // Default: all main fields
      [
        "name",
        "username",
        "mobile",
        "role",
        "kapRole",
        "organization",
        "department",
        "password",
      ].forEach((field) => {
        projection[field] = 1;
      });
    }

    const data = await this.find(query, projection)
      .limit(Number(limit) || 0)
      .skip(Number(skip) || 0)
      .populate("organization", "name _id")
      .populate("department", "name _id logo");

    // Format the response data
    let formattedData;
    if (fields) {
      // Only include requested fields (plus _id)
      const requestedFields = fields.split(",").map((f) => f.trim());
      formattedData = data.map((user) => {
        const obj = { _id: user._id };
        requestedFields.forEach((field) => {
          if (user[field] !== undefined) obj[field] = user[field];
        });
        return obj;
      });
    } else {
      formattedData = data.map((user) => ({
        _id: user._id,
        name: user.name,
        username: user.username,
        mobile: user.mobile,
        role: user.role,
        kapRole: user.kapRole,
        organization: user.organization
          ? {
              _id: user.organization._id,
              name: user.organization.name,
              logo: user.organization.logo.url,
            }
          : null,
        department: user.department
          ? { _id: user.department._id, name: user.department.name }
          : null,
        password: user.password,
      }));
    }

    return {
      success: true,
      message: formattedData.length
        ? "Users retrieved successfully"
        : "No users found",
      data: formattedData,
    };
  } catch (error) {
    console.error("Error getting users:", error);
    return {
      success: false,
      message: "Error getting users",
      data: null,
    };
  }
};

// Create User
userSchema.statics.createUser = async function (userData) {
  try {
    // Check if username exists
    if (await this.findOne({ username: userData.username })) {
      return {
        success: false,
        message: "Username already exists",
        data: null,
      };
    }

    // Check if mobile exists
    if (await this.findOne({ mobile: userData.mobile })) {
      return {
        success: false,
        message: "Mobile number already exists",
        data: null,
      };
    }

    // For ADMIN role, ensure only one admin exists
    if (userData.role === "ADMIN") {
      const existingAdmin = await this.findOne({ role: "ADMIN" });
      if (existingAdmin) {
        return {
          success: false,
          message: "Only one admin user is allowed",
          data: null,
        };
      }
    }

    // Remove organization and department for KAP_EMPLOYEE and ADMIN
    if (userData.role === "KAP_EMPLOYEE" || userData.role === "ADMIN") {
      userData.organization = undefined;
      userData.department = undefined;
    }

    const newUser = await this.create(userData);
    const allUsers = await this.find({});

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
      data: null,
    };
  }
};

// User Login
userSchema.statics.loginUser = async function (username, password) {
  try {
    const user = await this.findOne({ username })
      .populate("organization", "name _id logo type adminName")
      .populate("department", "name _id");

    if (!user) {
      return {
        success: false,
        message: "User not found",
        data: null,
      };
    }

    // In a real application, you would compare hashed passwords here
    if (user.password !== password) {
      return {
        success: false,
        message: "Invalid credentials",
        data: null,
      };
    }

    // Get organization details if user has an organization
    let organizationDetails = null;
    if (user.organization) {
      organizationDetails = {
        _id: user.organization._id,
        name: user.organization.name,
        type: user.organization.type,
        adminName: user.organization.adminName,
        logo: user.organization.logo
          ? {
              url: user.organization.logo.url,
            }
          : null,
      };
    }

    // Return user data with organization details
    return {
      success: true,
      message: "Login successful",
      data: {
        _id: user._id,
        name: user.name,
        username: user.username,
        mobile: user.mobile,
        role: user.role,
        kapRole: user.kapRole || null,
        organization: organizationDetails,
        department: user.department
          ? { _id: user.department._id, name: user.department.name }
          : null,
        password: user.password,
      },
    };
  } catch (error) {
    console.error("Error during login:", error);
    return {
      success: false,
      message: "Error during login",
      data: null,
    };
  }
};

// Delete User by ID
userSchema.statics.deleteUserById = async function (userId) {
  try {
    if (!ObjectId.isValid(userId)) {
      return {
        success: false,
        message: "Invalid user ID",
        data: null,
      };
    }

    const userToDelete = await this.findById(userId);
    if (!userToDelete) {
      return {
        success: false,
        message: "User not found",
        data: null,
      };
    }

    // Prevent deletion of the only admin user
    if (userToDelete.role === "ADMIN") {
      return {
        success: false,
        message: "Cannot delete admin user",
        data: null,
      };
    }

    const deletedUser = await this.findByIdAndDelete(userId);
    const allUsers = await this.find({});
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
      data: null,
    };
  }
};

// Add this to your User model (userSchema.statics)

// Delete users by department(s) - returns true on success, false on failure
userSchema.statics.deleteUsersByDepartment = async function (departmentIds) {
  try {
    // Convert single ID to array if needed
    const ids = Array.isArray(departmentIds) ? departmentIds : [departmentIds];

    // Validate all IDs
    for (const id of ids) {
      if (!ObjectId.isValid(id)) {
        return false;
      }
    }

    // Delete users with these departments
    await this.deleteMany({
      department: { $in: ids },
      // Don't delete admin or KAP employees
      role: {
        $nin: ["ADMIN", "KAP_EMPLOYEE"],
        $in: ["GOV_MANAGER", "OP_MANAGER", "GOV_EMPLOYEE", "OP_EMPLOYEE"],
      },
    });

    return true;
  } catch (error) {
    console.error("Error deleting users by department:", error);
    return false;
  }
};

// Update Password by ID
userSchema.statics.updatePasswordById = async function (userId, newPassword) {
  try {
    if (!ObjectId.isValid(userId)) {
      return {
        success: false,
        message: "Invalid user ID",
        data: null,
      };
    }

    const updatedUser = await this.findByIdAndUpdate(
      userId,
      { password: newPassword },
      { new: true }
    );

    if (!updatedUser) {
      return {
        success: false,
        message: "User not found",
        data: null,
      };
    }
    const allUsers = await this.find({});
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
      data: null,
    };
  }
};

const User = mongoose.model("User", userSchema);

export default User;
