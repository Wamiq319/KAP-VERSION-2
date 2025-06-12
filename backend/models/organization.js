import mongoose from "mongoose";
const { ObjectId } = mongoose.Types;

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  type: { type: String, enum: ["GOVERNMENT", "COMPANY"], required: true },
  adminName: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  mobile: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  logo: {
    public_id: { type: String },
    url: { type: String },
  },
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
      .skip(Number(skip) || 0)
      .lean();

    const transformedData = data.map((org) => {
      if (org.logo) {
        return {
          ...org,
          logoUrl: org.logo.url,
        };
      }
      return org;
    });

    return {
      success: true,
      message: data.length
        ? "Organizations retrieved successfully"
        : "No organizations found",
      data: transformedData,
    };
  } catch (error) {
    console.error("Error getting organizations:", error);
    return {
      success: false,
      message: "Error getting organizations",
      data: null,
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
        data: null,
      };
    }

    if (await this.findOne({ username: orgData.username })) {
      return {
        success: false,
        message: "username  already exists",
        data: null,
      };
    }

    // Check if mobile exists
    if (await this.findOne({ mobile: orgData.mobile })) {
      return {
        success: false,
        message: "Mobile number already exists",
        data: null,
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
      message: "Internal Error creating organization",
      data: null,
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
        data: null,
      };
    }

    const deletedOrg = await this.findByIdAndDelete(orgId);
    if (!deletedOrg) {
      return {
        success: false,
        message: "Organization not found",
        data: null,
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
      data: null,
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
        data: null,
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
        data: null,
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
      data: null,
    };
  }
};

const Organization = mongoose.model("Organization", organizationSchema);

export default Organization;
