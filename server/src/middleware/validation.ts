import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.type, message: e.msg })),
    });
    return;
  }
  next();
};

export const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email')
    .trim()
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/\d/).withMessage('Password must contain at least one number'),
  handleValidationErrors,
];

export const validateLogin = [
  body('email').trim().isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors,
];

export const validateReport = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 5, max: 100 }).withMessage('Title must be 5-100 characters'),
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 10, max: 1000 }).withMessage('Description must be 10-1000 characters'),
  body('category')
    .isIn(['wildfire', 'illegal_logging', 'water_leak', 'pollution'])
    .withMessage('Invalid category'),
  body('latitude')
    .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('longitude')
    .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  handleValidationErrors,
];

export const validateWaterData = [
  body('level')
    .isFloat({ min: 0, max: 100 }).withMessage('Level must be between 0 and 100'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('source').trim().notEmpty().withMessage('Source name is required'),
  handleValidationErrors,
];

export const validateForestData = [
  body('fireRiskLevel')
    .isIn(['Low', 'Medium', 'High', 'Very High', 'Extreme'])
    .withMessage('Invalid fire risk level'),
  body('healthIndex')
    .isFloat({ min: 0, max: 100 }).withMessage('Health index must be between 0 and 100'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('area').isFloat({ min: 0 }).withMessage('Area must be positive'),
  body('temperature').isFloat().withMessage('Temperature is required'),
  body('humidity').isFloat({ min: 0, max: 100 }).withMessage('Humidity must be 0-100'),
  body('windSpeed').isFloat({ min: 0 }).withMessage('Wind speed must be positive'),
  handleValidationErrors,
];
