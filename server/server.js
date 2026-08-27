// ─────────────────────────────────────────────────────────────────────────────
// Borukva News — Node.js / Express server
//
// Responsibilities:
//   1. Serve the built React SPA (client/dist) and static assets.
//   2. Provide a REST proxy to the GitHub Contents API for reading/writing
//      hotspot JSON files — this replaces the Cloudflare Worker
//      (gh-proxy/github-proxy.js) from the original Flutter project.
//
// Env vars (see .env.example):
//   GITHUB_TOKEN   - GitHub personal access token with repo contents access
//   GITHUB_OWNER   - GitHub username/org that owns the data repo (default: borukva-news)
//   GITHUB_REPO    - Repo that stores the hotspot JSON files   (default: news-data)
//   PORT           - HTTP port to listen on (default: 3000)
// ─────────────────────────────────────────────────────────────────────────────

require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();

const PORT = process.env.PORT || 3000;
const GITHUB_OWNER = process.env.GITHUB_OWNER || 'borukva-news';
const GITHUB_REPO = process.env.GITHUB_REPO || 'news-data';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// ── Static assets (images, fonts, sounds) ──────────────────────────────────
// Mirrors the original Flutter `assets/` folder 1:1 — see README for what to
// copy in here (picture folders are large and not bundled with the source).
app.use('/assets', express.static(path.join(__dirname, '..', 'assets')));

// ── GitHub hotspot proxy (replaces the Cloudflare Worker) ───────────────────
//
// GET  /api/hotspots/:file   -> returns { content (base64), sha, ... } from GitHub
// PUT  /api/hotspots/:file   -> body: { content (base64), sha } -> commits update
//
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

app.get('/api/hotspots/:file', async (req, res) => {
  const { file } = req.params;
  if (!GITHUB_TOKEN) {
    return res.status(500).json({ error: 'GITHUB_TOKEN is not configured on the server' });
  }
  try {
    const apiUrl = githubContentsUrl(file);
    const ghResp = await fetch(apiUrl, { headers: ghHeaders() });
    const body = await ghResp.text();
    res.status(ghResp.status).type('application/json').send(body);
  } catch (err) {
    console.error('[hotspots GET] error:', err);
    res.status(502).json({ error: 'Failed to reach GitHub API' });
  }
});

app.put('/api/hotspots/:file', async (req, res) => {
  const { file } = req.params;
  if (!GITHUB_TOKEN) {
    return res.status(500).json({ error: 'GITHUB_TOKEN is not configured on the server' });
  }
  try {
    const apiUrl = githubContentsUrl(file);
    const payload = { ...req.body };
    if (!payload.message) payload.message = `update ${file}`;
    const ghResp = await fetch(apiUrl, {
      method: 'PUT',
      headers: ghHeaders(),
      body: JSON.stringify(payload),
    });
    const body = await ghResp.text();
    if (!ghResp.ok) console.error(`[hotspots PUT] GitHub ${ghResp.status}: ${body}`);
    res.status(ghResp.status).type('application/json').send(body);
  } catch (err) {
    console.error('[hotspots PUT] error:', err);
    res.status(502).json({ error: 'Failed to reach GitHub API' });
  }
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// ── Serve the React build (production) ──────────────────────────────────────
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));

// SPA fallback — anything not matched above goes to index.html so client-side
// routing (react-router) can take over. Using plain middleware (rather than a
// `'*'` route pattern) since Express 5's path-to-regexp no longer accepts a
// bare wildcard string.
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api/') || req.path.startsWith('/assets/')) return next();
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Borukva News server running at http://localhost:${PORT}`);
  if (!GITHUB_TOKEN) {
    console.warn('⚠️  GITHUB_TOKEN not set — hotspot save/load will not work until configured in .env');
  }
});
