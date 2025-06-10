import Department from "../models/department.js";

export const createDepartment = async (req, res) => {
  try {
    const { name, organization } = req.body;

    const { success, data, message } = await Department.createDepartment({
      name,
      organization,
    });

    res.status(200).json({ message, success, data });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error creating department",
      success: false,
      data: [],
    });
  }
};

export const deleteDepartment = async (req, res) => {
  try {
    const { deptId } = req.params;
    const { message, success, data } = await Department.deleteDepartmentById(
      deptId
    );
    res.status(200).json({ message, success, data });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Failed to delete department",
      success: false,
      data: null,
    });
  }
};

export const getDepartments = async (req, res) => {
  try {
    const {
      organization, // Filter by organization ID
      minimal, // Return minimal data (true/false)
      search, // Search term
      limit, // Pagination
      skip, // Pagination
    } = req.query;

    const { success, data, message } = await Department.getDepartments({
      organization,
      minimal: minimal === "true", // Convert string to boolean
      search,
      limit,
      skip,
    });

    res.status(200).json({ data, message, success });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Failed to get departments",
      success: false,
      data: null,
    });
  }
};
