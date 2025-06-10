import User from "../models/user.js";

export const createUser = async (req, res) => {
  try {
    const {
      name,
      username,
      password,
      mobile,
      role,
      kapRole,
      organization,
      department,
    } = req.body;

    // Validate required fields based on role
    if (role === "KAP_EMPLOYEE" && !kapRole) {
      return res.status(400).json({
        message: "kapRole is required for KAP employees",
        success: false,
        data: null,
      });
    }

    const { success, data, message } = await User.createUser({
      name,
      username,
      password,
      mobile,
      role,
      kapRole: role === "KAP_EMPLOYEE" ? kapRole : undefined,
      organization: role !== "KAP_EMPLOYEE" && role !== "ADMIN" ? organization : undefined,
      department: role !== "KAP_EMPLOYEE" && role !== "ADMIN" ? department : undefined,
    });

    if (!success) {
      // Handle specific error cases
      if (message === "Only one admin user is allowed") {
        return res.status(400).json({ message, success, data });
      }
      return res.status(400).json({ message, success, data });
    }

    res.status(201).json({ message, success, data });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error creating user",
      success: false,
      data: null,
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { message, success, data } = await User.deleteUserById(userId);

    if (!success) {
      // Handle specific error case for admin deletion
      if (message === "Cannot delete admin user") {
        return res.status(403).json({ message, success, data });
      }
      return res.status(400).json({ message, success, data });
    }

    res.status(200).json({ message, success, data });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Failed to delete user",
      success: false,
      data: null,
    });
  }
};

export const getUsers = async (req, res) => {
  try {
    const {
      role, // Filter by role
      organization, // Filter by organization ID
      fields, // Control returned fields
      limit, // Pagination
      skip, // Pagination
    } = req.query;

    const { success, data, message } = await User.getUsers({
      role,
      organization,
      fields,
      limit,
      skip,
    });

    res.status(200).json({ data, message, success });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Failed to get users",
      success: false,
      data: null,
    });
  }
};

export const updateUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        message: "New password is required",
        success: false,
        data: null,
      });
    }

    const { success, data, message } = await User.updatePasswordById(
      userId,
      newPassword
    );

    if (!success) {
      return res.status(400).json({ message, success, data });
    }

    res.status(200).json({ message, success, data });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Failed to update password",
      success: false,
      data: null,
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required",
        success: false,
        data: null,
      });
    }

    const { success, data, message } = await User.loginUser(username, password);

    if (!success) {
      return res.status(401).json({ message, success, data });
    }

    res.status(200).json({ message, success, data });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error during login",
      success: false,
      data: null,
    });
  }
};