// backend/src/routes/admin.routes.ts
import { Router } from 'express';
import { authGuard, requireRole } from '../middleware/auth.middleware.ts';
import {
  listUsers,
  getUserById,
  updateUserById,
  verifyEmailById,
  resetPasswordById,
  // legacy (compat)
  setRole,
  verifyManually,
  deactivate,
  reactivate,
  suspend,
  unsuspend,
} from '../controllers/admin.controller.ts';

const r = Router();

r.use(authGuard, requireRole(['ADMIN']));

// Nuevo contrato REST alineado con el frontend
r.get('/users', listUsers);
r.get('/users/:id', getUserById);
r.patch('/users/:id', updateUserById);

r.post('/users/:id/verify-email', verifyEmailById);
r.post('/users/:id/reset-password', resetPasswordById);

// Endpoints legacy (mantener temporalmente)
r.post('/users/role', setRole);
r.post('/users/verify', verifyManually);
r.post('/users/deactivate', deactivate);
r.post('/users/reactivate', reactivate);
r.post('/users/suspend', suspend);
r.post('/users/unsuspend', unsuspend);

export default r;
