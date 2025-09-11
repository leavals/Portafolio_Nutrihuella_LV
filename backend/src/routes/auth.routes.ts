import { Router } from 'express';
import { register, login, googleLogin, me, forgotPassword, resetPassword } from '../controllers/auth.controller.js';
import { authGuard } from '../middleware/auth.middleware.js';

const r = Router();
r.post('/register', register);
r.post('/login', login);
r.post('/google', googleLogin);
r.get('/me', authGuard, me);
r.post('/forgot', forgotPassword);
r.post('/reset', resetPassword);
export default r;
