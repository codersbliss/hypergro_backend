import express from 'express';
import {
  createRecommendation,
  getReceivedRecommendations,
  getSentRecommendations,
  markAsRead,
  deleteRecommendation,
  getUnreadCount,
} from '../controllers/recommendationController';
import { protect } from '../middlewares/auth';

const router = express.Router();

// All routes are protected
router.use(protect);

router.post('/', createRecommendation);
router.get('/received', getReceivedRecommendations);
router.get('/sent', getSentRecommendations);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteRecommendation);
router.get('/unread-count', getUnreadCount);

export default router;