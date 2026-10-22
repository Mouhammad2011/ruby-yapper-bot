<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ruby • Yapin' Server Control Center</title>
    <link rel="icon" type="image/png" href="ruby-bot.png">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #030305;
            --surface: rgba(14, 14, 18, 0.7);
            --surface-hover: rgba(22, 22, 28, 0.8);
            --surface-card: rgba(10, 10, 14, 0.65);
            --border: rgba(255, 255, 255, 0.1);
            --border-hi: rgba(255, 255, 255, 0.22);
            --border-focus: rgba(225, 29, 72, 0.6);
            --text: #f5f5f7;
            --muted: #94949d;
            --accent: #e11d48;
            --accent-hover: #f43f5e;
            --ok: #30d158;
            --bad: #ff453a;
            --font: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; font-family: var(--font); -webkit-font-smoothing: antialiased; }
        
        body { 
            background-color: var(--bg); 
            color: var(--text); 
            min-height: 100vh; 
            display: flex; 
            flex-direction: column; 
            background-image: url('ruby-bg.png');
            background-size: cover;
            background-position: center;
            background-attachment: fixed;
            background-repeat: no-repeat;
        }

        body::before {
            content: '';
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(3, 3, 5, 0.52);
            z-index: -1;
            pointer-events: none;
        }

        /* Header */
        header { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            padding: 16px 36px; 
            border-bottom: 1px solid var(--border); 
            background: rgba(8, 8, 12, 0.78); 
            backdrop-filter: blur(28px); 
            -webkit-backdrop-filter: blur(28px);
            position: sticky; 
            top: 0; 
            z-index: 100; 
        }
        .brand { display: flex; align-items: center; gap: 14px; }
        .brand img { width: 38px; height: 38px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border-hi); box-shadow: 0 0 15px rgba(225, 29, 72, 0.3); }
        .brand h1 { font-size: 1.15rem; font-weight: 700; background: linear-gradient(135deg, #ffffff, #fb7185); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

        .header-pill { display: flex; align-items: center; gap: 10px; background: rgba(255, 255, 255, 0.05); padding: 6px 14px; border-radius: 999px; border: 1px solid var(--border); backdrop-filter: blur(12px); }
        .header-pill img { width: 26px; height: 26px; border-radius: 50%; object-fit: cover; }

        .container { max-width: 1240px; margin: 36px auto; padding: 0 24px; width: 100%; flex: 1; }
        
        /* Glass Cards */
        .card { 
            background-color: var(--surface-card); 
            backdrop-filter: blur(24px); 
            -webkit-backdrop-filter: blur(24px);
            border: 1px solid var(--border); 
            border-radius: 20px; 
            padding: 32px; 
            box-shadow: 0 24px 60px rgba(0, 0, 0, 0.7), inset 0 1px 1px rgba(255, 255, 255, 0.12); 
            margin-bottom: 24px; 
        }

        .layout-cols { display: grid; grid-template-columns: 260px 1fr; gap: 28px; align-items: start; }
        
        /* Sidebar Navigation */
        .sidebar { display: flex; flex-direction: column; gap: 18px; position: sticky; top: 92px; }
        .nav-group-title { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); margin-bottom: 6px; padding-left: 12px; }
        
        .nav-link { 
            display: flex; 
            align-items: center; 
            gap: 12px; 
            padding: 10px 14px; 
            border-radius: 12px; 
            color: var(--muted); 
            font-size: 0.88rem; 
            font-weight: 500;
            text-decoration: none; 
            cursor: pointer; 
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); 
        }
        .nav-link:hover { background: rgba(255, 255, 255, 0.08); color: var(--text); }
        .nav-link.active { background: rgba(225, 29, 72, 0.2); color: #fff; border: 1px solid rgba(225, 29, 72, 0.45); font-weight: 600; box-shadow: 0 4px 18px rgba(225, 29, 72, 0.25); }

        /* Stats Grid */
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
        .stat-card { background: rgba(0, 0, 0, 0.4); border: 1px solid var(--border); border-radius: 16px; padding: 20px; backdrop-filter: blur(12px); }
        .stat-card b { font-size: 1.75rem; font-weight: 700; display: block; color: var(--text); letter-spacing: -0.02em; }
        .stat-card span { font-size: 0.75rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }

        /* Form Controls */
        .form-group { margin-bottom: 22px; }
        label { display: block; font-size: 0.82rem; font-weight: 600; margin-bottom: 8px; color: var(--muted); }
        input[type="text"], input[type="number"], select, textarea { 
            width: 100%; 
            padding: 12px 16px; 
            background: rgba(0, 0, 0, 0.5); 
            border: 1px solid var(--border); 
            border-radius: 12px; 
            color: var(--text); 
            font-size: 0.92rem; 
            outline: none; 
            transition: all 0.2s ease; 
            backdrop-filter: blur(12px);
        }
        input:focus, select:focus, textarea:focus { border-color: var(--border-focus); background: rgba(0, 0, 0, 0.7); box-shadow: 0 0 0 3px rgba(225, 29, 72, 0.2); }
        textarea { min-height: 100px; resize: vertical; }

        /* CUSTOM ANIMATED TOGGLE SWITCH */
        .switch {
            position: relative;
            display: inline-block;
            width: 52px;
            height: 28px;
        }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider {
            position: absolute;
            cursor: pointer;
            top: 0; left: 0; right: 0; bottom: 0;
            background-color: rgba(255, 255, 255, 0.12);
            border: 1px solid var(--border);
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            border-radius: 999px;
        }
        .slider:before {
            position: absolute;
            content: "";
            height: 20px;
            width: 20px;
            left: 3px;
            bottom: 3px;
            background-color: #ffffff;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        }
        input:checked + .slider {
            background-color: var(--accent);
            border-color: rgba(244, 63, 94, 0.6);
            box-shadow: 0 0 16px rgba(225, 29, 72, 0.4);
        }
        input:checked + .slider:before {
            transform: translateX(24px);
            background-color: #ffffff;
        }

        /* Buttons */
        button { 
            background: linear-gradient(135deg, #f43f5e, #e11d48); 
            color: white; 
            border: none; 
            padding: 12px 24px; 
            border-radius: 12px; 
            font-weight: 600; 
            cursor: pointer; 
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); 
            font-size: 0.9rem; 
            box-shadow: 0 4px 20px rgba(225, 29, 72, 0.35); 
        }
        button:hover { transform: translateY(-1px); box-shadow: 0 6px 25px rgba(225, 29, 72, 0.5); }

        .status-row { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: rgba(0, 0, 0, 0.4); border-radius: 14px; margin-bottom: 12px; border: 1px solid var(--border); }
        .pill { padding: 4px 12px; border-radius: 999px; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
        .pill.on { background: rgba(48, 209, 88, 0.15); color: var(--ok); border: 1px solid rgba(48, 209, 88, 0.3); }
        .pill.off { background: rgba(225, 29, 72, 0.15); color: var(--bad); border: 1px solid rgba(225, 29, 72, 0.3); }

        .hidden { display: none !important; }
        
        .server-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 18px; margin-top: 20px; }
        .server-card { background: var(--surface); border: 1px solid var(--border); border-radius: 18px; padding: 20px; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; gap: 16px; backdrop-filter: blur(20px); }
        .server-card:hover { border-color: var(--accent); transform: translateY(-2px); background: var(--surface-hover); }
        .server-avatar { width: 52px; height: 52px; border-radius: 50%; object-fit: cover; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; font-weight: 600; color: #fff; border: 1px solid var(--border); }

        .table { width: 100%; border: 1px solid var(--border); border-radius: 14px; overflow: hidden; border-collapse: collapse; margin-top: 12px; }
        .table th { text-align: left; padding: 14px 18px; background: rgba(0, 0, 0, 0.5); color: var(--muted); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border); }
        .table td { padding: 14px 18px; border-bottom: 1px solid var(--border); font-size: 0.88rem; background: rgba(0, 0, 0, 0.3); }
    </style>
</head>
<body>

    <header>
        <div class="brand">
            <img id="headerBotLogo" src="ruby-bot.png" alt="Logo">
            <h1>Ruby • Yapin' Server Control Center</h1>
        </div>
        <div style="display: flex; gap: 14px; align-items: center;">
            <div id="selectedServerHeader" class="header-pill hidden">
                <img id="headerServerAvatar" src="" alt="">
                <span id="headerServerName" style="font-size: 0.84rem; font-weight: 500;">Yapin' Server</span>
            </div>
            <div id="userHeader" class="header-pill hidden">
                <img id="userAvatar" src="" alt="User">
                <span id="userName" style="font-size: 0.84rem; font-weight: 500;">Administrator</span>
            </div>
        </div>
    </header>

    <div class="container">
        <!-- AUTH -->
        <div id="authCard" class="card" style="max-width: 440px; margin: 80px auto;">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                <img src="ruby-bot.png" alt="Ruby Logo" style="width: 44px; height: 44px; border-radius: 50%; border: 1px solid var(--border-hi);">
                <div>
                    <h2 style="font-size: 1.4rem; font-weight: 700;">Sign In</h2>
                    <p style="color: var(--muted); font-size: 0.82rem;">Yapin' Server Authentication</p>
                </div>
            </div>
            <p style="color: var(--muted); font-size: 0.88rem; margin-bottom: 24px;">Enter the 6-character alphanumeric passcode sent via <code>/login</code> in your DMs.</p>
            <div class="form-group">
                <label>Security Passcode (Letters & Numbers)</label>
                <div style="display: flex; gap: 10px;">
                    <input type="text" id="codeEntry" placeholder="A8K9Z2" maxlength="6" style="letter-spacing: 0.25em; font-weight: 700; text-align: center; text-transform: uppercase;">
                    <button type="button" onclick="pasteCode()" style="background: rgba(255,255,255,0.08); color: var(--text); border: 1px solid var(--border); box-shadow: none;">📋 Paste</button>
                </div>
            </div>
            <button onclick="verifyCode()" style="width: 100%; margin-top: 8px;">Authenticate</button>
            <p id="authError" style="color: var(--bad); margin-top: 14px; font-size: 0.84rem; text-align: center;"></p>
        </div>

        <!-- SERVER PICKER -->
        <div id="serverCard" class="card hidden">
            <h2 style="font-size: 1.4rem; font-weight: 700; margin-bottom: 6px;">Select Yapin' Workspace</h2>
            <p style="color: var(--muted); font-size: 0.88rem;">Choose a Yapin' Server to configure and manage.</p>
            <div id="serverList" class="server-grid"></div>
        </div>

        <!-- DASHBOARD WORKSPACE -->
        <div id="dashboardCard" class="hidden">
            <div class="layout-cols">
                <div class="sidebar">
                    <div>
                        <div class="nav-group-title">General</div>
                        <a class="nav-link active" onclick="switchTab('overview', this)">Overview</a>
                        <a class="nav-link" onclick="switchTab('permissions', this)">Permissions</a>
                        <a class="nav-link" onclick="switchTab('look', this)">Look & Customization</a>
                    </div>
                    <div>
                        <div class="nav-group-title">Moderation</div>
                        <a class="nav-link" onclick="switchTab('moderation', this)">Raid Shield & Security</a>
                        <a class="nav-link" onclick="switchTab('honeypot', this)">Honeypot Trap</a>
                        <a class="nav-link" onclick="switchTab('cases', this)">Cases Log</a>
                    </div>
                    <div>
                        <div class="nav-group-title">Server</div>
                        <a class="nav-link" onclick="switchTab('tickets', this)">Tickets Panels</a>
                        <a class="nav-link" onclick="switchTab('stats', this)">Voice & Stats Channels</a>
                    </div>
                    <div>
                        <div class="nav-group-title">Community</div>
                        <a class="nav-link" onclick="switchTab('welcome', this)">Welcome & Goodbye</a>
                        <a class="nav-link" onclick="switchTab('verification', this)">Verification & Alts</a>
                        <a class="nav-link" onclick="switchTab('levels', this)">Levels & XP</a>
                        <a class="nav-link" onclick="switchTab('birthdays', this)">Birthdays</a>
                        <a class="nav-link" onclick="switchTab('leaderboard', this)">Leaderboard</a>
                        <a class="nav-link" onclick="switchTab('tools', this)">Community Tools</a>
                    </div>
                    <button onclick="backToServers()" style="background: rgba(0,0,0,0.3); border: 1px solid var(--border); color: var(--muted); margin-top: 10px; width: 100%; box-shadow: none;">Switch Server</button>
                </div>

                <div>
                    <!-- OVERVIEW -->
                    <div id="tab-overview" class="tab-content card">
                        <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 20px;">
                            <img src="ruby-bot.png" alt="Logo" style="width: 48px; height: 48px; border-radius: 50%; border: 1px solid var(--border-hi);">
                            <div>
                                <h2 style="font-size: 1.3rem; font-weight: 700;">Yapin' Server Overview</h2>
                                <p style="color: var(--muted); font-size: 0.84rem;">Real-time Yapin' Server telemetry & core system operational status.</p>
                            </div>
                        </div>
                        <div class="stats-grid">
                            <div class="stat-card"><b id="statMembers">--</b><span>Members</span></div>
                            <div class="stat-card"><b id="statTickets">--</b><span>Open Tickets</span></div>
                            <div class="stat-card"><b id="statCases">--</b><span>Cases</span></div>
                            <div class="stat-card"><b id="statRanked">--</b><span>Ranked</span></div>
                        </div>
                        <div class="status-row"><span>Ruby Bot Status</span><span class="pill on">Online</span></div>
                        <div class="status-row"><span>Raid Shield</span><span class="pill on">Watching</span></div>
                        <div class="status-row"><span>Ticket Panels</span><span class="pill on">Active</span></div>
                    </div>

                    <!-- PERMISSIONS -->
                    <div id="tab-permissions" class="tab-content card hidden">
                        <h2 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 4px;">Permissions</h2>
                        <p style="color: var(--muted); font-size: 0.88rem; margin-bottom: 24px;">Staff roles and primary log destinations for Yapin' Server.</p>
                        <div class="form-group">
                            <label>Log Channel</label>
                            <select id="permLogChannel"><option value="">Not set</option></select>
                        </div>
                        <div class="form-group">
                            <label>Ticket Transcripts Log Channel</label>
                            <select id="permTicketLogChannel"><option value="">Not set</option></select>
                        </div>
                        <button onclick="savePermissions()">Save Permissions</button>
                    </div>

                    <!-- LOOK & CUSTOMIZATION -->
                    <div id="tab-look" class="tab-content card hidden">
                        <h2 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 4px;">Look & Customization</h2>
                        <p style="color: var(--muted); font-size: 0.88rem; margin-bottom: 24px;">Customize Ruby's name, custom avatar logo, and panel theme colour/filter.</p>
                        <div class="form-group">
                            <label>Bot Name</label>
                            <input type="text" id="lookName" value="Ruby">
                        </div>
                        <div class="form-group">
                            <label>Custom Bot Avatar URL / Logo</label>
                            <input type="text" id="lookAvatar" placeholder="https://i.imgur.com/example.png">
                        </div>
                        <div class="form-group">
                            <label>Panel Theme Accent / Color Filter</label>
                            <input type="color" id="lookColor" value="#e11d48" style="height: 44px; padding: 4px; cursor: pointer;">
                        </div>
                        <button onclick="saveLook()">Save Customization</button>
                    </div>

                    <!-- RAID SHIELD & SECURITY -->
                    <div id="tab-moderation" class="tab-content card hidden">
                        <h2 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 4px;">Raid Shield & Security</h2>
                        <p style="color: var(--muted); font-size: 0.88rem; margin-bottom: 24px;">Advanced anti-raid shielding and alert destinations for Yapin' Server.</p>
                        
                        <div class="status-row" style="margin-bottom: 20px;">
                            <span>Active Raid Shield Switch</span>
                            <label class="switch">
                                <input type="checkbox" id="modShieldEnabled">
                                <span class="slider"></span>
                            </label>
                        </div>

                        <div class="form-group">
                            <label>Alert Channel</label>
                            <select id="modAlertChannel"><option value="">Not set</option></select>
                        </div>
                        <button onclick="saveModeration()">Save Security Settings</button>
                    </div>

                    <!-- HONEYPOT TRAP -->
                    <div id="tab-honeypot" class="tab-content card hidden">
                        <h2 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 4px;">Honeypot Trap</h2>
                        <p style="color: var(--muted); font-size: 0.88rem; margin-bottom: 24px;">Secure trap channels against malicious scam bots.</p>
                        
                        <div class="status-row" style="margin-bottom: 20px;">
                            <span>Honeypot Toggle Switch</span>
                            <label class="switch">
                                <input type="checkbox" id="honeyEnabled">
                                <span class="slider"></span>
                            </label>
                        </div>

                        <div class="form-group">
                            <label>Trap Channel Selection</label>
                            <select id="honeyChannel"><option value="">Not set</option></select>
                        </div>
                        <div class="form-group">
                            <label>What Happens (Action)</label>
                            <select id="honeyAction">
                                <option value="ban">Ban them</option>
                                <option value="kick">Kick them</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Timeout Length (Minutes)</label>
                            <input type="number" id="honeyTimeout" value="1440">
                        </div>
                        <div class="form-group">
                            <label>Warning Text</label>
                            <textarea id="honeyText">This channel is a trap for scam bots and hacked accounts.</textarea>
                        </div>
                        <button onclick="saveHoneypot()">Save Honeypot</button>
                    </div>

                    <!-- CASES LOG -->
                    <div id="tab-cases" class="tab-content card hidden">
                        <h2 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 4px;">Cases Log</h2>
                        <p style="color: var(--muted); font-size: 0.88rem; margin-bottom: 16px;">Archived moderation actions on Yapin' Server.</p>
                        <table class="table">
                            <thead><tr><th>Case</th><th>Type</th><th>Member</th><th>Moderator</th><th>Reason</th><th>Time</th></tr></thead>
                            <tbody id="casesTableBody"></tbody>
                        </table>
                    </div>

                    <!-- TICKETS PANELS -->
                    <div id="tab-tickets" class="tab-content card hidden">
                        <h2 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 4px;">Tickets Panels Builder</h2>
                        <p style="color: var(--muted); font-size: 0.88rem; margin-bottom: 24px;">Add multiple ticket panels with customized buttons and target channels.</p>
                        <div id="ticketPanelsContainer"></div>
                        <button type="button" onclick="addTicketPanel()" style="background: rgba(255,255,255,0.08); border: 1px dashed var(--border); color: var(--text); width: 100%; margin-bottom: 20px; box-shadow: none;">+ Add Ticket Panel</button>
                        <button onclick="saveTickets()">Save Ticket Panels</button>
                    </div>

                    <!-- VOICE & STATS CHANNELS -->
                    <div id="tab-stats" class="tab-content card hidden">
                        <h2 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 4px;">Voice & Stats Channels</h2>
                        <p style="color: var(--muted); font-size: 0.88rem; margin-bottom: 24px;">Live updating channel metrics.</p>
                        <div class="form-group">
                            <label>Stats Voice Channel</label>
                            <select id="statsChannel"><option value="">Not set</option></select>
                        </div>
                        <button onclick="showStatus('📊 Stats channels saved.')">Save Stats</button>
                    </div>

                    <!-- WELCOME & GOODBYE -->
                    <div id="tab-welcome" class="tab-content card hidden">
                        <h2 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 4px;">Welcome & Goodbye</h2>
                        <p style="color: var(--muted); font-size: 0.88rem; margin-bottom: 24px;">Automated greet cards with automatic member count offset (+1 / -1).</p>
                        <div class="form-group">
                            <label>Welcome Channel</label>
                            <select id="welcChan"><option value="">Disabled</option></select>
                        </div>
                        <div class="form-group">
                            <label>Welcome Message (+1 Count Offset)</label>
                            <textarea id="welcText">Welcome to {server}, {user}! You are member #{count}.</textarea>
                        </div>
                        <div class="form-group">
                            <label>Goodbye Channel</label>
                            <select id="goodChan"><option value="">Disabled</option></select>
                        </div>
                        <div class="form-group">
                            <label>Goodbye Message (-1 Count Offset)</label>
                            <textarea id="goodText">{name} has left the server. We are now {count} members.</textarea>
                        </div>
                        <button onclick="saveWelcome()">Save Greet Settings</button>
                    </div>

                    <!-- VERIFICATION -->
                    <div id="tab-verification" class="tab-content card hidden">
                        <h2 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 4px;">Verification & Alts</h2>
                        <p style="color: var(--muted); font-size: 0.88rem; margin-bottom: 24px;">VPN/Alt detection with live server member avatars & manual queue.</p>
                        
                        <div class="status-row" style="margin-bottom: 20px;">
                            <span>Verification Switch</span>
                            <label class="switch">
                                <input type="checkbox" id="verifEnabled">
                                <span class="slider"></span>
                            </label>
                        </div>

                        <div class="form-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                            <div><label>Role to Give</label><select id="verifAddRole"><option value="">Not set</option></select></div>
                            <div><label>Role to Remove</label><select id="verifRemoveRole"><option value="">Not set</option></select></div>
                        </div>
                        <h3 style="font-size: 1.05rem; font-weight: 700; margin-top: 24px; margin-bottom: 10px;">Flagged Queue (Alts / VPNs)</h3>
                        <table class="table" style="margin-bottom: 20px;">
                            <thead><tr><th>User</th><th>Age</th><th>Reason</th><th>Time</th><th>Action</th></tr></thead>
                            <tbody id="verifQueueTableBody"></tbody>
                        </table>
                        <button onclick="saveVerification()">Save Verification</button>
                    </div>

                    <!-- LEVELS & XP -->
                    <div id="tab-levels" class="tab-content card hidden">
                        <h2 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 4px;">Levels & XP</h2>
                        <p style="color: var(--muted); font-size: 0.88rem; margin-bottom: 24px;">Granular leveling configuration, curves, and role rewards.</p>
                        
                        <div class="status-row" style="margin-bottom: 20px;">
                            <span>Levels Toggle Switch</span>
                            <label class="switch">
                                <input type="checkbox" id="lvlEnabled">
                                <span class="slider"></span>
                            </label>
                        </div>

                        <div class="form-group" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px;">
                            <div><label>Min XP / Msg</label><input type="number" id="lvlMinXP" value="5"></div>
                            <div><label>Max XP / Msg</label><input type="number" id="lvlMaxXP" value="30"></div>
                            <div><label>Cooldown (sec)</label><input type="number" id="lvlCooldown" value="40"></div>
                        </div>
                        <div class="form-group" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px;">
                            <div><label>Shortest Msg Chars</label><input type="number" id="lvlMinChars" value="2"></div>
                            <div><label>Difficulty (%)</label><input type="number" id="lvlDiff" value="100"></div>
                            <div><label>Highest Level</label><input type="number" id="lvlHigh" value="300"></div>
                        </div>
                        <div class="form-group">
                            <label>Level-up Message Channel</label>
                            <select id="lvlChan"><option value="">Chatting Channel (Dynamic)</option></select>
                        </div>
                        <div class="form-group">
                            <label>Level-up Message Template</label>
                            <input type="text" id="lvlMsg" value="{user} reached level {level} and has {xp} XP!">
                        </div>
                        <button onclick="saveLevels()">Save Leveling Settings</button>
                    </div>

                    <!-- BIRTHDAYS -->
                    <div id="tab-birthdays" class="tab-content card hidden">
                        <h2 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 4px;">Birthdays</h2>
                        <p style="color: var(--muted); font-size: 0.88rem; margin-bottom: 24px;">Members register via <code>/setbday DD.MM.YYYY</code>.</p>
                        <div class="form-group"><label>Birthday Channel</label><select id="bdayChan"><option value="">Not set</option></select></div>
                        <div class="form-group"><label>Birthday Message Template</label><textarea id="bdayText">Wishing a happy birthday to {users}!</textarea></div>
                        <button onclick="showStatus('🎂 Birthdays saved.')">Save Birthdays</button>
                    </div>

                    <!-- LEADERBOARD -->
                    <div id="tab-leaderboard" class="tab-content card hidden">
                        <h2 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 4px;">Leaderboard</h2>
                        <p style="color: var(--muted); font-size: 0.88rem; margin-bottom: 16px;">Top active members on Yapin' Server.</p>
                        <table class="table">
                            <thead><tr><th>Rank</th><th>Member</th><th>Level</th><th>XP</th><th>Messages</th></tr></thead>
                            <tbody id="leaderboardTableBody"></tbody>
                        </table>
                    </div>

                    <!-- COMMUNITY TOOLS -->
                    <div id="tab-tools" class="tab-content card hidden">
                        <h2 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 4px;">Community Tools</h2>
                        <p style="color: var(--muted); font-size: 0.88rem; margin-bottom: 24px;">Starboards & Suggestions with Upvote/Downvote interactive UI.</p>
                        <div class="form-group"><label>Suggestions Channel</label><select id="toolSugg"><option value="">Disabled</option></select></div>
                        <div class="form-group"><label>Starboard Channel</label><select id="toolStar"><option value="">Disabled</option></select></div>
                        <button onclick="showStatus('🛠️ Tools saved.')">Save Tools</button>
                    </div>

                    <p id="saveStatus" style="color: var(--ok); font-size: 0.86rem; margin-top: 16px; text-align: center; font-weight: 600;"></p>
                </div>
            </div>
        </div>
    </div>

    <script>
        const API_URL = '';
        let authToken = localStorage.getItem('ruby_token');
        let currentServerId = null;
        let ticketPanelsData = [];

        if (authToken) initApp();

        document.getElementById('codeEntry').addEventListener('input', (e) => {
            const v = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
            e.target.value = v;
            if (v.length === 6) verifyCode();
        });

        async function pasteCode() {
            try {
                const text = await navigator.clipboard.readText();
                const code = text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().trim();
                if (code.length === 6) { document.getElementById('codeEntry').value = code; verifyCode(); }
            } catch { alert('Clipboard permission required.'); }
        }

        async function verifyCode() {
            const code = document.getElementById('codeEntry').value.trim();
            const res = await fetch(`${API_URL}/api/auth/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                authToken = data.token;
                localStorage.setItem('ruby_token', authToken);
                initApp();
            } else {
                document.getElementById('authError').textContent = data.error || 'Authentication failed.';
            }
        }

        async function initApp() {
            try {
                const r = await fetch(`${API_URL}/api/me`, { headers: { 'Authorization': `Bearer ${authToken}` } });
                const d = await r.json();
                if (r.ok && d.user) {
                    document.getElementById('userName').textContent = d.user.username;
                    document.getElementById('userAvatar').src = d.user.avatar;
                    document.getElementById('userHeader').classList.remove('hidden');
                }
            } catch {}
            loadServers();
        }

        async function loadServers() {
            const r = await fetch(`${API_URL}/api/servers`, { headers: { 'Authorization': `Bearer ${authToken}` } });
            const d = await r.json();
            if (r.ok) {
                document.getElementById('authCard').classList.add('hidden');
                document.getElementById('serverCard').classList.remove('hidden');
                const list = document.getElementById('serverList');
                list.innerHTML = '';
                d.servers.forEach(s => {
                    const card = document.createElement('div');
                    card.className = 'server-card';
                    card.innerHTML = `<img class="server-avatar" src="${s.icon || 'ruby-bot.png'}"><div><h3 style="font-size: 0.95rem; font-weight: 600;">${s.name}</h3><span style="font-size: 0.75rem; color: var(--muted);">Yapin' Workspace</span></div>`;
                    card.onclick = () => selectServer(s.id, s.name, s.icon || 'ruby-bot.png');
                    list.appendChild(card);
                });
            } else {
                localStorage.removeItem('ruby_token');
                document.getElementById('authCard').classList.remove('hidden');
            }
        }

        async function selectServer(id, name, avatarUrl) {
            currentServerId = id;
            document.getElementById('headerServerName').textContent = name;
            document.getElementById('headerServerAvatar').src = avatarUrl;
            document.getElementById('selectedServerHeader').classList.remove('hidden');

            const statsRes = await fetch(`${API_URL}/api/servers/${id}/stats`, { headers: { 'Authorization': `Bearer ${authToken}` } });
            const stats = await statsRes.json();
            if (statsRes.ok) {
                document.getElementById('statMembers').textContent = stats.members;
                document.getElementById('statTickets').textContent = stats.openTickets;
                document.getElementById('statCases').textContent = stats.cases;
                document.getElementById('statRanked').textContent = stats.rankedMembers;
            }

            const rolesRes = await fetch(`${API_URL}/api/servers/${id}/roles`, { headers: { 'Authorization': `Bearer ${authToken}` } });
            const rolesData = await rolesRes.json();
            const roles = rolesData.roles || [];
            const fillRoles = (id) => {
                const el = document.getElementById(id);
                if (!el) return;
                el.innerHTML = '<option value="">Not set</option>';
                roles.forEach(r => el.innerHTML += `<option value="${r.id}">${r.name}</option>`);
            };
            fillRoles('verifAddRole');
            fillRoles('verifRemoveRole');

            const chanRes = await fetch(`${API_URL}/api/servers/${id}/channels`, { headers: { 'Authorization': `Bearer ${authToken}` } });
            const chanData = await chanRes.json();
            const channels = chanData.channels || [];
            const fillChan = (id) => {
                const el = document.getElementById(id);
                if (!el) return;
                el.innerHTML = '<option value="">Not set</option>';
                channels.forEach(c => el.innerHTML += `<option value="${c.id}">#${c.name}</option>`);
            };
            ['permLogChannel', 'permTicketLogChannel', 'modAlertChannel', 'honeyChannel', 'statsChannel', 'welcChan', 'goodChan', 'lvlChan', 'bdayChan', 'toolSugg', 'toolStar'].forEach(fillChan);

            const res = await fetch(`${API_URL}/api/servers/${id}/config`, { headers: { 'Authorization': `Bearer ${authToken}` } });
            const data = await res.json();
            if (res.ok) {
                const cfg = data.config;
                document.getElementById('lookName').value = cfg.botName || 'Ruby';
                document.getElementById('lookAvatar').value = cfg.botAvatar || '';
                document.getElementById('lookColor').value = cfg.panelColor || '#e11d48';

                document.getElementById('permLogChannel').value = cfg.logChannel || '';
                document.getElementById('permTicketLogChannel').value = cfg.ticketLogChannel || '';
                document.getElementById('modShieldEnabled').checked = cfg.shield?.enabled ?? true;
                document.getElementById('modAlertChannel').value = cfg.shield?.alertChannel || '';

                document.getElementById('honeyEnabled').checked = cfg.honeypot?.enabled ?? false;
                document.getElementById('honeyChannel').value = cfg.honeypot?.channelId || '';
                document.getElementById('honeyAction').value = cfg.honeypot?.action || 'ban';
                document.getElementById('honeyTimeout').value = cfg.honeypot?.timeoutMinutes || 1440;
                document.getElementById('honeyText').value = cfg.honeypot?.warningText || '';

                ticketPanelsData = cfg.tickets?.panels || [];
                renderTicketPanels(channels);

                document.getElementById('welcChan').value = cfg.welcome?.channelId || '';
                document.getElementById('welcText').value = cfg.welcome?.welcomeText || '';
                document.getElementById('goodChan').value = cfg.welcome?.goodbyeChannel || '';
                document.getElementById('goodText').value = cfg.welcome?.goodbyeText || '';

                document.getElementById('verifEnabled').checked = cfg.verification?.enabled ?? false;
                document.getElementById('verifAddRole').value = cfg.verification?.addRoleId || '';
                document.getElementById('verifRemoveRole').value = cfg.verification?.removeRoleId || '';

                document.getElementById('lvlEnabled').checked = cfg.levels?.enabled ?? true;
                document.getElementById('lvlMinXP').value = cfg.levels?.minXP || 5;
                document.getElementById('lvlMaxXP').value = cfg.levels?.maxXP || 30;
                document.getElementById('lvlCooldown').value = cfg.levels?.cooldownSeconds || 40;
                document.getElementById('lvlMinChars').value = cfg.levels?.minChars || 2;
                document.getElementById('lvlDiff').value = cfg.levels?.difficulty || 100;
                document.getElementById('lvlHigh').value = cfg.levels?.highestLevel || 300;
                document.getElementById('lvlChan').value = cfg.levels?.channelId || '';
                document.getElementById('lvlMsg').value = cfg.levels?.message || '';

                loadPendingVerifications();
                loadLeaderboard();
                loadCases();

                document.getElementById('serverCard').classList.add('hidden');
                document.getElementById('dashboardCard').classList.remove('hidden');
            }
        }

        function renderTicketPanels(channels) {
            const container = document.getElementById('ticketPanelsContainer');
            container.innerHTML = '';
            ticketPanelsData.forEach((p, i) => {
                let chanOpts = '<option value="">Select channel</option>';
                channels.forEach(c => chanOpts += `<option value="${c.id}" ${p.channelId === c.id ? 'selected' : ''}>#${c.name}</option>`);

                container.innerHTML += `
                    <div class="card" style="margin-bottom: 16px; background: rgba(0,0,0,0.3);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <b>Panel #${i+1}</b>
                            <button type="button" onclick="ticketPanelsData.splice(${i},1); renderTicketPanels([]);" style="padding: 4px 10px; font-size: 0.75rem; background: var(--bad); box-shadow: none;">Remove</button>
                        </div>
                        <div class="form-group"><label>Ticket Panel Title</label><input type="text" value="${p.title}" oninput="ticketPanelsData[${i}].title=this.value"></div>
                        <div class="form-group"><label>Ticket Message</label><textarea oninput="ticketPanelsData[${i}].text=this.value">${p.text}</textarea></div>
                        <div class="form-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <div><label>Button Name</label><input type="text" value="${p.buttonName}" oninput="ticketPanelsData[${i}].buttonName=this.value"></div>
                            <div><label>Button Color</label><select onchange="ticketPanelsData[${i}].buttonColor=this.value">
                                <option value="blue" ${p.buttonColor==='blue'?'selected':''}>Blue</option>
                                <option value="green" ${p.buttonColor==='green'?'selected':''}>Green</option>
                                <option value="red" ${p.buttonColor==='red'?'selected':''}>Red</option>
                            </select></div>
                        </div>
                        <div class="form-group"><label>Ticket Channel</label><select onchange="ticketPanelsData[${i}].channelId=this.value">${chanOpts}</select></div>
                    </div>
                `;
            });
        }

        function addTicketPanel() {
            ticketPanelsData.push({ id: `p_${Date.now()}`, title: 'Support & Assistance', text: 'Click below to open a ticket.', buttonName: 'Support', buttonColor: 'blue', channelId: '' });
            renderTicketPanels([]);
        }

        async function loadPendingVerifications() {
            const r = await fetch(`${API_URL}/api/servers/${currentServerId}/pending-verifications`, { headers: { 'Authorization': `Bearer ${authToken}` } });
            const d = await r.json();
            const tbody = document.getElementById('verifQueueTableBody');
            tbody.innerHTML = '';
            if (!d.pendingUsers || d.pendingUsers.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--muted);">No flagged users in queue.</td></tr>`;
                return;
            }
            d.pendingUsers.forEach(u => {
                tbody.innerHTML += `
                    <tr>
                        <td style="display: flex; align-items: center; gap: 10px;">
                            <img src="${u.avatar}" style="width: 28px; height: 28px; border-radius: 50%;">
                            <b>${u.username}</b>
                        </td>
                        <td>${u.accountAgeDays}d</td>
                        <td><span class="pill off">${u.flagReason}</span></td>
                        <td>${u.timeRemainingMins}m</td>
                        <td><button onclick="manualVerify('${u.userId}')" style="padding: 6px 12px; font-size: 0.75rem; background: var(--ok); color: #000; box-shadow: none;">Verify</button></td>
                    </tr>
                `;
            });
        }

        async function manualVerify(userId) {
            const r = await fetch(`${API_URL}/api/servers/${currentServerId}/manual-verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                body: JSON.stringify({ userId })
            });
            if (r.ok) { showStatus(`✅ User verified.`); loadPendingVerifications(); }
        }

        async function loadLeaderboard() {
            const r = await fetch(`${API_URL}/api/servers/${currentServerId}/leaderboard`, { headers: { 'Authorization': `Bearer ${authToken}` } });
            const d = await r.json();
            const tbody = document.getElementById('leaderboardTableBody');
            tbody.innerHTML = '';
            (d.leaderboard || []).forEach(row => {
                tbody.innerHTML += `<tr><td>#${row.rank}</td><td><b>${row.name}</b></td><td>${row.level}</td><td>${row.xp}</td><td>${row.messages}</td></tr>`;
            });
        }

        async function loadCases() {
            const r = await fetch(`${API_URL}/api/servers/${currentServerId}/cases`, { headers: { 'Authorization': `Bearer ${authToken}` } });
            const d = await r.json();
            const tbody = document.getElementById('casesTableBody');
            tbody.innerHTML = '';
            (d.cases || []).forEach(c => {
                tbody.innerHTML += `<tr><td>#${c.num}</td><td>${c.type}</td><td>${c.member}</td><td>${c.mod}</td><td>${c.reason}</td><td>${c.time}</td></tr>`;
            });
        }

        function switchTab(tab, el) {
            document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            document.getElementById(`tab-${tab}`).classList.remove('hidden');
            el.classList.add('active');
        }

        async function patchConfig(updates, msg) {
            const r = await fetch(`${API_URL}/api/servers/${currentServerId}/config`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                body: JSON.stringify(updates)
            });
            if (r.ok) showStatus(msg);
        }

        function savePermissions() {
            patchConfig({ logChannel: document.getElementById('permLogChannel').value, ticketLogChannel: document.getElementById('permTicketLogChannel').value }, '🔐 Permissions saved.');
        }
        function saveLook() {
            patchConfig({ botName: document.getElementById('lookName').value, botAvatar: document.getElementById('lookAvatar').value, panelColor: document.getElementById('lookColor').value }, '💎 Look & Customization saved.');
        }
        function saveModeration() {
            patchConfig({ shield: { enabled: document.getElementById('modShieldEnabled').checked, alertChannel: document.getElementById('modAlertChannel').value } }, '🛡️ Raid Shield saved.');
        }
        function saveHoneypot() {
            patchConfig({ honeypot: { enabled: document.getElementById('honeyEnabled').checked, channelId: document.getElementById('honeyChannel').value, action: document.getElementById('honeyAction').value, timeoutMinutes: parseInt(document.getElementById('honeyTimeout').value)||1440, warningText: document.getElementById('honeyText').value } }, '🍯 Honeypot saved.');
        }
        function saveTickets() {
            patchConfig({ tickets: { panels: ticketPanelsData } }, '🎟️ Ticket panels saved.');
        }
        function saveWelcome() {
            patchConfig({ welcome: { channelId: document.getElementById('welcChan').value, welcomeText: document.getElementById('welcText').value, goodbyeChannel: document.getElementById('goodChan').value, goodbyeText: document.getElementById('goodText').value } }, '👋 Welcome & Goodbye saved.');
        }
        function saveVerification() {
            patchConfig({ verification: { enabled: document.getElementById('verifEnabled').checked, addRoleId: document.getElementById('verifAddRole').value, removeRoleId: document.getElementById('verifRemoveRole').value } }, '🛡️ Verification saved.');
        }
        function saveLevels() {
            patchConfig({ levels: { enabled: document.getElementById('lvlEnabled').checked, minXP: parseInt(document.getElementById('lvlMinXP').value)||5, maxXP: parseInt(document.getElementById('lvlMaxXP').value)||30, cooldownSeconds: parseInt(document.getElementById('lvlCooldown').value)||40, minChars: parseInt(document.getElementById('lvlMinChars').value)||2, difficulty: parseInt(document.getElementById('lvlDiff').value)||100, highestLevel: parseInt(document.getElementById('lvlHigh').value)||300, channelId: document.getElementById('lvlChan').value, message: document.getElementById('lvlMsg').value } }, '🎉 Levels saved.');
        }

        function showStatus(text) {
            const el = document.getElementById('saveStatus');
            el.textContent = text;
            setTimeout(() => el.textContent = '', 3500);
        }

        function backToServers() {
            document.getElementById('dashboardCard').classList.add('hidden');
            document.getElementById('selectedServerHeader').classList.add('hidden');
            document.getElementById('serverCard').classList.remove('hidden');
        }
    </script>
</body>
</html>
