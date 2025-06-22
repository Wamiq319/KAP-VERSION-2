import express from "express";
import {
  createTicket,
  getTickets,
  deleteTicket,
  updateTicket,
  getTicketById,
} from "../controllers/tktController.js";
import { uploadImage } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.post("/", createTicket);

router.get("/", getTickets);

router.get("/:ticketId", getTicketById);

router.delete("/:tktId", deleteTicket);

router.patch("/:tktId", uploadImage, updateTicket);

export default router;
