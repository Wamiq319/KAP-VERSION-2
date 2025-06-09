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
        data: [],
      };
    }

    const newDept = await this.create(departmentData);
    const allDepts = await this.getDepartments({});

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
      data: [],
    };
  }
};

// Delete Department
departmentSchema.statics.deleteDepartmentById = async function (departmentId) {
  try {
    const deletedDept = await this.findByIdAndDelete(departmentId);
    if (!deletedDept) {
      return {
        success: false,
        message: "Department not found",
        data: [],
      };
    }

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
      data: [],
    };
  }
};

// Enhanced Get Departments Function
departmentSchema.statics.getDepartments = async function (options = {}) {
  try {
    const {
      organization = null, // Filter by organization ID
      minimal = false, // Return only _id and name if true
      search = null, // Search term for department name
      limit = null, // Pagination limit
      skip = null, // Pagination skip
    } = options;

    // Build query
    const query = {};
    if (organization) query.organization = organization;
    if (search) query.name = new RegExp(search, "i");

    // Build projection
    const projection = minimal ? "_id name" : "_id name organization";
    const populate = minimal ? null : { path: "organization", select: "name" };

    // Execute query
    let queryBuilder = this.find(query).select(projection).sort({ name: 1 });

    if (populate) queryBuilder = queryBuilder.populate(populate);
    if (limit) queryBuilder = queryBuilder.limit(Number(limit));
    if (skip) queryBuilder = queryBuilder.skip(Number(skip));

    const departments = await queryBuilder.lean();

    // Transform data if not minimal
    const data = minimal
      ? departments
      : departments.map((dept) => ({
          _id: dept._id,
          name: dept.name,
          organization: {
            _id: dept.organization._id,
            name: dept.organization.name,
          },
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
      data: [],
    };
  }
};

const Department = mongoose.model("Department", departmentSchema);

export default Department;
