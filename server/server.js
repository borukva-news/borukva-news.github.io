
// ─────────────────────────────────────────────────────────────────────────────
// Borukva News — Node.js / Express API server
//
// Deployment:
//   Frontend → GitHub Pages
//   Backend  → Render
//
// Responsibilities:
//   1. Provide REST proxy to GitHub Contents API.
//   2. Read/write hotspot JSON files in the GitHub repository.
//   3. Provide API health check.
//
// Environment variables:
//   GITHUB_TOKEN   - GitHub Personal Access Token
//   GITHUB_OWNER   - GitHub username/org (default: borukva-news)
//   GITHUB_REPO    - Repository containing hotspot JSON files
//                    (default: news-data)
//   FRONTEND_URL   - GitHub Pages URL, used for CORS
//                    Example:
//                    https://YOUR_USERNAME.github.io
//   PORT            - Provided automatically by Render
// ─────────────────────────────────────────────────────────────────────────────

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;

const GITHUB_OWNER = process.env.GITHUB_OWNER || 'borukva-news';
const GITHUB_REPO = process.env.GITHUB_REPO || 'news-data';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://borukva-news.github.io';

// ─────────────────────────────────────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────────────────────────────────────

const allowedOrigins = [
  'https://borukva-news.github.io',
  'http://localhost:5173',
  'http://localhost:3000',
  FRONTEND_URL.replace(/\/+$/, ''),
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      const isAllowed = allowedOrigins.some(
        (allowed) => origin === allowed || origin.startsWith(allowed)
      );
      if (isAllowed || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(null, true); // Permissive CORS for public API
    },
    methods: ['GET', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '2mb' }));

// ─────────────────────────────────────────────────────────────────────────────
// GitHub API helpers
// ─────────────────────────────────────────────────────────────────────────────

function ghHeaders() {
  return {
    Authorization: `token ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'User-Agent': 'borukva-news-node-server',
  };
}

function githubContentsUrl(file) {
  const encodedPath = file
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');

  return `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodedPath}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Health check
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'borukva-news-api',
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GitHub hotspot API
//
// GET /api/hotspots/:file
//
// Example:
// GET /api/hotspots/hotspots.json
//
// Returns GitHub Contents API response.
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/hotspots/:file', async (req, res) => {
  const { file } = req.params;

  if (!GITHUB_TOKEN) {
    return res.status(500).json({
      error: 'GITHUB_TOKEN is not configured on the server',
    });
  }

  if (!file) {
    return res.status(400).json({
      error: 'File name is required',
    });
  }

  try {
    const apiUrl = githubContentsUrl(file);

    const ghResp = await fetch(apiUrl, {
      method: 'GET',
      headers: ghHeaders(),
    });

    const body = await ghResp.text();

    res
      .status(ghResp.status)
      .type('application/json')
      .send(body);
  } catch (err) {
    console.error('[hotspots GET] error:', err);

    res.status(502).json({
      error: 'Failed to reach GitHub API',
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GitHub hotspot API
//
// PUT /api/hotspots/:file
//
// Body:
// {
//   "content": "base64 encoded content",
//   "sha": "existing file sha",
//   "message": "optional commit message"
// }
//
// ─────────────────────────────────────────────────────────────────────────────

app.put('/api/hotspots/:file', async (req, res) => {
  const { file } = req.params;

  if (!GITHUB_TOKEN) {
    return res.status(500).json({
      error: 'GITHUB_TOKEN is not configured on the server',
    });
  }

  if (!file) {
    return res.status(400).json({
      error: 'File name is required',
    });
  }

  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({
      error: 'Request body must be a JSON object',
    });
  }

  try {
    const apiUrl = githubContentsUrl(file);

    const payload = {
      ...req.body,
    };

    if (!payload.message) {
      payload.message = `update ${file}`;
    }

    const ghResp = await fetch(apiUrl, {
      method: 'PUT',
      headers: ghHeaders(),
      body: JSON.stringify(payload),
    });

    const body = await ghResp.text();

    if (!ghResp.ok) {
      console.error(
        `[hotspots PUT] GitHub ${ghResp.status}: ${body}`
      );
    }

    res
      .status(ghResp.status)
      .type('application/json')
      .send(body);
  } catch (err) {
    console.error('[hotspots PUT] error:', err);

    res.status(502).json({
      error: 'Failed to reach GitHub API',
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 404 handler for unknown API routes
// ─────────────────────────────────────────────────────────────────────────────

app.use('/api', (_req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Start server
// ─────────────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log('──────────────────────────────────────────────');
  console.log('Borukva News API server started');
  console.log(`Port: ${PORT}`);
  console.log(`GitHub repository: ${GITHUB_OWNER}/${GITHUB_REPO}`);
  console.log(`Frontend: ${FRONTEND_URL}`);
  console.log('──────────────────────────────────────────────');

  if (!GITHUB_TOKEN) {
    console.warn(
      '⚠️ GITHUB_TOKEN is not configured.'
    );
    console.warn(
      'Hotspot read/write operations will not work.'
    );
  } else {
    console.log('GitHub token: configured');
  }
});
