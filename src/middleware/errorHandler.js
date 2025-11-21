// Global error handler middleware
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => val.message);
    error = { message, statusCode: 400 };
  }

  // Custom service errors
  if (err.message) {
    // Determine status code based on error message
    let statusCode = 500;
    
    if (err.message.includes('not found')) {
      statusCode = 404;
    } else if (
      err.message.includes('Not authorized') ||
      err.message.includes('authorized')
    ) {
      statusCode = 403;
    } else if (
      err.message.includes('required') ||
      err.message.includes('invalid') ||
      err.message.includes('already exists') ||
      err.message.includes('Cannot')
    ) {
      statusCode = 400;
    }

    return res.status(statusCode).json({
      success: false,
      error: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
