import express from 'express';
import {
  register,
  login,
  getCurrentUser,
  updateUser,
  updatePassword,
  findUserByEmail,
} from '../controllers/userController';
import { protect } from '../middlewares/auth';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.use(protect);
router.get('/me', getCurrentUser);
router.put('/update', updateUser);
router.put('/update-password', updatePassword);
router.get('/find', findUserByEmail);

export default router;