import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not set in the environment variables');
}

const JWT_SECRET = process.env.JWT_SECRET;

export function signJwt(payload: object) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

export function verifyJwt(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send('Unauthorized');
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyJwt(token);

  if (!decoded) {
    return res.status(401).send('Unauthorized');
  }

  (req as any).user = decoded;
  next();
}
