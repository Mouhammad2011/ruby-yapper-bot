/**
 * RUBY / JEWEL ALL-IN-ONE YAPPER BOT & BACKEND API ENGINE
 * Modernized Dashboard Engine for Render.com Hosting
 */

import express from 'express';
import crypto from 'crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Bot, Embed, Row, Button } from './yapper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.YAPPER_BOT_TOKEN || 'yb_feefbcf1.vUmpvyzldBBC46ArXJkCstRtH4tJlp0hjIwQaZfs';

const bot = new Bot(BOT_TOKEN);
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

const db = {
  authCodes: new Map(),
  sessions: new Map(),
  serverConfigs: new Map(),
  userXP: new Map(),
  cases: new Map(),
  tickets: new Map()
};

function getGuildConfig(serverId) {
  if (!db.serverConfigs.has(serverId)) {
    db.serverConfigs.set(serverId, {
      id: serverId,
      botName: 'Ruby',
      prefix: '/',
      shield: 'watching',
      ticketPanel: true,
      verifyEnabled: false,
      levelsEnabled: true,
      welcomeChannel: '',
      automod: {
        enabled: true,
        words: ['badword', 'scam', 'phishing'],
        invites: true
      }
    });
  }
  return db.serverConfigs.get(serverId);
}

function generateSecureCode() {
  return crypto.randomInt(100000, 999999).toString();
}

function generateSessionToken() {
  return 'ruby_sec_' + crypto.randomBytes(24).toString('hex');
}

const startTime = Date.now();

// --- BOT LISTENERS ---
bot.on('message', async (msg) => {
  if (msg.author_bot || !msg.server_id) return;
  const cfg = getGuildConfig(msg.server_id);

  if (cfg.automod.enabled) {
    const text = (msg.content || '').toLowerCase();
    const hasForbidden = cfg.automod.words.some((w) => text.includes(w));
    if (hasForbidden || (cfg.automod.invites && /(discord\.gg|yapper\.website\/invite)/i.test(text))) {
      await bot.delete(msg.channel_id, msg.id);
      return msg.say(`⚠️ <@${msg.author_id}>, message removed by AutoMod.`);
    }
  }

  if (cfg.levelsEnabled) {
    const key = `${msg.server_id}:${msg.author_id}`;
    const stats = db.userXP.get(key) || { xp: 0, level: 1, messages: 0 };
    stats.messages += 1;
    stats.xp += 15;
    if (stats.xp >= stats.level * 100) {
      stats.level += 1;
      msg.say(`🎉 Congratulations <@${msg.author_id}>, you reached **Level ${stats.level}**!`);
    }
    db.userXP.set(key, stats);
  }
});

bot.on('member_join', async (ev) => {
  const cfg = getGuildConfig(ev.server_id);
  if (!cfg.welcomeChannel) return;
  bot.send(cfg.welcomeChannel, `👋 Welcome <@${ev.user_id}> to the server! Member #${ev.member_count}.`);
});

// --- COMMANDS ---
bot.command('login', 'Generate panel login code', async (msg) => {
  const code = generateSecureCode();
  db.authCodes.set(code, { userId: msg.author_id, expiresAt: Date.now() + 10 * 60 * 1000 });
  try {
    await bot.dmSend(msg.author_id, `🔐 **Ruby Control Panel Passcode**: \`${code}\`\nThis single-use code expires in 10 minutes.`);
    await msg.reply('📬 I sent your 6-digit login code to your **DMs**!');
  } catch {
    await msg.reply(`⚠️ Could not DM you. Your passcode is: \`${code}\``);
  }
});

bot.command('dashboard', 'Get dashboard link', (msg) => {
  msg.reply('🌐 Open your Control Panel and use `/login` in chat to retrieve your passcode.');
});

// --- REST API ENDPOINTS ---
app.post('/api/auth/verify', (req, res) => {
  const { code } = req.body;
  const record = db.authCodes.get(code);
  if (!record || Date.now() > record.expiresAt) {
    return res.status(401).json({ error: 'Invalid or expired authentication code.' });
  }
  db.authCodes.delete(code);
  const token = generateSessionToken();
  db.sessions.set(token, { userId: record.userId });
  res.json({ success: true, token });
});

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !db.sessions.has(auth.split(' ')[1])) {
    return res.status(401).json({ error: 'Unauthorized session.' });
  }
  req.session = db.sessions.get(auth.split(' ')[1]);
  next();
}

app.get('/api/me', authMiddleware, async (req, res) => {
  try {
    const user = await bot.user(req.session.userId);
    res.json({ user });
  } catch {
    res.json({ user: { username: 'Admin User', display_name: 'Administrator', avatar: 'ruby-bot.png' } });
  }
});

app.get('/api/servers', authMiddleware, async (req, res) => {
  try {
    const servers = await bot.servers();
    res.json({ servers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/servers/:id/channels', authMiddleware, async (req, res) => {
  try {
    const channels = await bot.channels(req.params.id, { type: 'text' });
    res.json({ channels });
  } catch {
    res.json({ channels: [] });
  }
});

app.get('/api/servers/:id/stats', authMiddleware, (req, res) => {
  const serverId = req.params.id;
  const rankedCount = [...db.userXP.keys()].filter((k) => k.startsWith(serverId)).length;
  res.json({
    members: 24,
    openTickets: (db.tickets.get(serverId) || []).filter((t) => t.status === 'open').length,
    cases: (db.cases.get(serverId) || []).length,
    rankedMembers: rankedCount
  });
});

app.get('/api/servers/:id/config', authMiddleware, (req, res) => {
  res.json({ config: getGuildConfig(req.params.id) });
});

app.patch('/api/servers/:id/config', authMiddleware, (req, res) => {
  const cfg = getGuildConfig(req.params.id);
  Object.assign(cfg, req.body);
  db.serverConfigs.set(req.params.id, cfg);
  res.json({ success: true, config: cfg });
});

app.post('/api/bot/status', authMiddleware, async (req, res) => {
  try {
    const { status, activity } = req.body;
    await bot.setStatus(status || 'online', activity || 'Protecting Server');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bot/profile', authMiddleware, async (req, res) => {
  try {
    const { displayName, bio } = req.body;
    await bot.setProfile({ displayName, bio });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => console.log(`[ruby-api] Running control engine on port ${PORT}`));
bot.start().catch(console.error);
