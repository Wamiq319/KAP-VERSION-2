import Organization from "../models/organization.js";
import { uploadImage } from "../utils/uploadCloudinary.js";
import Department from "../models/department.js";
import { sendSms } from "../utils/sendMessage.js";

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

    // Send SMS notification if organization was created successfully
    if (response.success) {
      try {
        const message = `${name} has been added for you in KAP.`;
        const smsResult = await sendSms({
          to: mobile,
          message: message,
        });

        if (smsResult.success) {
          console.log(
            `✅ SMS sent successfully to ${mobile} for organization ${name}`
          );
        } else {
          console.error(
            `❌ Failed to send SMS to ${mobile} for organization ${name}:`,
            smsResult.error
          );
        }
      } catch (smsError) {
        console.error("❌ Error sending SMS notification:", smsError);
        // Don't fail the request if SMS fails, just log the error
      }
    }

    res.status(response.success ? 201 : 400).json(response);
  } catch (error) {
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
      message: "Internal server error",
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
    res.status(200).json(response);
  } catch (error) {
    console.error("Error deleting organization:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      data: null,
    });
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

    res.status(200).json(response);
  } catch (error) {
    console.error("Error getting organizations:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      data: null,
    });
  }
};

export const updateOrganizationPassword = async (req, res) => {
  try {
    const { orgId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing",
        data: null,
      });
    }

    const response = await Organization.updatePasswordById(orgId, newPassword);
    res.status(200).json(response);
  } catch (error) {
    console.error("Error updating organization password:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      data: null,
    });
  }
};
