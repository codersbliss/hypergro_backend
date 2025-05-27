import express from 'express';
import {
  getProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  getUserProperties,
} from '../controllers/propertyController';
import { protect, isPropertyOwner } from '../middlewares/auth';
import { cacheMiddleware } from '../config/redis';

const router = express.Router();

// Public routes
router.get('/', cacheMiddleware('properties', 1800), getProperties);
router.get('/:id', cacheMiddleware('property', 1800), getProperty);

// Protected routes
router.use(protect);
router.post('/', createProperty);
router.put('/:id', isPropertyOwner, updateProperty);
router.delete('/:id', isPropertyOwner, deleteProperty);
router.get('/user/me', getUserProperties);

export default router;