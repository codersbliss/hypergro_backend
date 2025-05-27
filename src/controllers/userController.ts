import { Request, Response } from 'express';
import User from '../models/User';
import { AppError, asyncHandler } from '../middlewares/error';

// Register user
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) throw new AppError('User already exists', 400);

  const user = await User.create({ name, email, password });
  const token = user.generateAuthToken();

  res.status(201).json({
    success: true,
    token,
    user: { id: user._id, name: user.name, email: user.email },
  });
});

// Login user
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password)
    throw new AppError('Please provide email and password', 400);

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password)))
    throw new AppError('Invalid credentials', 401);

  const token = user.generateAuthToken();

  res.status(200).json({
    success: true,
    token,
    user: { id: user._id, name: user.name, email: user.email },
  });
});

// Get current user
export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new AppError('User not found', 404);

  res.status(200).json({
    success: true,
    data: { id: user._id, name: user.name, email: user.email },
  });
});

// Update user details
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { name, email } = req.body;

  if (email) {
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.id.toString() !== req.user._id.toString())
      throw new AppError('Email already in use', 400);
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, email },
    { new: true, runValidators: true }
  );

  if (!user) throw new AppError('User not found', 404);

  res.status(200).json({
    success: true,
    data: { id: user._id, name: user.name, email: user.email },
  });
});

// Update password
export const updatePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword)
    throw new AppError('Please provide current and new password', 400);

  const user = await User.findById(req.user._id).select('+password');
  if (!user) throw new AppError('User not found', 404);

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new AppError('Current password is incorrect', 401);

  user.password = newPassword;
  await user.save(); // ensure pre-save middleware hashes the password

  const token = user.generateAuthToken();

  res.status(200).json({
    success: true,
    token,
    message: 'Password updated successfully',
  });
});

// Find user by email
export const findUserByEmail = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.query;
  if (!email) throw new AppError('Please provide an email to search', 400);

  const user = await User.findOne({ email: email.toString() });
  if (!user) throw new AppError('User not found', 404);

  res.status(200).json({
    success: true,
    data: { id: user._id, name: user.name, email: user.email },
  });
});
