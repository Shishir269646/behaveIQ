const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = [];

  // Handle express-validator errors
  if (err.array) { // Check if it's an express-validator error object
    statusCode = 400; // Bad Request
    message = 'Validation Failed';
    errors = err.array().map(error => ({ field: error.param, message: error.msg }));
    console.error('Validation Errors:', errors); // Log detailed validation errors
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    errors: errors.length > 0 ? errors : undefined, // Include detailed errors if available
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;