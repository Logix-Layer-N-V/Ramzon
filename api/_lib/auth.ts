import jwt from 'jsonwebtoken';

export interface AuthUser {
  id: string;
  role: string;
  name: string;
}

export function getAuthUser(req: Request): AuthUser | null {
  const token = req.headers.get('authorization')?.split(' ')[1];
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as AuthUser;
  } catch {
    return null;
  }
}

export function signAccess(payload: AuthUser): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '15m' });
}

export function signRefresh(payload: AuthUser): string {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' });
}
