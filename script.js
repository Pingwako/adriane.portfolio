(function () {
  'use strict';

  const root = document.documentElement;
  root.classList.remove('no-js');

  /* ---------- Mobile menu ---------- */
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.getElementById('nav-menu');

  function setMenu(open) {
    if (!toggle || !menu) return;
    menu.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      setMenu(!menu.classList.contains('open'));
    });

    menu.addEventListener('click', (e) => {
      if (e.target.closest('a')) setMenu(false);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('open')) {
        setMenu(false);
        toggle.focus();
      }
    });

    document.addEventListener('click', (e) => {
      if (menu.classList.contains('open') &&
          !menu.contains(e.target) && !toggle.contains(e.target)) {
        setMenu(false);
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth >= 900) setMenu(false);
    });
  }

  /* ---------- Active nav highlighting ---------- */
  const navLinks = Array.from(document.querySelectorAll('.nav-menu a[href^="#"]'));
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    const activeObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((link) => {
            const match = link.getAttribute('href') === '#' + entry.target.id;
            link.classList.toggle('active', match);
            if (match) link.setAttribute('aria-current', 'true');
            else link.removeAttribute('aria-current');
          });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach((s) => activeObserver.observe(s));
  }

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('visible'));
  }

  /* ---------- Typing effect for hero subtitle ---------- */
  const typing = document.querySelector('.typing');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (typing && !reduceMotion) {
    const fullText = typing.dataset.text || typing.textContent;
    typing.textContent = '';
    let i = 0;
    const tick = () => {
      typing.textContent = fullText.slice(0, i);
      i += 1;
      if (i <= fullText.length) {
        setTimeout(tick, 55);
      }
    };
    tick();
  }

  /* ---------- Back to top ---------- */
  const backBtn = document.getElementById('back-to-top');
  if (backBtn) {
    const onScroll = () => {
      backBtn.classList.toggle('show', window.scrollY > 600);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    backBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------- Copyright year ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Contact form validation ---------- */
  const form = document.getElementById('contact-form');
  if (form) {
    const status = document.getElementById('form-status');
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    const rules = {
      name: (v) => (v.trim() === '' ? 'Please enter your full name.' : ''),
      email: (v) => {
        if (v.trim() === '') return 'Please enter your email address.';
        if (!EMAIL_RE.test(v.trim())) return 'Please enter a valid email address, such as name@example.com.';
        return '';
      },
      subject: (v) => (v.trim() === '' ? 'Please enter a subject.' : ''),
      message: (v) => (v.trim() === '' ? 'Please enter a message.' : ''),
    };

    function showError(field, message) {
      const errEl = document.getElementById(field.id + '-error');
      field.setAttribute('aria-invalid', message ? 'true' : 'false');
      if (errEl) errEl.textContent = message;
      return !message;
    }

    function validateField(field) {
      const rule = rules[field.name];
      if (!rule) return true;
      return showError(field, rule(field.value));
    }

    Array.from(form.elements).forEach((el) => {
      if (el.name && rules[el.name]) {
        el.addEventListener('blur', () => validateField(el));
        el.addEventListener('input', () => {
          if (el.getAttribute('aria-invalid') === 'true') validateField(el);
        });
      }
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let firstInvalid = null;
      let valid = true;

      Array.from(form.elements).forEach((el) => {
        if (el.name && rules[el.name]) {
          if (!validateField(el)) {
            valid = false;
            if (!firstInvalid) firstInvalid = el;
          }
        }
      });

      if (!valid) {
        status.className = 'form-status';
        status.textContent = 'Please fix the highlighted fields and try again.';
        firstInvalid.focus();
        return;
      }

      /*
        No backend is configured. A static site cannot deliver email by itself,
        so the message is NOT sent. We tell the visitor honestly instead of faking success.
        To enable delivery, connect a form service (e.g. Formspree) by setting
        FORM_ENDPOINT below and uncommenting the fetch block.
      */
      const FORM_ENDPOINT = ''; // e.g. 'https://formspree.io/f/your-id'

      if (!FORM_ENDPOINT) {
        status.className = 'form-status warning';
        status.textContent = 'The contact form needs configuration before messages can be delivered. Please reach out through the email address listed above.';
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      status.className = 'form-status';
      status.textContent = 'Sending...';

      fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      })
        .then((res) => {
          if (!res.ok) throw new Error('Request failed');
          status.className = 'form-status success';
          status.textContent = 'Thank you! Your message has been sent.';
          form.reset();
        })
        .catch(() => {
          status.className = 'form-status warning';
          status.textContent = 'Sorry, your message could not be sent. Please try again later.';
        })
        .finally(() => {
          submitBtn.disabled = false;
        });
    });
  }
})();
