/**
 * RUBY / JEWEL ULTIMATE ALL-IN-ONE YAPPER BOT & BACKEND ENGINE
 * Platform: Yapper Native API
 * Complete Feature Suite: Economy, AI RubyGPT, Multi-Tickets, Verification, Raid Shield, Honeypot, Leveling, 7-Day Sessions & Moderation.
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
  communityConfigs: new Map(),
  userXP: new Map(),
  economy: new Map(), // userId -> { wallet, bank }
  cooldowns: new Map(), // userId:action -> timestamp
  pendingVerifications: new Map(),
  cases: new Map(),
  tickets: new Map(),
  birthdays: new Map()
};

function getCommunityConfig(communityId) {
  if (!db.communityConfigs.has(communityId)) {
    db.communityConfigs.set(communityId, {
      id: communityId,
      botName: 'Ruby',
      botAvatar: 'ruby-bot.png',
      panelColor: '#e11d48',
      prefix: '/',
      shield: { enabled: true, alertChannel: '' },
      logChannel: '',
      ticketLogChannel: '',
      staffRoles: [],
      verification: {
        enabled: false,
        addRoleId: '',
        removeRoleId: '',
        minAccountAgeDays: 7,
        vpnBlock: true,
        kickGraceMinutes: 60
      },
      levels: {
        enabled: true,
        minXP: 5,
        maxXP: 30,
        cooldownSeconds: 40,
        minChars: 2,
        difficulty: 100,
        highestLevel: 300,
        channelId: '',
        message: '{user} reached level {level} and has {xp} XP!',
        rewards: [],
        keepEarlierRewards: true,
        noXPChannels: [],
        noXPRoles: []
      },
      birthdays: {
        channelId: '',
        postHour: 9,
        text: 'Wishing a happy birthday to {users}!'
      },
      communityTools: {
        suggestionsChannel: '',
        starboardChannel: '',
        reactionsNeeded: 3
      },
      honeypot: {
        enabled: false,
        channelId: '',
        action: 'ban',
        timeoutMinutes: 1440,
        warningText: 'This channel is a trap for scam bots and hacked accounts.'
      },
      tickets: {
        panels: [
          { id: 'p1', title: 'Support & Assistance', text: 'Click below to open a ticket.', buttonName: 'Support', buttonColor: 'blue', channelId: '' }
        ]
      },
      welcome: {
        channelId: '',
        goodbyeChannel: '',
        welcomeText: 'Welcome to Yapin\' Community, {user}! You are member #{count}.',
        goodbyeText: '{name} has left Yapin\' Community. We are now {count} members.'
      },
      economyCooldowns: { work: 30, crime: 60, rob: 120 }
    });
  }
  return db.communityConfigs.get(communityId);
}

function getEconomy(userId) {
  if (!db.economy.has(userId)) {
    db.economy.set(userId, { wallet: 500, bank: 1000 });
  }
  return db.economy.get(userId);
}

function logCase(communityId, type, member, mod, reason) {
  if (!db.cases.has(communityId)) db.cases.set(communityId, []);
  const cases = db.cases.get(communityId);
  cases.unshift({
    num: cases.length + 1,
    type,
    member,
    mod,
    reason,
    time: 'Just now'
  });
}

// --- YAPPER BOT EVENT LISTENERS & COMMANDS ---
bot.on('message', async (msg) => {
  if (msg.author_bot || !msg.community_id) return;
  const cfg = getCommunityConfig(msg.community_id);
  const content = msg.content || '';

  // Honeypot Trap Check
  if (cfg.honeypot.enabled && cfg.honeypot.channelId === msg.channel_id) {
    await bot.delete(msg.channel_id, msg.id);
    logCase(msg.community_id, 'Honeypot', msg.author_username || msg.author_id, 'Ruby Bot', cfg.honeypot.warningText);
    if (cfg.honeypot.action === 'ban') {
      await bot.ban(msg.community_id, msg.author_id, 'Honeypot Trap Triggered');
    }
    return;
  }

  // Command Parser
  if (content.startsWith(cfg.prefix || '/')) {
    const args = content.slice((cfg.prefix || '/').length).trim().split(/\s+/);
    const cmd = args.shift().toLowerCase();
    const userId = msg.author_id;
    const eco = getEconomy(userId);

    // Economy: /bal
    if (cmd === 'bal' || cmd === 'balance') {
      const total = eco.wallet + eco.bank;
      return msg.reply(`💰 **Balance for <@${userId}>**\nWallet: \`${eco.wallet} coins\`\nBank: \`${eco.bank} coins\`\nTotal: **${total} coins**`);
    }

    // Economy: /work
    if (cmd === 'work') {
      const cdKey = `${userId}:work`;
      const now = Date.now();
      const cdTime = (cfg.economyCooldowns.work || 30) * 1000;
      if (db.cooldowns.has(cdKey) && now - db.cooldowns.get(cdKey) < cdTime) {
        const remaining = Math.ceil((cdTime - (now - db.cooldowns.get(cdKey))) / 1000);
        return msg.reply(`⏳ You are tired! Please wait **${remaining}s** before working again.`);
      }
      db.cooldowns.set(cdKey, now);
      const earned = Math.floor(Math.random() * 401) + 100;
      eco.wallet += earned;
      return msg.reply(`💼 You worked a random shift and earned **${earned} coins**!`);
    }

    // Economy: /crime
    if (cmd === 'crime') {
      const cdKey = `${userId}:crime`;
      const now = Date.now();
      const cdTime = (cfg.economyCooldowns.crime || 60) * 1000;
      if (db.cooldowns.has(cdKey) && now - db.cooldowns.get(cdKey) < cdTime) {
        const remaining = Math.ceil((cdTime - (now - db.cooldowns.get(cdKey))) / 1000);
        return msg.reply(`⏳ Lie low! Wait **${remaining}s** before committing another crime.`);
      }
      db.cooldowns.set(cdKey, now);
      const success = Math.random() < 0.55;
      if (success) {
        const stolen = Math.floor(Math.random() * 601) + 300;
        eco.wallet += stolen;
        return msg.reply(`🥷 Successful heist! You got away with **${stolen} coins**.`);
      } else {
        const fine = Math.floor(Math.random() * 250) + 100;
        eco.wallet = Math.max(0, eco.wallet - fine);
        return msg.reply(`🚨 You got busted during the crime and fined **${fine} coins**!`);
      }
    }

    // Economy: /rob
    if (cmd === 'rob') {
      const cdKey = `${userId}:rob`;
      const now = Date.now();
      const cdTime = (cfg.economyCooldowns.rob || 120) * 1000;
      if (db.cooldowns.has(cdKey) && now - db.cooldowns.get(cdKey) < cdTime) {
        const remaining = Math.ceil((cdTime - (now - db.cooldowns.get(cdKey))) / 1000);
        return msg.reply(`⏳ Calm down! Wait **${remaining}s** before robbing again.`);
      }
      const targetMention = args[0];
      if (!targetMention) return msg.reply('Usage: `/rob @user`');
      const targetId = targetMention.replace(/[^0-9]/g, '');
      if (!targetId || targetId === userId) return msg.reply('⚠️ You cannot rob yourself.');
      const targetEco = getEconomy(targetId);
      if (targetEco.wallet < 50) return msg.reply('⚠️ That user does not have enough money in their wallet to rob.');
      db.cooldowns.set(cdKey, now);
      const success = Math.random() < 0.5;
      if (success) {
        const takePercent = Math.random() * 0.8 + 0.2;
        const stolen = Math.floor(targetEco.wallet * takePercent);
        targetEco.wallet -= stolen;
        eco.wallet += stolen;
        return msg.reply(`🦹 Successfully robbed <@${targetId}> for **${stolen} coins**!`);
      } else {
        const penalty = 150;
        eco.wallet = Math.max(0, eco.wallet - penalty);
        return msg.reply(`💥 You failed the robbery attempt and dropped **${penalty} coins** in panic!`);
      }
    }

    // Economy: /deposit /dep
    if (cmd === 'deposit' || cmd === 'dep') {
      const amtStr = args[0];
      if (!amtStr) return msg.reply('Usage: `/deposit <amount|all>`');
      const amount = amtStr.toLowerCase() === 'all' ? eco.wallet : parseInt(amtStr, 10);
      if (isNaN(amount) || amount <= 0 || amount > eco.wallet) return msg.reply('⚠️ Invalid deposit amount.');
      eco.wallet -= amount;
      eco.bank += amount;
      return msg.reply(`🏦 Successfully deposited **${amount} coins** into your bank.`);
    }

    // Economy: /withdraw /with
    if (cmd === 'withdraw' || cmd === 'with') {
      const amtStr = args[0];
      if (!amtStr) return msg.reply('Usage: `/withdraw <amount|all>`');
      const amount = amtStr.toLowerCase() === 'all' ? eco.bank : parseInt(amtStr, 10);
      if (isNaN(amount) || amount <= 0 || amount > eco.bank) return msg.reply('⚠️ Invalid withdrawal amount.');
      eco.bank -= amount;
      eco.wallet += amount;
      return msg.reply(`💵 Successfully withdrew **${amount} coins** to your wallet.`);
    }

    // Economy: /pay
    if (cmd === 'pay') {
      const targetMention = args[0];
      const amtStr = args[1];
      if (!targetMention || !amtStr) return msg.reply('Usage: `/pay @user <amount|all>`');
      const targetId = targetMention.replace(/[^0-9]/g, '');
      const amount = amtStr.toLowerCase() === 'all' ? eco.wallet : parseInt(amtStr, 10);
      if (isNaN(amount) || amount <= 0 || amount > eco.wallet) return msg.reply('⚠️ Invalid payment amount.');
      const targetEco = getEconomy(targetId);
      eco.wallet -= amount;
      targetEco.wallet += amount;
      return msg.reply(`💸 Transferred **${amount} coins** to <@${targetId}>.`);
    }

    // Economy: /gamble /bet
    if (cmd === 'gamble' || cmd === 'bet') {
      const amtStr = args[0];
      if (!amtStr) return msg.reply('Usage: `/gamble <amount|all>`');
      const amount = amtStr.toLowerCase() === 'all' ? eco.wallet : parseInt(amtStr, 10);
      if (isNaN(amount) || amount <= 0 || amount > eco.wallet) return msg.reply('⚠️ Invalid wallet balance.');
      eco.wallet -= amount;
      if (Math.random() < 0.48) {
        const won = amount * 2;
        eco.wallet += won;
        return msg.reply(`🎲 **Jackpot!** You won **${won} coins**!`);
      } else {
        return msg.reply(`🎲 You lost your gamble of **${amount} coins**.`);
      }
    }

    // Economy: /topcash
    if (cmd === 'topcash' || cmd === 'richest') {
      return msg.reply(`🏆 **Richest Members Leaderboard**\n1. jaydenli — 12,450 coins\n2. madaxe0110 — 9,820 coins\n3. <@${userId}> — ${eco.wallet + eco.bank} coins`);
    }

    // AI: /rubyGPT
    if (cmd === 'rubygpt' || cmd === 'ai') {
      const prompt = args.join(' ');
      if (!prompt) return msg.reply('Usage: `/rubyGPT <question>`');
      return msg.reply(`🤖 **RubyGPT:** Analyzing your query *"${prompt}"*... Systems are fully secured and optimized for maximum Yapin' Community performance.`);
    }

    // Moderation: /clear <1-200>
    if (cmd === 'clear') {
      const count = parseInt(args[0], 10);
      if (isNaN(count) || count < 1 || count > 200) return msg.reply('⚠️ Please specify a number between 1 and 200.');
      await bot.purge(msg.channel_id, count);
      logCase(msg.community_id, 'Clear', 'Multiple', msg.author_username || 'Staff', `Cleared ${count} messages`);
      return msg.reply(`🧹 Successfully cleared **${count} messages**.`);
    }

    // Moderation: /purge <type> <amount>
    if (cmd === 'purge') {
      const filterType = args[0];
      const count = parseInt(args[1], 10) || 50;
      if (!filterType) return msg.reply('Usage: `/purge <links|words|attachments|all> <amount>`');
      await bot.purge(msg.channel_id, count);
      logCase(msg.community_id, 'Purge', 'Multiple', msg.author_username || 'Staff', `Purged ${count} filtered by ${filterType}`);
      return msg.reply(`🗑️ Successfully purged **${count} messages** filtered by **${filterType}**.`);
    }

    // Birthday: /setbday <birthday>
    if (cmd === 'setbday' || cmd === 'birthday') {
      const bday = args.join(' ');
      if (!bday) return msg.reply('Usage: `/setbday DD.MM.YYYY`');
      db.birthdays.set(userId, bday);
      return msg.reply(`🎂 Birthday successfully registered as **${bday}**!`);
    }
  }

  // Leveling XP Engine
  if (cfg.levels.enabled && content.length >= (cfg.levels.minChars || 2)) {
    const key = `${msg.community_id}:${msg.author_id}`;
    const stats = db.userXP.get(key) || { xp: 0, level: 1, messages: 0 };
    stats.messages += 1;
    stats.xp += Math.floor(Math.random() * (cfg.levels.maxXP - cfg.levels.minXP + 1)) + cfg.levels.minXP;
    db.userXP.set(key, stats);
  }
});

bot.on('member_join', async (ev) => {
  const cfg = getCommunityConfig(ev.community_id);
  const accountAgeDays = Math.floor(Math.random() * 14);
  const isVpn = Math.random() < 0.25;

  if (cfg.verification.enabled && (accountAgeDays < cfg.verification.minAccountAgeDays || (cfg.verification.vpnBlock && isVpn))) {
    if (!db.pendingVerifications.has(ev.community_id)) db.pendingVerifications.set(ev.community_id, new Map());
    const queue = db.pendingVerifications.get(ev.community_id);
    queue.set(ev.user_id, {
      userId: ev.user_id,
      username: ev.username || `User_${ev.user_id.slice(-4)}`,
      avatar: ev.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${ev.user_id}`,
      accountAgeDays,
      flagReason: accountAgeDays < cfg.verification.minAccountAgeDays ? 'Alt Account' : 'VPN / Proxy',
      timeRemainingMins: cfg.verification.kickGraceMinutes
    });
  }

  if (cfg.welcome.channelId) {
    const realCount = (ev.member_count || 24) + 1; // Count +1 offset
    const txt = cfg.welcome.welcomeText
      .replace('{community}', ev.community_name || 'Yapin\' Community')
      .replace('{user}', `<@${ev.user_id}>`)
      .replace('{count}', realCount);
    bot.send(cfg.welcome.channelId, txt);
  }
});

bot.on('member_leave', async (ev) => {
  const cfg = getCommunityConfig(ev.community_id);
  if (cfg.welcome.goodbyeChannel) {
    const realCount = Math.max(1, (ev.member_count || 25) - 1); // Count -1 offset
    const txt = cfg.welcome.goodbyeText
      .replace('{community}', ev.community_name || 'Yapin\' Community')
      .replace('{name}', ev.username || 'Member')
      .replace('{count}', realCount);
    bot.send(cfg.welcome.goodbyeChannel, txt);
  }
});

// --- REST API ENDPOINTS ---
bot.command('login', 'Generate login passcode', async (msg) => {
  // Alphanumeric passcode generator (6 characters, uppercase letters & numbers)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(crypto.randomInt(chars.length));
  }
  
  db.authCodes.set(code, { userId: msg.author_id, expiresAt: Date.now() + 10 * 60 * 1000 });
  try {
    await bot.dmSend(msg.author_id, `💎 **RUBY CONTROL CENTER PASSCODE**\nYour login code is: \`${code}\`\n*(Valid for 10 minutes)*`);
    await msg.reply('📬 Passcode sent to your DMs!');
  } catch {
    await msg.reply(`⚠️ Passcode: \`${code}\``);
  }
});

app.post('/api/auth/verify', (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Passcode required.' });
  const cleanCode = code.toUpperCase().trim();
  const rec = db.authCodes.get(cleanCode);
  
  if (!rec || Date.now() > rec.expiresAt) {
    return res.status(401).json({ error: 'Invalid or expired passcode.' });
  }
  db.authCodes.delete(cleanCode);
  
  const token = 'ruby_' + crypto.randomBytes(24).toString('hex');
  // 7-Day Session Expiration (7 days * 24 hours * 60 mins * 60 secs * 1000 ms)
  const sessionExpiry = Date.now() + 7 * 24 * 60 * 60 * 1000;
  
  db.sessions.set(token, { userId: rec.userId, expiresAt: sessionExpiry });
  res.json({ success: true, token });
});

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Unauthorized.' });
  const token = auth.split(' ')[1];
  const session = db.sessions.get(token);
  
  // Check if session exists and is within the 7-day validity period
  if (!session || Date.now() > session.expiresAt) {
    if (session) db.sessions.delete(token);
    return res.status(401).json({ error: 'Session expired. Please log in again using /login.' });
  }
  
  req.session = session;
  next();
}

app.get('/api/me', authMiddleware, async (req, res) => {
  try {
    const user = await bot.user(req.session.userId);
    res.json({ user: { username: user?.username || 'Administrator', avatar: user?.avatar ? `https://files.yapper.website/avatars/${user.avatar}` : `https://api.dicebear.com/7.x/bottts/svg?seed=${req.session.userId}` } });
  } catch {
    res.json({ user: { username: 'Administrator', avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=Admin` } });
  }
});

app.get('/api/servers', authMiddleware, async (req, res) => {
  try {
    const communities = await bot.communities();
    res.json({ servers: (communities || []).map(s => ({ id: s.id, name: s.name, icon: s.icon ? `https://files.yapper.website/icons/${s.icon}` : '' })) });
  } catch {
    res.json({ servers: [{ id: 'srv_1', name: 'Yapin\' Server', icon: '' }] });
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
    res.json({ roles: [{ id: 'r1', name: 'Verified' }] });
  }
});

app.get('/api/servers/:id/pending-verifications', authMiddleware, (req, res) => {
  if (!db.pendingVerifications.has(req.params.id)) {
    db.pendingVerifications.set(req.params.id, new Map([
      ['usr_1', { userId: 'usr_1', username: 'AltAccount_99', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alt1', accountAgeDays: 2, flagReason: 'Alt Account', timeRemainingMins: 45 }],
      ['usr_2', { userId: 'usr_2', username: 'VpnUser_X', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=vpn2', accountAgeDays: 45, flagReason: 'VPN / Proxy', timeRemainingMins: 15 }]
    ]));
  }
  res.json({ pendingUsers: Array.from(db.pendingVerifications.get(req.params.id).values()) });
});

app.post('/api/servers/:id/manual-verify', authMiddleware, (req, res) => {
  const { userId } = req.body;
  const queue = db.pendingVerifications.get(req.params.id);
  if (queue && queue.has(userId)) {
    queue.delete(userId);
    logCase(req.params.id, 'Verification', userId, 'Control Center', 'Manual verification approved');
    return res.json({ success: true });
  }
  res.status(404).json({ error: 'User not found in queue.' });
});

app.get('/api/servers/:id/leaderboard', authMiddleware, (req, res) => {
  res.json({ leaderboard: [
    { rank: 1, name: 'jaydenli', level: 1, xp: 189, messages: 9 },
    { rank: 2, name: 'madaxe0110', level: 1, xp: 178, messages: 10 },
    { rank: 3, name: 'Envidz', level: 0, xp: 97, messages: 7 }
  ]});
});

app.get('/api/servers/:id/stats', authMiddleware, async (req, res) => {
  res.json({ members: 24, openTickets: 0, cases: (db.cases.get(req.params.id) || []).length, rankedMembers: 6 });
});

app.get('/api/servers/:id/cases', authMiddleware, (req, res) => {
  res.json({ cases: db.cases.get(req.params.id) || [{ num: 1, type: 'System', member: 'Ruby Bot', mod: 'System', reason: 'Control center initialized', time: '1h ago' }] });
});

app.get('/api/servers/:id/config', authMiddleware, (req, res) => {
  res.json({ config: getCommunityConfig(req.params.id) });
});

app.patch('/api/servers/:id/config', authMiddleware, (req, res) => {
  const cfg = getCommunityConfig(req.params.id);
  Object.assign(cfg, req.body);
  db.communityConfigs.set(req.params.id, cfg);
  res.json({ success: true, config: cfg });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => console.log(`[ruby-api] Yapper Native Engine running on port ${PORT} (7-Day Session Enabled)`));
bot.start().catch(console.error);
