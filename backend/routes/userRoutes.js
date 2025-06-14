import express from "express";
import {
  createUser,
  deleteUser,
  getUsers,
  updateUserPassword,
  loginUser,
} from "../controllers/userController.js";

const router = express.Router();

router.post("/", createUser);
router.delete("/:userId", deleteUser);
router.get("/", getUsers);
router.patch("/:userId/password", updateUserPassword);
router.post("/login", loginUser);

export default router;
