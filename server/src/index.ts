// server/src/index.ts
// Full implementation in Task 6
import express from 'express';
const app = express();
const PORT = process.env.PORT || 4000;
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.listen(PORT, () => console.log(`Ramzon API running on :${PORT}`));
