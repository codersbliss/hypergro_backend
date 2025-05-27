import { Request, Response } from 'express';
import Property, { IProperty } from '../models/Property';
import { getRedisClient } from '../config/redis';
import { AppError, asyncHandler } from '../middlewares/error';
import mongoose from 'mongoose';

// Get all properties
export const getProperties = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const properties = await Property.find()
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await Property.countDocuments();

  res.status(200).json({
    success: true,
    count: properties.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    data: properties,
  });
});

// Get single property
export const getProperty = asyncHandler(async (req: Request, res: Response) => {
  const property = await Property.findById(req.params.id);

  if (!property) {
    throw new AppError('Property not found', 404);
  }

  res.status(200).json({
    success: true,
    data: property,
  });
});

// Create new property
export const createProperty = asyncHandler(async (req: Request, res: Response) => {
  // Add user to request body
  req.body.createdBy = req.user._id;

  // Handle amenities and tags if they come as strings
  if (req.body.amenities && typeof req.body.amenities === 'string') {
    req.body.amenities = req.body.amenities.split('|');
  }
  
  if (req.body.tags && typeof req.body.tags === 'string') {
    req.body.tags = req.body.tags.split('|');
  }

  // Convert availableFrom to Date if it's a string
  if (req.body.availableFrom && typeof req.body.availableFrom === 'string') {
    const [day, month, year] = req.body.availableFrom.split('/');
    req.body.availableFrom = new Date(`${year}-${month}-${day}`);
  }

  const property = await Property.create(req.body);

  // Clear cache for properties
  const redisClient = getRedisClient();
  await redisClient.del('properties:*');

  res.status(201).json({
    success: true,
    data: property,
  });
});

// Update property
export const updateProperty = asyncHandler(async (req: Request, res: Response) => {
  let property = await Property.findById(req.params.id);

  if (!property) {
    throw new AppError('Property not found', 404);
  }

  // Check if user is property owner
  if (property.createdBy.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to update this property', 403);
  }

  // Handle amenities and tags if they come as strings
  if (req.body.amenities && typeof req.body.amenities === 'string') {
    req.body.amenities = req.body.amenities.split('|');
  }
  
  if (req.body.tags && typeof req.body.tags === 'string') {
    req.body.tags = req.body.tags.split('|');
  }

  // Convert availableFrom to Date if it's a string
  if (req.body.availableFrom && typeof req.body.availableFrom === 'string') {
    const [day, month, year] = req.body.availableFrom.split('/');
    req.body.availableFrom = new Date(`${year}-${month}-${day}`);
  }

  property = await Property.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  // Clear cache
  const redisClient = getRedisClient();
  await redisClient.del(`properties:${req.params.id}`);
  await redisClient.del('properties:*');

  res.status(200).json({
    success: true,
    data: property,
  });
});

// Delete property
export const deleteProperty = asyncHandler(async (req: Request, res: Response) => {
  const property = await Property.findById(req.params.id);

  if (!property) {
    throw new AppError('Property not found', 404);
  }

  // Check if user is property owner
  if (property.createdBy.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to delete this property', 403);
  }

  await Property.findByIdAndDelete(req.params.id);

  // Clear cache
  const redisClient = getRedisClient();
  await redisClient.del(`properties:${req.params.id}`);
  await redisClient.del('properties:*');

  res.status(200).json({
    success: true,
    data: {},
  });
});

// Get properties by user
export const getUserProperties = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const properties = await Property.find({ createdBy: req.user._id })
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await Property.countDocuments({ createdBy: req.user._id });

  res.status(200).json({
    success: true,
    count: properties.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    data: properties,
  });
});