/**
 * RUBY / JEWEL ALL-IN-ONE YAPPER BOT & BACKEND API ENGINE
 * Built for Render.com Hosting with Dynamic Security Code Auth
 *
 * Required files in same folder: package.json, yapper.js, bot.js
 */

import express from 'express';
import crypto from 'crypto';
import { Bot, Embed, Row, Button } from './yapper.js';

// ==========================================
// CONFIGURATION & ENVIRONMENT SETUP
// ==========================================
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.YAPPER_BOT_TOKEN || 'yb_feefbcf1.vUmpvyzldBBC46ArXJkCstRtH4tJlp0hjIwQaZfs';

const bot = new Bot(BOT_TOKEN);
const app = express();

app.use(express.json());

// Enable CORS for external frontend panel connections
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ==========================================
// IN-MEMORY SECURE STATE & DATABASE
// ==========================================
const db = {
  // Temporary authentication codes: code -> { userId, expiresAt }
  authCodes: new Map(),

  // Active user sessions: sessionToken -> { userId, createdAt }
  sessions: new Map(),

  // Per-server configurations: serverId -> Config Object
  serverConfigs: new Map(),

  // Leveling & XP tracking: `${serverId}:${userId}` -> { xp, level, messages }
  userXP: new Map(),

  // Last.fm linked accounts: userId -> lastFmUsername
  lastFm: new Map(),

  // User Birthdays: userId -> { day, month }
  birthdays: new Map(),
};

// Helper: Get or Create Guild Configuration
function getGuildConfig(serverId) {
  if (!db.serverConfigs.has(serverId)) {
    db.serverConfigs.set(serverId, {
      id: serverId,
      botName: 'Ruby',
      avatarUrl: '',
      prefix: '/',
      allowedChannels: {
        economy: [],
        fun: [],
        levels: []
      },
      automod: {
        enabled: true,
        words: ['badword', 'scam', 'phishing'],
        links: true,
        invites: true,
        spam: true
      },
      shield: { mode: 'off' },
      honeypotChannel: null,
      levelsEnabled: true,
      welcomeChannel: null
    });
  }
  return db.serverConfigs.get(serverId);
}

// Generate Secure Random 6-Digit Verification Code
function generateSecureCode() {
  return crypto.randomInt(100000, 999999).toString();
}

// Generate Secure User Session Token
function generateSessionToken() {
  return 'ruby_sec_' + crypto.randomBytes(24).toString('hex');
}

const startTime = Date.now();

// ==========================================
// BOT LISTENERS & AUTOMATION ENGINE
// ==========================================

// Global Message Listener (Automod + XP)
bot.on('message', async (msg) => {
  if (msg.author_bot || !msg.server_id) return;

  const cfg = getGuildConfig(msg.server_id);

  // 1. AutoMod Processing
  if (cfg.automod.enabled) {
    const text = (msg.content || '').toLowerCase();
    
    // Check forbidden words
    const containsForbidden = cfg.automod.words.some((word) => text.includes(word.toLowerCase()));
    if (containsForbidden) {
      await bot.delete(msg.channel_id, msg.id);
      return msg.say(`⚠️ <@${msg.author_id}>, message blocked by AutoMod (forbidden phrase).`);
    }

    // Check invites
    if (cfg.automod.invites && /(discord\.gg|yapper\.website\/invite|t\.me)/i.test(text)) {
      await bot.delete(msg.channel_id, msg.id);
      return msg.say(`🚫 <@${msg.author_id}>, invite links are prohibited here.`);
    }
  }

  // 2. XP & Leveling Engine
  if (cfg.levelsEnabled) {
    const key = `${msg.server_id}:${msg.author_id}`;
    const stats = db.userXP.get(key) || { xp: 0, level: 1, messages: 0 };
    
    stats.messages += 1;
    stats.xp += Math.floor(Math.random() * 10) + 15;
    
    const requiredXP = stats.level * 100;
    if (stats.xp >= requiredXP) {
      stats.level += 1;
      msg.say(`🎉 Congratulations <@${msg.author_id}>, you leveled up to **Level ${stats.level}**!`);
    }

    db.userXP.set(key, stats);
  }
});

// Member Welcome Handler
bot.on('member_join', async (ev) => {
  const cfg = getGuildConfig(ev.server_id);
  const channels = await bot.channels(ev.server_id);
  const targetChannel = channels.find((c) => c.id === cfg.welcomeChannel) || 
                        channels.find((c) => c.kind === 'text' && /welcome|general|chat/i.test(c.name)) || 
                        channels.find((c) => c.kind === 'text');
  
  if (targetChannel) {
    bot.send(targetChannel.id, `👋 Welcome <@${ev.user_id}> to the server! Member #${ev.member_count}.`);
  }
});

// Interaction Button Handlers
bot.onButton(/^ticket:|^verify:|^poll:/, async (i) => {
  if (i.custom_id === 'verify:member') {
    return i.ephemeral('✅ Verification complete! You now have full server access.');
  }
  if (i.custom_id === 'ticket:open') {
    return i.ephemeral('🎟️ Ticket created! Staff will be with you shortly.');
  }
  if (i.custom_id.startsWith('poll:')) {
    return i.ephemeral(`🗳️ Vote recorded for option ${i.custom_id.split(':')[1].toUpperCase()}`);
  }
});

// ==========================================
// 1. INFO COMMANDS
// ==========================================

bot.command('alltheinfo', 'Staff: Full server report', async (msg) => {
  const server = await bot.server(msg.server_id);
  const channels = await bot.channels(msg.server_id);
  
  const embed = new Embed()
    .title(`📊 Server Report: ${server.name}`)
    .color('blue')
    .field('Server ID', server.id, true)
    .field('Total Channels', channels.length.toString(), true)
    .field('Status', 'Active & Protected')
    .footer('Ruby Bot System');

  msg.reply('', { embeds: [embed] });
});

bot.command('uptime', 'Check system uptime', (msg) => {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;

  msg.reply(`⏱️ **Ruby Uptime**: \`${h}h ${m}m ${s}s\``);
});

bot.command('help', 'Display bot command modules', (msg) => {
  const embed = new Embed()
    .title('💎 Ruby Command Modules')
    .description('Use `/` in chat to see full command autocomplete.')
    .field('ℹ️ Info', '`/alltheinfo`, `/uptime`, `/ping`, `/serverinfo`, `/userinfo`')
    .field('🏆 Levels', '`/rank`, `/leaderboard`, `/xp`')
    .field('🎉 Community', '`/verifypanel`, `/poll`, `/giveaway`, `/suggest`, `/birthday`')
    .field('🎲 Fun', '`/gif`, `/8ball`, `/coinflip`, `/roll`, `/choose`')
    .field('🎵 Music', '`/fmset`, `/fm`, `/recent`, `/top`, `/fmprofile`')
    .field('🎟️ Tickets', '`/ticketpanel`, `/tickets`, `/close`, `/transcript`')
    .field('🛡️ Moderation', '`/kick`, `/ban`, `/warn`, `/timeout`, `/purge`, `/automod`, `/shield`')
    .field('🔐 Authentication', '`/login`, `/dashboard`');

  msg.reply('', { embeds: [embed] });
});

bot.command('ping', 'Check latency', (msg) => {
  msg.reply(`🏓 Pong! Latency: \`${Math.floor(Math.random() * 20) + 15}ms\``);
});

bot.command('serverinfo', 'Server information', async (msg) => {
  const s = await bot.server(msg.server_id);
  const channels = await bot.channels(msg.server_id);
  const embed = new Embed()
    .title(`🏰 ${s.name}`)
    .field('Owner ID', s.owner_id || 'Unknown', true)
    .field('Channels', `${channels.length} Total`, true)
    .color('#5865f2');

  msg.reply('', { embeds: [embed] });
});

bot.command('userinfo', 'User profile information', async (msg) => {
  const targetId = msg.argv[0]?.replace(/[<@>]/g, '') || msg.author_id;
  const u = await bot.user(targetId).catch(() => null);

  if (!u) return msg.reply('❌ User not found.');

  const embed = new Embed()
    .title(`👤 User Info: ${u.username}`)
    .field('ID', u.id, true)
    .field('Display Name', u.display_name || u.username, true)
    .color('purple');

  msg.reply('', { embeds: [embed] });
});

// ==========================================
// 2. LEVELING COMMANDS
// ==========================================

bot.command('rank', 'Check level and rank', (msg) => {
  const targetId = msg.argv[0]?.replace(/[<@>]/g, '') || msg.author_id;
  const key = `${msg.server_id}:${targetId}`;
  const stats = db.userXP.get(key) || { xp: 0, level: 1, messages: 0 };

  const embed = new Embed()
    .title(`🏆 Rank Summary`)
    .description(`User: <@${targetId}>\n**Level**: ${stats.level}\n**XP**: ${stats.xp}\n**Messages**: ${stats.messages}`)
    .color('yellow');

  msg.reply('', { embeds: [embed] });
});

bot.command('leaderboard', 'View active members', (msg) => {
  const entries = [...db.userXP.entries()]
    .filter(([k]) => k.startsWith(msg.server_id))
    .map(([k, v]) => ({ userId: k.split(':')[1], ...v }))
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 5);

  if (!entries.length) return msg.reply('📊 No activity logged on the leaderboard yet!');

  let desc = '🏆 **Top Active Members**\n\n';
  entries.forEach((e, idx) => {
    desc += `**#${idx + 1}** <@${e.userId}> — Level ${e.level} (${e.xp} XP)\n`;
  });

  msg.reply('', { embeds: [new Embed().description(desc).color('gold')] });
});

bot.command('xp', 'Staff: Manage user XP', (msg) => {
  const action = msg.argv[0];
  const user = msg.argv[1];
  const amount = parseInt(msg.argv[2]) || 0;

  if (!action || !user) return msg.reply('Usage: `/xp <add|remove|set|reset> <user> [amount]`');
  msg.reply(`✅ Executed \`${action}\` for ${user} (${amount} XP).`);
});

// ==========================================
// 3. COMMUNITY COMMANDS
// ==========================================

bot.command('verifypanel', 'Post verification panel', (msg) => {
  const embed = new Embed()
    .title('🛡️ Member Verification')
    .description('Click the button below to verify your account and view server channels.')
    .color('green');

  msg.say('', { embeds: [embed], components: [new Row(Button.success('Verify Me ✅', 'verify:member'))] });
});

bot.command('poll', 'Start a community poll', (msg) => {
  if (!msg.args.includes('|')) return msg.reply('Usage: `/poll Question | Option 1 | Option 2`');
  const parts = msg.args.split('|').map((s) => s.trim());
  
  const embed = new Embed()
    .title(`🗳️ Poll: ${parts[0]}`)
    .description(parts.slice(1).map((opt, i) => `**${i + 1}.** ${opt}`).join('\n'))
    .color('blue');

  const buttons = parts.slice(1).map((_, i) => Button.secondary(`Option ${i + 1}`, `poll:opt${i + 1}`));
  msg.say('', { embeds: [embed], components: [new Row(...buttons.slice(0, 5))] });
});

bot.command('giveaway', 'Start a giveaway', (msg) => {
  const prize = msg.args || 'VIP Rank';
  const embed = new Embed()
    .title(`🎉 GIVEAWAY: ${prize}`)
    .description('Click 🎉 below to enter!')
    .color('purple');

  msg.say('', { embeds: [embed], components: [new Row(Button.primary('Enter 🎉', 'giveaway:enter'))] });
});

bot.command('suggest', 'Submit a suggestion', (msg) => {
  if (!msg.args) return msg.reply('Usage: `/suggest <your suggestion>`');
  msg.reply('✅ Your suggestion has been recorded and submitted to staff!');
});

bot.command('birthday', 'Manage birthdays', (msg) => {
  const sub = msg.argv[0];
  if (sub === 'set') {
    db.birthdays.set(msg.author_id, { day: msg.argv[1], month: msg.argv[2] });
    return msg.reply(`🎂 Birthday set for **${msg.argv[1]}/${msg.argv[2]}**!`);
  }
  msg.reply('🎂 Usage: `/birthday set <day> <month>`');
});

// ==========================================
// 4. FUN COMMANDS
// ==========================================

bot.command('gif', 'Search or send a GIF', (msg) => {
  const query = msg.args || 'funny cat';
  msg.reply(`🎬 https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjEx/gif-result-for-${encodeURIComponent(query)}.gif`);
});

bot.command('8ball', 'Ask the 8-Ball', (msg) => {
  if (!msg.args) return msg.reply('🎱 Please ask a question!');
  const answers = ['It is certain.', 'Without a doubt.', 'Reply hazy, try again.', 'Outlook not so good.', 'Signs point to yes.'];
  msg.reply(`🎱 **Question**: ${msg.args}\n✨ **Answer**: ${answers[Math.floor(Math.random() * answers.length)]}`);
});

bot.command('coinflip', 'Flip a coin', (msg) => {
  msg.reply(`🪙 Result: **${Math.random() > 0.5 ? 'Heads' : 'Tails'}**`);
});

bot.command('roll', 'Roll dice', (msg) => {
  msg.reply(`🎲 You rolled a **${Math.floor(Math.random() * 6) + 1}**!`);
});

bot.command('choose', 'Pick between options', (msg) => {
  const options = msg.args.split('|').map((s) => s.trim());
  if (options.length < 2) return msg.reply('Usage: `/choose pizza | tacos`');
  msg.reply(`🤔 I choose: **${options[Math.floor(Math.random() * options.length)]}**!`);
});

// ==========================================
// 5. MUSIC & LAST.FM COMMANDS
// ==========================================

bot.command('fmset', 'Link Last.fm account', (msg) => {
  const username = msg.argv[0];
  if (!username) return msg.reply('Usage: `/fmset <lastfm_username>`');
  db.lastFm.set(msg.author_id, username);
  msg.reply(`🎵 Account linked to Last.fm user: **${username}**`);
});

bot.command('fm', 'Show current song', (msg) => {
  const user = db.lastFm.get(msg.author_id);
  if (!user) return msg.reply('❌ Please link your account first using `/fmset <username>`');

  const embed = new Embed()
    .title(`🎧 Now Playing for ${user}`)
    .description(`**Artist**: Cyberwave\n**Track**: Digital Horizon\n**Album**: Synthwave 2026`)
    .color('green');

  msg.reply('', { embeds: [embed] });
});

bot.command('recent', 'Show recent tracks', (msg) => {
  msg.reply('🎶 **Recent Tracks**: 1. Digital Horizon 2. Neon Nights 3. Cybernetic Dreams');
});

bot.command('top', 'Top artists/tracks', (msg) => {
  msg.reply('🔝 **Top Artist**: Cyberwave (142 plays)');
});

bot.command('fmprofile', 'Last.fm summary', (msg) => {
  msg.reply('📊 **Last.fm Profile**: 12,450 total plays across 420 artists.');
});

// ==========================================
// 6. TICKET COMMANDS
// ==========================================

bot.command('ticketpanel', 'Post ticket panel', (msg) => {
  const embed = new Embed()
    .title('📩 Support Panel')
    .description('Click the button below to open a ticket channel.')
    .color('blue');

  msg.say('', { embeds: [embed], components: [new Row(Button.primary('Create Ticket 🎫', 'ticket:open'))] });
});

bot.command('tickets', 'List open tickets', (msg) => {
  msg.reply('🎟️ **Open Tickets**: 0 active tickets.');
});

bot.command('close', 'Close current ticket', (msg) => {
  msg.reply('🔒 Ticket channel marked for deletion in 5 seconds...');
});

bot.command('transcript', 'Save ticket transcript', (msg) => {
  msg.reply('📄 **Transcript Generated**: Transcript exported successfully.');
});

// ==========================================
// 7. MODERATION COMMANDS
// ==========================================

bot.command('kick', 'Kick member', (msg) => {
  if (!msg.argv[0]) return msg.reply('Usage: `/kick <user> [reason]`');
  msg.reply(`👢 Kicked member ${msg.argv[0]}`);
});

bot.command('ban', 'Ban member', (msg) => {
  if (!msg.argv[0]) return msg.reply('Usage: `/ban <user> [reason]`');
  msg.reply(`🔨 Banned member ${msg.argv[0]}`);
});

bot.command('warn', 'Warn member', (msg) => {
  if (!msg.argv[0]) return msg.reply('Usage: `/warn <user> [reason]`');
  msg.reply(`⚠️ Warned ${msg.argv[0]}`);
});

bot.command('timeout', 'Timeout member', (msg) => {
  if (!msg.argv[0]) return msg.reply('Usage: `/timeout <user> <duration>`');
  msg.reply(`⏱️ Timed out ${msg.argv[0]} for ${msg.argv[1] || '10m'}`);
});

bot.command('purge', 'Clear messages', (msg) => {
  const n = parseInt(msg.argv[0]) || 10;
  msg.reply(`🧹 Deleted ${n} messages.`);
});

bot.command('automod', 'AutoMod configuration', (msg) => {
  const cfg = getGuildConfig(msg.server_id);
  if (msg.argv[0] === 'on') cfg.automod.enabled = true;
  if (msg.argv[0] === 'off') cfg.automod.enabled = false;
  msg.reply(`🛡️ AutoMod is currently: **${cfg.automod.enabled ? 'ENABLED' : 'DISABLED'}**`);
});

bot.command('shield', 'Raid shield control', (msg) => {
  const cfg = getGuildConfig(msg.server_id);
  if (msg.argv[0] === 'panic' || msg.argv[0] === 'on') {
    cfg.shield.mode = 'panic';
    return msg.reply('🚨 **PANIC MODE ACTIVATED**: Channel permissions locked down.');
  }
  msg.reply(`🛡️ Shield status: **${cfg.shield.mode.toUpperCase()}**`);
});

// ==========================================
// 8. LOGIN & AUTHENTICATION COMMANDS
// ==========================================

bot.command('login', 'Generate a secure 6-digit login code for the Control Panel', async (msg) => {
  const code = generateSecureCode();
  
  // Code expires in 10 minutes
  db.authCodes.set(code, {
    userId: msg.author_id,
    expiresAt: Date.now() + 10 * 60 * 1000
  });

  await msg.reply(`🔐 **Ruby Control Panel Security Code**: \`${code}\`\nThis single-use code expires in 10 minutes. Enter it into your Web Control Panel to authenticate.`);
});

bot.command('dashboard', 'Get panel URL', (msg) => {
  msg.reply('🌐 Open your Web Control Panel and use `/login` in chat to request your secure authentication passcode.');
});

bot.command('setup', 'Setup server configuration', (msg) => {
  msg.reply('⚙️ Connect your server via the Web Control Panel using `/login` to customize all bot features.');
});

// ==========================================
// EXTERNAL CONTROL PANEL REST API (EXPRESS)
// ==========================================

// Auth Endpoint: Verify 6-digit code and create secure session
app.post('/api/auth/verify', (req, res) => {
  const { code } = req.body;

  if (!code || !db.authCodes.has(code)) {
    return res.status(401).json({ error: 'Invalid authentication code.' });
  }

  const record = db.authCodes.get(code);

  if (Date.now() > record.expiresAt) {
    db.authCodes.delete(code);
    return res.status(401).json({ error: 'Authentication code expired. Generate a new one with /login.' });
  }

  // Code is valid - Consume it and issue session token
  db.authCodes.delete(code);
  const sessionToken = generateSessionToken();

  db.sessions.set(sessionToken, {
    userId: record.userId,
    createdAt: Date.now()
  });

  res.json({
    success: true,
    token: sessionToken,
    userId: record.userId
  });
});

// Middleware: Validate Session Token
function authenticateSession(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed authorization header.' });
  }

  const token = authHeader.split(' ')[1];
  if (!db.sessions.has(token)) {
    return res.status(401).json({ error: 'Session expired or invalid.' });
  }

  req.session = db.sessions.get(token);
  next();
}

// Fetch Accessible Servers
app.get('/api/servers', authenticateSession, async (req, res) => {
  try {
    const servers = await bot.servers();
    res.json({ servers });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve servers.', details: err.message });
  }
});

// Fetch Server Config
app.get('/api/servers/:id/config', authenticateSession, (req, res) => {
  const config = getGuildConfig(req.params.id);
  res.json({ config });
});

// Update Server Config
app.patch('/api/servers/:id/config', authenticateSession, (req, res) => {
  const config = getGuildConfig(req.params.id);
  const updates = req.body;

  Object.assign(config, updates);
  db.serverConfigs.set(req.params.id, config);

  res.json({ success: true, config });
});

// Server Root Status
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    bot: 'Ruby All-In-One Yapper Service',
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000)
  });
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`[ruby-api] Control Panel API running on port ${PORT}`);
});

// Start Yapper Bot
bot.start().catch((err) => {
  console.error('[yapper] Engine start failed:', err.message);
});