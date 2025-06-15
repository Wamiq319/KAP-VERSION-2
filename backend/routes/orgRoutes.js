import express from "express";
import {
  createOrganization,
  deleteOrganization,
  getOrganizations,
  updateOrganizationPassword,
} from "../controllers/orgController.js";

import { uploadImage } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.post("/", uploadImage, createOrganization);

router.get("/", getOrganizations);

router.delete("/:orgId", deleteOrganization);

router.patch("/:orgId/password", updateOrganizationPassword);

export default router;
