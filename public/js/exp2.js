// Experiment 2 — Interactive event cards: filters + expand/collapse.
(function () {
  'use strict';

  const SAMPLE = [
    { id: 1, title: 'Applied AI & ML Workshop',        cat: 'workshop',  date: '2026-05-12', place: 'Lab 402',         blurb: 'Predictive modeling and neural network fundamentals.',         details: 'Bring your laptop with Python 3.11 installed. Dataset will be provided. Seats: 60.' },
    { id: 2, title: 'Modern Web Dev Bootcamp',         cat: 'bootcamp',  date: '2026-05-18', place: 'Main Auditorium', blurb: 'Three immersive days on React, Tailwind, and tooling.',       details: 'Prior JS experience recommended. Daily 9 AM – 5 PM. Seats: 120.' },
    { id: 3, title: 'Smart Campus IoT Challenge',      cat: 'hackathon', date: '2026-06-05', place: 'Innovation Hub',  blurb: 'Build connected devices for campus sustainability.',          details: 'Team size: 2–4. Hardware kits provided. ₹25k prize pool.' },
    { id: 4, title: 'Startup Pitch Clinic',            cat: 'seminar',   date: '2026-06-14', place: 'Seminar Hall B',  blurb: 'Refine your pitch with real VC feedback.',                    details: 'Submit your 2-minute pitch video ahead of time. Limited to 20 founders.' },
    { id: 5, title: 'Cloud & DevOps Masterclass',      cat: 'workshop',  date: '2026-06-22', place: 'Lab 305',         blurb: 'Hands-on with AWS, Docker, and CI/CD.',                       details: 'Requires an AWS free-tier account. Seats: 40.' },
    { id: 6, title: 'Design Systems Bootcamp',         cat: 'bootcamp',  date: '2026-07-03', place: 'Design Studio',   blurb: 'Tokens, components, and scalable UI foundations.',            details: 'Bring Figma. Level: intermediate. Seats: 30.' },
  ];

  const TAG_CLASS = { workshop: 'tag-blue', bootcamp: 'tag-red', hackathon: 'tag-neutral', seminar: 'tag-blue' };

  const grid = document.getElementById('exp2Cards');
  const filters = document.getElementById('exp2Filters');
  if (!grid || !filters) return;

  let active = 'all';

  function render() {
    const filtered = active === 'all' ? SAMPLE : SAMPLE.filter((e) => e.cat === active);
    if (!filtered.length) {
      grid.innerHTML = '<div class="empty-state">No events in this category.</div>';
      return;
    }
    grid.innerHTML = filtered.map((e) => `
      <article class="card event-card" data-id="${e.id}" tabindex="0" role="button" aria-expanded="false">
        <header>
          <span class="tag ${TAG_CLASS[e.cat]}">${e.cat}</span>
          <time datetime="${e.date}">${App.formatDate(e.date)}</time>
        </header>
        <h4>${App.escapeHtml(e.title)}</h4>
        <p>${App.escapeHtml(e.blurb)}</p>
        <div class="details">${App.escapeHtml(e.details)}</div>
        <footer>
          <span>${App.escapeHtml(e.place)}</span>
          <span class="muted" style="font-size:.75rem">Click to expand</span>
        </footer>
      </article>
    `).join('');

    grid.querySelectorAll('.event-card').forEach((card) => {
      const toggle = () => {
        const open = card.classList.toggle('is-expanded');
        card.setAttribute('aria-expanded', String(open));
      };
      card.addEventListener('click', toggle);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      });
    });
  }

  filters.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-chip');
    if (!btn) return;
    active = btn.dataset.filter;
    filters.querySelectorAll('.filter-chip').forEach((b) => b.classList.toggle('active', b === btn));
    render();
  });

  render();
})();
