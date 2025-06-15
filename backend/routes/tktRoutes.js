import express from "express";
import {
  createTicket,
  getTickets,
  deleteTicket,
  updateTicket,
} from "../controllers/tktController.js";

const router = express.Router();

router.post("/", createTicket);

router.get("/", getTickets);

router.delete("/:tktId", deleteTicket);

router.patch("/:tktId", updateTicket);

export default router;
