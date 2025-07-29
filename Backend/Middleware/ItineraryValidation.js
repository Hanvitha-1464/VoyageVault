const { body, param, validationResult } = require('express-validator');

const validateAddActivity = [
  body('place')
    .trim()
    .notEmpty()
    .withMessage('Place name is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Place name must be between 1 and 255 characters'),
    
  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Date must be in valid format (YYYY-MM-DD)'),
    
  body('startTime')
    .notEmpty()
    .withMessage('Start time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in valid format (HH:MM)'),
    
  body('endTime')
    .notEmpty()
    .withMessage('End time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in valid format (HH:MM)')
    .custom((endTime, { req }) => {
      const startTime = req.body.startTime;
      if (startTime && endTime <= startTime) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),
    
  body('addedBy')
    .notEmpty()
    .withMessage('Added by field is required')
    .isInt({ min: 1 })
    .withMessage('Added by must be a valid user ID')
];

const validateDeleteActivity = [
  param('activityId')
    .isInt({ min: 1 })
    .withMessage('Activity ID must be a valid positive integer')
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

module.exports = {
  validateAddActivity,
  validateDeleteActivity,
  handleValidationErrors
};