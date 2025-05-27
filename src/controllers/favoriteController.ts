import { Request, Response } from 'express';
import Favorite from '../models/Favorite';
import Property from '../models/Property';
import { AppError, asyncHandler } from '../middlewares/error';
import { getRedisClient } from '../config/redis';

// Get all favorites for the current user
export const getFavorites = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const favorites = await Favorite.find({ user: req.user._id })
    .populate('property')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await Favorite.countDocuments({ user: req.user._id });

  res.status(200).json({
    success: true,
    count: favorites.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    data: favorites,
  });
});

// Add property to favorites
export const addToFavorites = asyncHandler(async (req: Request, res: Response) => {
  const { propertyId, notes } = req.body;

  // Check if property exists
  const property = await Property.findById(propertyId);

  if (!property) {
    throw new AppError('Property not found', 404);
  }

  // Check if property is already in favorites
  const existingFavorite = await Favorite.findOne({
    user: req.user._id,
    property: propertyId,
  });

  if (existingFavorite) {
    throw new AppError('Property already in favorites', 400);
  }

  // Add to favorites
  const favorite = await Favorite.create({
    user: req.user._id,
    property: propertyId,
    notes,
  });

  // Clear cache
  const redisClient = getRedisClient();
  await redisClient.del(`favorites:${req.user._id}`);

  res.status(201).json({
    success: true,
    data: favorite,
  });
});

// Remove property from favorites
export const removeFromFavorites = asyncHandler(async (req: Request, res: Response) => {
  const favoriteId = req.params.id;

  const favorite = await Favorite.findById(favoriteId);

  if (!favorite) {
    throw new AppError('Favorite not found', 404);
  }

  // Check if user owns the favorite
  if (favorite.user.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to remove this favorite', 403);
  }

  await Favorite.findByIdAndDelete(favoriteId);

  // Clear cache
  const redisClient = getRedisClient();
  await redisClient.del(`favorites:${req.user._id}`);

  res.status(200).json({
    success: true,
    data: {},
  });
});

// Update favorite notes
export const updateFavoriteNotes = asyncHandler(async (req: Request, res: Response) => {
  const favoriteId = req.params.id;
  const { notes } = req.body;

  let favorite = await Favorite.findById(favoriteId);

  if (!favorite) {
    throw new AppError('Favorite not found', 404);
  }

  // Check if user owns the favorite
  if (favorite.user.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to update this favorite', 403);
  }

  favorite = await Favorite.findByIdAndUpdate(
    favoriteId,
    { notes },
    { new: true, runValidators: true }
  );

  // Clear cache
  const redisClient = getRedisClient();
  await redisClient.del(`favorites:${req.user._id}`);

  res.status(200).json({
    success: true,
    data: favorite,
  });
});

// Check if property is in favorites
export const checkFavorite = asyncHandler(async (req: Request, res: Response) => {
  const propertyId = req.params.propertyId;

  const favorite = await Favorite.findOne({
    user: req.user._id,
    property: propertyId,
  });

  res.status(200).json({
    success: true,
    isFavorite: !!favorite,
    data: favorite,
  });
});