import { Router } from 'express';
import { authGuard } from '../middleware/auth.middleware.ts';
import { validate } from '../middleware/validate.middleware.ts';
import { upload } from '../middleware/upload.middleware.ts';
import { getMe, updateMe, changePassword, cancelPlus } from '../controllers/users.controller.ts';
import { UpdateMeSchema, ChangePasswordSchema } from '../schemas/users.schema.ts';

const r = Router();

// GET /api/users/me  (alias de /api/auth/me)
r.get('/me', authGuard, getMe);

// PATCH /api/users/me  (JSON o multipart/form-data con campo "picture")
r.patch('/me', authGuard, upload.single('picture'), validate(UpdateMeSchema), updateMe);

// POST /api/users/change-password
r.post('/change-password', authGuard, validate(ChangePasswordSchema), changePassword);

// POST /api/users/plus/cancel  (cancelar membresía Plus)
r.post('/plus/cancel', authGuard, cancelPlus);

export default r;
