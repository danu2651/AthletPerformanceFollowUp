const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // PostgreSQL errors
  if (err.code === "23505") {
    statusCode = 409;
    message = "A record with this value already exists";
  }
  if (err.code === "23503") {
    statusCode = 400;
    message = "Referenced record does not exist";
  }
  if (err.code === "23514") {
    statusCode = 400;
    message = "Value violates a constraint";
  }

  if (process.env.NODE_ENV === "development") {
    console.error("[ERROR]", err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
};

module.exports = { errorHandler, notFound };
