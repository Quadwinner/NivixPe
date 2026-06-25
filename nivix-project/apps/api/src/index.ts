import express from 'express';
import { pinoHttp } from 'pino-http';
import { config } from './config';
import { healthRouter } from './routes/health';

const app = express();
app.use(express.json());
app.use(pinoHttp());

// Phase 1 routes mount here. KYC + auth routers land in WS-B.
app.use('/api/v1', healthRouter);

app.use((_req, res) => res.status(404).json({ error: 'not_found' }));

app.listen(config.port, () => {
  console.log(
    `[nivix-api] listening on http://localhost:${config.port} (env=${config.env})`,
  );
});
