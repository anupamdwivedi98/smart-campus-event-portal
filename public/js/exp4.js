// Experiment 4 — Multi-step registration wizard.
// Steps: 1) personal details  2) event selection  3) review & submit
// Posts to POST /api/registrations (requires login). Drafts auto-save as JSON.
(function () {
  'use strict';

  const form    = document.getElementById('exp4Form');
  const prev    = document.getElementById('wPrev');
  const next    = document.getElementById('wNext');
  const submit  = document.getElementById('wSubmit');
  const status  = document.getElementById('wStatus');
  const review  = document.getElementById('w3Review');
  const authHint= document.getElementById('w3AuthHint');
  const eventSel= document.getElementById('w2Event');
  if (!form) return;

  const STORAGE_KEY = 'iilm.exp4.draft';
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PHONE_RE = /^[+\d][\d\s\-()]{6,20}$/;

  let step = 1;
  const TOTAL = 3;

  // --- Events for step 2 ---
  async function loadEvents() {
    try {
      const { events } = await App.api('/api/events');
      const saved = (loadDraft() || {}).eventId;
      eventSel.innerHTML =
        '<option value="" disabled ' + (saved ? '' : 'selected') + '>Pick an event</option>' +
        events.map((e) =>
          `<option value="${e.id}" ${String(e.id) === String(saved) ? 'selected' : ''}>${App.escapeHtml(e.title)} — ${App.formatDate(e.event_date)}</option>`
        ).join('');
    } catch (_) {
      eventSel.innerHTML = '<option value="" disabled selected>Events unavailable</option>';
    }
  }

  // --- Step navigation / validation per step ---
  function goToStep(n) {
    step = Math.max(1, Math.min(TOTAL, n));
    form.querySelectorAll('.wizard-step').forEach((s) => {
      const active = Number(s.dataset.step) === step;
      s.hidden = !active;
      s.classList.toggle('active', active);
    });
    form.querySelectorAll('.step').forEach((s) => {
      const n = Number(s.dataset.step);
      s.classList.toggle('active', n === step);
      s.classList.toggle('done', n < step);
    });
    prev.disabled = step === 1;
    next.hidden   = step === TOTAL;
    submit.hidden = step !== TOTAL;
    if (step === TOTAL) renderReview();
    authHint.hidden = !(step === TOTAL && !App.user);
    status.textContent = '';
    status.className = 'form-status';
  }

  function validateStep(n) {
    const v = getValues();
    const errors = {};
    if (n === 1) {
      if (!v.firstName || v.firstName.length < 2) errors.w1First = 'Enter first name';
      if (!v.lastName  || v.lastName.length < 2)  errors.w1Last  = 'Enter last name';
      if (!EMAIL_RE.test(v.email))                errors.w1Email = 'Enter a valid email';
      if (v.phone && !PHONE_RE.test(v.phone))     errors.w1Phone = 'Invalid phone';
    }
    if (n === 2) {
      if (!v.eventId) errors.w2Event = 'Choose an event';
    }
    return errors;
  }

  function getValues() {
    const fd = new FormData(form);
    return {
      firstName:  (fd.get('firstName')  || '').trim(),
      lastName:   (fd.get('lastName')   || '').trim(),
      email:      (fd.get('email')      || '').trim(),
      phone:      (fd.get('phone')      || '').trim(),
      department: fd.get('department')  || '',
      eventId:    fd.get('eventId')     || '',
      notes:      (fd.get('notes')      || '').trim(),
    };
  }

  function paintErrors(errs) {
    form.querySelectorAll('[data-for]').forEach((el) => { el.textContent = ''; });
    form.querySelectorAll('.form-row.invalid').forEach((el) => el.classList.remove('invalid'));
    Object.entries(errs).forEach(([id, msg]) => {
      const input = document.getElementById(id);
      const err = document.querySelector(`.error[data-for="${id}"]`);
      if (input) input.closest('.form-row')?.classList.add('invalid');
      if (err) err.textContent = msg;
    });
  }

  function renderReview() {
    const v = getValues();
    const selectedOpt = eventSel.options[eventSel.selectedIndex];
    review.innerHTML = `
      <dl>
        <dt>Name</dt><dd>${App.escapeHtml(`${v.firstName} ${v.lastName}`.trim())}</dd>
        <dt>Email</dt><dd>${App.escapeHtml(v.email)}</dd>
        <dt>Phone</dt><dd>${App.escapeHtml(v.phone) || '<span class="muted">—</span>'}</dd>
        <dt>Department</dt><dd>${App.escapeHtml(v.department) || '<span class="muted">—</span>'}</dd>
        <dt>Event</dt><dd>${App.escapeHtml(selectedOpt ? selectedOpt.text : '—')}</dd>
        <dt>Notes</dt><dd>${App.escapeHtml(v.notes) || '<span class="muted">—</span>'}</dd>
      </dl>`;
  }

  // --- Draft persistence ---
  function saveDraft() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(getValues()));
  }
  function loadDraft() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { return null; }
  }
  function restoreDraft() {
    const d = loadDraft();
    if (!d) return;
    Object.entries({
      w1First: d.firstName, w1Last: d.lastName, w1Email: d.email,
      w1Phone: d.phone, w1Dept: d.department, w2Notes: d.notes,
    }).forEach(([id, val]) => { if (val) { const el = document.getElementById(id); if (el) el.value = val; } });
  }

  form.addEventListener('input', saveDraft);
  form.addEventListener('change', saveDraft);

  prev.addEventListener('click', () => goToStep(step - 1));
  next.addEventListener('click', () => {
    const errs = validateStep(step);
    paintErrors(errs);
    if (Object.keys(errs).length) {
      status.className = 'form-status error';
      status.textContent = 'Please fix the highlighted fields.';
      return;
    }
    goToStep(step + 1);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (step !== TOTAL) return;
    if (!App.user) {
      App.openAuth('login');
      return;
    }
    const v = getValues();
    if (!v.eventId) {
      status.className = 'form-status error';
      status.textContent = 'Please pick an event.';
      goToStep(2);
      return;
    }
    submit.disabled = true;
    status.className = 'form-status';
    status.textContent = 'Submitting…';
    try {
      await App.api('/api/registrations', {
        method: 'POST',
        body: {
          eventId: Number(v.eventId),
          phone:   v.phone || null,
          notes:   v.notes || null,
        },
      });
      status.className = 'form-status success';
      status.textContent = '✓ Registration confirmed. Check "My Dashboard" for details.';
      App.toast('Registration confirmed!', 'success');
      localStorage.removeItem(STORAGE_KEY);
      form.reset();
      goToStep(1);
    } catch (err) {
      status.className = 'form-status error';
      status.textContent = err.message || 'Submission failed.';
    } finally {
      submit.disabled = false;
    }
  });

  // React to auth changes (to toggle the login hint on the review step)
  App.onAuthChange(() => { if (step === TOTAL) authHint.hidden = !!App.user; });

  // Lazy-load events the first time this tab becomes active
  let eventsLoaded = false;
  document.addEventListener('tabchange', (e) => {
    if (e.detail.tab === 'exp4' && !eventsLoaded) {
      eventsLoaded = true;
      loadEvents();
    }
  });

  restoreDraft();
  goToStep(1);
})();
