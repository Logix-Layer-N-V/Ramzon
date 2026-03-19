import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool';
import { requireAuth, AuthRequest } from '../middleware/auth';

export const authRouter = Router();

const signAccess = (payload: object) =>
  jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '15m' });
const signRefresh = (payload: object) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' });

authRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email=$1 AND status=$2',
      [email, 'Active']
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const payload = { id: user.id, role: user.role, name: user.name };
    const accessToken = signAccess(payload);
    const refreshToken = signRefresh(payload);
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 7 * 86400 * 1000,
    });
    res.json({ accessToken, user: payload });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

authRouter.post('/refresh', (req: Request, res: Response): void => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    res.status(401).json({ error: 'No refresh token' });
    return;
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as {
      id: string; role: string; name: string;
    };
    res.json({ accessToken: signAccess({ id: payload.id, role: payload.role, name: payload.name }) });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

authRouter.post('/logout', (_req: Request, res: Response): void => {
  res.clearCookie('refreshToken');
  res.json({ ok: true });
});

authRouter.get('/me', requireAuth, (req: AuthRequest, res: Response): void => {
  res.json({ user: req.user });
});
