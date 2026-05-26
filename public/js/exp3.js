// Experiment 3 — real-time client-side form validation + localStorage draft.
(function () {
  'use strict';

  const form   = document.getElementById('exp3Form');
  const submit = document.getElementById('f3Submit');
  const reset  = document.getElementById('f3Reset');
  const status = document.getElementById('f3Status');
  const eventSelect = document.getElementById('f3Event');
  if (!form) return;

  const STORAGE_KEY = 'iilm.exp3.draft';
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PHONE_RE = /^[+\d][\d\s\-()]{6,20}$/;

  // Populate event options from API (AJAX also showcases /api/events)
  async function loadEvents() {
    try {
      const { events } = await App.api('/api/events');
      eventSelect.innerHTML = '<option value="" disabled selected>Choose an event</option>' +
        events.map((e) => `<option value="${e.id}">${App.escapeHtml(e.title)}</option>`).join('');
      // Restore saved selection if valid
      const draft = loadDraft();
      if (draft && draft.eventId) eventSelect.value = draft.eventId;
    } catch (_) {
      eventSelect.innerHTML = '<option value="" disabled selected>Events unavailable — start the server</option>';
    }
  }

  function validators() {
    return {
      fullName:  (v) => !v || v.trim().length < 2 ? 'Name must be at least 2 characters' : '',
      email:     (v) => !EMAIL_RE.test(v || '') ? 'Enter a valid email' : '',
      phone:     (v) => !PHONE_RE.test((v || '').trim()) ? 'Enter a valid phone number' : '',
      eventId:   (v) => !v ? 'Choose an event' : '',
      date:      (v) => {
        if (!v) return 'Pick a date';
        const d = new Date(v);
        if (isNaN(d.getTime())) return 'Invalid date';
        if (d < new Date(new Date().toDateString())) return 'Date must be today or later';
        return '';
      },
      terms:     (checked) => !checked ? 'You must agree to the code of conduct' : '',
    };
  }

  function getValues() {
    const fd = new FormData(form);
    return {
      fullName: fd.get('fullName') || '',
      email:    fd.get('email') || '',
      phone:    fd.get('phone') || '',
      eventId:  fd.get('eventId') || '',
      date:     fd.get('date') || '',
      terms:    form.elements.terms.checked,
    };
  }

  function validate() {
    const v = getValues();
    const checks = validators();
    const errors = {};
    Object.entries(checks).forEach(([key, fn]) => {
      const msg = fn(v[key]);
      if (msg) errors[key] = msg;
    });
    return { values: v, errors };
  }

  function paintErrors(errors, { onlyTouched = true, touched = {} } = {}) {
    const map = {
      fullName: 'f3Name',
      email:    'f3Email',
      phone:    'f3Phone',
      eventId:  'f3Event',
      date:     'f3Date',
      terms:    'f3Terms',
    };
    Object.entries(map).forEach(([key, id]) => {
      const input = document.getElementById(id);
      const row = input?.closest('.form-row') || input?.closest('.checkbox-row')?.parentElement;
      const err = document.querySelector(`.error[data-for="${id}"]`);
      const show = errors[key] && (!onlyTouched || touched[key]);
      if (row) row.classList.toggle('invalid', !!show);
      if (err) err.textContent = show ? errors[key] : '';
    });
  }

  const touched = {};
  ['fullName', 'email', 'phone', 'eventId', 'date', 'terms'].forEach((k) => (touched[k] = false));

  function onInput(e) {
    const name = e.target.name;
    if (!name) return;
    touched[name] = true;
    saveDraft();
    const { errors } = validate();
    paintErrors(errors, { touched });
    submit.disabled = Object.keys(errors).length > 0;
  }
  form.addEventListener('input', onInput);
  form.addEventListener('change', onInput);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    // Mark everything touched to reveal all errors
    Object.keys(touched).forEach((k) => (touched[k] = true));
    const { values, errors } = validate();
    paintErrors(errors, { touched });
    if (Object.keys(errors).length) {
      status.className = 'form-status error';
      status.textContent = 'Please fix the highlighted fields.';
      submit.disabled = true;
      return;
    }
    status.className = 'form-status success';
    status.textContent = '✓ All fields valid. (Submission is demo-only on this panel — use Experiment 4 to post live.)';
    console.log('[Exp 3] Validated form payload:', values);
  });

  reset.addEventListener('click', () => {
    form.reset();
    localStorage.removeItem(STORAGE_KEY);
    Object.keys(touched).forEach((k) => (touched[k] = false));
    paintErrors({}, { touched });
    submit.disabled = true;
    status.className = 'form-status';
    status.textContent = 'Draft cleared.';
  });

  // Draft persistence
  function saveDraft() {
    const v = getValues();
    delete v.terms;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
  }
  function loadDraft() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { return null; }
  }
  function restoreDraft() {
    const draft = loadDraft();
    if (!draft) return;
    if (draft.fullName) form.fullName.value = draft.fullName;
    if (draft.email)    form.email.value    = draft.email;
    if (draft.phone)    form.phone.value    = draft.phone;
    if (draft.date)     form.date.value     = draft.date;
  }

  loadEvents().then(restoreDraft);
})();
