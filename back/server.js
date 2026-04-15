require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const authGoogle = require('./routes/auth.google');

(async () => {
  try {
    await connectDB();
  } catch (err) {
    console.error('Falha ao conectar no MongoDB:', err.message);
  }

  const app = express();

  const origins = (process.env.CORS_ORIGINS || 'http://localhost:4300,http://localhost:4200')
    .split(',').map(o => o.trim()).filter(Boolean);

  app.use(cors({ origin: origins, credentials: true }));
  app.use(express.json());

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  app.use('/api/auth', authGoogle);

  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`API on :${port} (CORS: ${origins.join(', ')})`));
})();
