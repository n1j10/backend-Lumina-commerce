import { Router } from "express";
import { getDashboardStats } from "../controllers/adminController.js";

const router = Router();

router.get("/dashboard", getDashboardStats);

export default router;
