// Experiment 6 — Admin CRUD for events (uses /api/events).
(function () {
  'use strict';

  const gate    = document.getElementById('exp6AuthGate');
  const content = document.getElementById('exp6Content');
  const tbody   = document.querySelector('#exp6Table tbody');
  const btnNew  = document.getElementById('exp6New');
  const btnRef  = document.getElementById('exp6Refresh');
  const form    = document.getElementById('exp6Form');
  const formTitle = document.getElementById('exp6FormTitle');
  const btnCancel = document.getElementById('exp6Cancel');
  const status  = document.getElementById('exp6Status');
  if (!gate) return;

  function updateGate() {
    const isAdmin = App.user && App.user.role === 'admin';
    gate.hidden = isAdmin;
    content.hidden = !isAdmin;
  }

  async function load() {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px"><span class="spinner"></span> Loading…</td></tr>';
    try {
      const { events } = await App.api('/api/events');
      if (!events.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text-muted)">No events. Click "+ New event" to add one.</td></tr>';
        return;
      }
      tbody.innerHTML = events.map((e) => `
        <tr data-id="${e.id}">
          <td>#${e.id}</td>
          <td><strong>${App.escapeHtml(e.title)}</strong></td>
          <td>${App.escapeHtml(e.category)}</td>
          <td>${App.formatDate(e.event_date)}</td>
          <td>${App.escapeHtml(e.location)}</td>
          <td>${e.capacity}</td>
          <td class="table-actions">
            <button class="btn btn-sm btn-outline" data-edit="${e.id}">Edit</button>
            <button class="btn btn-sm btn-danger"  data-del="${e.id}">Delete</button>
          </td>
        </tr>`).join('');

      tbody.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => openEditor(b.dataset.edit)));
      tbody.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => del(b.dataset.del)));
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--error)">Could not load — ${App.escapeHtml(err.message)}</td></tr>`;
    }
  }

  function openEditor(id) {
    form.hidden = false;
    form.reset();
    status.textContent = '';
    status.className = 'form-status';
    if (!id) {
      formTitle.textContent = 'New event';
      form.elements.id.value = '';
      form.elements.capacity.value = 100;
      form.elements.category.value = 'workshop';
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    App.api('/api/events/' + id)
      .then(({ event }) => {
        formTitle.textContent = `Edit: ${event.title}`;
        form.elements.id.value         = event.id;
        form.elements.title.value      = event.title;
        form.elements.description.value= event.description;
        form.elements.category.value   = event.category;
        form.elements.event_date.value = event.event_date;
        form.elements.location.value   = event.location;
        form.elements.capacity.value   = event.capacity;
        form.elements.image_url.value  = event.image_url || '';
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      })
      .catch((err) => App.toast(err.message || 'Load failed', 'error'));
  }

  async function del(id) {
    if (!confirm('Delete this event? Registrations will be removed too.')) return;
    try {
      await App.api('/api/events/' + id, { method: 'DELETE' });
      App.toast('Event deleted.');
      load();
    } catch (err) {
      App.toast(err.message || 'Delete failed', 'error');
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const payload = {
      title:       fd.get('title'),
      description: fd.get('description'),
      category:    fd.get('category'),
      event_date:  fd.get('event_date'),
      location:    fd.get('location'),
      capacity:    Number(fd.get('capacity')),
      image_url:   fd.get('image_url') || null,
    };
    const id = fd.get('id');
    status.className = 'form-status';
    status.textContent = 'Saving…';
    try {
      if (id) await App.api('/api/events/' + id, { method: 'PUT',  body: payload });
      else    await App.api('/api/events',         { method: 'POST', body: payload });
      status.className = 'form-status success';
      status.textContent = '✓ Saved.';
      App.toast('Event saved.');
      form.hidden = true;
      load();
    } catch (err) {
      status.className = 'form-status error';
      status.textContent = err.message || 'Save failed';
    }
  });

  btnNew.addEventListener('click', () => openEditor(null));
  btnRef.addEventListener('click', load);
  btnCancel.addEventListener('click', () => { form.hidden = true; });

  App.onAuthChange(updateGate);
  document.addEventListener('tabchange', (e) => {
    if (e.detail.tab !== 'exp6') return;
    updateGate();
    if (App.user && App.user.role === 'admin') load();
  });
  updateGate();
})();
