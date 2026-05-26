import type { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncFunction = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

const AsyncHandler = (fn: AsyncFunction): RequestHandler => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (err) {
      console.error(err);
      next(err);
    }
  };
};

export default AsyncHandler;