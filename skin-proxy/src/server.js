import compression from 'compression';
import cors from 'cors';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { fileURLToPath } from 'node:url';
import { fetchSkinById } from './mojang.js';
import { SkinError } from './skin.js';

const ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export function createApp({ fetchImpl = fetch, rateLimitMax = 30, allowedOrigins = ORIGINS } = {}) {
  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(compression());
  app.use(cors({
    origin(origin, callback) {
      if (!origin) return callback(null, false);
      if (allowedOrigins.includes('*')) return callback(null, '*');
      return callback(null, allowedOrigins.includes(origin) ? origin : false);
    },
    methods: ['GET'],
  }));
  app.use((req, res, next) => {
    const startedAt = Date.now();
    res.on('finish', () => {
      if (process.env.LOG_LEVEL !== 'silent') {
        console.log(`${req.method} ${req.originalUrl.split('?')[0]} ${res.statusCode} ${Date.now() - startedAt}ms`);
      }
    });
    next();
  });

  app.get('/healthz', (_req, res) => res.json({ ok: true }));
  app.use('/api', rateLimit({
    windowMs: 60 * 1000,
    limit: rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => res.status(429).set('Retry-After', '60').json({ error: 'rate_limited' }),
  }));

  async function skinResponse(req, res, format) {
    try {
      const skin = await fetchSkinById(req.params.id, fetchImpl);
      res.set('Cache-Control', 'public, max-age=300');
      if (format === 'png') {
        return res.type('png').set('X-Skin-Model', skin.model).send(skin.pngBuffer);
      }
      return res.json({ uuid: skin.uuid, name: skin.name, model: skin.model, skin: skin.skin });
    } catch (error) {
      const skinError = error instanceof SkinError ? error : new SkinError(502, 'upstream_unavailable');
      if (skinError.retryAfter) res.set('Retry-After', skinError.retryAfter);
      return res.status(skinError.status).json({ error: skinError.code });
    }
  }

  app.get('/api/skin/:id.png', (req, res) => skinResponse(req, res, 'png'));
  app.get('/api/skin/:id', (req, res) => skinResponse(req, res, 'json'));
  app.use('/api/skin', (_req, res) => res.status(400).json({ error: 'invalid_id' }));
  app.use((_req, res) => res.status(404).json({ error: 'not_found' }));
  app.use((error, _req, res, _next) => {
    if (error instanceof URIError) return res.status(400).json({ error: 'invalid_id' });
    return res.status(500).json({ error: 'upstream_unavailable' });
  });
  return app;
}

const entryPath = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (entryPath) {
  const port = Number(process.env.PORT) || 3000;
  createApp().listen(port, () => console.log(`skin proxy listening on ${port}`));
}