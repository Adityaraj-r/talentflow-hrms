import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ResponseHandler } from '../utils/responseHandler';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: AppError | Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof AppError) {
    logger.error(`AppError: ${err.message}`, {
      statusCode: err.statusCode,
      path: req.path,
      method: req.method,
    });
    ResponseHandler.error(res, err.message, err.statusCode);
    return;
  }

  if (err.name === 'ValidationError') {
    logger.error('Validation Error:', err.message);
    ResponseHandler.badRequest(res, 'Validation failed', [err.message]);
    return;
  }

  if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    logger.error('Duplicate Key Error:', err.message);
    ResponseHandler.conflict(res, 'Duplicate entry found');
    return;
  }

  if (err.name === 'JsonWebTokenError') {
    logger.error('JWT Error:', err.message);
    ResponseHandler.unauthorized(res, 'Invalid token');
    return;
  }

  if (err.name === 'TokenExpiredError') {
    logger.error('JWT Expired:', err.message);
    ResponseHandler.unauthorized(res, 'Token expired');
    return;
  }

  logger.error('Unexpected Error:', err);
  ResponseHandler.serverError(res, 'An unexpected error occurred');
};

export const notFoundHandler = (req: Request, res: Response): void => {
  logger.warn(`404 - Route not found: ${req.method} ${req.path}`);
  ResponseHandler.notFound(res, `Route ${req.method} ${req.path} not found`);
};
