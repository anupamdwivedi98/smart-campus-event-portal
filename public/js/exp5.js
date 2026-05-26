// Experiment 5 — Admin registrations dashboard (reads /api/registrations).
(function () {
  'use strict';

  const gate    = document.getElementById('exp5AuthGate');
  const content = document.getElementById('exp5Content');
  const tbody   = document.querySelector('#exp5Table tbody');
  const search  = document.getElementById('exp5Search');
  const refresh = document.getElementById('exp5Refresh');
  if (!gate) return;

  let cache = [];

  function renderRows(rows) {
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text-muted)">No registrations yet.</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map((r) => `
      <tr>
        <td>#${r.id}</td>
        <td>${App.escapeHtml(r.full_name)}${r.student_id ? `<br><small class="muted">${App.escapeHtml(r.student_id)}</small>` : ''}</td>
        <td>${App.escapeHtml(r.email)}</td>
        <td>${App.escapeHtml(r.event_title)}<br><small class="muted">${App.escapeHtml(r.category || '')}</small></td>
        <td>${App.formatDate(r.event_date)}</td>
        <td><span class="badge ${r.status}">${r.status}</span></td>
        <td>${App.formatDate(r.created_at)}</td>
      </tr>`).join('');
  }

  function applyFilter() {
    const q = search.value.trim().toLowerCase();
    if (!q) return renderRows(cache);
    renderRows(cache.filter((r) =>
      (r.full_name || '').toLowerCase().includes(q) ||
      (r.email     || '').toLowerCase().includes(q) ||
      (r.event_title || '').toLowerCase().includes(q)
    ));
  }

  async function load() {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px"><span class="spinner"></span> Loading…</td></tr>';
    try {
      const { registrations } = await App.api('/api/registrations');
      cache = registrations;
      applyFilter();
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--error)">Could not load — ${App.escapeHtml(err.message)}</td></tr>`;
    }
  }

  function updateGate() {
    const isAdmin = App.user && App.user.role === 'admin';
    gate.hidden = isAdmin;
    content.hidden = !isAdmin;
  }

  search.addEventListener('input', applyFilter);
  refresh.addEventListener('click', load);

  App.onAuthChange(updateGate);

  document.addEventListener('tabchange', (e) => {
    if (e.detail.tab !== 'exp5') return;
    updateGate();
    if (App.user && App.user.role === 'admin') load();
  });
  updateGate();
})();
