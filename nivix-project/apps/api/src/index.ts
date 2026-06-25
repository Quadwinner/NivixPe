import express from 'express';
import { pinoHttp } from 'pino-http';
import { config } from './config';
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';
import { kycRouter, kycWebhookRouter } from './routes/kyc';

const app = express();
app.use(express.json());
app.use(pinoHttp());

const API = '/api/v1';
app.use(API, healthRouter);
app.use(API, authRouter);
app.use(API, kycRouter);
app.use(API, kycWebhookRouter);

app.use((_req, res) => res.status(404).json({ error: 'not_found' }));

app.listen(config.port, () => {
  console.log(
    `[nivix-api] listening on http://localhost:${config.port} (env=${config.env})`,
  );
});
