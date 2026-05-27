import type { Request, Response, NextFunction } from "express";
import { FinancialProfileModel } from "../models/financialProfile.model";
import { UserModel } from "../models/user.model";

/**
 * Guards routes that require a completed financial profile.
 * Must be used AFTER authMiddleware (depends on req.id being set).
 *
 * Checks both:
 *  1. isProfileCompleted flag on the User document   (fast, indexed)
 *  2. Existence of a FinancialProfile document        (source of truth)
 *
 * Usage:
 *   router.get("/dashboard", authMiddleware, isProfileCompleted, dashboardController);
 */
const isProfileCompleted = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await UserModel.findById(req.id).select("isProfileCompleted");

    if (!user) {
      res.status(401).json({ message: "User not found." });
      return;
    }

    if (!user.isProfileCompleted) {
      res.status(403).json({
        message: "Profile not completed. Please complete your financial profile first.",
        redirect: "/api/profile/complete",
      });
      return;
    }

    // Secondary check: ensure the FinancialProfile document actually exists
    const profileExists = await FinancialProfileModel.exists({ userId: req.id });
    if (!profileExists) {
      // Flag is stale — reset it and inform the client
      await UserModel.findByIdAndUpdate(req.id, { isProfileCompleted: false });
      res.status(403).json({
        message: "Profile data missing. Please complete your financial profile.",
        redirect: "/api/profile/complete",
      });
      return;
    }

    next();
  } catch (err) {
    console.error("isProfileCompleted middleware error:", err);
    res.status(500).json({ message: "Internal server error." });
  }
};

export default isProfileCompleted;