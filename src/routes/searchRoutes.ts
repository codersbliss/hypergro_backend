import express from 'express';
import { advancedSearch, textSearch } from '../controllers/searchController';
import { cacheMiddleware } from '../config/redis';

const router = express.Router();

router.get('/', cacheMiddleware('search', 1800), advancedSearch);
router.get('/text', cacheMiddleware('text-search', 1800), textSearch);

export default router;