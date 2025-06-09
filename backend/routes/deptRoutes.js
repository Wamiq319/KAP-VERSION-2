import express from "express";
import {
  createDepartment,
  deleteDepartment,
  getDepartments,
} from "../controllers/deptControlller.js";

const router = express.Router();

router.post("/", createDepartment);

router.get("/", getDepartments);

router.delete("/:deptId", deleteDepartment);

export default router;
