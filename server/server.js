
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
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const RESEND_FROM = process.env.RESEND_FROM || process.env.SMTP_FROM || 'onboarding@resend.dev';

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
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-moderation-token'],
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
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === 'true';
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST.trim(),
    port,
    secure,
    requireTLS: !secure && port === 587,
    auth: {
      user: process.env.SMTP_USER.trim(),
      pass: process.env.SMTP_PASS.replace(/\s/g, ''),
    },
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function moderationEmailHtml({ id, author, title, approveUrl, rejectUrl }) {
  return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:30px;background:#f6f7f9">
  <div style="background:#ffffff;border-radius:12px;padding:28px;box-shadow:0 2px 10px rgba(0,0,0,0.06)">
    <h2 style="margin-top:0;color:#202124;">📰 Нова новина на модерацію</h2>
    <p style="color:#5f6368;font-size:15px;">Нова новина від автора <b>${escapeHtml(author)}</b> очікує на модерацію.</p>
    <div style="background:#f1f3f4;border-radius:8px;padding:14px;margin:20px 0;">
      <div style="font-size:12px;color:#80868b;">ID новини</div>
      <div style="font-family:monospace;margin-top:4px;">${escapeHtml(id)}</div>
      <div style="font-size:12px;color:#80868b;margin-top:12px;">Назва</div>
      <div style="margin-top:4px;">${escapeHtml(title)}</div>
    </div>
    <p style="font-size:14px;color:#5f6368;">Оберіть дію:</p>
    <div style="margin-top:20px;">
      <a href="${escapeHtml(approveUrl)}" style="display:inline-block;background:#188038;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:7px;font-weight:bold;margin-right:8px;">✓ Схвалити</a>
      <a href="${escapeHtml(rejectUrl)}" style="display:inline-block;background:#d93025;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:7px;font-weight:bold;">✕ Відхилити</a>
    </div>
    <hr style="border:none;border-top:1px solid #eee;margin:28px 0;">
    <div style="font-size:12px;color:#9aa0a6;">Borukva News · Система модерації</div>
  </div>
</div>`;
}

async function sendMail(to, subject, text, html) {
  if (RESEND_API_KEY) {
    try {
      console.log('[mail] sending through Resend HTTPS', { to, from: RESEND_FROM });
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: RESEND_FROM, to: [to], subject, text, ...(html ? { html } : {}) }),
      });
      const body = await response.text();
      if (!response.ok) {
        console.error('[mail] Resend failed:', response.status, body.slice(0, 500));
        return { sent: false, error: 'resend_failed', code: `HTTP_${response.status}` };
      }
      console.log('[mail] Resend message sent', { response: body.slice(0, 200) });
      return { sent: true, error: null };
    } catch (err) {
      console.error('[mail] Resend request failed:', err.code || 'UNKNOWN', err.message);
      return { sent: false, error: 'resend_request_failed', code: err.code || 'UNKNOWN' };
    }
  }

  const transport = mailer();
  if (!transport) {
    console.error('[mail] SMTP is not configured', {
      host: Boolean(process.env.SMTP_HOST),
      user: Boolean(process.env.SMTP_USER),
      pass: Boolean(process.env.SMTP_PASS),
    });
    return { sent: false, error: 'not_configured' };
  }
  console.log('[mail] connecting', { host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: process.env.SMTP_SECURE === 'true', to });
  try {
    await transport.verify();
  } catch (err) {
    console.error('[mail] verify failed:', err.code || 'UNKNOWN', err.message);
    return { sent: false, error: 'verify_failed', code: err.code || 'UNKNOWN' };
  }
  console.log('[mail] SMTP connection verified');
  try {
    await transport.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to, subject, text, ...(html ? { html } : {}) });
  } catch (err) {
    console.error('[mail] send failed:', err.code || 'UNKNOWN', err.message);
    return { sent: false, error: 'send_failed', code: err.code || 'UNKNOWN' };
  }
  console.log('[mail] message sent');
  return { sent: true, error: null };
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
  console.log('[propose-news] request received', {
    title,
    authorNick,
    imageCount: Array.isArray(images) ? images.length : 0,
    hotspotCount: Array.isArray(hotspots) ? hotspots.length : 0,
  });
  if (!title?.trim() || !authorNick?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authorEmail || '') || !Array.isArray(images) || images.length === 0) {
    console.error('[propose-news] validation failed', {
      hasTitle: Boolean(title?.trim()),
      hasAuthorNick: Boolean(authorNick?.trim()),
      hasValidEmail: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authorEmail || ''),
      imageCount: Array.isArray(images) ? images.length : 0,
    });
    return res.status(400).json({ error: 'title, authorNick, authorEmail and at least one image are required' });
  }
  try {
    console.log('[propose-news] started', { title, authorNick, imageCount: images.length, hotspotCount: hotspots.length });
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
    console.log('[propose-news] reserving id', { id });
    await writeGithubFile('custom-news', 'ids/news_ids.json', JSON.stringify({ lastId: Number(id.slice(5)) }, null, 2), `Reserve ${id}`, idsSha);
    const imageNames = images.map((_, index) => `${id}_p${index + 1}.png`);
    const news = { id, title: title.trim(), authorNick: authorNick.trim(), authorEmail: authorEmail.trim(), status: 'draft', createdAt: new Date().toISOString(), images: imageNames, likes: 0, dislikes: 0, comments: [], commentsCount: 0, reactionVoters: {} };
    console.log('[propose-news] saving draft', { id });
    await writeGithubFile('custom-news', `drafts/${id}.json`, JSON.stringify(news, null, 2), `Create draft ${id}`);
    console.log('[propose-news] saving images', { id, count: images.length });
    await Promise.all(images.map((data, index) => writeGithubFile('custom-news', `drafts/images/${imageNames[index]}`, Buffer.from(String(data).replace(/^data:image\/png;base64,/, ''), 'base64'), `Add ${imageNames[index]}`)));
    await writeGithubFile('news-data', `hotspots/${id}_hotspots.json`, JSON.stringify({ newsId: id, hotspots }, null, 2), `Add hotspots for ${id}`);
    console.log('[propose-news] sending moderation email', { id, to: MODERATOR_EMAIL });
    const approve = `${API_PUBLIC_URL}/api/news/moderate?id=${id}&action=approve&token=${encodeURIComponent(MODERATION_SECRET)}`;
    const reject = `${API_PUBLIC_URL}/api/news/moderate?id=${id}&action=reject&token=${encodeURIComponent(MODERATION_SECRET)}`;
    const moderationText = `ID: ${id}\nАвтор: ${authorNick} (${authorEmail})\nНазва: ${title}\n\nApprove: ${approve}\nReject: ${reject}`;
    const moderationHtml = moderationEmailHtml({ id, author: authorNick, title, approveUrl: approve, rejectUrl: reject });
    const mailResult = await sendMail(MODERATOR_EMAIL, `Нова новина на модерацію: ${title}`, moderationText, moderationHtml);
    console.log('[propose-news] completed', { id, mailSent: mailResult.sent, mailError: mailResult.error, mailCode: mailResult.code });
    res.status(201).json({ status: 'draft_created', id, mailSent: mailResult.sent, mailError: mailResult.error, mailCode: mailResult.code || null });
  } catch (err) {
    console.error('[propose-news] failed', { code: err.code, status: err.status, message: err.message, body: err.body });
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

app.delete('/api/news/:id', async (req, res) => {
  const { id } = req.params;
  const token = req.get('x-moderation-token') || req.body?.token;
  if (!validNewsId(id) || !MODERATION_SECRET || token !== MODERATION_SECRET) return res.status(403).json({ error: 'Invalid moderation token' });
  try {
    const publishedFile = await readGithubFile('custom-news', `published/${id}.json`);
    const news = parseNews(JSON.parse(publishedFile.decoded));
    await removeGithubFile('custom-news', `published/${id}.json`, `Delete published ${id}`);
    await Promise.all(news.images.map((name) => removeGithubFile('custom-news', `published/images/${name}`, `Delete ${name}`).catch((err) => { if (err.status !== 404) throw err; })));
    await removeGithubFile('news-data', `hotspots/${id}_hotspots.json`, `Delete hotspots for ${id}`).catch((err) => { if (err.status !== 404) throw err; });
    console.log('[news delete] completed', { id });
    res.json({ status: 'deleted', id });
  } catch (err) {
    console.error('[news delete] failed', { id, code: err.code, status: err.status, message: err.message });
    res.status(err.status || 502).json({ error: 'Failed to delete published news' });
  }
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
