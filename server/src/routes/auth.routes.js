import { Router } from "express";
import { register, login, refresh, logout, forgotPassword } from "../controllers/auth.controller.js";
import { validate } from "../middleware/validate.js";
import { registerSchema, loginSchema, forgotPasswordSchema } from "../validators/auth.validator.js";
import { loginLimiter, forgotPasswordLimiter } from "../middleware/rateLimiters.js";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", loginLimiter, validate(loginSchema), login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/forgot-password", forgotPasswordLimiter, validate(forgotPasswordSchema), forgotPassword);

export default router;
