import Organization from "../models/organization.js";
import { uploadLogoImage } from "../Utils/uploadCloudinary.js";

export const createOrganization = async (req, res) => {
  try {
    const { name, type, adminName, username, mobile, password } = req.body;
    const logoImage = req.file;

    // Prepare logo data object
    let logo = null;

    if (logoImage) {
      const uploaded = await uploadLogoImage(logoImage.path);
      logo = {
        public_id: uploaded.public_id,
        url: uploaded.url,
      };
    }

    const { success, data, message } = await Organization.createOrganization({
      name,
      type,
      adminName,
      username,
      mobile,
      password,
      logo, // Pass the full logo object with public_id and url
    });

    if (!success) {
      return res.status(400).json({ message, success, data });
    }

    res.status(201).json({ message, success, data });
  } catch (error) {
    console.error("Error creating organization:", error);
    res.status(500).json({
      message: "Internal server error while creating organization",
      success: false,
      data: null,
    });
  }
};

export const deleteOrganization = async (req, res) => {
  try {
    const { orgId } = req.params;
    const { message, success, data } =
      await Organization.deleteOrganizationById(orgId);
    res.status(200).json({ message, success, data });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Failed to delete organization",
      success: false,
      data: null,
    });
  }
};

export const getOrganizations = async (req, res) => {
  try {
    const {
      type, // Filter by type
      fields, // Control returned fields
      limit, // Pagination
      skip, // Pagination
    } = req.query;

    const { success, data, message } = await Organization.getOrganizations({
      type,
      fields,
      limit,
      skip,
    });

    res.status(200).json({ data, message, success });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Failed to get organizations",
      success: false,
      data: null,
    });
  }
};

export const updateOrganizationPassword = async (req, res) => {
  try {
    const { orgId } = req.params;
    const { newPassword } = req.body;

    const { success, data, message } = await Organization.updatePasswordById(
      orgId,
      newPassword
    );
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
