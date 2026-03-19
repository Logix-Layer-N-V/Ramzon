import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { authRouter } from './routes/auth';
import { usersRouter } from './routes/users';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV }));

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Ramzon API running on :${PORT}`));
