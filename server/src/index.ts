import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV }));

// Routes will be added in Task 7
// app.use('/api/auth', authRouter);
// app.use('/api/clients', clientsRouter);
// etc.

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Ramzon API running on :${PORT}`));
