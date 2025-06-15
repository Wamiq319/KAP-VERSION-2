import Department from "../models/department.js";
import {
  handleModelResponse,
  handleInternalError,
  handleValidationError,
} from "../utils/responseHandler.js";

export const createDepartment = async (req, res) => {
  try {
    const { name, organization } = req.body;

    if (!name || !organization) {
      return res
        .status(400)
        .json(handleValidationError("DEPARTMENT", "REQUIRED_FIELDS"));
    }

    const response = await Department.createDepartment({
      name,
      organization,
    });

    res.status(200).json(handleModelResponse(response, "CREATE", "DEPARTMENT"));
  } catch (error) {
    res.status(500).json(handleInternalError("DEPARTMENT", error));
  }
};

export const deleteDepartment = async (req, res) => {
  try {
    const { deptId } = req.params;
    const response = await Department.deleteDepartmentById(deptId);
    res.status(200).json(handleModelResponse(response, "DELETE", "DEPARTMENT"));
  } catch (error) {
    res.status(500).json(handleInternalError("DEPARTMENT", error));
  }
};

export const getDepartments = async (req, res) => {
  try {
    const {
      orgType, // Filter by organization Type
      organization, // Filter by organization ID
      minimal, // Return minimal data (true/false)
      search, // Search term
      limit, // Pagination
      skip, // Pagination
    } = req.query;

    const response = await Department.getDepartments({
      orgType,
      organization,
      minimal: minimal === "true", // Convert string to boolean
      search,
      limit,
      skip,
    });

    res.status(200).json(handleModelResponse(response, "FETCH", "DEPARTMENT"));
  } catch (error) {
    res.status(500).json(handleInternalError("DEPARTMENT", error));
  }
};
