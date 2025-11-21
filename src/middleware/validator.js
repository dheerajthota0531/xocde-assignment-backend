import { body, validationResult } from 'express-validator';

// Middleware to handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  next();
};

// Validation rules for creating a post
export const validatePost = [
  body('text')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Text must be less than 5000 characters'),
  handleValidationErrors,
];

// Validation rules for sending a message
export const validateMessage = [
  body('text')
    .trim()
    .notEmpty()
    .withMessage('Message text is required')
    .isLength({ max: 1000 })
    .withMessage('Message must be less than 1000 characters'),
  body('receiver')
    .notEmpty()
    .withMessage('Receiver is required')
    .isMongoId()
    .withMessage('Invalid receiver ID'),
  handleValidationErrors,
];

