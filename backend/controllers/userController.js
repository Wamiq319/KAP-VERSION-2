import User from "../models/user.js";
import {
  handleModelResponse,
  handleInternalError,
  handleValidationError,
} from "../utils/responseHandler.js";

// Common error messages
const ERROR_MESSAGES = {
  REQUIRED_FIELDS: "Required fields are missing",
  INTERNAL_ERROR: "Internal server error while processing user",
  MODEL_ERROR: "Error in user operation",
  NOT_FOUND: "User not found",
  INVALID_DATA: "Invalid user data provided",
  DUPLICATE: "User already exists",
  AUTH_ERROR: "Authentication failed",
  UNAUTHORIZED: "Unauthorized operation",
  ADMIN_ERROR: "Admin operation failed",
};

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
      return res
        .status(400)
        .json(handleValidationError("USER", "KAP_ROLE_REQUIRED"));
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

    res.status(201).json(handleModelResponse(response, "CREATE", "USER"));
  } catch (error) {
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
    const { role, organization, fields, limit, skip } = req.query;

    const response = await User.getUsers({
      role,
      organization,
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
      return res
        .status(400)
        .json(handleValidationError("USER", "REQUIRED_FIELDS"));
    }

    const response = await User.updatePasswordById(userId, newPassword);
    res.status(200).json(handleModelResponse(response, "UPDATE", "USER"));
  } catch (error) {
    res.status(500).json(handleInternalError("USER", error));
  }
};

export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json(handleValidationError("USER", "REQUIRED_FIELDS"));
    }

    const response = await User.loginUser(username, password);
    res.status(200).json(handleModelResponse(response, "FETCH", "USER"));
  } catch (error) {
    res.status(500).json(handleInternalError("USER", error));
  }
};
