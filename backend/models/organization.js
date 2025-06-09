import mongoose from "mongoose";
const { ObjectId } = mongoose.Types;

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  type: { type: String, enum: ["GOVERNMENT", "COMPANY"], required: true },
  adminName: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  mobile: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  logo: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// Generate SMS data from organization document
organizationSchema.statics.getOrgSmsData = function (org) {
  if (!org) return null;

  return {
    username: org.username,
    mobile: org.mobile,
    orgName: org.name,
    adminName: org.adminName,
    password: org.password,
  };
};

organizationSchema.statics.getOrganizations = async function (options = {}) {
  try {
    const {
      type = null, // 'GOVERNMENT' or 'COMPANY'
      fields = null, // 'name _id' or any other field names
      limit = null, // for pagination
      skip = null, // for pagination
    } = options;

    // Build query
    const query = {};
    if (type) query.type = type;

    // Build projection
    const projection = {};
    if (fields) {
      fields.split(" ").forEach((field) => {
        projection[field] = 1;
      });
    }

    const data = await this.find(query, projection)
      .limit(Number(limit) || 0)
      .skip(Number(skip) || 0);

    return {
      success: true,
      message: data.length
        ? "Organizations retrieved successfully"
        : "No organizations found",
      data,
    };
  } catch (error) {
    console.error("Error getting organizations:", error);
    return {
      success: false,
      message: "Error getting organizations",
      data: [],
    };
  }
};

// Create Organization
organizationSchema.statics.createOrganization = async function (orgData) {
  try {
    if (await this.findOne({ name: orgData.name })) {
      return {
        success: false,
        message: "Organization Name already exists",
        data: [],
      };
    }

    if (await this.findOne({ username: orgData.username })) {
      return {
        success: false,
        message: "username  already exists",
        data: [],
      };
    }

    // Check if mobile exists
    if (await this.findOne({ mobile: orgData.mobile })) {
      return {
        success: false,
        message: "Mobile number already exists",
        data: [],
      };
    }

    const newOrg = await this.create(orgData);
    const allOrgs = await this.find({});

    return {
      success: true,
      message: "Organization created successfully",
      data: allOrgs,
    };
  } catch (error) {
    console.error("Error creating organization:", error);
    return {
      success: false,
      message: "Error creating organization",
      data: [],
    };
  }
};

// Delete Organization by ID
organizationSchema.statics.deleteOrganizationById = async function (orgId) {
  try {
    if (!ObjectId.isValid(orgId)) {
      return {
        success: false,
        message: "Invalid organization ID",
        data: [],
      };
    }

    const deletedOrg = await this.findByIdAndDelete(orgId);
    if (!deletedOrg) {
      return {
        success: false,
        message: "Organization not found",
        data: [],
      };
    }

    const allOrgs = await this.find({});
    return {
      success: true,
      message: "Organization deleted successfully",
      data: allOrgs,
    };
  } catch (error) {
    console.error("Error deleting organization:", error);
    return {
      success: false,
      message: "Error deleting organization",
      data: [],
    };
  }
};

// Update Password by ID
organizationSchema.statics.updatePasswordById = async function (
  orgId,
  newPassword
) {
  try {
    if (!ObjectId.isValid(orgId)) {
      return {
        success: false,
        message: "Invalid organization ID",
        data: [],
      };
    }

    const updatedOrg = await this.findByIdAndUpdate(
      orgId,
      { password: newPassword },
      { new: true }
    );

    if (!updatedOrg) {
      return {
        success: false,
        message: "Organization not found",
        data: [],
      };
    }

    const allOrgs = await this.find({});
    return {
      success: true,
      message: "Password updated successfully",
      data: allOrgs,
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

const Organization = mongoose.model("Organization", organizationSchema);

export default Organization;
