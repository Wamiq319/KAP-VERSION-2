import mongoose from "mongoose";
const { ObjectId } = mongoose.Types;

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

departmentSchema.statics.createDepartment = async function (departmentData) {
  try {
    const existingDept = await this.findOne({
      name: departmentData.name,
      organization: departmentData.organization,
    });
    if (existingDept) {
      return {
        success: false,
        message: "Department Name for this organization already exist",
        data: null,
      };
    }

    const newDept = await this.create(departmentData);
    const allDepts = await this.getDepartments({ minimal: false });

    return {
      success: true,
      message: "Department created successfully",
      data: allDepts.data,
    };
  } catch (error) {
    console.error("Error creating department:", error);
    return {
      success: false,
      message: "Error creating department",
      data: null,
    };
  }
};

// Delete Department
departmentSchema.statics.deleteDepartmentById = async function (departmentId) {
  try {
    if (!ObjectId.isValid(departmentId)) {
      return {
        success: false,
        message: "Invalid department ID",
        data: null,
      };
    }

    const deletedDept = await this.findByIdAndDelete(departmentId);
    if (!deletedDept) {
      return {
        success: false,
        message: "Department not found",
        data: null,
      };
    }

    // Delete all users in this department
    await mongoose.model("User").deleteUsersByDepartment(departmentId);

    const remainingDepts = await this.getDepartments({});

    return {
      success: true,
      message: "Department deleted successfully",
      data: remainingDepts.data,
    };
  } catch (error) {
    console.error("Error deleting department:", error);
    return {
      success: false,
      message: "Error deleting department",
      data: null,
    };
  }
};

// Delete Departments by Organization
departmentSchema.statics.deleteDepartmentsByOrganization = async function (
  organizationId
) {
  try {
    if (!ObjectId.isValid(organizationId)) {
      return false;
    }

    const departments = await this.find({ organization: organizationId });
    const departmentIds = departments.map((dept) => dept._id);

    // Delete all departments
    const result = await this.deleteMany({ organization: organizationId });

    // Delete all users in these departments if any departments existed
    if (departmentIds.length > 0) {
      await mongoose.model("User").deleteUsersByDepartment(departmentIds);
    }

    return;
    true;
  } catch (error) {
    console.error("Error deleting departments by organization:", error);
    return false;
  }
};

// Get Departments Function (unchanged)
departmentSchema.statics.getDepartments = async function (options = {}) {
  try {
    const {
      organization = null,
      orgType = null,
      minimal = false,
      search = null,
      limit = null,
      skip = null,
    } = options;

    if (orgType) {
      const pipeline = [];

      const matchStage = {};
      if (organization) matchStage.organization = new ObjectId(organization);
      if (search) matchStage.name = { $regex: search, $options: "i" };
      pipeline.push({ $match: matchStage });

      pipeline.push({
        $lookup: {
          from: "organizations",
          localField: "organization",
          foreignField: "_id",
          as: "organization",
        },
      });

      pipeline.push({
        $unwind: { path: "$organization", preserveNullAndEmptyArrays: true },
      });

      pipeline.push({
        $match: { "organization.type": orgType },
      });

      pipeline.push({
        $project: {
          _id: 1,
          name: 1,
          organization: {
            $cond: {
              if: { $eq: ["$organization", null] },
              then: null,
              else: {
                _id: "$organization._id",
                name: "$organization.name",
                type: "$organization.type",
              },
            },
          },
        },
      });

      if (limit) pipeline.push({ $limit: Number(limit) });
      if (skip) pipeline.push({ $skip: Number(skip) });

      const departments = await this.aggregate(pipeline);

      return {
        success: true,
        message: departments.length
          ? "Departments retrieved successfully"
          : "No departments found",
        data: departments,
      };
    }

    // Default behavior when no orgType filtering
    const query = {};
    if (organization) query.organization = organization;
    if (search) query.name = new RegExp(search, "i");

    const projection = minimal ? "_id name" : "_id name organization";
    const populate = minimal
      ? null
      : { path: "organization", select: "name type" };

    let queryBuilder = this.find(query).select(projection).sort({ name: 1 });
    if (populate) queryBuilder = queryBuilder.populate(populate);
    if (limit) queryBuilder = queryBuilder.limit(Number(limit));
    if (skip) queryBuilder = queryBuilder.skip(Number(skip));

    const departments = await queryBuilder.lean();

    const data = minimal
      ? departments
      : departments.map((dept) => ({
          _id: dept._id,
          name: dept.name,
          organization: dept.organization
            ? {
                _id: dept.organization._id,
                name: dept.organization.name,
                type: dept.organization.type,
              }
            : null,
        }));

    return {
      success: true,
      message: departments.length
        ? "Departments retrieved successfully"
        : "No departments found",
      data,
    };
  } catch (error) {
    console.error("Error getting departments:", error);
    return {
      success: false,
      message: "Error getting departments",
      data: null,
    };
  }
};

const Department = mongoose.model("Department", departmentSchema);

export default Department;
