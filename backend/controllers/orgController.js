import Organization from "../models/organization.js";
import { uploadImage } from "../utils/uploadCloudinary.js";
import Department from "../models/department.js";
import {
  handleModelResponse,
  handleInternalError,
  handleValidationError,
} from "../utils/responseHandler.js";

export const createOrganization = async (req, res) => {
  try {
    const { name, type, adminName, username, mobile, password } = req.body;
    const logoImage = req.file;

    // Validate required fields
    if (!name || !type || !adminName || !username || !mobile || !password) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing",
        data: null,
      });
    }

    // Prepare logo data object
    let logo = null;

    if (logoImage) {
      try {
        const uploaded = await uploadImage(logoImage.path);
        logo = {
          public_id: uploaded.public_id,
          url: uploaded.url,
        };
      } catch (error) {
        console.log(error);
        return res.status(400).json({
          success: false,
          message: "Error processing organization image",
          data: null,
        });
      }
    }

    const response = await Organization.createOrganization({
      name,
      type,
      adminName,
      username,
      mobile,
      password,
      logo,
    });

    // Ensure we have all required fields in the response
    if (!response || typeof response !== "object") {
      return res.status(500).json({
        success: false,
        message: "Invalid response from server",
        data: null,
      });
    }

    // If the model response doesn't have all required fields, add them
    const finalResponse = {
      success: response.success ?? false,
      message: response.message || "Organization creation failed",
      data: response.data ?? null,
    };

    res.status(finalResponse.success ? 201 : 400).json(finalResponse);
  } catch (error) {
    // Handle Multer file filter errors (e.g., non-image upload)
    if (
      error instanceof Error &&
      error.message.includes("Only JPEG, PNG, GIF, or WEBP images are allowed")
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
        data: null,
      });
    }
    console.error("Error creating organization:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while creating organization",
      data: null,
    });
  }
};

export const deleteOrganization = async (req, res) => {
  try {
    const { orgId } = req.params;

    // First delete all departments (and their users) for this organization
    await Department.deleteDepartmentsByOrganization(orgId);

    // Then delete the organization itself
    const response = await Organization.deleteOrganizationById(orgId);
    res
      .status(200)
      .json(handleModelResponse(response, "DELETE", "ORGANIZATION"));
  } catch (error) {
    res.status(500).json(handleInternalError("ORGANIZATION", error));
  }
};

export const getOrganizations = async (req, res) => {
  try {
    const { type, fields, limit, skip } = req.query;

    const response = await Organization.getOrganizations({
      type,
      fields,
      limit,
      skip,
    });

    res
      .status(200)
      .json(handleModelResponse(response, "FETCH", "ORGANIZATION"));
  } catch (error) {
    res.status(500).json(handleInternalError("ORGANIZATION", error));
  }
};

export const updateOrganizationPassword = async (req, res) => {
  try {
    const { orgId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res
        .status(400)
        .json(handleValidationError("ORGANIZATION", "REQUIRED_FIELDS"));
    }

    const response = await Organization.updatePasswordById(orgId, newPassword);
    res
      .status(200)
      .json(handleModelResponse(response, "UPDATE", "ORGANIZATION"));
  } catch (error) {
    res.status(500).json(handleInternalError("ORGANIZATION", error));
  }
};
