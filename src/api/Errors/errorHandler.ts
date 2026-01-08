// src/api/middleware/errorHandler.ts

import { Request, Response, NextFunction } from 'express';

// Custom error class
export class ApiError extends Error {
  statusCode: number;
  
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Not found error
export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(404, message);
  }
}

// Bad request error
export class BadRequestError extends ApiError {
  constructor(message: string = 'Bad request') {
    super(400, message);
  }
}

// Database error
export class DatabaseError extends ApiError {
  constructor(message: string = 'Database error') {
    super(500, message);
  }
}

// Error handler middleware
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(`[Error] ${err.message}`);
  
  // Handle known errors
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode,
    });
  }

  // Handle database errors
  if (err.message.includes('ECONNREFUSED')) {
    return res.status(503).json({
      error: 'Database connection failed',
      statusCode: 503,
    });
  }

  // Handle unknown errors
  return res.status(500).json({
    error: 'Internal server error',
    statusCode: 500,
  });
}

// 404 handler middleware
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: 'Endpoint not found',
    statusCode: 404,
    path: req.path,
  });
}

// Request logger middleware
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const timestamp = new Date().toISOString().slice(11, 19);
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
}