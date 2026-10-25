(() => {
  const dashboardLinks = [...document.querySelectorAll('[data-dashboard-link]')];
  const token = localStorage.getItem('ruby_token');

  const setDashboardState = (signedIn) => {
    for (const link of dashboardLinks) {
      link.href = signedIn ? '/dashboard' : '/login';
      link.innerHTML = signedIn
        ? 'Go to dashboard <span aria-hidden="true">↗</span>'
        : 'Log in <span aria-hidden="true">↗</span>';
      link.setAttribute('aria-label', signedIn ? 'Go to the Ruby Dashboard' : 'Log in to the Ruby Dashboard');
    }
  };

  setDashboardState(false);
  if (token) {
    fetch('/api/session', { headers: { Authorization: 'Bearer ' + token } })
      .then((response) => setDashboardState(response.ok))
      .catch(() => setDashboardState(false));
  }

  function initials(name) {
    return String(name || 'Community').trim().split(/\s+/).slice(0, 2).map((part) => part[0] || '').join('').toUpperCase() || 'C';
  }

  function makeCommunityCard(community) {
    const name = String(community.name || 'Community');
    let invite;
    try {
      invite = new URL(community.inviteUrl);
      if (invite.protocol !== 'https:' || !['yapper.website', 'www.yapper.website'].includes(invite.hostname.toLowerCase()) || !/^\/invite\/[^/]+\/?$/i.test(invite.pathname)) return null;
    } catch {
      return null;
    }

    const card = document.createElement('a');
    card.className = 'directory-server';
    card.href = invite.href;
    card.target = '_blank';
    card.rel = 'noopener noreferrer';
    card.setAttribute('aria-label', 'Join ' + name + ' on Yapper (opens in a new tab)');

    const avatar = document.createElement('span');
    avatar.className = 'directory-avatar';
    avatar.setAttribute('aria-hidden', 'true');
    const fallback = document.createElement('span');
    fallback.className = 'directory-avatar-fallback';
    fallback.textContent = initials(name);
    if (community.icon) {
      const image = document.createElement('img');
      image.src = community.icon;
      image.alt = '';
      image.loading = 'lazy';
      image.decoding = 'async';
      image.referrerPolicy = 'no-referrer';
      image.onerror = () => image.replaceWith(fallback);
      avatar.append(image);
    } else {
      avatar.append(fallback);
    }

    const title = document.createElement('strong');
    title.className = 'directory-server-name';
    title.textContent = name;
    card.append(avatar, title);
    return card;
  }

  function setupCommandGuide() {
    const catalog = document.getElementById('commandCatalog');
    const filterBar = document.getElementById('commandFilters');
    const search = document.getElementById('commandSearch');
    if (!catalog || !filterBar || !search) return;
    let groups = [];
    let commands = [];
    let activeGroup = 'all';

    function renderFilters() {
      filterBar.replaceChildren();
      const options = [{ id: 'all', label: 'All commands' }, ...groups];
      for (const option of options) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'command-filter';
        button.textContent = option.label;
        button.setAttribute('aria-pressed', String(activeGroup === option.id));
        button.addEventListener('click', () => { activeGroup = option.id; renderFilters(); renderCommands(); });
        filterBar.append(button);
      }
    }

    function renderCommands() {
      const query = search.value.trim().toLowerCase();
      catalog.replaceChildren();
      const sections = groups.filter(group => activeGroup === 'all' || group.id === activeGroup).map(group => {
        const entries = commands.filter(command => command.group === group.id &&
          (!query || `${command.label} ${command.description}`.toLowerCase().includes(query)));
        return { group, entries };
      }).filter(section => section.entries.length);

      if (!sections.length) {
        const empty = document.createElement('p');
        empty.className = 'command-guide-message';
        empty.textContent = query ? 'No commands match that search.' : 'There are no commands in this section yet.';
        catalog.append(empty);
        return;
      }

      for (const { group, entries } of sections) {
        const section = document.createElement('section');
        section.className = 'command-group';
        const heading = document.createElement('h3');
        heading.textContent = group.label;
        const list = document.createElement('div');
        list.className = 'command-group-list';
        for (const command of entries) {
          const row = document.createElement('article');
          row.className = 'command-entry';
          const syntax = document.createElement('code');
          syntax.textContent = command.label;
          const description = document.createElement('p');
          description.textContent = command.description;
          row.append(syntax, description);
          list.append(row);
        }
        section.append(heading, list);
        catalog.append(section);
      }
    }

    search.addEventListener('input', renderCommands);
    fetch('/api/public/commands', { headers: { Accept: 'application/json' }, cache: 'no-store' })
      .then(response => { if (!response.ok) throw new Error('Command list unavailable'); return response.json(); })
      .then(data => {
        groups = Array.isArray(data.groups) ? data.groups : [];
        commands = Array.isArray(data.commands) ? data.commands : [];
        renderFilters();
        renderCommands();
      })
      .catch(() => {
        const message = document.createElement('p');
        message.className = 'command-guide-message';
        message.textContent = 'The command list is temporarily unavailable.';
        catalog.replaceChildren(message);
      });
  }

  async function loadFeaturedCommunities() {
    const track = document.getElementById('featuredCommunities');
    if (!track) return;
    try {
      const response = await fetch('/api/public/communities', { headers: { Accept: 'application/json' }, cache: 'no-store' });
      if (!response.ok) throw new Error('Directory unavailable');
      const data = await response.json();
      const serverCountStat = document.getElementById('serverCountStat');
      const serverCount = document.getElementById('serverCount');
      const serverCountLabel = document.getElementById('serverCountLabel');
      if (serverCountStat && serverCount && Number.isSafeInteger(data.serverCount) && data.serverCount >= 0) {
        serverCount.textContent = new Intl.NumberFormat().format(data.serverCount);
        if (serverCountLabel) serverCountLabel.textContent = data.serverCount === 1 ? 'server with Ruby' : 'servers with Ruby';
        serverCountStat.hidden = false;
      }
      const communities = Array.isArray(data.communities) ? data.communities : [];
      const cards = communities.map(makeCommunityCard).filter(Boolean);
      track.replaceChildren();

      if (!cards.length) {
        const empty = document.createElement('p');
        empty.className = 'directory-empty';
        empty.textContent = 'No communities are featured yet. Check back soon.';
        track.append(empty);
        return;
      }

      const group = document.createElement('div');
      group.className = 'directory-group';
      group.append(...cards);
      track.append(group);

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (cards.length >= 4 && !prefersReducedMotion) {
        const duplicate = group.cloneNode(true);
        duplicate.setAttribute('aria-hidden', 'true');
        duplicate.inert = true;
        track.append(duplicate);
        track.classList.add('is-rolling');
        track.style.setProperty('--roll-duration', Math.max(32, cards.length * 8) + 's');
      }
    } catch {
      const message = document.createElement('p');
      message.className = 'directory-empty';
      message.textContent = 'The community directory is temporarily unavailable.';
      track.replaceChildren(message);
    }
  }

  setupCommandGuide();
  loadFeaturedCommunities();

  const revealTargets = [...document.querySelectorAll('[data-reveal]')];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const target = entry.target;
        target.classList.add('scroll-entered');
        let cleanupTimer;
        const finishMotion = (event) => {
          if (event && event.target !== target) return;
          target.classList.remove('scroll-entered');
          clearTimeout(cleanupTimer);
          target.removeEventListener('animationend', finishMotion);
        };
        target.addEventListener('animationend', finishMotion);
        cleanupTimer = setTimeout(() => finishMotion(), 1400);
        observer.unobserve(entry.target);
      }
    }, { threshold: 0, rootMargin: '0px 0px 8% 0px' });

    revealTargets.forEach((element, index) => {
      element.style.setProperty('--scroll-delay', `${(index % 4) * 55}ms`);
      revealObserver.observe(element);
    });
  }
})();
