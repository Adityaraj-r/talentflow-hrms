import { Request, Response, NextFunction } from 'express';
import { ResponseHandler } from './responseHandler';

type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/** Wrap async Express handlers; forwards errors to next (add global error middleware) or responds safely. */
export function catchAsync(fn: AsyncRequestHandler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : 'Request failed';
      if (!res.headersSent) {
        ResponseHandler.serverError(res, process.env.NODE_ENV === 'production' ? 'Internal server error' : message);
      }
    });
  };
}
