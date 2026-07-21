// Mobile nav toggle
document.querySelectorAll('.nav-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const links = document.querySelector('.nav-links');
    const open = links.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
});

// Recipe accordion
document.querySelectorAll('.recipe-entry-head').forEach(head => {
  head.addEventListener('click', () => {
    const entry = head.closest('.recipe-entry');
    const isOpen = entry.classList.contains('open');
    const wasExpanded = head.getAttribute('aria-expanded') === 'true';
    entry.classList.toggle('open', !isOpen);
    head.setAttribute('aria-expanded', wasExpanded ? 'false' : 'true');
  });
});

// Ingredient checklist strike-through
document.querySelectorAll('.ingredients input[type="checkbox"]').forEach(cb => {
  cb.addEventListener('change', () => {
    cb.closest('li').classList.toggle('checked', cb.checked);
  });
});

// Recipe filter pills (front-end only demo filtering by data-tag)
const pills = document.querySelectorAll('.filter-pill');
if (pills.length) {
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const tag = pill.dataset.tag;
      document.querySelectorAll('.recipe-entry').forEach(entry => {
        const show = tag === 'all' || entry.dataset.tags.includes(tag);
        entry.style.display = show ? '' : 'none';
      });
    });
  });
}

// Newsletter form (static demo — no backend)
const newsletterForm = document.querySelector('.newsletter-form');
if (newsletterForm) {
  newsletterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const success = document.querySelector('.form-success');
    if (success) success.classList.add('show');
    newsletterForm.reset();
  });
}

