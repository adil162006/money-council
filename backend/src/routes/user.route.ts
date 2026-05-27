import { Router } from "express";
import {
  completeProfile,
  updateProfile,
  getUserDetails,
} from "../controllers/user.controller";
import authMiddleware from "../middleware/auth.middleware";
import isProfileCompleted from "../middleware/isProfileCompleted.middleware";

const router = Router();

// All routes require a valid JWT
router.use(authMiddleware);

// POST /api/profile/complete — one-time onboarding; profile must NOT exist yet
router.post("/complete", completeProfile);

// GET  /api/profile          — full profile + liabilities + summary
router.get("/", isProfileCompleted, getUserDetails);

// PATCH /api/profile         — update any profile fields
router.patch("/", isProfileCompleted, updateProfile);

export default router;