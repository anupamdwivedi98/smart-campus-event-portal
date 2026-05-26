// Experiment 7 — AJAX event listing with debounced search + category filter.
(function () {
  'use strict';

  const cardsEl  = document.getElementById('exp7Cards');
  const statusEl = document.getElementById('exp7Status');
  const searchEl = document.getElementById('exp7Search');
  const filtersEl= document.getElementById('exp7Filters');
  if (!cardsEl) return;

  const TAG_CLASS = { workshop: 'tag-blue', bootcamp: 'tag-red', hackathon: 'tag-neutral', seminar: 'tag-blue' };

  let category = '';
  let query = '';
  let debounceTimer = null;
  let inflight = null;

  function renderSkeleton() {
    cardsEl.innerHTML = Array.from({ length: 3 }).map(() => `
      <article class="card event-card" aria-hidden="true" style="opacity:.55">
        <header><span class="tag">··</span><time>·· ··</time></header>
        <h4 style="background:var(--surface-2);color:transparent;border-radius:4px">Loading event name</h4>
        <p style="background:var(--surface-2);color:transparent;border-radius:4px">Loading description here.</p>
        <footer><span>··</span></footer>
      </article>`).join('');
  }

  function renderEvents(events) {
    if (!events.length) {
      cardsEl.innerHTML = '<div class="empty-state">No events match your filters.</div>';
      return;
    }
    cardsEl.innerHTML = events.map((e) => `
      <article class="card event-card" data-id="${e.id}">
        <header>
          <span class="tag ${TAG_CLASS[e.category] || ''}">${App.escapeHtml(e.category)}</span>
          <time datetime="${e.event_date}">${App.formatDate(e.event_date)}</time>
        </header>
        <h4>${App.escapeHtml(e.title)}</h4>
        <p>${App.escapeHtml(e.description)}</p>
        <footer>
          <span>${App.escapeHtml(e.location)}</span>
          <button class="btn btn-sm btn-outline" data-register="${e.id}">Register</button>
        </footer>
      </article>`).join('');

    cardsEl.querySelectorAll('[data-register]').forEach((btn) =>
      btn.addEventListener('click', async () => {
        if (!App.user) { App.openAuth('login'); App.toast('Please login to register.'); return; }
        try {
          await App.api('/api/registrations', { method: 'POST', body: { eventId: Number(btn.dataset.register) } });
          App.toast('Registered! See "My Dashboard".', 'success');
        } catch (err) {
          App.toast(err.message || 'Registration failed', 'error');
        }
      })
    );
  }

  async function load() {
    // Abort nothing — keep it simple; just ignore stale responses via an id.
    const ticket = ++loadTicket;
    const params = new URLSearchParams();
    if (query)    params.set('q', query);
    if (category) params.set('category', category);
    statusEl.innerHTML = '<span class="spinner"></span> Loading events…';
    renderSkeleton();
    try {
      const { events } = await App.api('/api/events' + (params.toString() ? `?${params}` : ''));
      if (ticket !== loadTicket) return; // a newer request has overtaken us
      statusEl.textContent = `${events.length} event${events.length === 1 ? '' : 's'} found.`;
      renderEvents(events);
    } catch (err) {
      if (ticket !== loadTicket) return;
      statusEl.innerHTML = `<span style="color:var(--error)">Could not load — ${App.escapeHtml(err.message)}</span>`;
      cardsEl.innerHTML = '';
    }
  }
  let loadTicket = 0;

  searchEl.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      query = e.target.value.trim();
      load();
    }, 280);
  });

  filtersEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-chip');
    if (!btn) return;
    category = btn.dataset.filter || '';
    filtersEl.querySelectorAll('.filter-chip').forEach((b) => b.classList.toggle('active', b === btn));
    load();
  });

  let loaded = false;
  document.addEventListener('tabchange', (e) => {
    if (e.detail.tab !== 'exp7') return;
    if (!loaded) { loaded = true; load(); }
  });
})();
