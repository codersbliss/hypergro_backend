import express from 'express';
import {
  getFavorites,
  addToFavorites,
  removeFromFavorites,
  updateFavoriteNotes,
  checkFavorite,
} from '../controllers/favoriteController';
import { protect } from '../middlewares/auth';
import { cacheMiddleware } from '../config/redis';

const router = express.Router();

// All routes are protected
router.use(protect);

router.get('/', cacheMiddleware('favorites', 1800), getFavorites);
router.post('/', addToFavorites);
router.delete('/:id', removeFromFavorites);
router.put('/:id', updateFavoriteNotes);
router.get('/check/:propertyId', checkFavorite);

export default router;