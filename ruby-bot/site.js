(() => {
  const dashboardLinks = [...document.querySelectorAll('[data-dashboard-link]')];
  const token = localStorage.getItem('ruby_token');
  const setState = (signedIn) => {
    for (const link of dashboardLinks) {
      link.href = signedIn ? '/dashboard' : '/login';
      link.innerHTML = signedIn
        ? 'Go to dashboard <span aria-hidden="true">↗</span>'
        : 'Log in <span aria-hidden="true">↗</span>';
      link.setAttribute('aria-label', signedIn ? 'Go to the Ruby Dashboard' : 'Log in to the Ruby Dashboard');
    }
  };
  setState(false);
  if (!token) return;
  fetch('/api/session', { headers: { Authorization: 'Bearer ' + token } })
    .then((response) => setState(response.ok))
    .catch(() => setState(false));
})();