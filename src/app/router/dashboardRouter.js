import express from 'express';
import { getDashboardExecutor } from '../controller/dashboardController.js';
import { autenticarToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/dashboard', autenticarToken, getDashboardExecutor);

export default router;
