import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
      token?: string;
    }
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token;

    // Check if token exists in authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      res.status(401).json({ success: false, message: 'Not authorized to access this route' });
      return;
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key_here') as any;

      // Set user in request
      const user = await User.findById(decoded.id);

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      req.user = user;
      req.token = token;
      next();
    } catch (error) {
      res.status(401).json({ success: false, message: 'Not authorized to access this route' });
      return;
    }
  } catch (error) {
    next(error);
  }
};

// Check if user is property owner
export const isPropertyOwner = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const propertyId = req.params.id;
    const Property = require('../models/Property').default;
    
    const property = await Property.findById(propertyId);
    
    if (!property) {
      res.status(404).json({ success: false, message: 'Property not found' });
      return;
    }
    
    // Check if user is the property owner
    if (property.createdBy.toString() !== req.user._id.toString()) {
      res.status(403).json({ 
        success: false, 
        message: 'Not authorized to perform this action on this property' 
      });
      return;
    }
    
    next();
  } catch (error) {
    next(error);
  }
};