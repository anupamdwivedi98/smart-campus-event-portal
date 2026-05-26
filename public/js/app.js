// =====================================================================
// Core shell: tabs, auth state, modal, toast, and shared helpers (App.*)
// =====================================================================
(function () {
  'use strict';

  const App = (window.App = {
    user: null,
    _listeners: new Set(),
    onAuthChange(fn) { this._listeners.add(fn); },
    _emitAuth() { this._listeners.forEach((fn) => { try { fn(this.user); } catch (_) {} }); },
  });

  // ---------- API wrapper ----------
  App.api = async function api(path, { method = 'GET', body, headers } = {}) {
    const opts = {
      method,
      credentials: 'same-origin',
      headers: { 'Accept': 'application/json', ...(headers || {}) },
    };
    if (body !== undefined) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    const res = await fetch(path, opts);
    let data = null;
    try { data = await res.json(); } catch (_) { /* non-json response */ }
    if (!res.ok) {
      const err = new Error((data && data.error) || `Request failed (${res.status})`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  };

  // ---------- Toast ----------
  const toastEl = document.getElementById('toast');
  let toastTimer = null;
  App.toast = function toast(msg, kind = '') {
    if (!toastEl) return;
    toastEl.className = 'toast' + (kind ? ' ' + kind : '');
    toastEl.textContent = msg;
    toastEl.hidden = false;
    requestAnimationFrame(() => toastEl.classList.add('show'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('show');
      setTimeout(() => { toastEl.hidden = true; }, 250);
    }, 2800);
  };

  // ---------- Tabs / routing ----------
  const tabButtons = document.querySelectorAll('[data-tab]');
  const panels = document.querySelectorAll('.panel');
  const TAB_IDS = ['home', 'exp1', 'exp2', 'exp3', 'exp4', 'exp5', 'exp6', 'exp7', 'mydash'];

  App.switchTab = function switchTab(tab) {
    if (!TAB_IDS.includes(tab)) tab = 'home';
    panels.forEach((p) => {
      const active = p.id === `panel-${tab}`;
      p.classList.toggle('active', active);
      p.hidden = !active;
    });
    // Update tab bar + nav link highlighting
    document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('.nav-link').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    // Fire a tabchange event so modules can react (lazy-load data)
    document.dispatchEvent(new CustomEvent('tabchange', { detail: { tab } }));
    // Update URL hash (no jump)
    if (location.hash.replace('#', '') !== tab) {
      history.replaceState(null, '', '#' + tab);
    }
    // Close mobile nav if open
    document.querySelector('.main-nav')?.classList.remove('open');
    document.getElementById('navToggle')?.setAttribute('aria-expanded', 'false');
    // Scroll to top of main on tab change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const tab = btn.dataset.tab;
      if (!tab) return;
      if (btn.dataset.auth === 'required' && !App.user) {
        App.openAuth('login');
        App.toast('Please login first.');
        return;
      }
      e.preventDefault();
      App.switchTab(tab);
    });
  });

  // Mobile nav toggle
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.querySelector('.main-nav');
  navToggle?.addEventListener('click', () => {
    const open = mainNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(open));
  });

  // ---------- Progress Bento (Home) ----------
  const PROGRESS = [
    ['Exp 01', 'Semantic HTML & Layout',          'Foundation homepage built with semantic tags + CSS Grid.', 100],
    ['Exp 02', 'Interactive Event Cards',         'Filter by category and expand card details without reloads.', 100],
    ['Exp 03', 'Form Validation',                 'Real-time validation with inline errors and draft saving.', 100],
    ['Exp 04', 'Multi-step Registration Wizard',  'Guided 3-step flow that posts live to the API.', 100],
    ['Exp 05', 'Registration Dashboard',          'Admin view over registrations, served from MySQL.', 100],
    ['Exp 06', 'Admin Event CRUD API',            'Create, read, update, delete events via Express + MySQL.', 100],
    ['Exp 07', 'AJAX Event Listing',              'Live search with debounce and graceful loading states.', 100],
  ];
  const progressGrid = document.getElementById('progressGrid');
  if (progressGrid) {
    progressGrid.innerHTML = PROGRESS.map(([num, title, desc, pct], i) => `
      <article class="progress-card" data-go="exp${i + 1}">
        <span class="num">${num}</span>
        <h4>${title}</h4>
        <p>${desc}</p>
        <div class="bar"><span style="width:${pct}%"></span></div>
      </article>
    `).join('');
    progressGrid.querySelectorAll('[data-go]').forEach((el) =>
      el.addEventListener('click', () => App.switchTab(el.dataset.go))
    );
  }

  // ---------- Auth modal ----------
  const authModal = document.getElementById('authModal');
  const authClose = document.getElementById('authClose');
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const loginStatus = document.getElementById('loginStatus');
  const signupStatus = document.getElementById('signupStatus');
  const authTitle = document.getElementById('authTitle');

  App.openAuth = function openAuth(mode = 'login') {
    authModal.hidden = false;
    switchAuthMode(mode);
    setTimeout(() => document.getElementById(mode === 'signup' ? 'suName' : 'loginEmail')?.focus(), 50);
  };
  App.closeAuth = function closeAuth() {
    authModal.hidden = true;
    loginStatus.textContent = '';
    signupStatus.textContent = '';
    loginStatus.className = 'form-status';
    signupStatus.className = 'form-status';
    loginForm.reset();
    signupForm.reset();
  };

  function switchAuthMode(mode) {
    document.querySelectorAll('.modal-tab').forEach((t) => t.classList.toggle('active', t.dataset.mode === mode));
    loginForm.hidden = mode !== 'login';
    signupForm.hidden = mode !== 'signup';
    authTitle.textContent = mode === 'signup' ? 'Create account' : 'Login';
  }
  document.querySelectorAll('.modal-tab').forEach((t) =>
    t.addEventListener('click', () => switchAuthMode(t.dataset.mode))
  );

  authClose?.addEventListener('click', App.closeAuth);
  authModal?.addEventListener('click', (e) => { if (e.target === authModal) App.closeAuth(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !authModal.hidden) App.closeAuth(); });

  document.getElementById('btnLogin')?.addEventListener('click', () => App.openAuth('login'));
  document.getElementById('btnSignup')?.addEventListener('click', () => App.openAuth('signup'));

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(loginForm);
    loginStatus.className = 'form-status';
    loginStatus.textContent = 'Signing in…';
    try {
      const { user } = await App.api('/api/auth/login', {
        method: 'POST',
        body: { email: fd.get('email'), password: fd.get('password') },
      });
      App.user = user;
      App._emitAuth();
      renderAuthUI();
      App.closeAuth();
      App.toast(`Welcome back, ${user.fullName.split(' ')[0]}!`, 'success');
    } catch (err) {
      loginStatus.className = 'form-status error';
      loginStatus.textContent = err.message || 'Login failed';
    }
  });

  signupForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(signupForm);
    signupStatus.className = 'form-status';
    signupStatus.textContent = 'Creating account…';
    try {
      const { user } = await App.api('/api/auth/signup', {
        method: 'POST',
        body: {
          fullName: fd.get('fullName'),
          email: fd.get('email'),
          password: fd.get('password'),
          studentId: fd.get('studentId') || null,
          department: fd.get('department') || null,
        },
      });
      App.user = user;
      App._emitAuth();
      renderAuthUI();
      App.closeAuth();
      App.toast('Account created. You are now signed in.', 'success');
    } catch (err) {
      signupStatus.className = 'form-status error';
      signupStatus.textContent = err.message || 'Signup failed';
    }
  });

  // Logout
  document.getElementById('btnLogout')?.addEventListener('click', async () => {
    try { await App.api('/api/auth/logout', { method: 'POST' }); } catch (_) {}
    App.user = null;
    App._emitAuth();
    renderAuthUI();
    App.switchTab('home');
    App.toast('Signed out.');
  });

  // ---------- Header auth UI ----------
  function renderAuthUI() {
    const loggedIn = !!App.user;
    const isAdmin = loggedIn && App.user.role === 'admin';

    document.getElementById('btnLogin').hidden = loggedIn;
    document.getElementById('btnSignup').hidden = loggedIn;
    document.getElementById('btnLogout').hidden = !loggedIn;

    const userChip = document.querySelector('.auth-user');
    if (userChip) {
      userChip.hidden = !loggedIn;
      const nameEl = userChip.querySelector('.auth-user-name');
      if (nameEl) nameEl.textContent = loggedIn ? App.user.fullName.split(' ')[0] : '';
    }

    // Admin-only elements
    document.querySelectorAll('.admin-only').forEach((el) => { el.hidden = !isAdmin; });

    // Auth-required buttons disabled state (visual only — handler also checks)
    document.querySelectorAll('[data-auth="required"]').forEach((el) => {
      el.style.opacity = loggedIn ? '' : '.55';
    });
  }

  // ---------- My Dashboard ----------
  const mydashContent = document.getElementById('mydashContent');
  async function loadMyDashboard() {
    if (!App.user) {
      mydashContent.innerHTML = '<div class="empty-state">Login required.</div>';
      return;
    }
    mydashContent.innerHTML = '<div class="ajax-status"><span class="spinner"></span>Loading…</div>';
    try {
      const { registrations } = await App.api('/api/registrations/mine');
      if (!registrations.length) {
        mydashContent.innerHTML = `
          <div class="empty-state">
            <p>You haven't registered for any events yet.</p>
            <button class="btn btn-primary" data-go-tab="exp7">Browse events</button>
          </div>`;
        mydashContent.querySelector('[data-go-tab]')?.addEventListener('click', () => App.switchTab('exp7'));
        return;
      }
      mydashContent.innerHTML = `
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>Event</th><th>Category</th><th>Date</th><th>Location</th><th>Status</th><th></th></tr></thead>
            <tbody>${registrations.map((r) => `
              <tr data-id="${r.id}">
                <td><strong>${escapeHtml(r.title)}</strong></td>
                <td>${escapeHtml(r.category)}</td>
                <td>${formatDate(r.event_date)}</td>
                <td>${escapeHtml(r.location || '')}</td>
                <td><span class="badge ${r.status}">${r.status}</span></td>
                <td><button class="btn btn-sm btn-ghost" data-cancel="${r.id}">Cancel</button></td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
      mydashContent.querySelectorAll('[data-cancel]').forEach((btn) =>
        btn.addEventListener('click', async () => {
          if (!confirm('Cancel this registration?')) return;
          try {
            await App.api('/api/registrations/' + btn.dataset.cancel, { method: 'DELETE' });
            App.toast('Registration cancelled.');
            loadMyDashboard();
          } catch (err) {
            App.toast(err.message || 'Cancel failed', 'error');
          }
        })
      );
    } catch (err) {
      mydashContent.innerHTML = `<div class="empty-state">Could not load — ${escapeHtml(err.message)}</div>`;
    }
  }

  document.addEventListener('tabchange', (e) => {
    if (e.detail.tab === 'mydash') loadMyDashboard();
  });

  // ---------- Shared helpers ----------
  App.escapeHtml = escapeHtml;
  App.formatDate = formatDate;

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str).replace(/[&<>"']/g, (c) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }
  function formatDate(d) {
    if (!d) return '';
    try {
      const date = new Date(d);
      if (isNaN(date.getTime())) return d;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return d; }
  }

  // ---------- Boot ----------
  async function boot() {
    // Try to resume session
    try {
      const { user } = await App.api('/api/auth/me');
      App.user = user;
    } catch (_) {
      App.user = null;
    }
    App._emitAuth();
    renderAuthUI();

    // Respect URL hash
    const hash = location.hash.replace('#', '');
    App.switchTab(TAB_IDS.includes(hash) ? hash : 'home');
  }
  boot();

  // Also react to hash changes
  window.addEventListener('hashchange', () => {
    const hash = location.hash.replace('#', '');
    if (TAB_IDS.includes(hash)) App.switchTab(hash);
  });
})();
