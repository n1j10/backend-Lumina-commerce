import { Router } from "express";
import { seedCategories } from "../seed/seedData.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json(seedCategories);
});

export default router;
