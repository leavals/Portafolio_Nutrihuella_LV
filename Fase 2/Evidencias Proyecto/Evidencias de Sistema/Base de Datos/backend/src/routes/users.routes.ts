import { Router } from 'express';
import { authGuard } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import { getMe, updateMe, changePassword } from '../controllers/users.controller.js';
import { UpdateMeSchema, ChangePasswordSchema } from '../schemas/users.schema.js';

const r = Router();

// GET /api/users/me  (alias de /api/auth/me)
r.get('/me', authGuard, getMe);

// PATCH /api/users/me  (JSON o multipart/form-data con campo "picture")
r.patch('/me', authGuard, upload.single('picture'), validate(UpdateMeSchema), updateMe);

// POST /api/users/change-password
r.post('/change-password', authGuard, validate(ChangePasswordSchema), changePassword);

export default r;
