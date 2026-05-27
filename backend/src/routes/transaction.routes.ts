import { Router } from "express";
import {
  getTransactionsByDate,
  addTransaction,
} from "../controllers/transaction.controller";
import authMiddleware from "../middleware/auth.middleware";
import isProfileCompleted from "../middleware/isProfileCompleted.middleware";

const router = Router();

// All routes require a valid JWT + completed profile
router.use(authMiddleware);
router.use(isProfileCompleted);

// GET  /api/transactions?date=YYYY-MM-DD — transactions for a date (default today)
router.get("/", getTransactionsByDate);

// POST /api/transactions                 — add a transaction (all cases)
router.post("/", addTransaction);

export default router;