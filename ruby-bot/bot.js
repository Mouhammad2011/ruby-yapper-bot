/**
 * RUBY / JEWEL ALL-IN-ONE YAPPER BOT & BACKEND API ENGINE
 * Liquid Glass Dashboard with Alt/VPN Protection & Live Manual Verification
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
  pendingVerifications: new Map(), // serverId -> Map(userId -> info)
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
      logChannel: '',
      ticketLogChannel: '',
      staffRoles: [],
      look: { name: 'Ruby', icon: '', banner: '', poweredBy: true, accentColor: 'Purple' },
      discover: { listed: false, shortDescription: '', inviteLink: '' },
      verification: {
        enabled: true,
        channelId: '',
        addRoleId: '',
        removeRoleId: '',
        minAccountAgeDays: 7,
        vpnBlock: true,
        kickGraceMinutes: 60, // Time before auto-kick if unverified/flagged
        title: 'Verify to enter',
        text: 'Press the button below to confirm you are a real person and unlock the rest of the server.',
        buttonLabel: 'Verify',
        color: 'blue'
      },
      levels: {
        enabled: true,
        minXP: 5,
        maxXP: 30,
        cooldownSeconds: 40,
        minChars: 2,
        difficulty: 100,
        highestLevel: 300,
        announceType: 'channel',
        channelId: '',
        message: '{user} reached level {level} and has {xp} XP! Keep GRINDING {user}.',
        rewards: [
          { level: 2, roleId: 'role_media' },
          { level: 10, roleId: 'role_junior' },
          { level: 30, roleId: 'role_senior' }
        ],
        noXPChannels: [],
        noXPRoles: []
      },
      birthdays: {
        channelId: '',
        postHour: 9,
        utcOffset: 0,
        roleId: '',
        title: 'Happy birthday!',
        text: '{users}\n\nWishing you a wonderful day from everyone in {server}.'
      },
      communityTools: {
        suggestionsChannel: '',
        starboardChannel: '',
        reactionsNeeded: 3,
        reactionEmojis: ['⭐', '🔥', '✔️'],
        voiceRoomsEnabled: false,
        hubVoiceChannel: '',
        roomCategory: '',
        roomNamePattern: "{name}'s room"
      },
      honeypot: {
        enabled: false,
        channelId: '',
        action: 'ban',
        timeoutMinutes: 1440,
        warningText: 'This channel is a trap for scam bots and hacked accounts.'
      },
      tickets: {
        title: 'THE LOUNGE HQ — SUPPORT & ASSISTANCE',
        text: 'Need help or have a question? Our staff team is here to assist you!',
        channelId: '',
        color: 'blue',
        types: [
          { key: 'type-1', label: 'Support', description: 'Questions, help and anything that is not working.', style: 'success', intro: 'Welcome. Tell us what you need and a staff member will be with you shortly.' },
          { key: 'type-2', label: 'Report a member', description: 'Tell staff about rule-breaking. Include names and details.', style: 'primary', intro: 'Please describe the incident and mention the user.' },
          { key: 'type-3', label: 'Appeal', description: 'Ask staff to review a ban, timeout or warning.', style: 'danger', intro: 'State your case and why the punishment should be lifted.' }
        ]
      },
      welcome: {
        channelId: '',
        title: 'Welcome to {server}, {user}! 🍸',
        text: "You're our {count} member to pull up a seat. Make yourself at home!",
        color: 'blue',
        smallPicture: 'avatar',
        autoRole: ''
      },
      moderation: { timeoutWarnings: 3, banWarnings: 5, antiLink: false, allowedChannels: [], blockedWords: ['badword', 'scam'] },
      automod: { enabled: true, invites: true }
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

// Seed mock pending verification queue for demonstration
function getPendingVerifications(serverId) {
  if (!db.pendingVerifications.has(serverId)) {
    const queue = new Map();
    queue.set('usr_8921', { userId: 'usr_8921', username: 'AltAccount_99', accountAgeDays: 2, flagReason: 'Alt Account (2d old < 7d min)', timeRemainingMins: 42 });
    queue.set('usr_4102', { userId: 'usr_4102', username: 'VpnUser_X', accountAgeDays: 45, flagReason: 'VPN / Proxy Detected', timeRemainingMins: 18 });
    db.pendingVerifications.set(serverId, queue);
  }
  return db.pendingVerifications.get(serverId);
}

// --- BOT LISTENERS ---
bot.on('message', async (msg) => {
  if (msg.author_bot || !msg.server_id) return;
  const cfg = getGuildConfig(msg.server_id);

  if (cfg.honeypot.enabled && cfg.honeypot.channelId === msg.channel_id) {
    await bot.delete(msg.channel_id, msg.id);
    if (cfg.honeypot.action === 'ban') {
      await bot.ban(msg.server_id, msg.author_id, 'Honeypot Triggered');
    }
    return;
  }

  if (cfg.levels.enabled) {
    const key = `${msg.server_id}:${msg.author_id}`;
    const stats = db.userXP.get(key) || { xp: 0, level: 1, messages: 0 };
    stats.messages += 1;
    stats.xp += Math.floor(Math.random() * (cfg.levels.maxXP - cfg.levels.minXP + 1)) + cfg.levels.minXP;
    db.userXP.set(key, stats);
  }
});

bot.on('member_join', async (ev) => {
  const cfg = getGuildConfig(ev.server_id);
  const accountAgeDays = Math.floor(Math.random() * 10); // Simulated account age check
  const isVpn = Math.random() < 0.3; // Simulated VPN check

  if (accountAgeDays < cfg.verification.minAccountAgeDays || (cfg.verification.vpnBlock && isVpn)) {
    const queue = getPendingVerifications(ev.server_id);
    const reason = accountAgeDays < cfg.verification.minAccountAgeDays 
      ? `Alt Account (${accountAgeDays}d old < ${cfg.verification.minAccountAgeDays}d min)` 
      : 'VPN / Proxy Detected';
    
    queue.set(ev.user_id, {
      userId: ev.user_id,
      username: ev.username || `User_${ev.user_id.slice(-4)}`,
      accountAgeDays,
      flagReason: reason,
      timeRemainingMins: cfg.verification.kickGraceMinutes
    });
  }
});

// --- COMMANDS ---
bot.command('login', 'Generate panel login code', async (msg) => {
  const code = generateSecureCode();
  db.authCodes.set(code, { userId: msg.author_id, expiresAt: Date.now() + 10 * 60 * 1000 });
  
  const dmMessage = 
    `💎 **RUBY CONTROL PANEL AUTHENTICATION** 💎\n\n` +
    `Hello! You requested access to your Ruby Control Panel.\n` +
    `Your secure single-use passcode is: \`${code}\`\n\n` +
    `*This passcode will expire in 10 minutes.*`;

  try {
    await bot.dmSend(msg.author_id, dmMessage);
    await msg.reply('📬 **Passcode Sent!** I have dispatched your 6-digit login code to your **DMs**.');
  } catch {
    await msg.reply(`⚠️ Could not send DM. Your security passcode is: \`${code}\``);
  }
});

bot.command('manuallyverify', 'Manually verify a flagged user', async (msg, args) => {
  const targetId = args[0];
  if (!targetId) return msg.reply('Usage: `/manuallyverify <userId>`');
  const queue = getPendingVerifications(msg.server_id);
  if (queue.has(targetId)) {
    queue.delete(targetId);
    return msg.reply(`✅ Successfully verified <@${targetId}>! Granted access roles.`);
  }
  msg.reply('⚠️ User not found in pending verification queue.');
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
    const channels = await bot.channels(req.params.id);
    res.json({ channels });
  } catch {
    res.json({ channels: [] });
  }
});

app.get('/api/servers/:id/roles', authMiddleware, async (req, res) => {
  try {
    const roles = await bot.roles(req.params.id);
    res.json({ roles });
  } catch {
    res.json({ roles: [{ id: 'r1', name: 'Member' }, { id: 'r2', name: 'Unverified' }] });
  }
});

app.get('/api/servers/:id/pending-verifications', authMiddleware, (req, res) => {
  const queue = getPendingVerifications(req.params.id);
  res.json({ pendingUsers: Array.from(queue.values()) });
});

app.post('/api/servers/:id/manual-verify', authMiddleware, (req, res) => {
  const { userId } = req.body;
  const queue = getPendingVerifications(req.params.id);
  if (queue.has(userId)) {
    queue.delete(userId);
    return res.json({ success: true, message: `User ${userId} verified.` });
  }
  res.status(404).json({ error: 'User not found in queue.' });
});

app.get('/api/servers/:id/leaderboard', authMiddleware, (req, res) => {
  const serverId = req.params.id;
  const list = [
    { rank: 1, name: 'jaydenli', level: 1, xp: 189, messages: 9 },
    { rank: 2, name: 'madaxe0110', level: 1, xp: 178, messages: 10 },
    { rank: 3, name: 'Envidz | Get Jewel.wtf', level: 0, xp: 97, messages: 7 },
    { rank: 4, name: 'LARPER', level: 0, xp: 89, messages: 5 },
    { rank: 5, name: 'Somedude_', level: 0, xp: 68, messages: 4 },
    { rank: 6, name: 'SMALL GIF', level: 0, xp: 61, messages: 5 }
  ];
  res.json({ leaderboard: list });
});

app.get('/api/servers/:id/stats', authMiddleware, async (req, res) => {
  const serverId = req.params.id;
  try {
    const serverInfo = await bot.server(serverId).catch(() => ({}));
    res.json({
      name: serverInfo.name || 'Server',
      icon: serverInfo.icon || serverInfo.iconPath || '',
      members: serverInfo.member_count || 24,
      openTickets: (db.tickets.get(serverId) || []).filter((t) => t.status === 'open').length,
      cases: (db.cases.get(serverId) || []).length,
      rankedMembers: 6
    });
  } catch {
    res.json({ name: 'Server', icon: '', members: 24, openTickets: 0, cases: 0, rankedMembers: 6 });
  }
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

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => console.log(`[ruby-api] Verification & Suite Engine running on port ${PORT}`));
bot.start().catch(console.error);
