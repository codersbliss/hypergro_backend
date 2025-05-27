import { Request, Response } from 'express';
import Recommendation from '../models/Recommendation';
import Property from '../models/Property';
import User from '../models/User';
import { AppError, asyncHandler } from '../middlewares/error';

// Create a recommendation
export const createRecommendation = asyncHandler(async (req: Request, res: Response) => {
  const { recipientId, propertyId, message } = req.body;

  // Check if recipient exists
  const recipient = await User.findById(recipientId);
  if (!recipient) {
    throw new AppError('Recipient user not found', 404);
  }

  // Check if property exists
  const property = await Property.findById(propertyId);
  if (!property) {
    throw new AppError('Property not found', 404);
  }

  // Create recommendation
  const recommendation = await Recommendation.create({
    sender: req.user._id,
    recipient: recipientId,
    property: propertyId,
    message,
    isRead: false,
  });

  res.status(201).json({
    success: true,
    data: recommendation,
  });
});

// Get recommendations received by the current user
export const getReceivedRecommendations = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const recommendations = await Recommendation.find({ recipient: req.user._id })
    .populate('sender', 'name email')
    .populate('property')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await Recommendation.countDocuments({ recipient: req.user._id });

  res.status(200).json({
    success: true,
    count: recommendations.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    data: recommendations,
  });
});

// Get recommendations sent by the current user
export const getSentRecommendations = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const recommendations = await Recommendation.find({ sender: req.user._id })
    .populate('recipient', 'name email')
    .populate('property')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await Recommendation.countDocuments({ sender: req.user._id });

  res.status(200).json({
    success: true,
    count: recommendations.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    data: recommendations,
  });
});

// Mark recommendation as read
export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const recommendationId = req.params.id;

  let recommendation = await Recommendation.findById(recommendationId);

  if (!recommendation) {
    throw new AppError('Recommendation not found', 404);
  }

  // Check if user is the recipient
  if (recommendation.recipient.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to update this recommendation', 403);
  }

  recommendation = await Recommendation.findByIdAndUpdate(
    recommendationId,
    { isRead: true },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: recommendation,
  });
});

// Delete recommendation
export const deleteRecommendation = asyncHandler(async (req: Request, res: Response) => {
  const recommendationId = req.params.id;

  const recommendation = await Recommendation.findById(recommendationId);

  if (!recommendation) {
    throw new AppError('Recommendation not found', 404);
  }

  // Check if user is the sender or recipient
  if (
    recommendation.sender.toString() !== req.user._id.toString() &&
    recommendation.recipient.toString() !== req.user._id.toString()
  ) {
    throw new AppError('Not authorized to delete this recommendation', 403);
  }

  await Recommendation.findByIdAndDelete(recommendationId);

  res.status(200).json({
    success: true,
    data: {},
  });
});

// Get unread recommendations count
export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  const count = await Recommendation.countDocuments({
    recipient: req.user._id,
    isRead: false,
  });

  res.status(200).json({
    success: true,
    count,
  });
});