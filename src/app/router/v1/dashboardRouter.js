import express from 'express';
import { getDashboardExecutor } from '../../controller/v1/dashboardController.js';
import { autenticarToken } from '../../middleware/authMiddleware.js';

const router = express.Router();

router.get('/dashboard', autenticarToken, getDashboardExecutor);

export default router;
