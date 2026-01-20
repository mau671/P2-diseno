import { Request, Response, NextFunction } from 'express'

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  next()
}

export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  next()
}
