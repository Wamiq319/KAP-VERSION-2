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
      return (
        this.role !== "KAP_EMPLOYEE" &&
        this.role !== "ADMIN" &&
        this.role !== "GOV_MANAGER" &&
        this.role !== "OP_MANAGER"
      );
    },
  },
  createdAt: { type: Date, default: Date.now },
});

// Generate user data for response
userSchema.statics.getUserData = function (user) {
  if (!user) return null;

  return {
    id: user._id,
    name: user.name,
    username: user.username,
    mobile: user.mobile,
    role: user.role,
    kapRole: user.kapRole,
    organization: user.organization,
    department: user.department,
    createdAt: user.createdAt,
  };
};

// Get users with filtering options
userSchema.statics.getUsers = async function (options = {}) {
  try {
    const {
      role = null, // filter by role
      organization = null, // filter by organization ID
      fields = null, // selected fields
      limit = null, // for pagination
      skip = null, // for pagination
    } = options;

    // Build query
    const query = {};
    if (role) query.role = role;
    if (organization) query.organization = organization;

    // Build projection
    const projection = {};
    if (fields) {
      fields.split(" ").forEach((field) => {
        projection[field] = 1;
      });
    }

    const data = await this.find(query, projection)
      .limit(Number(limit) || 0)
      .skip(Number(skip) || 0)
      .populate("organization", "name")
      .populate("department", "name");

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
    const user = await this.findOne({ username });

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

    return {
      success: true,
      message: "Login successful",
      data: this.getUserData(user),
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

    return {
      success: true,
      message: "Password updated successfully",
      data: this.getUserData(updatedUser),
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
