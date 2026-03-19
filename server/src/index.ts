import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { authRouter } from './routes/auth';
import { usersRouter } from './routes/users';
import { clientsRouter } from './routes/clients';
import { invoicesRouter } from './routes/invoices';
import { estimatesRouter } from './routes/estimates';
import { paymentsRouter } from './routes/payments';
import { creditsRouter } from './routes/credits';
import { expensesRouter } from './routes/expenses';
import { productsRouter } from './routes/products';

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
app.use('/api/clients', clientsRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/estimates', estimatesRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/credits', creditsRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/products', productsRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Ramzon API running on :${PORT}`));
