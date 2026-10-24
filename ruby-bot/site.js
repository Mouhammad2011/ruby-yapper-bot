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

    const copy = document.createElement('span');
    copy.className = 'directory-server-copy';
    const title = document.createElement('strong');
    title.textContent = name;
    const action = document.createElement('span');
    action.className = 'directory-server-action';
    action.innerHTML = 'Open invite <span aria-hidden="true">↗</span>';
    copy.append(title, action);
    const arrow = document.createElement('span');
    arrow.className = 'directory-server-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '↗';
    card.append(avatar, copy, arrow);
    return card;
  }

  async function loadFeaturedCommunities() {
    const track = document.getElementById('featuredCommunities');
    if (!track) return;
    try {
      const response = await fetch('/api/public/communities', { headers: { Accept: 'application/json' }, cache: 'no-store' });
      if (!response.ok) throw new Error('Directory unavailable');
      const data = await response.json();
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

  loadFeaturedCommunities();
})();