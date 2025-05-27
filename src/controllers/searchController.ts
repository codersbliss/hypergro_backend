import { Request, Response } from 'express';
import Property from '../models/Property';
import { asyncHandler } from '../middlewares/error';
import { getRedisClient } from '../config/redis';

// Advanced search with multiple filters
export const advancedSearch = asyncHandler(async (req: Request, res: Response) => {
  const {
    type,
    city,
    state,
    minPrice,
    maxPrice,
    minBedrooms,
    maxBedrooms,
    minBathrooms,
    maxBathrooms,
    minAreaSqFt,
    maxAreaSqFt,
    furnished,
    amenities,
    tags,
    listedBy,
    listingType,
    isVerified,
    minRating,
    maxRating,
    sort,
    page = 1,
    limit = 10,
  } = req.query;

  // Build query
  const query: any = {};

  // Type filter
  if (type) {
    query.type = type;
  }

  // Location filters
  if (city) {
    query.city = { $regex: city, $options: 'i' };
  }

  if (state) {
    query.state = { $regex: state, $options: 'i' };
  }

  // Price range
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  // Bedroom range
  if (minBedrooms || maxBedrooms) {
    query.bedrooms = {};
    if (minBedrooms) query.bedrooms.$gte = Number(minBedrooms);
    if (maxBedrooms) query.bedrooms.$lte = Number(maxBedrooms);
  }

  // Bathroom range
  if (minBathrooms || maxBathrooms) {
    query.bathrooms = {};
    if (minBathrooms) query.bathrooms.$gte = Number(minBathrooms);
    if (maxBathrooms) query.bathrooms.$lte = Number(maxBathrooms);
  }

  // Area range
  if (minAreaSqFt || maxAreaSqFt) {
    query.areaSqFt = {};
    if (minAreaSqFt) query.areaSqFt.$gte = Number(minAreaSqFt);
    if (maxAreaSqFt) query.areaSqFt.$lte = Number(maxAreaSqFt);
  }

  // Furnished status
  if (furnished) {
    query.furnished = furnished;
  }

  // Amenities
  if (amenities) {
    const amenitiesArray = Array.isArray(amenities) 
      ? amenities 
      : (amenities as string).split(',');
    query.amenities = { $all: amenitiesArray };
  }

  // Tags
  if (tags) {
    const tagsArray = Array.isArray(tags) 
      ? tags 
      : (tags as string).split(',');
    query.tags = { $all: tagsArray };
  }

  // Listed by
  if (listedBy) {
    query.listedBy = listedBy;
  }

  // Listing type
  if (listingType) {
    query.listingType = listingType;
  }

  // Verified status
  if (isVerified) {
    query.isVerified = isVerified === 'true';
  }

  // Rating range
  if (minRating || maxRating) {
    query.rating = {};
    if (minRating) query.rating.$gte = Number(minRating);
    if (maxRating) query.rating.$lte = Number(maxRating);
  }

  // Pagination
  const pageNum = Number(page);
  const limitNum = Number(limit);
  const skip = (pageNum - 1) * limitNum;

  // Sort options
  let sortOption = {};
  if (sort) {
    const sortFields = (sort as string).split(',');
    sortFields.forEach((field) => {
      const sortOrder = field.startsWith('-') ? -1 : 1;
      const fieldName = field.startsWith('-') ? field.substring(1) : field;
      sortOption = { ...sortOption, [fieldName]: sortOrder };
    });
  } else {
    sortOption = { createdAt: -1 };
  }

  // Generate cache key
  const cacheKey = `search:${JSON.stringify({ query, sortOption, skip, limitNum })}`;
  const redisClient = getRedisClient();
  
  // Try to get from cache
  const cachedResult = await redisClient.get(cacheKey);
  
  if (cachedResult) {
    return res.status(200).json(JSON.parse(cachedResult));
  }

  // Execute query
  const properties = await Property.find(query)
    .sort(sortOption)
    .skip(skip)
    .limit(limitNum);

  const total = await Property.countDocuments(query);

  const result = {
    success: true,
    count: properties.length,
    total,
    totalPages: Math.ceil(total / limitNum),
    currentPage: pageNum,
    data: properties,
  };

  // Cache the result
  await redisClient.setEx(cacheKey, 3600, JSON.stringify(result));

  res.status(200).json(result);
});

// Text search across multiple fields
export const textSearch = asyncHandler(async (req: Request, res: Response) => {
  const { q, page = 1, limit = 10 } = req.query;

  if (!q) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a search query',
    });
  }

  const pageNum = Number(page);
  const limitNum = Number(limit);
  const skip = (pageNum - 1) * limitNum;

  // Generate cache key
  const cacheKey = `text-search:${q}-${pageNum}-${limitNum}`;
  const redisClient = getRedisClient();
  
  // Try to get from cache
  const cachedResult = await redisClient.get(cacheKey);
  
  if (cachedResult) {
    return res.status(200).json(JSON.parse(cachedResult));
  }

  // Search using a text index or regex pattern
  const searchQuery = {
    $or: [
      { title: { $regex: q, $options: 'i' } },
      { type: { $regex: q, $options: 'i' } },
      { city: { $regex: q, $options: 'i' } },
      { state: { $regex: q, $options: 'i' } },
      { listedBy: { $regex: q, $options: 'i' } },
      { tags: { $regex: q, $options: 'i' } },
      { amenities: { $regex: q, $options: 'i' } },
    ],
  };

  const properties = await Property.find(searchQuery)
    .skip(skip)
    .limit(limitNum)
    .sort({ createdAt: -1 });

  const total = await Property.countDocuments(searchQuery);

  const result = {
    success: true,
    count: properties.length,
    total,
    totalPages: Math.ceil(total / limitNum),
    currentPage: pageNum,
    data: properties,
  };

  // Cache the result
  await redisClient.setEx(cacheKey, 3600, JSON.stringify(result));

  res.status(200).json(result);
});