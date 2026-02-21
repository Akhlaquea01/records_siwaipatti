import { Router } from 'express';
import advanceTrackerRoutes from './advanceTracker.routes.js';
import expenseRoutes from './expense.routes.js';
import rentLedgerRoutes from './rentLedger.routes.js';
import tenantRoutes from './tenantDetails.routes.js';
import authRoutes from './auth.routes.js';

const router = Router();

router.get('/health', (_req, res) => {
    res.json({ success: true, message: 'API is running', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/advance-tracker', advanceTrackerRoutes);
router.use('/expenses', expenseRoutes);
router.use('/rent-ledger', rentLedgerRoutes);
router.use('/tenants', tenantRoutes);

export default router;
