
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
//   CUSTOM_NEWS_GITHUB_TOKEN - GitHub token for custom-news
//   NEWS_DATA_GITHUB_TOKEN   - GitHub token for news-data
//   GITHUB_OWNER             - GitHub username/org (default: borukva-news)
//   FRONTEND_URL   - GitHub Pages URL, used for CORS
//                    Example:
//                    https://YOUR_USERNAME.github.io
//   PORT            - Provided automatically by Render
// ─────────────────────────────────────────────────────────────────────────────

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const nodemailer = require('nodemailer');

const app = express();

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;

const GITHUB_OWNER = process.env.GITHUB_OWNER || 'borukva-news';
const CUSTOM_NEWS_REPO = process.env.CUSTOM_NEWS_REPO || 'custom-news';
const NEWS_DATA_REPO = process.env.NEWS_DATA_REPO || 'news-data';
const CUSTOM_NEWS_TOKEN = process.env.CUSTOM_NEWS_GITHUB_TOKEN || process.env.GITHUB_TOKEN || '';
const NEWS_DATA_TOKEN = process.env.NEWS_DATA_GITHUB_TOKEN || process.env.GITHUB_TOKEN || '';
const MODERATION_SECRET = process.env.MODERATION_SECRET || '';
const API_PUBLIC_URL = (process.env.API_PUBLIC_URL || `http://localhost:${PORT}`).replace(/\/+$/, '');
const MODERATOR_EMAIL = process.env.MODERATOR_EMAIL || 'borukvanews@gmail.com';

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
    methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '25mb' }));

// ─────────────────────────────────────────────────────────────────────────────
// GitHub API helpers
// ─────────────────────────────────────────────────────────────────────────────

function ghHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'User-Agent': 'borukva-news-node-server',
  };
}

function githubContentsUrl(repo, file) {
  const encodedPath = file
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');

  return `https://api.github.com/repos/${GITHUB_OWNER}/${repo}/contents/${encodedPath}`;
}

function repositoryConfig(repo) {
  return repo === 'custom-news'
    ? { name: CUSTOM_NEWS_REPO, token: CUSTOM_NEWS_TOKEN }
    : { name: NEWS_DATA_REPO, token: NEWS_DATA_TOKEN };
}

async function githubRequest(repo, file, options = {}) {
  const config = repositoryConfig(repo);
  if (!config.token) throw new Error(`GitHub token is not configured for ${repo}`);
  const response = await fetch(githubContentsUrl(config.name, file), {
    ...options,
    headers: { ...ghHeaders(config.token), ...(options.headers || {}) },
  });
  const text = await response.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  if (!response.ok) {
    const error = new Error(`GitHub request failed with ${response.status}`);
    error.status = response.status;
    error.body = body;
    throw error;
  }
  return body;
}

async function readGithubFile(repo, file) {
  const body = await githubRequest(repo, file);
  return {
    ...body,
    decoded: Buffer.from(body.content.replace(/\s/g, ''), 'base64').toString('utf8'),
  };
}

async function writeGithubFile(repo, file, content, message, sha) {
  return githubRequest(repo, file, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content: Buffer.isBuffer(content) ? content.toString('base64') : Buffer.from(content).toString('base64'),
      ...(sha ? { sha } : {}),
    }),
  });
}

async function removeGithubFile(repo, file, message) {
  const existing = await githubRequest(repo, file);
  return githubRequest(repo, file, {
    method: 'DELETE',
    body: JSON.stringify({ message, sha: existing.sha }),
  });
}

function validNewsId(id) {
  return /^news_[0-9]+$/.test(id);
}

function parseNews(value) {
  return {
    ...value,
    likes: Number(value.likes) || 0,
    dislikes: Number(value.dislikes) || 0,
    comments: Array.isArray(value.comments) ? value.comments : [],
    reactionVoters: value.reactionVoters && typeof value.reactionVoters === 'object' ? value.reactionVoters : {},
  };
}

function imageUrl(folder, filename) {
  return `${API_PUBLIC_URL}/api/news/image/${encodeURIComponent(folder)}/${encodeURIComponent(filename)}`;
}

function mailer() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  return nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: process.env.SMTP_SECURE === 'true', auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
}

async function sendMail(to, subject, text) {
  const transport = mailer();
  if (!transport) return false;
  try {
    await transport.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to, subject, text });
    return true;
  } catch (err) {
    console.error('[mail] failed:', err.message);
    return false;
  }
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

  if (!NEWS_DATA_TOKEN) {
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
    res.json(await githubRequest('news-data', `hotspots/${file}`));
  } catch (err) {
    console.error('[hotspots GET] error:', err);

    res.status(err.status || 502).json({
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

  if (!NEWS_DATA_TOKEN) {
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
    res.json(await githubRequest('news-data', `hotspots/${file}`, {
      method: 'PUT',
      body: JSON.stringify({ ...req.body, message: req.body.message || `update ${file}` }),
    }));
  } catch (err) {
    console.error('[hotspots PUT] error:', err);

    res.status(err.status || 502).json({
      error: 'Failed to reach GitHub API',
    });
  }
});

app.post('/api/propose-news', async (req, res) => {
  const { title, authorNick, authorEmail, images, hotspots = [] } = req.body || {};
  if (!title?.trim() || !authorNick?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authorEmail || '') || !Array.isArray(images) || images.length === 0) {
    return res.status(400).json({ error: 'title, authorNick, authorEmail and at least one image are required' });
  }
  try {
    let ids = { lastId: Math.floor(Date.now() / 1000) - 1 };
    let idsSha;
    try {
      const idsFile = await readGithubFile('custom-news', 'ids/news_ids.json');
      idsSha = idsFile.sha;
      const parsedIds = JSON.parse(idsFile.decoded || '{}');
      if (parsedIds && typeof parsedIds === 'object') ids = parsedIds;
    } catch (err) {
      if (err.status !== 404 && !(err instanceof SyntaxError)) throw err;
    }
    const id = `news_${Math.max(Number(ids.lastId) || 0, Date.now()) + 1}`;
    await writeGithubFile('custom-news', 'ids/news_ids.json', JSON.stringify({ lastId: Number(id.slice(5)) }, null, 2), `Reserve ${id}`, idsSha);
    const imageNames = images.map((_, index) => `${id}_p${index + 1}.png`);
    const news = { id, title: title.trim(), authorNick: authorNick.trim(), authorEmail: authorEmail.trim(), status: 'draft', createdAt: new Date().toISOString(), images: imageNames, likes: 0, dislikes: 0, comments: [], commentsCount: 0, reactionVoters: {} };
    await writeGithubFile('custom-news', `drafts/${id}.json`, JSON.stringify(news, null, 2), `Create draft ${id}`);
    await Promise.all(images.map((data, index) => writeGithubFile('custom-news', `drafts/images/${imageNames[index]}`, Buffer.from(String(data).replace(/^data:image\/png;base64,/, ''), 'base64'), `Add ${imageNames[index]}`)));
    await writeGithubFile('news-data', `hotspots/${id}_hotspots.json`, JSON.stringify({ newsId: id, hotspots }, null, 2), `Add hotspots for ${id}`);
    const approve = `${API_PUBLIC_URL}/api/news/moderate?id=${id}&action=approve&token=${encodeURIComponent(MODERATION_SECRET)}`;
    const reject = `${API_PUBLIC_URL}/api/news/moderate?id=${id}&action=reject&token=${encodeURIComponent(MODERATION_SECRET)}`;
    await sendMail(MODERATOR_EMAIL, `Нова новина на модерацію: ${title}`, `ID: ${id}\nАвтор: ${authorNick} (${authorEmail})\n\nApprove: ${approve}\nReject: ${reject}`);
    res.status(201).json({ status: 'draft_created', id });
  } catch (err) {
    console.error('[propose-news]', err);
    res.status(err.status || 502).json({ error: 'Failed to create news draft' });
  }
});

app.get('/api/news/moderate', async (req, res) => {
  const { id, action, token } = req.query;
  if (!validNewsId(id) || !['approve', 'reject'].includes(action) || !MODERATION_SECRET || token !== MODERATION_SECRET) return res.status(403).send('Invalid moderation link');
  try {
    const draft = parseNews(JSON.parse((await readGithubFile('custom-news', `drafts/${id}.json`)).decoded));
    if (action === 'approve') {
      const published = { ...draft, status: 'published' };
      await writeGithubFile('custom-news', `published/${id}.json`, JSON.stringify(published, null, 2), `Publish ${id}`);
      await Promise.all(draft.images.map(async (name) => { const file = await githubRequest('custom-news', `drafts/images/${name}`); return writeGithubFile('custom-news', `published/images/${name}`, Buffer.from(file.content.replace(/\s/g, ''), 'base64'), `Publish ${name}`); }));
    }
    await removeGithubFile('custom-news', `drafts/${id}.json`, `${action} ${id}`);
    await Promise.all(draft.images.map((name) => removeGithubFile('custom-news', `drafts/images/${name}`, `${action} ${name}`).catch((err) => { if (err.status !== 404) throw err; })));
    if (action === 'reject') await removeGithubFile('news-data', `hotspots/${id}_hotspots.json`, `Reject hotspots for ${id}`).catch((err) => { if (err.status !== 404) throw err; });
    await sendMail(draft.authorEmail, `Новину ${action === 'approve' ? 'опубліковано' : 'відхилено'}`, `Випуск «${draft.title}» (${id}) ${action === 'approve' ? 'опубліковано.' : 'відхилено.'}`);
    res.type('html').send(`<h1>${action === 'approve' ? 'Новину опубліковано' : 'Новину відхилено'}</h1><p>${draft.title}</p>`);
  } catch (err) { console.error('[moderate]', err); res.status(err.status || 502).send('Moderation failed'); }
});

app.get('/api/news/image/:folder/:filename', async (req, res) => {
  const { folder, filename } = req.params;
  if (!['published', 'drafts'].includes(folder) || !/^[\w.-]+\.png$/i.test(filename)) return res.status(400).json({ error: 'Invalid image path' });
  try {
    const file = await githubRequest('custom-news', `${folder}/images/${filename}`);
    res.type('png').send(Buffer.from(file.content.replace(/\s/g, ''), 'base64'));
  } catch (err) {
    res.status(err.status || 502).json({ error: 'Failed to load news image' });
  }
});

app.get('/api/news/feed', async (_req, res) => {
  try {
    const visitorId = typeof _req.query.visitorId === 'string' ? _req.query.visitorId : '';
    const files = await githubRequest('custom-news', 'published');
    const news = await Promise.all(files.filter((file) => file.name.endsWith('.json')).map(async (file) => {
      const item = parseNews(JSON.parse((await readGithubFile('custom-news', file.path)).decoded));
      return { ...item, author: item.authorNick, userReaction: visitorId ? item.reactionVoters[visitorId] || null : null, commentsCount: item.comments.length, images: item.images.map((name) => imageUrl('published', name)) };
    }));
    res.json(news.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  } catch (err) { res.status(err.status || 502).json({ error: 'Failed to load published news' }); }
});

app.post('/api/news/:id/reactions', async (req, res) => {
  const { type, visitorId } = req.body || {};
  if (!validNewsId(req.params.id) || !['like', 'dislike'].includes(type) || typeof visitorId !== 'string' || !/^[a-zA-Z0-9_-]{16,100}$/.test(visitorId)) return res.status(400).json({ error: 'Invalid reaction' });
  try {
    const file = await readGithubFile('custom-news', `published/${req.params.id}.json`);
    const news = parseNews(JSON.parse(file.decoded));
    const previousReaction = news.reactionVoters[visitorId];
    if (previousReaction) return res.json({ likes: news.likes, dislikes: news.dislikes, userReaction: previousReaction });
    news[type === 'like' ? 'likes' : 'dislikes'] += 1;
    news.reactionVoters[visitorId] = type;
    await writeGithubFile('custom-news', `published/${req.params.id}.json`, JSON.stringify(news, null, 2), `React to ${req.params.id}`, file.sha);
    res.json({ likes: news.likes, dislikes: news.dislikes, userReaction: type });
  } catch (err) { res.status(err.status || 502).json({ error: 'Failed to save reaction' }); }
});

app.post('/api/news/:id/comments', async (req, res) => {
  const { author, authorEmail, text } = req.body || {};
  if (!validNewsId(req.params.id) || !author?.trim() || !text?.trim()) return res.status(400).json({ error: 'Author and text are required' });
  try {
    const file = await readGithubFile('custom-news', `published/${req.params.id}.json`);
    const news = parseNews(JSON.parse(file.decoded));
    news.comments.push({ author: author.trim(), authorEmail: authorEmail?.trim() || '', text: text.trim(), createdAt: new Date().toISOString() });
    news.commentsCount = news.comments.length;
    await writeGithubFile('custom-news', `published/${req.params.id}.json`, JSON.stringify(news, null, 2), `Comment on ${req.params.id}`, file.sha);
    res.status(201).json(news.comments.at(-1));
  } catch (err) { res.status(err.status || 502).json({ error: 'Failed to save comment' }); }
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
  console.log(`News repositories: ${GITHUB_OWNER}/${CUSTOM_NEWS_REPO}, ${GITHUB_OWNER}/${NEWS_DATA_REPO}`);
  console.log(`Frontend: ${FRONTEND_URL}`);
  console.log('──────────────────────────────────────────────');

  if (!CUSTOM_NEWS_TOKEN || !NEWS_DATA_TOKEN) {
    console.warn(
      '⚠️ GITHUB_TOKEN is not configured.'
    );
    console.warn(
      'Some GitHub operations will not work.'
    );
  } else {
    console.log('GitHub token: configured');
  }
});
