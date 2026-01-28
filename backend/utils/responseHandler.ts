import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: any[];
  timestamp: string;
}

export class ResponseHandler {
  static success<T>(
    res: Response,
    data: T,
    message: string = 'Success',
    statusCode: number = 200
  ): Response {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(response);
  }

  static error(
    res: Response,
    message: string = 'Error occurred',
    statusCode: number = 500,
    errors?: any[]
  ): Response {
    const response: ApiResponse = {
      success: false,
      error: message,
      errors,
      timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(response);
  }

  static created<T>(res: Response, data: T, message: string = 'Created successfully'): Response {
    return this.success(res, data, message, 201);
  }

  static badRequest(res: Response, message: string = 'Bad request', errors?: any[]): Response {
    return this.error(res, message, 400, errors);
  }

  static unauthorized(res: Response, message: string = 'Unauthorized'): Response {
    return this.error(res, message, 401);
  }

  static forbidden(res: Response, message: string = 'Forbidden'): Response {
    return this.error(res, message, 403);
  }

  static notFound(res: Response, message: string = 'Resource not found'): Response {
    return this.error(res, message, 404);
  }

  static conflict(res: Response, message: string = 'Conflict'): Response {
    return this.error(res, message, 409);
  }

  static serverError(res: Response, message: string = 'Internal server error'): Response {
    return this.error(res, message, 500);
  }
}
