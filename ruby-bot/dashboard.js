const API_URL = '';
        let authToken = localStorage.getItem('ruby_token');
        let sessionExpiryTime = parseInt(localStorage.getItem('ruby_session_expiry') || '0', 10);
        let currentServerId = null;
        let selectedServerConfig = null;
        let serverLoadSequence = 0;
        let ticketPanelsData = [];
        let ticketAllowedRoles = [];
        let channelCache = [];
        let categoryCache = [];
        let roleCache = [];
        let countdownTimer = null;
        let statusTimer = null;

        // Escape anything that came from users/servers before putting it in HTML
        function esc(v) {
            return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
        }
        const ICON_PATHS = {
            home: '<path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9M9 20v-6h6v6"/>',
            workspace: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
            shield: '<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/>',
            tools: '<path d="M14.7 6.3a5 5 0 0 0-6.6 6.6L3 18l3 3 5.1-5.1a5 5 0 0 0 6.6-6.6L14 13l-3-3 3.7-3.7Z"/>',
            community: '<path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
            activity: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
            sliders: '<path d="M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3"/><path d="M2 14h4m4-6h4m4 8h4"/>',
            user: '<path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="8" r="4"/>',
            role: '<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="M9 12h6"/>',
            channel: '<path d="M9 3 7 21M17 3l-2 18M4 8h16M3 16h16"/>',
            voice: '<path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15 9a5 5 0 0 1 0 6m3-9a9 9 0 0 1 0 12"/>',
            list: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6h.01M4 12h.01M4 18h.01"/>',
            ticket: '<path d="M2 9a3 3 0 0 0 0 6v4h20v-4a3 3 0 0 1 0-6V5H2v4Z"/><path d="M13 5v2m0 4v2m0 4v2"/>',
            calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
            chart: '<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-5 5"/>',
            wallet: '<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 8h18m-5 5h2"/><path d="M3 5V4a2 2 0 0 1 2-2h13"/>',
            message: '<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z"/>',
            search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
            check: '<path d="m5 12 4 4L19 6"/>',
            alert: '<path d="M12 9v4m0 4h.01"/><path d="M10.3 3.9 2.6 17.2A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.8L13.7 3.9a2 2 0 0 0-3.4 0Z"/>',
            tag: '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0l-7.2-7.2a2 2 0 0 1 0-2.8l7.2-7.2A2 2 0 0 1 12 2.8H19a2 2 0 0 1 2 2v7a2 2 0 0 1-.4 1.6Z"/><circle cx="16.5" cy="7.5" r="1"/>',
            clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
            megaphone: '<path d="m3 11 18-5v12l-18-5v-2Z"/><path d="M11.6 15.4 13 21H8l-1.3-5.8M5 10v6"/>',
            sparkle: '<path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z"/><path d="m19 14 1.1 2.9L23 18l-2.9 1.1L19 22l-1.1-2.9L15 18l2.9-1.1L19 14Z"/>',
            badge: '<circle cx="12" cy="8" r="6"/><path d="m8.2 13-1.1 8L12 18l4.9 3-1.1-8"/><path d="m9.5 8 1.7 1.7L14.7 6"/>',
            chevron: '<path d="m6 9 6 6 6-6"/>',
            arrowUpRight: '<path d="M7 17 17 7M7 7h10v10"/>',
            plus: '<path d="M12 5v14M5 12h14"/>',
            refresh: '<path d="M20 7v5h-5"/><path d="M4 17v-5h5"/><path d="M5.6 9A7 7 0 0 1 18 6l2 2M4 16l2 2a7 7 0 0 0 12.4-3"/>',
            minus: '<path d="M5 12h14"/>'
        };
        function dashboardIcon(name, className = 'ui-icon') {
            return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name] || ICON_PATHS.workspace}</svg>`;
        }
        const PAGE_ICONS = { overview: 'activity', permissions: 'shield', look: 'sliders', moderation: 'shield', security: 'shield', honeypot: 'search', cases: 'list', tickets: 'ticket', voice: 'voice', stats: 'chart', welcome: 'message', verification: 'badge', levels: 'chart', birthdays: 'calendar', leaderboard: 'chart', economy: 'wallet', announcements: 'calendar', tools: 'tools', suggestions: 'message', rolemenus: 'tag', 'command-rules': 'sliders' };
        function decorateDashboardHeadings() {
            document.querySelectorAll('#dashboardCard .tab-content[id^="tab-"] h2').forEach(heading => {
                if (heading.dataset.iconDecorated) return;
                const tab = heading.closest('.tab-content')?.id.slice(4) || 'overview';
                const mark = document.createElement('span');
                mark.className = 'dashboard-heading-icon';
                mark.innerHTML = dashboardIcon(PAGE_ICONS[tab] || 'workspace');
                heading.prepend(mark);
                heading.classList.add('dashboard-icon-heading');
                heading.dataset.iconDecorated = 'true';
            });
        }
        function ticketColorInputValue(value) {
            const legacy = { blue: '#5865f2', green: '#57f287', red: '#ed4245' };
            const color = String(value || '').trim();
            return legacy[color.toLowerCase()] || (/^#[0-9a-f]{6}$/i.test(color) ? color : '#bd785c');
        }
        const $ = (id) => document.getElementById(id);

        // One place for every request: adds the token, handles expired sessions, never throws on bad JSON
        async function api(path, opts = {}) {
            const controller = new AbortController();
            const timeoutMs = Number(opts.timeoutMs) > 0 ? Number(opts.timeoutMs) : 20000;
            const requestOptions = { ...opts, signal: controller.signal };
            delete requestOptions.timeoutMs;
            const timeout = setTimeout(() => controller.abort(), timeoutMs);
            let res;
            try {
                res = await fetch(`${API_URL}${path}`, {
                    ...requestOptions,
                    headers: { 'Content-Type': 'application/json', ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}), ...(opts.headers || {}) }
                });
            } catch (error) {
                const message = error?.name === 'AbortError' ? 'The request took too long. Please try again.' : (error?.message || 'Could not reach Ruby. Check your connection and try again.');
                return { ok: false, status: 0, data: { error: message } };
            } finally {
                clearTimeout(timeout);
            }
            let data = {};
            const raw = await res.text();
            try { data = raw ? JSON.parse(raw) : {}; }
            catch {
                const detail = raw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 260);
                if (!res.ok || detail) data.error = `Server returned HTTP ${res.status}${detail ? `: ${detail}` : ''}`;
            }
            if (!res.ok && !data.error) data.error = `Request failed with HTTP ${res.status}${res.statusText ? ` ${res.statusText}` : ''}.`;
            if (res.status === 401 && authToken) { endSession('Your session expired. Please log in again using /login.'); }
            return { ok: res.ok, status: res.status, data };
        }
        function endSession(message) {
            localStorage.removeItem('ruby_token'); localStorage.removeItem('ruby_session_expiry'); authToken = null;
            if (countdownTimer) clearInterval(countdownTimer);
            if (message) { showStatus(message, true); setTimeout(() => location.reload(), 2200); }
            else location.reload();
        }

        async function logout() {
            await api('/api/auth/logout', { method: 'POST' });
            localStorage.removeItem('ruby_token');
            localStorage.removeItem('ruby_session_expiry');
            authToken = null;
            location.replace('/');
        }

        // Validate a saved token with the server before trusting the browser's cached expiry.
        // A stale localStorage timestamp must not end a still-valid seven-day session.
        if (authToken) { $('dashboardLoading').classList.remove('hidden'); initApp(); } else { $('dashboardLoading').classList.add('hidden'); $('authCard').classList.remove('hidden'); }

        function startSessionCountdown() {
            $('sessionPillHeader').classList.remove('hidden');
            function updateTimer() {
                const remainingMs = sessionExpiryTime - Date.now();
                const el = $('sessionCountdownText');
                if (remainingMs <= 0) { endSession('Your 7-day session has expired. Please log in again using /login.'); return; }
                const totalMinutes = Math.max(1, Math.ceil(remainingMs / 60000));
                const days = Math.floor(totalMinutes / 1440);
                const hours = Math.floor((totalMinutes % 1440) / 60);
                const minutes = totalMinutes % 60;
                if (days > 0) el.textContent = `Session expires in ${days}d ${hours}h`;
                else if (hours > 0) el.textContent = `Session expires in ${hours}h ${minutes}m`;
                else el.textContent = totalMinutes === 1 ? 'Session expires in under a minute' : `Session expires in ${minutes}m`;
                $('sessionPillHeader').title = `Your dashboard session expires ${new Date(sessionExpiryTime).toLocaleString()}`;
            }
            updateTimer();
            if (countdownTimer) clearInterval(countdownTimer);
            countdownTimer = setInterval(updateTimer, 30000);
        }

        $('codeEntry').addEventListener('input', (e) => {
            const v = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
            e.target.value = v;
            if (v.length === 6) verifyCode();
        });

        async function pasteCode() {
            try {
                const text = await navigator.clipboard.readText();
                const code = text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().trim();
                if (code.length === 6) { $('codeEntry').value = code; verifyCode(); }
                else $('authError').textContent = 'Clipboard does not contain a 6-character code.';
            } catch { $('authError').textContent = 'Clipboard permission required. Paste with Ctrl+V instead.'; }
        }

        let verifying = false;
        async function verifyCode() {
            if (verifying) return;
            verifying = true;
            $('authError').textContent = '';
            try {
                const { ok, data } = await api('/api/auth/verify', { method: 'POST', body: JSON.stringify({ code: $('codeEntry').value.trim() }) });
                if (ok && data.success) {
                    authToken = data.token;
                    sessionExpiryTime = data.expiresAt || (Date.now() + 7 * 86400000);
                    localStorage.setItem('ruby_token', authToken);
                    localStorage.setItem('ruby_session_expiry', sessionExpiryTime);
                    location.replace('/dashboard');
                } else {
                    $('authError').textContent = data.error || 'Authentication failed.';
                }
            } catch { $('authError').textContent = 'Cannot reach the bot. Is it running?'; }
            verifying = false;
        }

        async function initApp() {
            const s = await api('/api/session');
            if (!s.ok) { $('dashboardLoading')?.classList.add('hidden'); $('authCard').classList.remove('hidden'); return; }
            if (s.data.expiresAt) { sessionExpiryTime = s.data.expiresAt; localStorage.setItem('ruby_session_expiry', sessionExpiryTime); startSessionCountdown(); }
            const { ok, data } = await api('/api/me');
            if (ok && data.user) {
                $('userName').textContent = data.user.username;
                $('userHeader').classList.remove('hidden');
            }
            loadServers();
        }

        async function loadServers() {
            const { ok, data } = await api('/api/servers');
            const list = $('serverList');
            const count = $('serverSelectionCount');
            $('dashboardLoading')?.classList.add('hidden');
            list.replaceChildren();
            $('authCard').classList.add('hidden');
            $('serverCard').classList.remove('hidden');
            if (!ok) {
                count.textContent = 'Workspace unavailable';
                const message = document.createElement('div');
                message.className = 'server-empty server-empty-error';
                message.textContent = data.error || 'Could not load your communities. Please try again.';
                list.append(message);
                return;
            }
            const servers = Array.isArray(data.servers) ? data.servers : [];
            count.textContent = `${servers.length} ${servers.length === 1 ? 'community' : 'communities'}`;
            if (!servers.length) {
                const message = document.createElement('div');
                message.className = 'server-empty';
                message.innerHTML = `<span class="server-empty-icon">${dashboardIcon('community')}</span><strong>No communities to show yet</strong><small>Invite Ruby to a community, then come back here to manage it.</small>`;
                list.append(message);
                return;
            }
            servers.forEach((s, index) => {
                const name = s.name || 'Community';
                const card = document.createElement('button');
                card.type = 'button';
                card.className = 'server-card';
                card.style.animationDelay = `${Math.min(index, 8) * 58}ms`;
                const memberCount = typeof s.members === 'number' && Number.isFinite(s.members) ? s.members : null;
                const memberLabel = memberCount === null
                    ? 'Yapin workspace'
                    : `${new Intl.NumberFormat().format(memberCount)} ${memberCount === 1 ? 'member' : 'members'}`;
                card.setAttribute('aria-label', memberCount === null ? `Open ${name}` : `Open ${name}, ${memberLabel}`);
                const img = document.createElement('img');
                img.className = 'server-avatar';
                img.alt = '';
                img.decoding = 'async';
                safeImg(img, s.icon, name);
                const info = document.createElement('span');
                info.className = 'server-card-copy';
                const title = document.createElement('strong');
                title.textContent = name;
                const meta = document.createElement('small');
                meta.textContent = memberLabel;
                info.append(title, meta);
                const arrow = document.createElement('span');
                arrow.className = 'server-card-arrow';
                arrow.setAttribute('aria-hidden', 'true');
                arrow.innerHTML = dashboardIcon('arrowUpRight');
                card.append(img, info, arrow);
                card.addEventListener('click', () => {
                    $('serverOpenError').classList.add('hidden');
                    selectServer(s.id, name, s.icon);
                });
                list.appendChild(card);
            });
        }

        function fillSelect(id, items, placeholder, label) {
            const el = $(id);
            if (!el) return;
            el.innerHTML = '';
            el.add(new Option(placeholder, ''));
            items.forEach(i => el.add(new Option(label(i), i.id)));
        }

        async function selectServer(id, name, avatarUrl) {
            currentServerId = id;
            selectedServerConfig = null;
            $('serverOpenError').classList.add('hidden');
            $('headerServerName').textContent = name;
            safeImg($('headerServerAvatar'), avatarUrl, name);
            $('selectedServerHeader').classList.remove('hidden');

            const [stats, rolesR, chanR, cfgR, commandR] = await Promise.all([
                api('/api/servers/' + id + '/stats'),
                api('/api/servers/' + id + '/roles'),
                api('/api/servers/' + id + '/channels'),
                api('/api/servers/' + id + '/config'),
                api('/api/servers/' + id + '/commands')
            ]);
            if (!cfgR.ok) { const notice = $('serverOpenError'); notice.textContent = cfgR.data?.error || 'Ruby could not load this community settings. Try again in a moment.'; notice.classList.remove('hidden'); return; }

            if (String(currentServerId) !== String(id)) return;
            if (stats.ok) {
                $('statMembers').textContent = stats.data.members ?? '--';
                $('statTickets').textContent = stats.data.openTickets;
                $('statCases').textContent = stats.data.cases;
                $('statRanked').textContent = stats.data.rankedMembers;
            }

            const roles = rolesR.ok ? (rolesR.data?.roles || []) : [];
            roleCache = roles;
            channelCache = chanR.ok ? (chanR.data?.channels || []) : [];
            categoryCache = chanR.ok ? (chanR.data?.categories || []) : [];
            ['verifAddRole', 'verifRemoveRole'].forEach(i => fillSelect(i, roles, 'Not set', r => r.name, !rolesR.ok));
            ['permLogChannel', 'modAlertChannel', 'honeyChannel', 'welcChan', 'goodChan', 'lvlChan', 'bdayChan', 'toolSugg', 'toolStar', 'lbChan', 'annChan']
                .forEach(i => fillSelect(i, channelCache, 'Not set', c => c.name, !chanR.ok));

            const cfg = cfgR.data.config;
            selectedServerConfig = cfg;
            initializeCommandRules(cfg, commandR.ok ? commandR.data : null);
            document.documentElement.style.setProperty('--accent', cfg.panelColor || '#bd785c');
            $('lookName').value = cfg.botName || 'Ruby';
            $('lookAvatar').value = cfg.botAvatar || '';
            $('lookColor').value = cfg.panelColor || '#bd785c';

            $('permLogChannel').value = cfg.logChannel || '';
            $('modShieldEnabled').checked = cfg.shield?.enabled ?? true;
            $('modAlertChannel').value = cfg.shield?.alertChannel || '';

            $('honeyEnabled').checked = cfg.honeypot?.enabled ?? false;
            $('honeyChannel').value = cfg.honeypot?.channelId || '';
            $('honeyAction').value = cfg.honeypot?.action || 'ban';
            $('honeyTimeout').value = cfg.honeypot?.timeoutMinutes ?? 1440;
            $('honeyText').value = cfg.honeypot?.warningText || '';
            $('honeyPostWarning').checked = cfg.honeypot?.postWarning ?? false;

            ticketPanelsData = (cfg.tickets?.panels || []).map(panel => ({
                ...panel,
                buttonName: panel.buttonName === 'Support' ? 'Open a support ticket' : panel.buttonName,
                buttonColor: ticketColorInputValue(panel.buttonColor),
                nameTemplate: panel.nameTemplate || 'ticket-{number}-{username}',
                ticketCategoryId: panel.ticketCategoryId || '',
                logChannelId: panel.logChannelId || ''
            }));
            ticketAllowedRoles = cfg.tickets?.allowedRoles || [];
            renderTicketPanels();

            $('welcChan').value = cfg.welcome?.channelId || '';
            $('welcText').value = cfg.welcome?.welcomeText || '';
            $('goodChan').value = cfg.welcome?.goodbyeChannel || '';
            $('goodText').value = cfg.welcome?.goodbyeText || '';

            $('verifEnabled').checked = cfg.verification?.enabled ?? false;
            $('verifAddRole').value = cfg.verification?.addRoleId || '';
            $('verifRemoveRole').value = cfg.verification?.removeRoleId || '';
            $('verifMinAge').value = cfg.verification?.minAccountAgeDays ?? 7;
            $('verifGrace').value = cfg.verification?.kickGraceMinutes ?? 60;

            $('lvlEnabled').checked = cfg.levels?.enabled ?? true;
            $('lvlMinXP').value = cfg.levels?.minXP ?? 5;
            $('lvlMaxXP').value = cfg.levels?.maxXP ?? 30;
            $('lvlCooldown').value = cfg.levels?.cooldownSeconds ?? 60;
            $('lvlMinChars').value = cfg.levels?.minChars ?? 1;
            $('lvlDiff').value = cfg.levels?.difficulty ?? 100;
            $('lvlHigh').value = cfg.levels?.highestLevel ?? 100;
            $('lvlChan').value = cfg.levels?.channelId || '';
            $('lvlMsg').value = cfg.levels?.message || '';

            $('bdayChan').value = cfg.birthdays?.channelId || '';
            $('bdayHour').value = cfg.birthdays?.postHour ?? 9;
            $('bdayText').value = cfg.birthdays?.text || '';

            $('toolSugg').value = cfg.communityTools?.suggestionsChannel || '';
            $('toolStar').value = cfg.communityTools?.starboardChannel || '';
            $('toolReact').value = cfg.communityTools?.reactionsNeeded ?? 3;

            extraLoad(cfg);
            loadPendingVerifications();
            loadCases();

            $('serverCard').classList.add('hidden');
            $('dashboardCard').classList.remove('hidden');
            switchTab('overview', document.querySelector('.nav-link'));
            loadLiveStats(stats.ok ? stats.data : null);
        }

        function addTicketPanel() {
            ticketPanelsData.push({ id: `p_${Date.now()}`, title: 'Support & Assistance', text: 'Click below to open a ticket.', buttonName: 'Open a support ticket', buttonColor: '#bd785c', nameTemplate: 'ticket-{number}-{username}', ticketCategoryId: '', logChannelId: '', channelId: '' });
            renderTicketPanels();
            markDashboardDirty('tickets');
        }

        async function loadPendingVerifications() {
            const { data } = await api(`/api/servers/${currentServerId}/pending-verifications`);
            const tbody = $('verifQueueTableBody');
            tbody.innerHTML = '';
            if (!data.pendingUsers || !data.pendingUsers.length) {
                tbody.innerHTML = `<tr><td colspan="5" class="empty">No flagged users in queue.</td></tr>`;
                return;
            }
            data.pendingUsers.forEach(u => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><div class="user-cell"><img alt="${esc(u.username)}" referrerpolicy="no-referrer" src="${esc(u.avatar || '')}" onerror="this.onerror=null;this.src=fallbackSrc(this.alt||'?')"><b>${esc(u.username)}</b></div></td>
                    <td>${esc(u.accountAgeDays)}d</td>
                    <td><span class="pill off">${esc(u.flagReason)}</span></td>
                    <td>${esc(u.timeRemainingMins)}m</td>
                    <td><button class="btn-ok" data-verify>Verify</button></td>`;
                tr.querySelector('[data-verify]').onclick = () => manualVerify(u.userId);
                tbody.appendChild(tr);
            });
        }

        async function manualVerify(userId) {
            const { ok, data } = await api(`/api/servers/${currentServerId}/manual-verify`, { method: 'POST', body: JSON.stringify({ userId }) });
            if (ok) { showStatus('✅ User verified.'); loadPendingVerifications(); }
            else showStatus('⚠️ ' + (data.error || 'Could not verify user.'), true);
        }

        async function loadLeaderboard() {
            const { data } = await api(`/api/servers/${currentServerId}/leaderboard`);
            const tbody = $('leaderboardTableBody');
            tbody.innerHTML = '';
            if (!data.leaderboard || !data.leaderboard.length) { tbody.innerHTML = `<tr><td colspan="5" class="empty">Nobody has earned XP yet.</td></tr>`; return; }
            data.leaderboard.forEach(row => {
                tbody.innerHTML += `<tr><td>#${esc(row.rank)}</td><td><b>${esc(row.name)}</b></td><td>${esc(row.level)}</td><td>${esc(row.xp)}</td><td>${esc(row.messages)}</td></tr>`;
            });
        }

        function timeAgo(ts) {
            if (!ts) return '';
            const s = Math.floor((Date.now() - ts) / 1000);
            if (s < 60) return 'Just now';
            if (s < 3600) return `${Math.floor(s / 60)}m ago`;
            if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
            return `${Math.floor(s / 86400)}d ago`;
        }

        async function loadCases() {
            const { data } = await api(`/api/servers/${currentServerId}/cases`);
            const tbody = $('casesTableBody');
            tbody.innerHTML = '';
            if (!data.cases || !data.cases.length) { tbody.innerHTML = `<tr><td colspan="6" class="empty">No moderation cases yet.</td></tr>`; return; }
            data.cases.forEach(c => {
                tbody.innerHTML += `<tr><td>#${esc(c.num)}</td><td>${esc(c.type)}</td><td>${esc(c.member)}</td><td>${esc(c.mod)}</td><td>${esc(c.reason)}</td><td>${esc(timeAgo(c.at))}</td></tr>`;
            });
        }

        function switchTab(tab, el) {
            document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            $(`tab-${tab}`).classList.remove('hidden');
            if (el) {
                el.classList.add('active');
                const selectedCategory = el.closest('.nav-category');
                if (selectedCategory) document.querySelectorAll('.nav-category').forEach(category => { category.open = category === selectedCategory; });
            }
            if (tab === 'cases') loadCases();
            if (tab === 'leaderboard') loadLeaderboard();
            if (tab === 'verification') loadPendingVerifications();
        }

        async function patchConfig(updates, msg) {
            const { ok, data } = await api(`/api/servers/${currentServerId}/config`, { method: 'PATCH', body: JSON.stringify(updates) });
            if (ok) showStatus(msg); else showStatus('⚠️ Save failed: ' + (data.error || 'unknown error'), true);
            return ok;
        }

        const num = (id, fallback) => { const n = parseInt($(id).value, 10); return Number.isNaN(n) ? fallback : n; };

        function showStatus(text, isError) {
            const el = $('saveStatus');
            const copy = document.createElement('span');
            copy.textContent = String(text ?? '').replace(/^(?:[\p{Extended_Pictographic}\uFE0F\u200D\uFE0E]+\s*)+/u, '');
            const mark = document.createElement('span');
            mark.className = 'status-message-icon';
            mark.innerHTML = dashboardIcon(isError ? 'alert' : 'check');
            el.replaceChildren(mark, copy);
            el.style.color = isError ? 'var(--bad)' : 'var(--ok)';
            el.classList.add('show');
            clearTimeout(statusTimer);
            statusTimer = setTimeout(() => { el.classList.remove('show'); el.replaceChildren(); }, 3500);
        }

        function backToServers() {
            $('dashboardCard').classList.add('hidden');
            $('selectedServerHeader').classList.add('hidden');
            $('serverCard').classList.remove('hidden');
        }

/* ============ Extension: dropdowns, avatars, appearance, new sections ============ */
        let rewardsData = [], noXPChannels = [], noXPRoles = [];
        let editingAnnouncement = null;

        // Avatar fallback: a locally generated initial, never a broken image and never an external service.
        function fallbackSrc(name) {
            const letter = (String(name || '?').trim()[0] || '?').toUpperCase();
            const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#bd785c';
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="${accent}"/><text x="32" y="43" font-size="32" font-family="Arial" font-weight="700" fill="#fff" text-anchor="middle">${letter.replace(/[<&]/g, '?')}</text></svg>`;
            return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
        }
        function safeImg(img, src, name) {
            img.alt = name || '';
            img.referrerPolicy = 'no-referrer';
            img.onerror = () => { img.onerror = null; img.src = fallbackSrc(name); };
            img.src = src || fallbackSrc(name);
        }

        /* ---- Searchable dropdown that keeps the native <select> in sync ---- */
        function enhance(sel, kind, state) {
            if (!sel) return;
            if (!sel._combo) buildCombo(sel, kind);
            sel._combo.state = state || '';
            sel._combo.render();
        }
        function buildCombo(sel, kind) {
            sel.classList.add('native-hidden');
            const wrap = document.createElement('div'); wrap.className = 'combo';
            const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'combo-btn';
            btn.setAttribute('aria-haspopup', 'listbox'); btn.setAttribute('aria-expanded', 'false');
            const pop = document.createElement('div'); pop.className = 'combo-pop hidden';
            const search = document.createElement('input'); search.type = 'text'; search.placeholder = kind === 'role' ? 'Search roles…' : kind === 'member' ? 'Search members…' : kind === 'channel' ? 'Search channels…' : 'Search options…'; search.setAttribute('aria-label', 'Search');
            const list = document.createElement('div'); list.className = 'combo-list'; list.setAttribute('role', 'listbox');
            pop.append(search, list); wrap.append(btn, pop); sel.after(wrap);
            const desc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
            Object.defineProperty(sel, 'value', { configurable: true, get() { return desc.get.call(sel); }, set(v) { desc.set.call(sel, v); api_.render(); } });
            const noun = kind === 'role' ? 'roles' : kind === 'member' ? 'members' : kind === 'channel' ? 'channels' : 'options';
            const icon = (o) => `<span class="ico">${dashboardIcon(kind === 'member' ? 'user' : kind === 'role' ? 'role' : kind === 'channel' ? (o.dataset.kind === 'voice' ? 'voice' : 'channel') : 'list')}</span>`;
            const api_ = sel._combo = {
                state: '',
                render() {
                    const cur = sel.selectedOptions[0];
                    const opts = [...sel.options];
                    const isPh = !cur || !cur.value;
                    btn.innerHTML = `${cur && cur.value ? icon(cur) : ''}<span class="lbl ${isPh ? 'ph' : ''}">${esc(this.state === 'loading' ? 'Loading…' : isPh ? (opts[0]?.text || 'Not set') : cur.text)}</span><span class="caret">${dashboardIcon('chevron')}</span>`;
                    wrap.classList.toggle('err', this.state === 'error');
                    const q = search.value.toLowerCase().trim();
                    list.innerHTML = '';
                    if (this.state === 'error') { list.innerHTML = `<div class="combo-msg">Could not load ${noun}. Check Ruby's permissions and reload.</div>`; return; }
                    const real = opts.filter(o => o.value);
                    if (!real.length) { list.innerHTML = `<div class="combo-msg">No ${noun} available.</div>`; }
                    const clear = opts.find(o => !o.value);
                    const shown = [ ...(clear ? [clear] : []), ...real.filter(o => !q || o.text.toLowerCase().includes(q)) ];
                    if (real.length && shown.length === (clear ? 1 : 0)) list.innerHTML += `<div class="combo-msg">No matches.</div>`;
                    shown.forEach(o => {
                        const row = document.createElement('div');
                        row.className = 'combo-opt' + (o.value === sel.value ? ' sel' : '');
                        row.setAttribute('role', 'option'); row.setAttribute('aria-selected', o.value === sel.value);
                        row.innerHTML = `${o.value ? icon(o) : `<span class="ico">${dashboardIcon('minus')}</span>`}<span>${esc(o.value ? o.text : o.text + ' (clear)')}</span>${o.value === sel.value ? `<span class="tick">${dashboardIcon('check')}</span>` : ''}`;
                        row.onclick = () => { desc.set.call(sel, o.value); sel.dispatchEvent(new Event('change', { bubbles: true })); close(); api_.render(); };
                        list.appendChild(row);
                    });
                }
            };
            const open = () => { pop.classList.remove('hidden'); btn.setAttribute('aria-expanded', 'true'); search.value = ''; api_.render(); search.focus(); };
            const close = () => { pop.classList.add('hidden'); btn.setAttribute('aria-expanded', 'false'); };
            wrap.addEventListener('click', event => {
                const trigger = event.target.closest('.combo-btn');
                if (!trigger || !wrap.contains(trigger)) return;
                event.preventDefault();
                pop.classList.contains('hidden') ? open() : close();
            });
            search.oninput = () => api_.render();
            wrap.addEventListener('keydown', e => { if (e.key === 'Escape') { close(); btn.focus(); } });
            document.addEventListener('click', e => { if (!wrap.contains(e.target)) close(); });
            api_.render();
        }

        // Re-implement fillSelect so every channel/role menu becomes a searchable dropdown with colours
        const ROLE_SELECTS = new Set(['verifAddRole', 'verifRemoveRole']);
        fillSelect = function (id, items, placeholder, label, failed) {
            const el = $(id); if (!el) return;
            el.innerHTML = '';
            el.add(new Option(placeholder, ''));
            items.forEach(i => { const o = new Option(label(i), i.id); if (i.type) o.dataset.kind = i.type; if (i.color) o.dataset.color = typeof i.color === 'number' ? '#' + i.color.toString(16).padStart(6, '0') : i.color; el.add(o); });
            enhance(el, ROLE_SELECTS.has(id) || id.startsWith('moneyRewardRole-') ? 'role' : id === 'adminUserAdd' ? 'member' : 'channel', failed ? 'error' : '');
        };

        // Upgrade static and dynamically-created selects too, so no browser-native menus are left behind.
        function dropdownKind(sel) {
            const id = String(sel.id || sel.name || '');
            if (id === 'adminUserAdd' || /member|user/i.test(id)) return 'member';
            if (ROLE_SELECTS.has(id) || /^moneyRewardRole-/i.test(id) || /role|staff/i.test(id)) return 'role';
            if (/chan|channel/i.test(id)) return 'channel';
            return 'option';
        }
        function enhanceSelectTree(root) {
            if (!root) return;
            const selects = [];
            if (root instanceof HTMLSelectElement) selects.push(root);
            if (root.querySelectorAll) selects.push(...root.querySelectorAll('select'));
            for (const sel of selects) {
                if (sel.multiple || sel.dataset.nativeDropdown === 'false') continue;
                enhance(sel, dropdownKind(sel));
            }
        }
        enhanceSelectTree(document);
        const dropdownObserver = new MutationObserver(records => {
            const changed = new Set();
            for (const record of records) {
                const owner = record.target instanceof HTMLSelectElement ? record.target : record.target.closest?.('select');
                if (owner) changed.add(owner);
                for (const node of record.addedNodes) if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.matches('select')) changed.add(node);
                    node.querySelectorAll?.('select').forEach(sel => changed.add(sel));
                }
            }
            changed.forEach(sel => {
                if (!sel.multiple && sel.dataset.nativeDropdown !== 'false') enhance(sel, dropdownKind(sel));
            });
        });
        dropdownObserver.observe(document.body, { childList: true, subtree: true });

        /* ---- Appearance ---- */
        const ACCENTS = [['#bd785c', 'Ruby clay'], ['#718b78', 'Sage'], ['#6b88ad', 'Slate blue'], ['#8b7ca8', 'Iris'], ['#c28b4b', 'Amber'], ['#b46f86', 'Rose'], ['#438c8b', 'Teal']];
        let currentIdentity = { name: 'Ruby', avatar: '' };
        function shade(hex, amt) {
            const n = parseInt(hex.slice(1), 16);
            const c = (v) => Math.max(0, Math.min(255, v + amt));
            return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => c(v).toString(16).padStart(2, '0')).join('');
        }
        function applyAppearance(accent, filter) {
            const root = document.documentElement;
            root.style.setProperty('--accent', accent);
            root.style.setProperty('--accent-hover', shade(accent, 40));
            root.style.setProperty('--border-focus', accent);
            if (filter && filter !== 'dark') root.setAttribute('data-filter', filter); else root.removeAttribute('data-filter');
        }
        function applyIdentity() {
            document.querySelector('.brand h1').textContent = 'Ruby Dashboard';
            document.title = 'Ruby Dashboard';
            safeImg($('headerBotLogo'), '/ruby-logo.png', 'Ruby');
        }
        function buildSwatches() {
            const box = $('lookSwatches'); box.innerHTML = '';
            ACCENTS.forEach(([hex, label]) => {
                const b = document.createElement('button'); b.type = 'button'; b.className = 'swatch' + (hex.toLowerCase() === $('lookColor').value.toLowerCase() ? ' sel' : '');
                b.style.background = hex; b.title = label; b.setAttribute('aria-label', label);
                b.onclick = () => { $('lookColor').value = hex; previewLook(); markDashboardDirty('look'); };
                box.appendChild(b);
            });
        }
        function previewLook() {
            applyAppearance($('lookColor').value, $('lookFilter').value);
            const name = $('lookName').value.trim() || 'Ruby';
            $('pvName').textContent = name;
            safeImg($('pvLogo'), $('lookAvatar').value.trim() || 'ruby-bot.png', name);
            buildSwatches();
        }
        // The final dashboard layer binds its live nickname and accent preview after initialization.

        saveLook = async function () {
            const name = $('lookName').value.trim() || 'Ruby';
            const ok = await patchConfig({ botName: name, botAvatar: $('lookAvatar').value.trim(), appearance: { theme: 'custom', accent: $('lookColor').value, filter: $('lookFilter').value }, panelColor: $('lookColor').value }, '💎 Appearance and identity saved.');
            if (ok) { currentIdentity = { name, avatar: $('lookAvatar').value.trim() }; applyIdentity(name, currentIdentity.avatar); }
        };
        async function resetLook() {
            if (!(await askConfirm('Reset appearance and Ruby identity to the defaults?'))) return;
            $('lookColor').value = '#bd785c'; $('lookFilter').value = 'dark'; $('lookName').value = 'Ruby'; $('lookAvatar').value = '';
            previewLook(); saveLook();
        }

        /* ---- Level rewards + no-XP lists ---- */
        function roleName(id) { return roleCache.find(r => r.id === id)?.name || id; }
        function chanName(id) { return '#' + (channelCache.find(c => c.id === id)?.name || id); }
        function renderChips(boxId, arr, nameFn) {
            const box = $(boxId); box.innerHTML = '';
            arr.forEach((id, i) => {
                const c = document.createElement('span'); c.className = 'chip'; c.textContent = nameFn(id);
                const x = document.createElement('button'); x.type = 'button'; x.textContent = '×'; x.setAttribute('aria-label', 'Remove');
                x.onclick = () => { arr.splice(i, 1); renderChips(boxId, arr, nameFn); };
                c.appendChild(x); box.appendChild(c);
            });
        }
        function renderRewards() {
            const box = $('rewardRows'); box.innerHTML = '';
            if (!rewardsData.length) box.innerHTML = '<p class="hint" style="margin-bottom:12px;">No role rewards yet.</p>';
            rewardsData.forEach((r, i) => {
                const row = document.createElement('div'); row.className = 'reward-row';
                row.innerHTML = `<div><label>Role</label><select></select></div><div><label>At level</label><input type="number" min="1" max="1000" value="${esc(r.level)}"></div><button type="button" class="btn-danger" style="margin-bottom:6px;">Remove</button>`;
                const sel = row.querySelector('select');
                sel.add(new Option('Select role', '')); roleCache.forEach(ro => { const o = new Option(ro.name, ro.id); if (ro.color) o.dataset.color = typeof ro.color === 'number' ? '#' + ro.color.toString(16).padStart(6, '0') : ro.color; sel.add(o); });
                enhance(sel, 'role'); sel.value = r.roleId || '';
                sel.addEventListener('change', () => { rewardsData[i].roleId = sel.value; markDashboardDirty('levels'); });
                row.querySelector('input').addEventListener('input', e => { rewardsData[i].level = parseInt(e.target.value, 10) || 0; markDashboardDirty('levels'); });
                const removeButton = row.querySelector('.btn-danger');
                removeButton.onclick = () => { rewardsData.splice(i, 1); renderRewards(); markDashboardDirty('levels'); };
                box.appendChild(row);
            });
        }
        function addReward() { rewardsData.push({ level: 5, roleId: '' }); renderRewards(); markDashboardDirty('levels'); }
        saveLevels = function () {
            const min = num('lvlMinXP', 5), max = num('lvlMaxXP', 30);
            if (min > max) { showStatus('⚠️ Min XP cannot be higher than Max XP.', true); return; }
            if (rewardsData.some(r => !r.roleId || r.level < 1)) { showStatus('⚠️ Every reward needs a role and a level of 1 or more.', true); return; }
            patchConfig({ levels: { enabled: $('lvlEnabled').checked, minXP: min, maxXP: max, cooldownSeconds: num('lvlCooldown', 60), minChars: num('lvlMinChars', 1), difficulty: num('lvlDiff', 100), highestLevel: num('lvlHigh', 100), channelId: $('lvlChan').value, message: $('lvlMsg').value, rewards: rewardsData, keepEarlierRewards: $('lvlKeep').checked, noXPChannels, noXPRoles } }, 'Levels saved.');
        };

        /* ---- Welcome / goodbye ---- */
        function sampleFill(t, extra) {
            const srv = $('headerServerName').textContent || 'the community';
            const members = parseInt($('statMembers').textContent, 10);
            return String(t).replace(/\{(\w+)\}/g, (m, k) => ({ user: '@NewMember', username: 'NewMember', name: 'NewMember', community: srv, server: srv, count: Number.isFinite(members) ? members : 15, ...extra }[k] ?? m));
        }
        function previewWelcome() { $('welcPreview').textContent = sampleFill($('welcText').value); $('goodPreview').textContent = sampleFill($('goodText').value); }
        saveWelcome = function () {
            patchConfig({ welcome: { enabled: $('welcEnabled').checked, goodbyeEnabled: $('goodEnabled').checked, channelId: $('welcChan').value, welcomeText: $('welcText').value, goodbyeChannel: $('goodChan').value, goodbyeText: $('goodText').value } }, '👋 Welcome & Goodbye saved.');
        };
        ['welcText', 'goodText'].forEach(i => $(i).addEventListener('input', previewWelcome));

        /* ---- Leaderboard ---- */
        loadLeaderboard = async function () {
            const type = $('lbView').value;
            const { data } = await api(`/api/servers/${currentServerId}/leaderboard?type=${type}`);
            const tbody = $('leaderboardTableBody');
            tbody.closest('table').querySelector('thead').innerHTML = type === 'economy' ? '<tr><th>Rank</th><th>Member</th><th>Wallet</th><th>Bank</th><th>Total</th></tr>' : '<tr><th>Rank</th><th>Member</th><th>Level</th><th>XP</th><th>Messages</th></tr>';
            tbody.innerHTML = '';
            if (!data.leaderboard || !data.leaderboard.length) { tbody.innerHTML = `<tr><td colspan="5" class="empty">Nothing to rank yet.</td></tr>`; return; }
            data.leaderboard.forEach(r => {
                tbody.innerHTML += type === 'economy'
                    ? `<tr><td>#${esc(r.rank)}</td><td><b>${esc(r.name)}</b></td><td>${esc(r.wallet)}</td><td>${esc(r.bank)}</td><td>${esc(r.total)}</td></tr>`
                    : `<tr><td>#${esc(r.rank)}</td><td><b>${esc(r.name)}</b></td><td>${esc(r.level)}</td><td>${esc(r.xp)}</td><td>${esc(r.messages)}</td></tr>`;
            });
        };
        async function previewBoard() {
            const { data } = await api(`/api/servers/${currentServerId}/leaderboard-preview?type=${$('lbType').value}`);
            $('lbPreview').textContent = data.text || 'Nothing to show yet.';
        }
        /* ---- Cases: search, filter, details ---- */
        let caseTimer;
        loadCases = async function () {
            const q = encodeURIComponent($('caseSearch').value.trim()), type = encodeURIComponent($('caseType').value);
            const { data } = await api(`/api/servers/${currentServerId}/cases?q=${q}&type=${type}`);
            const sel = $('caseType'), keep = sel.value;
            if (data.types) { sel.innerHTML = '<option value="">All types</option>' + data.types.map(t => `<option ${t === keep ? 'selected' : ''}>${esc(t)}</option>`).join(''); }
            const tbody = $('casesTableBody'); tbody.innerHTML = '';
            if (!data.cases || !data.cases.length) { tbody.innerHTML = `<tr><td colspan="6" class="empty">No cases match.</td></tr>`; return; }
            data.cases.forEach(c => {
                const tr = document.createElement('tr'); tr.style.cursor = 'pointer'; tr.tabIndex = 0;
                tr.innerHTML = `<td>#${esc(c.num)}</td><td>${esc(c.type)}</td><td>${esc(c.member)}</td><td>${esc(c.mod)}</td><td>${esc(c.reason)}</td><td>${esc(timeAgo(c.at))}</td>`;
                tr.onclick = () => openCase(c.num);
                tr.onkeydown = (e) => { if (e.key === 'Enter') openCase(c.num); };
                tbody.appendChild(tr);
            });
        };
        $('caseSearch').addEventListener('input', () => { clearTimeout(caseTimer); caseTimer = setTimeout(loadCases, 250); });
        $('caseType').addEventListener('change', loadCases);
        async function openCase(num) {
            const { ok, data } = await api(`/api/servers/${currentServerId}/cases/${num}`);
            if (!ok) { showStatus('⚠️ Case not found.', true); return; }
            const c = data.case;
            const bg = document.createElement('div'); bg.className = 'modal-bg';
            bg.innerHTML = `<div class="modal" role="dialog" aria-modal="true"><h2 style="font-size:1.2rem;">Case #${esc(c.num)} · ${esc(c.type)}</h2>
              <div class="kv"><span>Member</span><span>${esc(c.member)} ${c.memberId ? `<small style="color:var(--muted)">(${esc(c.memberId)})</small>` : ''}</span><span>Moderator</span><span>${esc(c.mod)}</span>
              <span>When</span><span>${esc(new Date(c.at).toLocaleString())}</span><span>Duration</span><span>${c.durationMinutes ? esc(c.durationMinutes) + ' minutes' : '—'}</span></div>
              <label>Reason</label><textarea id="caseReason">${esc(c.reason)}</textarea>
              <h3 class="sec" style="margin-top:18px;">Change history</h3>
              ${(c.history || []).length ? c.history.map(h => `<p class="hint">${esc(new Date(h.at).toLocaleString())} · ${esc(h.by)} changed ${esc(h.field)}: “${esc(h.from)}” → “${esc(h.to)}”</p>`).join('') : '<p class="hint">No changes.</p>'}
              <div style="display:flex;gap:10px;margin-top:18px;justify-content:flex-end;"><button type="button" class="btn-ghost" id="caseClose">Close</button><button type="button" id="caseSave">Save reason</button></div></div>`;
            document.body.appendChild(bg);
            const close = () => bg.remove();
            bg.querySelector('#caseClose').onclick = close;
            bg.addEventListener('click', e => { if (e.target === bg) close(); });
            bg.querySelector('#caseSave').onclick = async () => {
                const r = await api(`/api/servers/${currentServerId}/cases/${num}`, { method: 'PATCH', body: JSON.stringify({ reason: bg.querySelector('#caseReason').value }) });
                if (r.ok) { showStatus('✅ Case updated.'); close(); loadCases(); } else showStatus('⚠️ ' + (r.data.error || 'Could not update case.'), true);
            };
        }

        /* ---- Announcements ---- */
        function toLocalInput(ts) { const d = new Date(ts - new Date().getTimezoneOffset() * 60000); return d.toISOString().slice(0, 16); }
        function guessAnnounceChannel() {
            const c = channelCache.find(ch => /announce/i.test(ch.name));
            if (c && !$('annChan').value) { $('annChan').value = c.id; $('annHint').textContent = `Detected #${c.name} as the announcements channel. You can change it.`; }
            else $('annHint').textContent = c ? '' : 'No channel named “announcements” was found. Pick one manually.';
        }
        async function loadAnnouncements() {
            const { data } = await api(`/api/servers/${currentServerId}/announcements`);
            const box = $('annList'); box.innerHTML = '';
            if (!data.announcements || !data.announcements.length) { box.innerHTML = '<p class="hint">Nothing scheduled.</p>'; return; }
            data.announcements.forEach(a => {
                const row = document.createElement('div'); row.className = 'ann-item';
                row.innerHTML = `<div style="flex:1;min-width:200px;"><b>${esc(chanName(a.channelId))}</b> · ${esc(new Date(a.at).toLocaleString())} <span class="pill ${a.status === 'sent' ? 'on' : a.status === 'failed' ? 'off' : 'on'}" style="margin-left:6px;">${esc(a.status)}</span><div class="msg-preview">${esc(a.text)}</div></div><div style="display:flex;gap:8px;"></div>`;
                const actions = row.lastElementChild;
                if (a.status === 'scheduled') {
                    const e = document.createElement('button'); e.type = 'button'; e.className = 'btn-ghost btn-sm'; e.textContent = 'Edit';
                    e.onclick = () => { editingAnnouncement = a.id; $('annText').value = a.text; $('annChan').value = a.channelId; $('annWhen').value = toLocalInput(a.at); $('annSubmit').textContent = 'Update announcement'; $('annCancelEdit').classList.remove('hidden'); $('annText').focus(); };
                    actions.appendChild(e);
                }
                const d = document.createElement('button'); d.type = 'button'; d.className = 'btn-danger'; d.textContent = a.status === 'scheduled' ? 'Cancel' : 'Delete';
                d.onclick = async () => { if (!(await askConfirm('Remove this scheduled announcement?'))) return; const r = await api(`/api/servers/${currentServerId}/announcements/${a.id}`, { method: 'DELETE' }); if (r.ok) { showStatus('🗑️ Removed.'); loadAnnouncements(); } else showStatus('⚠️ ' + (r.data.error || 'Failed.'), true); };
                actions.appendChild(d);
                box.appendChild(row);
            });
        }
        function resetAnnouncementForm() { editingAnnouncement = null; $('annText').value = ''; $('annWhen').value = ''; $('annSubmit').textContent = 'Schedule announcement'; $('annCancelEdit').classList.add('hidden'); }
        async function submitAnnouncement() {
            const when = $('annWhen').value ? new Date($('annWhen').value).getTime() : NaN;
            const body = { text: $('annText').value, channelId: $('annChan').value, at: when };
            const url = `/api/servers/${currentServerId}/announcements` + (editingAnnouncement ? '/' + editingAnnouncement : '');
            const { ok, data } = await api(url, { method: editingAnnouncement ? 'PATCH' : 'POST', body: JSON.stringify(body) });
            if (ok) { showStatus(editingAnnouncement ? '✅ Announcement updated.' : '📣 Announcement scheduled.'); resetAnnouncementForm(); loadAnnouncements(); }
            else showStatus('⚠️ ' + (data.error || 'Could not schedule.'), true);
        }

        /* ---- Economy ---- */
        const ECO_FIELDS = { ecoWorkMin: ['work', 'min'], ecoWorkMax: ['work', 'max'], ecoWorkCd: ['work', 'cooldown'], ecoCrimeMin: ['crime', 'min'], ecoCrimeMax: ['crime', 'max'], ecoCrimeRate: ['crime', 'successRate'], ecoCrimeFineMin: ['crime', 'fineMin'], ecoCrimeFineMax: ['crime', 'fineMax'], ecoCrimeCd: ['crime', 'cooldown'], ecoRobRate: ['rob', 'successRate'], ecoRobMinPct: ['rob', 'minPercent'], ecoRobMaxPct: ['rob', 'maxPercent'], ecoRobMinWallet: ['rob', 'minWallet'], ecoRobFine: ['rob', 'fine'], ecoRobCd: ['rob', 'cooldown'], ecoGambleRate: ['gamble', 'winChance'], ecoGambleCd: ['gamble', 'cooldown'], ecoDaily: ['daily', 'amount'], ecoWeekly: ['weekly', 'amount'] };
        function loadEconomy(e) {
            $('ecoEnabled').checked = e.enabled; $('ecoCurrency').value = '$'; $('ecoStart').value = e.startBalance;
            for (const [id, [g, k]] of Object.entries(ECO_FIELDS)) $(id).value = e[g][k];
            moneyRewardsData = (e.roleRewards || []).map(reward => ({ ...reward }));
            renderMoneyRewards();
            $('ecoBody').classList.toggle('off-state', !e.enabled);
            loadEconomyLog();
        }
        async function loadEconomyLog() {
            const { data } = await api(`/api/servers/${currentServerId}/economy-log`);
            const tb = $('ecoLogBody'); tb.innerHTML = '';
            if (!data.log || !data.log.length) { tb.innerHTML = '<tr><td colspan="4" class="empty">No transactions yet.</td></tr>'; return; }
            data.log.forEach(l => { tb.innerHTML += `<tr><td>${esc(timeAgo(l.at))}</td><td>${esc(l.type)}</td><td>${esc(l.userId)}</td><td style="color:${l.amount < 0 ? 'var(--bad)' : 'var(--ok)'}">${l.amount > 0 ? '+' : ''}${esc(l.amount)} <small style="color:var(--muted)">${esc(l.note)}</small></td></tr>`; });
        }
        $('ecoEnabled').addEventListener('change', () => $('ecoBody').classList.toggle('off-state', !$('ecoEnabled').checked));

        /* ---- Hook called after a community's config is loaded ---- */
        function extraLoad(cfg) {
            const ap = cfg.appearance || {};
            const accent = ap.accent || cfg.panelColor || '#bd785c';
            $('lookColor').value = accent; $('lookFilter').value = ap.filter || 'dark';
            currentIdentity = { name: cfg.botName || 'Ruby', avatar: cfg.botAvatar || '' };
            previewLook(); applyIdentity(currentIdentity.name, currentIdentity.avatar);

            $('welcEnabled').checked = cfg.welcome?.enabled ?? true; $('goodEnabled').checked = cfg.welcome?.goodbyeEnabled ?? true; previewWelcome();
            rewardsData = (cfg.levels?.rewards || []).map(r => ({ ...r }));
            noXPChannels.length = 0; noXPChannels.push(...(cfg.levels?.noXPChannels || []));
            noXPRoles.length = 0; noXPRoles.push(...(cfg.levels?.noXPRoles || []));
            $('lvlKeep').checked = cfg.levels?.keepEarlierRewards ?? true;
            renderRewards(); renderNoXPChoices();

            $('lbEnabled').checked = cfg.leaderboard?.enabled ?? false; $('lbChan').value = cfg.leaderboard?.channelId || '';
            $('lbInterval').value = String(cfg.leaderboard?.intervalHours ?? 24); $('lbType').value = cfg.leaderboard?.type || 'xp'; $('lbPreview').textContent = '';
            loadEconomy(cfg.economy);
            resetAnnouncementForm(); $('annChan').value = ''; guessAnnounceChannel(); loadAnnouncements();
            loadLeaderboard();
        }

/* ============ Extension 2: staff roles, shield, voice, stats, role menus ============ */
        let staffRoles = [];
        let rmRoles = [], rmEditing = null, rmCache = [];
        const STAT_KEYS = { members: 'stMembers', humans: 'stHumans', bots: 'stBots', roles: 'stRoles', channels: 'stChannels', voice: 'stVoice' };
        ROLE_SELECTS.add('staffAdd');
        let adminUsers = [], memberCache = [];
        const memberName = (id) => memberCache.find(m => m.id === id)?.name || id;
        wireChipAdder('staffAdd', staffRoles, 'staffChips', roleName);
        wireChipAdder('adminUserAdd', adminUsers, 'adminUserChips', memberName);
        async function loadMembers() {
            const { ok, data } = await api(`/api/servers/${currentServerId}/members`);
            memberCache = ok ? data.members : [];
            fillSelect('adminUserAdd', memberCache, 'Add a member', m => m.name, !ok);
            if (!commandRuleEditorTouched && $('commandRuleExemptUserChoices')) renderCommandRuleEditor();
            $('adminUserAdd').value = '';
            renderChips('adminUserChips', adminUsers, memberName);
        }

        savePermissions = function () {
            patchConfig({ logChannel: $('permLogChannel').value, staffRoles, adminUsers }, '🔐 Permissions saved.');
        };
        saveModeration = function () {
            patchConfig({ shield: { enabled: $('modShieldEnabled').checked, alertChannel: $('modAlertChannel').value, joinThreshold: num('modThreshold', 5), windowSeconds: num('modWindow', 30), action: $('modAction').value } }, '🛡️ Raid Shield saved.');
        };
        saveTools = function () {
            patchConfig({ communityTools: { suggestionsChannel: $('toolSugg').value, starboardChannel: $('toolStar').value, reactionsNeeded: Math.max(1, num('toolReact', 3)), allowVoteChange: $('toolVoteChange').checked } }, '🛠️ Tools saved.');
        };
        function statsPayload() {
            const items = {}; for (const [k, id] of Object.entries(STAT_KEYS)) items[k] = $(id).checked;
            return { stats: { enabled: $('stEnabled').checked, intervalMinutes: num('stInterval', 10), items } };
        }
        saveStatsCfg = function () { patchConfig(statsPayload(), '📊 Statistics settings saved.'); };
        async function setupStats() {
            if (!(await patchConfig(statsPayload(), '📊 Statistics settings saved.'))) return;
            showStatus('Creating channels…');
            const { ok, data } = await api(`/api/servers/${currentServerId}/stats/setup`, { method: 'POST' });
            if (!ok) { showStatus('⚠️ ' + (data.error || 'Could not create statistics channels.'), true); return; }
            showStatus(data.missing && data.missing.length ? `⚠️ Could not create: ${data.missing.join(', ')}. Ruby needs Manage channels.` : '✅ Statistics channels are ready and updated.', !!(data.missing && data.missing.length));
            renderStatsStatus(data.config.stats, data.values);
        }
        function renderStatsStatus(st, values) {
            const parts = Object.keys(st.items).filter(k => st.items[k]).map(k => `${k}: ${st.channels[k] ? '✓ channel linked' : '✗ no channel yet'}${values && values[k] != null ? ' (' + values[k] + ')' : ''}`);
            $('stStatus').textContent = parts.length ? parts.join(' · ') : 'No statistics selected.';
        }

        /* Role menus */
        function rmRoleOptions() { return roleCache.filter(r => !r.privileged); }
        function renderRmRoles() {
            const box = $('rmRoleRows'); box.innerHTML = '';
            if (!rmRoles.length) box.innerHTML = '<p class="hint" style="margin-bottom:12px;">No roles added yet.</p>';
            rmRoles.forEach((r, i) => {
                const row = document.createElement('div'); row.className = 'reward-row';
                row.innerHTML = `<div><label>Role</label><select></select></div><div><label>Button text</label><input type="text" maxlength="80" value="${esc(r.label)}"></div><button type="button" class="btn-danger" style="margin-bottom:6px;">Remove</button>`;
                const sel = row.querySelector('select'); sel.add(new Option('Select role', ''));
                rmRoleOptions().forEach(ro => { const o = new Option(ro.name, ro.id); if (ro.color) o.dataset.color = typeof ro.color === 'number' ? '#' + ro.color.toString(16).padStart(6, '0') : ro.color; sel.add(o); });
                enhance(sel, 'role'); sel.value = r.roleId || '';
                sel.addEventListener('change', () => { rmRoles[i].roleId = sel.value; if (!rmRoles[i].label) { rmRoles[i].label = roleName(sel.value); renderRmRoles(); } });
                row.querySelector('input').addEventListener('input', e => { rmRoles[i].label = e.target.value; });
                row.querySelector('button').onclick = () => { rmRoles.splice(i, 1); renderRmRoles(); };
                box.appendChild(row);
            });
        }
        function addRmRole() { if (rmRoles.length >= 25) { showStatus('⚠️ A menu holds up to 25 roles.', true); return; } rmRoles.push({ roleId: '', label: '' }); renderRmRoles(); }
        function resetRoleMenuForm() {
            rmEditing = null; rmRoles = []; $('rmTitle').value = ''; $('rmDesc').value = ''; $('rmMax').value = 0; $('rmChan').value = ''; $('rmChan').disabled = false;
            $('rmFormTitle').textContent = 'New role menu'; $('rmSubmit').textContent = 'Post role menu'; $('rmCancel').classList.add('hidden'); renderRmRoles();
        }
        async function loadRoleMenus() {
            const { data } = await api(`/api/servers/${currentServerId}/rolemenus`);
            rmCache = data.menus || [];
            const box = $('rmList'); box.innerHTML = '';
            if (!rmCache.length) { box.innerHTML = '<p class="hint">No role menus yet.</p>'; return; }
            rmCache.forEach(m => {
                const row = document.createElement('div'); row.className = 'ann-item';
                row.innerHTML = `<div style="flex:1;min-width:200px;"><b>${esc(m.title)}</b> · ${esc(chanName(m.channelId))}<div class="hint">${m.roles.map(r => esc(r.label)).join(', ')}${m.maxRoles ? ' · up to ' + esc(m.maxRoles) : ''}</div></div><div style="display:flex;gap:8px;"></div>`;
                const act = row.lastElementChild;
                const e = document.createElement('button'); e.type = 'button'; e.className = 'btn-ghost btn-sm'; e.textContent = 'Edit';
                e.onclick = () => { rmEditing = m.id; rmRoles = m.roles.map(r => ({ ...r })); $('rmTitle').value = m.title; $('rmDesc').value = m.description || ''; $('rmMax').value = m.maxRoles; $('rmChan').value = m.channelId; $('rmChan').disabled = true; $('rmFormTitle').textContent = 'Edit role menu'; $('rmSubmit').textContent = 'Update menu'; $('rmCancel').classList.remove('hidden'); renderRmRoles(); $('rmTitle').focus(); };
                const d = document.createElement('button'); d.type = 'button'; d.className = 'btn-danger'; d.textContent = 'Delete';
                d.onclick = async () => { if (!(await askConfirm('Delete this role menu and its posted message?'))) return; const r = await api(`/api/servers/${currentServerId}/rolemenus/${m.id}`, { method: 'DELETE' }); if (r.ok) { showStatus('🗑️ Role menu deleted.'); if (rmEditing === m.id) resetRoleMenuForm(); loadRoleMenus(); } else showStatus('⚠️ ' + (r.data.error || 'Failed.'), true); };
                act.append(e, d); box.appendChild(row);
            });
        }
        async function submitRoleMenu() {
            if (rmRoles.some(r => !r.roleId)) { showStatus('⚠️ Choose a role for every row.', true); return; }
            const body = { title: $('rmTitle').value, description: $('rmDesc').value, channelId: $('rmChan').value, maxRoles: num('rmMax', 0), roles: rmRoles };
            const { ok, data } = await api(`/api/servers/${currentServerId}/rolemenus` + (rmEditing ? '/' + rmEditing : ''), { method: rmEditing ? 'PATCH' : 'POST', body: JSON.stringify(body) });
            if (ok) { showStatus(rmEditing ? '✅ Role menu updated.' : '🎭 Role menu posted.'); resetRoleMenuForm(); loadRoleMenus(); }
            else showStatus('⚠️ ' + (data.error || 'Could not save the menu.'), true);
        }

        const prevExtraLoad = extraLoad;
        extraLoad = function (cfg) {
            prevExtraLoad(cfg);
            // fill the new menus first so the saved values can be selected
            fillSelect('vcChan', channelCache, 'Not set', c => c.name, false);
            fillSelect('rmChan', channelCache, 'Not set', c => c.name, false);
            fillSelect('staffAdd', roleCache, 'Add a role', r => r.name, false);
            staffRoles.length = 0; staffRoles.push(...(cfg.staffRoles || [])); renderChips('staffChips', staffRoles, roleName); $('staffAdd').value = '';
            adminUsers.length = 0; adminUsers.push(...(cfg.adminUsers || [])); renderChips('adminUserChips', adminUsers, memberName); loadMembers();
            $('modThreshold').value = cfg.shield?.joinThreshold ?? 5; $('modWindow').value = cfg.shield?.windowSeconds ?? 30; $('modAction').value = cfg.shield?.action || 'alert';
            $('toolVoteChange').checked = cfg.communityTools?.allowVoteChange ?? true;
            const j = cfg.voice?.joinToCreate || {};
            $('vcEnabled').checked = !!j.enabled; $('vcChan').value = j.channelId || ''; $('vcName').value = j.nameTemplate || "{user}'s room";
            const st = cfg.stats || {};
            $('stEnabled').checked = !!st.enabled; $('stInterval').value = st.intervalMinutes ?? 10;
            for (const [k, id] of Object.entries(STAT_KEYS)) $(id).checked = !!st.items?.[k];
            renderStatsStatus(st);
            resetRoleMenuForm(); loadRoleMenus();
        };

// Dashboard behavior layer: live panel state, save island, and the new control surfaces.
    let currentBotAvatar = '';
    let dirtyDashboardTabs = new Set();
    let islandBusy = false;
    let commandRuleCatalog = { groups: [], commands: [] }, commandRuleData = {}, commandRuleEditorTouched = false;
    let moneyRewardsData = [];
    const savedDashboardSnapshots = new Map();

    function dashboardTabSnapshot(tab){
      const panel=$('tab-'+tab);if(!panel)return null;
      const controls=[...panel.querySelectorAll('input,select,textarea')]
        .filter(el=>!el.dataset.choiceSearch&&!el.dataset.noDirty)
        .map((el,index)=>({key:el.id||el.name||el.dataset.k||`${el.tagName}-${index}`,type:el.type||el.tagName,value:el.multiple?[...el.selectedOptions].map(option=>option.value):el.value,checked:['checkbox','radio'].includes(el.type)?el.checked:undefined}));
      let extra=null;
      if(tab==='tickets')extra={allowedRoles:ticketAllowedRoles,panels:ticketPanelsData.map(({id,title,text,buttonName,buttonColor,nameTemplate,ticketCategoryId,logChannelId,channelId})=>({id,title,text,buttonName,buttonColor,nameTemplate,ticketCategoryId,logChannelId,channelId}))};
      else if(tab==='levels')extra={rewards:rewardsData,noXPChannels,noXPRoles};
      else if(tab==='economy')extra=moneyRewardsData;
      else if(tab==='permissions')extra={staffRoles,adminUsers};
      else if(tab==='command-rules')extra=commandRuleData;
      return JSON.stringify({controls,extra});
    }
    function captureDashboardSnapshots(){
      savedDashboardSnapshots.clear();
      document.querySelectorAll('.tab-content[id^="tab-"]').forEach(panel=>{
        const tab=panel.id.slice(4),snapshot=dashboardTabSnapshot(tab);
        if(snapshot!==null)savedDashboardSnapshots.set(tab,snapshot);
      });
    }
    function refreshDashboardSnapshot(tab){
      const snapshot=dashboardTabSnapshot(tab);
      if(snapshot!==null)savedDashboardSnapshots.set(tab,snapshot);
    }

    function askConfirm(message,title='Please confirm'){
      return new Promise(resolve=>{
        const overlay=document.createElement('div');overlay.className='confirm-backdrop';
        const card=document.createElement('section');card.className='confirm-card';card.setAttribute('role','alertdialog');card.setAttribute('aria-modal','true');
        const heading=document.createElement('h2');heading.textContent=title;
        const copy=document.createElement('p');copy.textContent=message;
        const actions=document.createElement('div');actions.className='confirm-actions';
        const cancel=document.createElement('button');cancel.type='button';cancel.className='btn-ghost';cancel.textContent='Cancel';
        const confirmButton=document.createElement('button');confirmButton.type='button';confirmButton.className='confirm-danger';confirmButton.textContent='Continue';
        actions.append(cancel,confirmButton);card.append(heading,copy,actions);overlay.append(card);document.body.append(overlay);
        let done=false;
        const finish=value=>{if(done)return;done=true;document.removeEventListener('keydown',onKey);overlay.remove();resolve(value);};
        const onKey=e=>{if(e.key==='Escape')finish(false);if(e.key==='Enter')finish(true);};
        cancel.onclick=()=>finish(false);confirmButton.onclick=()=>finish(true);overlay.addEventListener('click',e=>{if(e.target===overlay)finish(false);});
        document.addEventListener('keydown',onKey);cancel.focus();
      });
    }

    applyIdentity = function(){
      document.querySelector('.brand h1').textContent = 'Ruby Dashboard';
      document.title = 'Ruby Dashboard';
    };
    previewLook = function(){
      const name = $('lookName').value.trim() || 'Ruby';
      $('pvName').textContent = name;
      safeImg($('pvLogo'), currentBotAvatar, 'Ruby');
      applyAppearance($('lookColor').value || '#bd785c', 'dark');
      buildSwatches();
    };
    endSession = function(message){
      localStorage.removeItem('ruby_token'); localStorage.removeItem('ruby_session_expiry'); authToken = null;
      if (countdownTimer) clearInterval(countdownTimer);
      if (message) {
        let notice=$('sessionNotice');
        if(!notice){notice=document.createElement('div');notice.id='sessionNotice';notice.className='session-notice';notice.setAttribute('role','status');notice.setAttribute('aria-live','assertive');document.body.append(notice);}
        notice.innerHTML='<span class="session-notice-mark" aria-hidden="true">!</span><span class="session-notice-copy"><b>Session ended</b><span>'+esc(message)+'</span></span>';
        setTimeout(() => location.reload(), 2600);
      }
      else location.reload();
    };
    startSessionCountdown = function(){
      $('sessionPillHeader').classList.remove('hidden');
      function update(){
        const left = sessionExpiryTime - Date.now(), el = $('sessionCountdownText');
        if (left <= 0) { endSession('Your session has expired. Sign in again with /login.'); return; }
        const days = Math.floor(left / 86400000), hours = Math.max(1, Math.ceil((left % 86400000) / 3600000));
        el.textContent = days ? 'Session · ' + days + 'd left' : 'Session · ' + hours + 'h left';
        el.title = 'Ruby Dashboard session expires ' + new Date(sessionExpiryTime).toLocaleString();
      }
      update(); if (countdownTimer) clearInterval(countdownTimer); countdownTimer = setInterval(update,60000);
    };

    function setChoiceList(id, items, chosen, kind){
      const box=$(id);if(!box)return;box.innerHTML='';box.classList.remove('is-open');box.classList.add('choice-picker');box.dataset.choiceKind=kind;
      const selected=new Set((chosen||[]).map(String));
      const labelKind=kind==='role'?'roles':kind==='member'?'members':'channels';
      if(!items.length){const p=document.createElement('span');p.className='hint';p.textContent='No '+labelKind+' are available.';box.append(p);return;}
      const list=document.createElement('div');list.className='choice-picker-options';list.setAttribute('role','group');list.setAttribute('aria-label','Choose '+labelKind);
      for(const item of items){
        const itemName=kind==='member'?(item.username||item.name||item.id):(item.name||item.id);
        const label=document.createElement('label');label.className='check-option';label.title=String(itemName);
        const input=document.createElement('input');input.type='checkbox';input.value=String(item.id);input.checked=selected.has(String(item.id));input.dataset.name=String(itemName);
        if(id.startsWith('commandRule'))input.dataset.noDirty='true';
        const text=document.createElement('span');text.className='choice-option-name';text.textContent=(kind==='channel'?'# ':kind==='member'?'@':'')+itemName;
        if(kind==='role'&&item.color){const swatch=document.createElement('i');swatch.className='choice-role-swatch';swatch.style.backgroundColor=typeof item.color==='number'?'#'+item.color.toString(16).padStart(6,'0'):item.color;label.append(swatch);}
        const check=document.createElement('span');check.className='choice-option-check';check.innerHTML=dashboardIcon('check');
        label.append(input,text,check);list.append(label);
      }
      box.append(list);
    }
    function checkedIds(id){return [...($(id)?.querySelectorAll('input:checked') || [])].map(x=>x.value);}
    function lines(id){return $(id).value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).slice(0,200);}
    function renderNoXPChoices(){
      setChoiceList('lvlNoChanChoices',(channelCache||[]).filter(channel=>channel.type!=='voice'),noXPChannels,'channel');
      setChoiceList('lvlNoRoleChoices',roleCache||[],noXPRoles,'role');
      $('lvlNoChanChoices')?.querySelectorAll('input[type="checkbox"]').forEach(input=>input.addEventListener('change',()=>{
        noXPChannels.length=0;noXPChannels.push(...checkedIds('lvlNoChanChoices'));
      }));
      $('lvlNoRoleChoices')?.querySelectorAll('input[type="checkbox"]').forEach(input=>input.addEventListener('change',()=>{
        noXPRoles.length=0;noXPRoles.push(...checkedIds('lvlNoRoleChoices'));
      }));
    }
    function renderStaffRoleChoices(){
      setChoiceList('staffRoleChoices', roleCache || [], staffRoles || [], 'role');
      $('staffRoleChoices')?.querySelectorAll('input[type="checkbox"]').forEach(input=>input.addEventListener('change',()=>{
        staffRoles.length=0;staffRoles.push(...checkedIds('staffRoleChoices'));renderChips('staffChips',staffRoles,roleName);
      }));
    }
    function loadModerationControls(cfg){
      const m=cfg.moderation || {}, anti=m.antiLink || {}, auto=m.automod || {}, safety=m.safety || {};
      $('timeoutAt').value=m.timeoutAt ?? 3; $('banAt').value=m.banAt ?? 5;
      $('antiLinkEnabled').checked=!!anti.enabled; $('allowYapperInvites').checked=anti.allowYapperInvites ?? true;
      syncAntiLinkOptions();
      setChoiceList('linkChannelChoices',(channelCache||[]).filter(c=>c.type!=='voice'),anti.allowedChannels||[],'channel');
      setChoiceList('linkRoleChoices',roleCache||[],anti.allowedRoles||[],'role');
      $('automodEnabled').checked=!!auto.enabled; $('automodAction').value=auto.action || 'delete_warn';
      $('spamLimit').value=auto.spamLimit ?? 5; $('spamWindow').value=auto.spamWindowSeconds ?? 5;
      $('blockRepeated').checked=auto.blockRepeated ?? true; $('mentionLimit').value=auto.mentionLimit ?? 5;
      $('automodBlockLinks').checked=!!auto.blockLinks;
      setChoiceList('spamChannelChoices',(channelCache||[]).filter(c=>c.type!=='voice'),auto.spamAllowedChannels||[],'channel');
      $('allowedSites').value=(auto.allowedSites||[]).join('\n'); $('blockedWords').value=(auto.blockedWords||[]).join('\n');
      $('modShieldEnabled').checked=cfg.shield?.enabled ?? true;
      $('modAlertChannel').value=cfg.shield?.alertChannel || '';
      $('modThreshold').value=cfg.shield?.joinThreshold ?? 5; $('modWindow').value=cfg.shield?.windowSeconds ?? 30; $('modAction').value=cfg.shield?.action || 'alert';
      $('safetyEnabled').checked=!!safety.enabled; $('safetyMinutes').value=safety.askAgainMinutes ?? 0;
      renderStaffRoleChoices();
    }
    function syncAntiLinkOptions(){const options=$('antiLinkOptions');if(options)options.classList.toggle('hidden',!$('antiLinkEnabled').checked);}
    function loadVerificationControls(v){
      fillSelect('verifChannel',(channelCache||[]).filter(c=>c.type!=='voice'),'Choose a channel',c=>c.name);
      $('verifChannel').value=v.panelChannelId || ''; $('verifTitle').value=v.panelTitle || 'Member verification';
      $('verifText').value=v.panelText || 'Press the button below to verify and unlock the community.';
      $('verifButton').value=v.buttonLabel || 'Verify';
    }
    function renderTicketPanels(){
      const box=$('ticketPanelsContainer'); if(!box)return; box.innerHTML='';
      const roleBox=$('ticketRoleChoices');
      setChoiceList('ticketRoleChoices',roleCache||[],ticketAllowedRoles,'role');
      roleBox?.querySelectorAll('input[type="checkbox"]').forEach(input=>input.addEventListener('change',()=>{ticketAllowedRoles=checkedIds('ticketRoleChoices');markDashboardDirty('tickets');}));
      if(!ticketPanelsData.length){const p=document.createElement('p');p.className='hint';p.textContent='No ticket panels yet.';box.append(p);return;}
      ticketPanelsData.forEach((panel,index)=>{
        const card=document.createElement('section');card.className='card panel-card ticket-builder-card';
        panel.buttonColor=ticketColorInputValue(panel.buttonColor);
        panel.nameTemplate=panel.nameTemplate||'ticket-{number}-{username}';
        panel.ticketCategoryId=panel.ticketCategoryId||'';
        panel.logChannelId=panel.logChannelId||'';
        card.style.setProperty('--ticket-accent',panel.buttonColor);
        const head=document.createElement('div');head.className='ticket-builder-head';
        const title=document.createElement('strong');title.textContent='Panel '+(index+1);
        const state=document.createElement('span');state.className='ticket-builder-state';state.textContent=panel.messageId?'Published':'Draft';
        const actions=document.createElement('div');actions.className='ticket-actions ticket-builder-footer';
        const post=document.createElement('button');post.type='button';post.className='ticket-post-button';post.innerHTML=`${dashboardIcon(panel.messageId?'refresh':'plus')}<span>${panel.messageId?'Post panel again':'Post ticket panel'}</span>`;post.onclick=()=>publishTicketPanel(panel.id);
        const remove=document.createElement('button');remove.type='button';remove.className='btn-danger';remove.textContent='Remove';remove.disabled=ticketPanelsData.length<=1;remove.title=remove.disabled?'Keep at least one ticket panel.':'';remove.onclick=()=>{if(ticketPanelsData.length<=1)return;ticketPanelsData.splice(index,1);renderTicketPanels();markDashboardDirty('tickets');};
        head.append(title,state);card.append(head);
        const addField=(labelText,key,type='text')=>{
          const wrap=document.createElement('div');wrap.className='form-group';const label=document.createElement('label');label.textContent=labelText;
          let control;
          if(type==='textarea'){control=document.createElement('textarea');control.value=panel[key]||'';}
          else{control=document.createElement('input');control.type=type;control.value=panel[key]||'';}
          control.addEventListener(type==='select'?'change':'input',()=>{panel[key]=control.value;});wrap.append(label,control);card.append(wrap);return control;
        };
        const panelTitle=addField('Panel title','title');panelTitle.maxLength=100;
        const message=addField('Message','text','textarea');message.maxLength=3500;
        const buttonLabel=addField('Open-ticket button label','buttonName');buttonLabel.maxLength=80;

        const nameWrap=document.createElement('div');nameWrap.className='form-group';
        const nameLabel=document.createElement('label');nameLabel.textContent='Ticket channel name format';
        const nameInput=document.createElement('input');nameInput.type='text';nameInput.maxLength=80;nameInput.value=panel.nameTemplate;nameInput.placeholder='ticket-{number}-{username}';
        nameInput.addEventListener('input',()=>{panel.nameTemplate=nameInput.value;});
        const nameHint=document.createElement('p');nameHint.className='hint';nameHint.textContent='Use {number} and {username}. Example: Ticket #{number} becomes ticket-12 after Yapper cleans it for a channel name.';
        nameWrap.append(nameLabel,nameInput,nameHint);card.append(nameWrap);

        const row=document.createElement('div');row.className='form-group two-col ticket-config-row';
        const colorCol=document.createElement('div');colorCol.className='ticket-color-field';
        const colorLabel=document.createElement('label');colorLabel.textContent='Ticket accent color';
        const colorControl=document.createElement('div');colorControl.className='ticket-color-control';
        const color=document.createElement('input');color.type='color';color.value=panel.buttonColor;color.setAttribute('aria-label','Choose ticket accent color');
        const colorValue=document.createElement('span');colorValue.className='ticket-color-value';colorValue.textContent=color.value.toUpperCase();
        color.addEventListener('input',()=>{panel.buttonColor=color.value;colorValue.textContent=color.value.toUpperCase();card.style.setProperty('--ticket-accent',panel.buttonColor);});
        colorControl.append(color,colorValue);
        const colorHint=document.createElement('p');colorHint.className='hint';colorHint.textContent='The panel uses this exact shade. Yapper action buttons have fixed fills, so Ruby picks the closest button color.';
        colorCol.append(colorLabel,colorControl,colorHint);
        const catCol=document.createElement('div');catCol.className='ticket-select-field';
        const catLabel=document.createElement('label');catLabel.textContent='Open tickets in category';
        const category=document.createElement('select');category.add(new Option('Use panel channel category',''));
        (categoryCache||[]).forEach(item=>category.add(new Option(item.name,item.id)));
        category.value=panel.ticketCategoryId;category.addEventListener('change',()=>{panel.ticketCategoryId=category.value;});
        catCol.append(catLabel,category);row.append(colorCol,catCol);card.append(row);

        const publishRow=document.createElement('div');publishRow.className='form-group two-col ticket-config-row';
        const channelCol=document.createElement('div');channelCol.className='ticket-select-field';
        const channelLabel=document.createElement('label');channelLabel.textContent='Post panel in channel';
        const channel=document.createElement('select');channel.id='ticketPanelChannel_'+index;channel.add(new Option('Choose a channel',''));
        (channelCache||[]).filter(c=>c.type!=='voice').forEach(c=>channel.add(new Option('#'+c.name,c.id)));
        channel.value=panel.channelId||'';channel.addEventListener('change',()=>{panel.channelId=channel.value;});
        channelCol.append(channelLabel,channel);
        const logCol=document.createElement('div');logCol.className='ticket-select-field';
        const logLabel=document.createElement('label');logLabel.textContent='Ticket log channel';
        const logChannel=document.createElement('select');logChannel.id='ticketPanelLog_'+index;logChannel.add(new Option('Use global ticket log',''));
        (channelCache||[]).filter(c=>c.type!=='voice').forEach(c=>logChannel.add(new Option('#'+c.name,c.id)));
        logChannel.value=panel.logChannelId||'';logChannel.addEventListener('change',()=>{panel.logChannelId=logChannel.value;});
        logCol.append(logLabel,logChannel);publishRow.append(channelCol,logCol);card.append(publishRow);
        const logHint=document.createElement('p');logHint.className='hint ticket-log-hint';logHint.textContent='Ticket activity is sent here. Leave this on “Use global ticket log” to use the channel set in Permissions.';card.append(logHint);

        fillSelectForCard(channel);fillSelectForCard(logChannel);actions.append(remove,post);card.append(actions);box.append(card);
      });
      function fillSelectForCard(select){enhance(select,'channel');}
    }
    function saveModeration(){
      const moderation={timeoutAt:num('timeoutAt',3),banAt:num('banAt',5),antiLink:{enabled:$('antiLinkEnabled').checked,allowYapperInvites:$('allowYapperInvites').checked,allowedChannels:checkedIds('linkChannelChoices'),allowedRoles:checkedIds('linkRoleChoices')},automod:{enabled:$('automodEnabled').checked,action:$('automodAction').value,spamLimit:num('spamLimit',5),spamWindowSeconds:num('spamWindow',5),blockRepeated:$('blockRepeated').checked,mentionLimit:num('mentionLimit',5),blockLinks:$('automodBlockLinks').checked,spamAllowedChannels:checkedIds('spamChannelChoices'),allowedSites:lines('allowedSites'),blockedWords:lines('blockedWords')}};
      if(moderation.timeoutAt<0||moderation.banAt<0){showStatus('Warning thresholds cannot be negative.',true);return false;}
      return patchConfig({moderation},'Moderation settings saved.');
    }
    function saveSecurity(){
      return patchConfig({shield:{enabled:$('modShieldEnabled').checked,alertChannel:$('modAlertChannel').value,joinThreshold:num('modThreshold',5),windowSeconds:num('modWindow',30),action:$('modAction').value},moderation:{safety:{enabled:$('safetyEnabled').checked,askAgainMinutes:num('safetyMinutes',0)}}},'Security settings saved.');
    }
    function savePermissions(){
      staffRoles.length=0;staffRoles.push(...checkedIds('staffRoleChoices'));
      return patchConfig({logChannel:$('permLogChannel').value,staffRoles},'Permissions saved.');
    }
    async function saveLook(){
      const name=$('lookName').value.trim()||'Ruby';
      const {ok,data}=await api('/api/servers/'+currentServerId+'/bot-profile',{method:'POST',body:JSON.stringify({name})});
      if(!ok){showStatus(data.error||'Ruby?s profile could not be updated.',true);return false;}
      const accent=$('lookColor').value;
      const appearance=await api('/api/servers/'+currentServerId+'/config',{method:'PATCH',body:JSON.stringify({panelColor:accent,appearance:{accent,theme:'custom',filter:'dark'}})});
      if(!appearance.ok){showStatus(appearance.data.error||'The nickname was saved, but the accent color could not be saved.',true);return false;}
      selectedServerConfig=appearance.data.config||selectedServerConfig;
      currentIdentity={name,avatar:currentBotAvatar};applyIdentity();previewLook();showStatus('Nickname and panel accent saved.');return true;
    }
    function saveHoneypot(){
      if($('honeyEnabled').checked&&!$('honeyChannel').value){showStatus('Choose a trap channel first.',true);return false;}
      return patchConfig({honeypot:{enabled:$('honeyEnabled').checked,channelId:$('honeyChannel').value,action:$('honeyAction').value,timeoutMinutes:num('honeyTimeout',1440),warningText:$('honeyText').value,postWarning:$('honeyPostWarning').checked}},'Honeypot settings saved.');
    }
    function saveTickets(){return patchConfig({tickets:{allowedRoles:ticketAllowedRoles,panels:ticketPanelsData}},'Ticket settings saved.');}
    function saveWelcome(){return patchConfig({welcome:{enabled:$('welcEnabled').checked,goodbyeEnabled:$('goodEnabled').checked,channelId:$('welcChan').value,welcomeText:$('welcText').value,goodbyeChannel:$('goodChan').value,goodbyeText:$('goodText').value}},'Welcome and goodbye saved.');}
    function saveVerification(){return patchConfig({verification:{enabled:$('verifEnabled').checked,panelChannelId:$('verifChannel').value,panelTitle:$('verifTitle').value.trim(),panelText:$('verifText').value,buttonLabel:$('verifButton').value.trim()||'Verify',addRoleId:$('verifAddRole').value,removeRoleId:$('verifRemoveRole').value,minAccountAgeDays:num('verifMinAge',7),kickGraceMinutes:num('verifGrace',60)}},'Verification settings saved.');}
    function saveVoice(){
      if($('vcEnabled').checked&&!$('vcChan').value){showStatus('Choose a lobby voice channel first.',true);return false;}
      return patchConfig({voice:{joinToCreate:{enabled:$('vcEnabled').checked,channelId:$('vcChan').value,nameTemplate:$('vcName').value.trim()||"{user}'s room"}},stats:{enabled:$('stEnabled').checked,intervalMinutes:num('stInterval',10),items:{members:$('stMembers').checked,humans:$('stHumans').checked,bots:$('stBots').checked,roles:$('stRoles').checked,channels:$('stChannels').checked,voice:$('stVoice').checked}}},'Voice and channel-stat settings saved.');
    }
    setupStats=async function(){
      if(!(await saveVoice()))return;
      dirtyDashboardTabs.delete('voice');refreshDashboardSnapshot('voice');updateSaveIsland();
      showStatus('Creating statistics channels…');
      const {ok,data}=await api('/api/servers/'+currentServerId+'/stats/setup',{method:'POST'});
      if(!ok){showStatus(data.error||'Could not create statistics channels.',true);return;}
      renderStatsStatus(data.config.stats,data.values);
      showStatus(data.missing?.length?'Some channels could not be created. Check Ruby’s channel permissions.':'Statistics channels are ready and updated.',!!data.missing?.length);
    };
    saveStatsCfg=function(){return saveVoice();};
    function saveBoard(){
      if($('lbEnabled').checked&&!$('lbChan').value){showStatus('Choose a channel for automatic posts.',true);return false;}
      return patchConfig({leaderboard:{enabled:$('lbEnabled').checked,channelId:$('lbChan').value,intervalHours:num('lbInterval',24),type:$('lbType').value}},'Leaderboard settings saved.');
    }
    function renderMoneyRewards(){
      const box=$('moneyRewardRows');if(!box)return;box.innerHTML='';
      if(!moneyRewardsData.length){const empty=document.createElement('p');empty.className='hint money-tier-empty';empty.textContent='No balance role tiers yet. Add one for each amount you want to reward.';box.append(empty);return;}
      moneyRewardsData.forEach((reward,index)=>{
        const row=document.createElement('div');row.className='money-tier-row';
        const thresholdWrap=document.createElement('label');thresholdWrap.className='money-tier-field';thresholdWrap.textContent='Minimum total balance';
        const threshold=document.createElement('input');threshold.type='number';threshold.min='0';threshold.max='1000000000';threshold.step='1';threshold.value=reward.threshold??'';threshold.setAttribute('aria-label','Minimum balance for tier '+(index+1));
        threshold.addEventListener('input',()=>{moneyRewardsData[index].threshold=threshold.value===''?null:Number(threshold.value);markDashboardDirty('economy');});thresholdWrap.append(threshold);
        const roleWrap=document.createElement('label');roleWrap.className='money-tier-field';roleWrap.textContent='Role to grant';
        const select=document.createElement('select');select.id='moneyRewardRole-'+index;roleWrap.append(select);
        const remove=document.createElement('button');remove.type='button';remove.className='btn-danger';remove.textContent='Remove tier';remove.onclick=()=>{moneyRewardsData.splice(index,1);renderMoneyRewards();markDashboardDirty('economy');};
        row.append(thresholdWrap,roleWrap,remove);box.append(row);
        fillSelect(select.id,roleCache||[],'Choose a role',r=>r.name);select.value=reward.roleId||'';
        select.addEventListener('change',()=>{moneyRewardsData[index].roleId=select.value;markDashboardDirty('economy');});
      });
    }
    function addMoneyReward(){
      const next=moneyRewardsData.length?Math.max(...moneyRewardsData.map(r=>Number(r.threshold)||0))+1000:1000;
      moneyRewardsData.push({threshold:next,roleId:''});renderMoneyRewards();markDashboardDirty('economy');
    }
    function commandRuleLabel(target){
      const [kind,id]=String(target||'').split(':',2);
      if(kind==='group')return (commandRuleCatalog.groups.find(item=>item.id===id)?.label||id)+' group';
      return commandRuleCatalog.commands.find(item=>item.id===id)?.label||('/'+id);
    }
    function ruleFallback(target){
      const [kind,id]=String(target||'').split(':',2),own=commandRuleData[target]||{};
      const groupId=kind==='command'?(commandRuleCatalog.commands.find(item=>item.id===id)?.group||''):id;
      const groupRule=groupId?commandRuleData['group:'+groupId]||{}:{};
      const has=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key);
      const fallbackCooldown=kind==='command'?Number(selectedServerConfig?.commandControls?.cooldowns?.[id]||0):0;
      const take=(key,fallback)=>has(own,key)?own[key]:has(groupRule,key)?groupRule[key]:fallback;
      return {channelIds:[...(take('channelIds',[])||[])],cooldownSeconds:Number(take('cooldownSeconds',fallbackCooldown))||0,cooldownExemptRoleIds:[...(take('cooldownExemptRoleIds',[])||[])],cooldownExemptUserIds:[...(take('cooldownExemptUserIds',[])||[])]};
    }
    function initializeCommandRules(cfg,catalog){
      commandRuleCatalog=catalog||{groups:[],commands:[]};commandRuleData=JSON.parse(JSON.stringify(cfg.commandControls?.rules||{}));commandRuleEditorTouched=false;
      const select=$('commandRuleTarget');if(!select)return;select.innerHTML='';select.add(new Option('Choose a command or group',''));
      if(commandRuleCatalog.groups?.length){const groups=document.createElement('optgroup');groups.label='Command groups';commandRuleCatalog.groups.forEach(item=>groups.append(new Option(item.label,'group:'+item.id)));select.append(groups);}
      if(commandRuleCatalog.commands?.length){const commands=document.createElement('optgroup');commands.label='Commands';commandRuleCatalog.commands.forEach(item=>{const option=new Option(item.label,'command:'+item.id);option.title=item.description||'';commands.append(option);});select.append(commands);}
      select.onchange=()=>{commandRuleEditorTouched=false;renderCommandRuleEditor();};renderCommandRuleEditor();renderCommandRuleList();
      if(!catalog)$('commandRuleList').textContent='Could not load commands. Refresh the dashboard and try again.';
    }
    function renderCommandRuleEditor(){
      const target=$('commandRuleTarget')?.value||'',rule=target?ruleFallback(target):{channelIds:[],cooldownSeconds:0,cooldownExemptRoleIds:[],cooldownExemptUserIds:[]};
      $('commandRuleCooldown').value=rule.cooldownSeconds;
      setChoiceList('commandRuleChannelChoices',(channelCache||[]).filter(c=>c.type==='text'),rule.channelIds,'channel');
      setChoiceList('commandRuleExemptRoleChoices',roleCache||[],rule.cooldownExemptRoleIds,'role');
      setChoiceList('commandRuleExemptUserChoices',memberCache||[],rule.cooldownExemptUserIds,'member');
      for(const input of document.querySelectorAll('#commandRuleChannelChoices input,#commandRuleExemptRoleChoices input,#commandRuleExemptUserChoices input')){input.dataset.noDirty='true';input.onchange=()=>{commandRuleEditorTouched=true;};}
      const cooldown=$('commandRuleCooldown');cooldown.dataset.noDirty='true';cooldown.oninput=()=>{commandRuleEditorTouched=true;};
    }
    function renderCommandRuleList(){
      const box=$('commandRuleList');if(!box)return;box.innerHTML='';const entries=Object.entries(commandRuleData);
      if(!entries.length){const empty=document.createElement('p');empty.className='hint';empty.textContent='No custom rules yet. Add a rule above to limit a command or group.';box.append(empty);return;}
      entries.sort((a,b)=>commandRuleLabel(a[0]).localeCompare(commandRuleLabel(b[0])));
      entries.forEach(([target,rule])=>{
        const row=document.createElement('article');row.className='command-rule-item';const copy=document.createElement('div');copy.className='command-rule-copy';
        const title=document.createElement('strong');title.textContent=commandRuleLabel(target);
        const channels=(rule.channelIds||[]).map(id=>(channelCache||[]).find(c=>String(c.id)===String(id))?.name).filter(Boolean);
        const parts=[channels.length?'In '+channels.map(name=>'#'+name).join(', '):'Any channel',(Number(rule.cooldownSeconds)||0)+'s cooldown'];
        const exemptions=(rule.cooldownExemptRoleIds||[]).length+(rule.cooldownExemptUserIds||[]).length;if(exemptions)parts.push(exemptions+' cooldown exemptions');
        const meta=document.createElement('span');meta.textContent=parts.join(' ? ');copy.append(title,meta);
        const actions=document.createElement('div');actions.className='command-rule-item-actions';
        const edit=document.createElement('button');edit.type='button';edit.className='btn-ghost';edit.textContent='Edit';edit.onclick=()=>{$('commandRuleTarget').value=target;commandRuleEditorTouched=false;renderCommandRuleEditor();$('commandRuleTarget').focus();};
        const remove=document.createElement('button');remove.type='button';remove.className='btn-danger';remove.textContent='Remove';remove.onclick=()=>{delete commandRuleData[target];if($('commandRuleTarget').value===target)renderCommandRuleEditor();renderCommandRuleList();markDashboardDirty('command-rules');};
        actions.append(edit,remove);row.append(copy,actions);box.append(row);
      });
    }
    function upsertCommandRule(){
      const target=$('commandRuleTarget').value;if(!target){showStatus('Choose a command or group first.',true);return;}
      const seconds=Number($('commandRuleCooldown').value);if(!Number.isInteger(seconds)||seconds<0||seconds>86400){showStatus('Cooldown must be a whole number of seconds from 0 to 86400.',true);return;}
      const rule={channelIds:checkedIds('commandRuleChannelChoices'),cooldownSeconds:seconds,cooldownExemptRoleIds:checkedIds('commandRuleExemptRoleChoices'),cooldownExemptUserIds:checkedIds('commandRuleExemptUserChoices')};
      if(rule.channelIds.length>100||rule.cooldownExemptRoleIds.length>100||rule.cooldownExemptUserIds.length>100){showStatus('Choose up to 100 channels, roles, or members per rule.',true);return;}
      commandRuleData[target]=rule;commandRuleEditorTouched=false;renderCommandRuleList();markDashboardDirty('command-rules');showStatus('Rule added to your unsaved changes.');
    }
    function removeSelectedCommandRule(){
      const target=$('commandRuleTarget').value;if(!target||!commandRuleData[target]){showStatus('There is no saved rule for this selection.',true);return;}
      delete commandRuleData[target];renderCommandRuleEditor();renderCommandRuleList();markDashboardDirty('command-rules');
    }
    function saveBirthdays(){return patchConfig({birthdays:{channelId:$('bdayChan').value,postHour:num('bdayHour',9),text:$('bdayText').value}},'Birthday settings saved.');}
    function saveTools(){return patchConfig({communityTools:{suggestionsChannel:$('toolSugg').value,starboardChannel:$('toolStar').value,reactionsNeeded:num('toolReact',3),allowVoteChange:$('toolVoteChange').checked}},'Community tools saved.');}
    function saveCommandRules(){
      if(Object.keys(commandRuleData).length>100){showStatus('You can save up to 100 command rules.',true);return false;}
      return patchConfig({commandControls:{rules:commandRuleData}},'Command rules saved.');
    }
    function saveLevels(){
      const min=num('lvlMinXP',5),max=num('lvlMaxXP',30);
      if(min>max){showStatus('Minimum XP cannot be higher than maximum XP.',true);return false;}
      if(rewardsData.some(r=>!r.roleId||r.level<1)){showStatus('Each reward needs a role and a level of 1 or more.',true);return false;}
      return patchConfig({levels:{enabled:$('lvlEnabled').checked,minXP:min,maxXP:max,cooldownSeconds:num('lvlCooldown',60),minChars:num('lvlMinChars',1),difficulty:num('lvlDiff',100),highestLevel:num('lvlHigh',100),channelId:$('lvlChan').value,message:$('lvlMsg').value,rewards:rewardsData,keepEarlierRewards:$('lvlKeep').checked,noXPChannels,noXPRoles}},'Levels saved.');
    }
    function saveEconomy(){
      const roleIds=new Set(),thresholds=new Set();
      for(const reward of moneyRewardsData){
        if(!reward.roleId||reward.threshold===null||reward.threshold===''||!Number.isInteger(Number(reward.threshold))||Number(reward.threshold)<0||Number(reward.threshold)>1000000000){showStatus('Each balance tier needs a role and a whole-dollar amount from 0 to 1,000,000,000.',true);return false;}
        if(roleIds.has(reward.roleId)){showStatus('Choose a different role for each balance tier.',true);return false;}
        if(thresholds.has(Number(reward.threshold))){showStatus('Each balance tier needs a different threshold.',true);return false;}
        roleIds.add(reward.roleId);thresholds.add(Number(reward.threshold));reward.threshold=Number(reward.threshold);
      }
      const economy={enabled:$('ecoEnabled').checked,currency:'$',startBalance:num('ecoStart',500),roleRewards:[...moneyRewardsData].sort((a,b)=>a.threshold-b.threshold)};
      for(const [id,[group,key]]of Object.entries(ECO_FIELDS)){economy[group]=economy[group]||{};economy[group][key]=num(id,0);}
      return patchConfig({economy},'Economy settings saved.');
    }
    async function savePublicListing(){
      const enabled=$('publicListingEnabled').checked;
      const inviteUrl=$('publicListingInvite').value.trim();
      if(enabled&&!inviteUrl){showStatus('Add an active Yapper invite before featuring your community.',true);return false;}
      return patchConfig({publicListing:{enabled,inviteUrl}},enabled?'Your community is now featured on Ruby’s homepage.':'Homepage listing settings saved.');
    }
    async function saveCurrentChanges(){
      if(islandBusy||!dirtyDashboardTabs.size)return;islandBusy=true;
      const actions={overview:savePublicListing,permissions:savePermissions,look:saveLook,moderation:saveModeration,security:saveSecurity,honeypot:saveHoneypot,tickets:saveTickets,voice:saveVoice,welcome:saveWelcome,verification:saveVerification,levels:saveLevels,birthdays:saveBirthdays,leaderboard:saveBoard,economy:saveEconomy,tools:saveTools,'command-rules':saveCommandRules,announcements:saveAnnouncementForm};
      let allSaved=true;
      try{for(const tab of [...dirtyDashboardTabs]){const fn=actions[tab];if(!fn)continue;const result=await fn();if(result===false){allSaved=false;break;}dirtyDashboardTabs.delete(tab);refreshDashboardSnapshot(tab);}}
      catch(e){showStatus(e?.message||'Could not save these changes.',true);allSaved=false;}
      if(allSaved){$('saveIsland').classList.add('hidden');showStatus('Changes saved.');loadLiveStats();}else updateSaveIsland();
      islandBusy=false;
    }
    function updateSaveIsland(){
      const label=$('saveIsland')?.querySelector('span:nth-child(2)');if(label)label.textContent=dirtyDashboardTabs.size===1?'Unsaved changes':'Unsaved changes on '+dirtyDashboardTabs.size+' pages';
      $('saveIsland')?.classList.toggle('hidden',!dirtyDashboardTabs.size);
    }
    function markDashboardDirty(tab){
      if(!tab)return;
      const saved=savedDashboardSnapshots.get(tab);
      if(saved!==undefined&&dashboardTabSnapshot(tab)===saved)dirtyDashboardTabs.delete(tab);
      else dirtyDashboardTabs.add(tab);
      updateSaveIsland();
    }
    async function discardCurrentChanges(){
      if(!currentServerId)return;
      const tab=document.querySelector('.tab-content:not(.hidden)')?.id?.replace('tab-','')||'overview';
      const id=currentServerId,name=$('headerServerName').textContent,icon=$('headerServerAvatar').src;
      dirtyDashboardTabs.clear();updateSaveIsland();await selectServer(id,name,icon);
      const link=[...document.querySelectorAll('.nav-link')].find(x=>x.getAttribute('onclick')?.includes("'"+tab+"'"));switchTab(tab,link||null);
    }
    async function saveAnnouncementForm(){
      const at=$('annWhen').value?new Date($('annWhen').value).getTime():NaN;
      const body={text:$('annText').value,channelId:$('annChan').value,at};
      const url='/api/servers/'+currentServerId+'/announcements'+(editingAnnouncement?'/'+editingAnnouncement:'');
      const r=await api(url,{method:editingAnnouncement?'PATCH':'POST',body:JSON.stringify(body)});
      if(!r.ok){showStatus(r.data.error||'Could not schedule the announcement.',true);return false;}
      dirtyDashboardTabs.delete('announcements');resetAnnouncementForm();refreshDashboardSnapshot('announcements');updateSaveIsland();showStatus(editingAnnouncement?'Announcement updated.':'Announcement scheduled.');loadAnnouncements();return true;
    }
    submitAnnouncement=async function(){return saveAnnouncementForm();};
    document.addEventListener('input',e=>{if(e.target.dataset.choiceSearch||e.target.dataset.noDirty)return;const panel=e.target.closest('.tab-content');if(!panel||panel.classList.contains('hidden'))return;const tab=panel.id.replace('tab-','');if(['cases','stats','rolemenus'].includes(tab))return;if(tab==='overview'&&!e.target.hasAttribute('data-track-overview'))return;markDashboardDirty(tab);});
    document.addEventListener('change',e=>{if(e.target.dataset.choiceSearch||e.target.dataset.noDirty)return;const panel=e.target.closest('.tab-content');if(!panel||panel.classList.contains('hidden'))return;const tab=panel.id.replace('tab-','');if(['cases','stats','rolemenus'].includes(tab))return;if(tab==='overview'&&!e.target.hasAttribute('data-track-overview'))return;markDashboardDirty(tab);});
    async function postVerificationPanel(){if(!(await saveVerification()))return;dirtyDashboardTabs.delete('verification');refreshDashboardSnapshot('verification');updateSaveIsland();const r=await api('/api/servers/'+currentServerId+'/verification-panel/post',{method:'POST'});if(!r.ok){showStatus(r.data.error||'Could not post the verification panel.',true);return;}showStatus('Verification panel posted.');}
    async function publishTicketPanel(panelId){
      if(!(await saveTickets()))return;
      dirtyDashboardTabs.delete('tickets');refreshDashboardSnapshot('tickets');updateSaveIsland();
      const r=await api('/api/servers/'+currentServerId+'/ticket-panels/'+encodeURIComponent(panelId)+'/post',{method:'POST'});
      if(!r.ok){showStatus(r.data.error||'Could not post this panel.',true);return;}
      const p=ticketPanelsData.find(x=>x.id===panelId);if(p)p.messageId=r.data.messageId;renderTicketPanels();showStatus('Ticket panel posted in the selected channel.');loadLiveStats();
    }
    async function loadLiveStats(loadedData=null){
      if(!currentServerId)return;let d=loadedData;if(!d){const r=await api('/api/servers/'+currentServerId+'/stats');if(!r.ok)return;d=r.data;}
      const put=(id,v)=>{const e=$(id);if(e)e.textContent=v==null?'?':Number(v).toLocaleString();};
      put('liveMembers',d.members);put('liveHumans',d.humans);put('liveBots',d.bots);put('liveVoice',d.voiceCount);put('liveChannels',d.channels);put('liveRoles',d.roles);put('liveCases',d.cases);put('liveWarnings',d.warnings);put('liveRanked',d.rankedMembers);put('liveBirthday',d.birthdays);put('liveVerify',d.pendingVerifications);put('liveOpenTickets',d.openTickets);put('liveTickets',d.ticketPanels);
      put('statMembers',d.members);put('statTickets',d.openTickets);put('statCases',d.cases);put('statRanked',d.rankedMembers);put('overviewVoice',d.voiceCount);put('overviewChannels',d.channels);put('overviewRoles',d.roles);put('overviewWarnings',d.warnings);
      for(const [id,on,label]of [['overviewOnline',d.botOnline,'Online'],['overviewShield',d.shieldEnabled,'On'],['overviewTicketPanel',d.ticketPanelEnabled,'On'],['overviewVerification',d.verificationEnabled,'On'],['overviewLevels',d.levelsEnabled,'On'],['overviewAntiLink',d.antiLinkEnabled,'On'],['overviewHoneypot',d.honeypotEnabled,'On'],['overviewWelcome',d.welcomeEnabled,'On'],['overviewAutomod',d.automodEnabled,'On']]){const e=$(id);if(e){e.className='pill '+(on?'on':'off');e.textContent=on?label:'Off';}}
      const groups=new Map();for(const u of d.voiceUsers||[]){if(!groups.has(u.channelName))groups.set(u.channelName,[]);groups.get(u.channelName).push(u.username);}
      for(const id of ['voicePresence','statsVoiceList']){const box=$(id);if(!box)continue;box.innerHTML='';if(!groups.size){const p=document.createElement('p');p.className='hint';p.textContent='Nobody is in voice right now.';box.append(p);continue;}for(const [name,users]of groups){const card=document.createElement('section');card.className='voice-channel';const title=document.createElement('h4');title.textContent='Voice · '+name;const line=document.createElement('div');line.className='voice-names';users.forEach(n=>{const tag=document.createElement('span');tag.className='voice-name';tag.textContent=n;line.append(tag);});card.append(title,line);box.append(card);}}
    }
    const selectServerOriginal=selectServer;
    selectServer=async function(id,name,avatar){
      const loadId=++serverLoadSequence;
      $('serverOpening').classList.remove('hidden');
      try{
        const profilePromise=api('/api/servers/'+id+'/bot-profile').catch(()=>({ok:false,data:{}}));
        await selectServerOriginal(id,name,avatar);
        if(loadId!==serverLoadSequence||String(currentServerId)!==String(id)||!selectedServerConfig)return;
        const cfg=selectedServerConfig,profile=await profilePromise,p=profile.data||{};
        currentBotAvatar=p.avatar||'/ruby-logo.png';
        $('lookName').value=p.name||cfg.botName||'Ruby';$('lookAvatar').value='';
        currentIdentity={name:$('lookName').value,avatar:currentBotAvatar};
        safeImg($('pvLogo'),currentBotAvatar,'Ruby');$('pvName').textContent=$('lookName').value;applyIdentity();
        loadModerationControls(cfg);loadVerificationControls(cfg.verification||{});
        fillSelect('verifAddRole',roleCache,'Not set',r=>r.name);fillSelect('verifRemoveRole',roleCache,'Not set',r=>r.name);
        $('verifAddRole').value=cfg.verification?.addRoleId||'';$('verifRemoveRole').value=cfg.verification?.removeRoleId||'';
        $('honeyChannel').value=cfg.honeypot?.channelId||'';$('honeyAction').value=cfg.honeypot?.action||'ban';
        $('lbOptions').classList.toggle('off-state',!$('lbEnabled').checked);
        safeImg($('overviewServerIcon'),avatar,name);
        $('publicListingEnabled').checked=!!cfg.publicListing?.enabled;
        $('publicListingInvite').value=cfg.publicListing?.inviteUrl||'';
      dirtyDashboardTabs.clear();updateSaveIsland();captureDashboardSnapshots();
      }catch(error){
        if(loadId===serverLoadSequence){const notice=$('serverOpenError');notice.textContent=error?.message||'Could not open this workspace. Please try again.';notice.classList.remove('hidden');}
      }finally{
        if(loadId===serverLoadSequence)$('serverOpening').classList.add('hidden');
      }
    };
    const switchTabOriginal=switchTab;
    let syncWorkspaceNavigation=()=>{};
    switchTab=function(tab,el){switchTabOriginal(tab,el);syncWorkspaceNavigation(tab);if(tab==='overview'||tab==='stats'||tab==='voice')loadLiveStats();};
    $('lookName').addEventListener('input',previewLook);
    $('lookColor').addEventListener('input',previewLook);
    $('antiLinkEnabled').addEventListener('change',syncAntiLinkOptions);
    $('lbEnabled').addEventListener('change',()=> $('lbOptions').classList.toggle('off-state',!$('lbEnabled').checked));
    const lbToggle=document.querySelector('#lbEnabled'); if(lbToggle)lbToggle.addEventListener('change',()=>markDashboardDirty('leaderboard'));
    const lbOptionsObserver=new MutationObserver(()=>{});

    // Turn the old nested menu into a two-level native-feeling workspace switcher.
    function mountWorkspaceNavigation(){
      const old=document.querySelector('#dashboardCard .sidebar');if(!old)return;
      const groups=[...old.querySelectorAll('.nav-category')].map((details,index)=>({
        title:details.querySelector('.nav-category-title')?.childNodes?.[0]?.textContent?.trim()||`Section ${index+1}`,
        links:[...details.querySelectorAll('.nav-link')]
      }));
      const nav=document.createElement('nav');nav.className='workspace-navigation';nav.setAttribute('aria-label','Dashboard pages');
      const categoryRow=document.createElement('div');categoryRow.className='workspace-category-row';categoryRow.setAttribute('role','tablist');
      const pageRow=document.createElement('div');pageRow.className='workspace-page-row';pageRow.setAttribute('aria-label','Pages in this section');
      const groupForTab=new Map();let selectedGroup=0;
      const sectionIcon=title=>/workspace/i.test(title)?'workspace':/safety/i.test(title)?'shield':/tools/i.test(title)?'tools':/community/i.test(title)?'community':'activity';
      groups.forEach((group,index)=>{
        group.button=document.createElement('button');group.button.type='button';group.button.className='workspace-category-button';group.button.setAttribute('role','tab');
        group.button.innerHTML=`<span class="workspace-category-icon">${dashboardIcon(sectionIcon(group.title))}</span><span>${esc(group.title)}</span>`;
        group.links.forEach(link=>{
          const tab=link.getAttribute('onclick')?.match(/switchTab\('([^']+)'/)?.[1];
          if(tab){groupForTab.set(tab,index);const mark=document.createElement('span');mark.className='workspace-page-icon';mark.innerHTML=dashboardIcon(PAGE_ICONS[tab]||'list');link.prepend(mark);}
        });
        group.button.onclick=()=>showGroup(index,true);categoryRow.append(group.button);
      });
      const communityButton=document.createElement('button');communityButton.type='button';communityButton.className='workspace-back';communityButton.textContent='All communities';communityButton.onclick=()=>backToServers();categoryRow.append(communityButton);
      nav.append(categoryRow,pageRow);old.replaceWith(nav);
      function showGroup(index,selectFirst){
        selectedGroup=index;const group=groups[index];if(!group)return;
        groups.forEach((item,i)=>{item.button.classList.toggle('active',i===index);item.button.setAttribute('aria-selected',i===index?'true':'false');});
        pageRow.replaceChildren(...group.links);group.links.forEach(link=>link.classList.remove('active'));
        if(selectFirst&&group.links[0])group.links[0].click();
      }
      syncWorkspaceNavigation=(tab)=>{
        const index=groupForTab.get(tab);if(index===undefined)return;
        if(index!==selectedGroup)showGroup(index,false);
        groups.forEach((group,i)=>group.button.classList.toggle('active',i===index));
        for(const group of groups)for(const link of group.links)link.classList.toggle('active',link.getAttribute('onclick')?.includes(`'${tab}'`)||false);
      };
      showGroup(0,false);syncWorkspaceNavigation('overview');
    }

    decorateDashboardHeadings();
    mountWorkspaceNavigation();
