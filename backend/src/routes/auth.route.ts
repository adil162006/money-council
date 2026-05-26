import express from "express";

import {
  registerUser,
  loginUser,
  logoutUser,
} from "../controllers/auth.controller";

const router = express.Router();

// Register User
router.post("/register", registerUser);

// Login User
router.post("/login", loginUser);

// Logout User
router.post("/logout", logoutUser);

export default router;