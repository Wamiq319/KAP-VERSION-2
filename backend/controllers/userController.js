import User from "../models/user.js";
import {
  handleModelResponse,
  handleInternalError,
  handleValidationError,
} from "../utils/responseHandler.js";

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
        message: "Kap role misisng",
        data: null,
        success: false,
      });
    }

    if (!name || !username || !password || !mobile || !role) {
      return res.status(400).json({
        message: "Required fields are missing",
        success: false,
        data: null,
      });
    }

    const response = await User.createUser({
      name,
      username,
      password,
      mobile,
      role,
      kapRole: role === "KAP_EMPLOYEE" ? kapRole : undefined,
      organization:
        role !== "KAP_EMPLOYEE" && role !== "ADMIN" ? organization : undefined,
      department:
        role !== "KAP_EMPLOYEE" && role !== "ADMIN" ? department : undefined,
    });
    return res.status(response.success ? 201 : 400).json(response);
  } catch (error) {
    console.error("Error in createUser controller:", error); // Log the actual error for debugging
    res.status(500).json(handleInternalError("USER", error));
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const response = await User.deleteUserById(userId);
    res.status(200).json(handleModelResponse(response, "DELETE", "USER"));
  } catch (error) {
    res.status(500).json(handleInternalError("USER", error));
  }
};

export const getUsers = async (req, res) => {
  try {
    const { role, organization, department, fields, limit, skip } = req.query;

    const response = await User.getUsers({
      role,
      organization,
      department,
      fields,
      limit,
      skip,
    });

    res.status(200).json(handleModelResponse(response, "FETCH", "USER"));
  } catch (error) {
    res.status(500).json(handleInternalError("USER", error));
  }
};

export const updateUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        message: "New password is required",
        data: null,
        success: false,
      });
    }

    const response = await User.updatePasswordById(userId, newPassword);
    return res.status(response.success ? 201 : 400).json(response);
  } catch (error) {
    res.status(500).json(handleInternalError("USER", error));
  }
};

export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        data: null,
        message: "Missing required fields",
        success: false,
      });
    }

    const response = await User.loginUser(username, password);

    return res.status(response.success ? 200 : 400).json(response);
  } catch (error) {
    console.error("Error in getTickets controller:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      data: [],
    });
  }
};
