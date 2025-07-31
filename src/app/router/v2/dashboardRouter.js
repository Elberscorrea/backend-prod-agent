import express from "express";
import { getDashboardAgenteV2 } from "../../controller/v2/dashboardController.js";
import { autenticarToken } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/dashboard", autenticarToken, getDashboardAgenteV2);

export default router;
