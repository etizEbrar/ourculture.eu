/* ══════════════════════════════════════════════════════════════
   OUR CULTURE — script.js  (v2)
   Vanilla JS: navigation, language switching, reveal animations
═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const STORAGE_KEY  = 'ourculture.lang';
  const SUPPORTED    = ['en', 'fr', 'tr', 'hu'];
  const DEFAULT_LANG = 'en';

  const header       = document.getElementById('site-header');
  const navToggle    = document.getElementById('nav-toggle');
  const primaryNav   = document.getElementById('primary-nav');
  const navLinks     = document.querySelectorAll('.nav-link');
  const langTrigger  = document.getElementById('lang-trigger');
  const langMenu     = document.getElementById('lang-menu');
  const langCurrent  = document.getElementById('lang-current');
  const langLoader   = document.getElementById('lang-loader');
  const yearEl       = document.getElementById('current-year');
  const contactForm  = document.getElementById('contact-form');
  const formFeedback = document.getElementById('form-feedback');
  const joinForm     = document.getElementById('join-form');
  const backTop      = document.getElementById('back-to-top');

  // ─── Utilities ──────────────────────────────────────────────
  function getNested(obj, path) {
    return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
  }

  function resolveStartLang() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED.includes(saved)) return saved;
    const browser = (navigator.language || DEFAULT_LANG).slice(0, 2).toLowerCase();
    return SUPPORTED.includes(browser) ? browser : DEFAULT_LANG;
  }

  // ─── Sticky header shadow + back-to-top visibility ──────────
  function onScroll() {
    if (window.scrollY > 8)   header.classList.add('scrolled');
    else                      header.classList.remove('scrolled');

    if (backTop) {
      if (window.scrollY > 600) backTop.classList.add('is-visible');
      else                      backTop.classList.remove('is-visible');
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ─── Mobile nav ─────────────────────────────────────────────
  navToggle.addEventListener('click', () => {
    const open = primaryNav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(open));
  });

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      primaryNav.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  // ─── Active section highlight ───────────────────────────────
  const sections = Array.from(document.querySelectorAll('main section[id]'));
  const sectionObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach(l => {
            l.classList.toggle('is-active', l.getAttribute('href') === '#' + id);
          });
        }
      });
    },
    { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
  );
  sections.forEach(s => sectionObserver.observe(s));

  // ─── Reveal on scroll ───────────────────────────────────────
  const revealTargets = document.querySelectorAll(
    '.news-card, .partner-card, .resource-card, .highlight, .hero-inner > *, .section-head, .intro-media, .intro-text, .exhibition-text, .exhibition-preview, .join-band-inner, .contact-grid > *'
  );
  revealTargets.forEach(el => el.classList.add('reveal'));

  const revealObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );
  revealTargets.forEach(el => revealObserver.observe(el));

  // ─── Back to top ────────────────────────────────────────────
  if (backTop) {
    backTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ─── Language dropdown ──────────────────────────────────────
  function openLangMenu()  { langMenu.classList.add('is-open');    langTrigger.setAttribute('aria-expanded', 'true'); }
  function closeLangMenu() { langMenu.classList.remove('is-open'); langTrigger.setAttribute('aria-expanded', 'false'); }

  langTrigger.addEventListener('click', e => {
    e.stopPropagation();
    langMenu.classList.contains('is-open') ? closeLangMenu() : openLangMenu();
  });

  document.addEventListener('click', e => {
    if (!langMenu.contains(e.target) && !langTrigger.contains(e.target)) closeLangMenu();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeLangMenu();
  });

  langMenu.querySelectorAll('[data-lang]').forEach(item => {
    item.addEventListener('click', () => {
      const lang = item.getAttribute('data-lang');
      setLanguage(lang);
      closeLangMenu();
    });
  });

  // ─── Language switching ─────────────────────────────────────
  function setLanguage(lang) {
    if (!SUPPORTED.includes(lang))               lang = DEFAULT_LANG;
    if (typeof translations === 'undefined')     return;
    if (!translations[lang])                     return;

    langLoader.classList.add('is-active');
    document.body.classList.add('lang-swapping');

    window.setTimeout(() => {
      applyTranslations(lang);

      document.documentElement.setAttribute('lang', lang);
      document.documentElement.setAttribute('data-lang', lang);
      localStorage.setItem(STORAGE_KEY, lang);

      const flags  = { en: '🇬🇧', fr: '🇫🇷', tr: '🇹🇷', hu: '🇭🇺' };
      const labels = { en: 'EN',   fr: 'FR',   tr: 'TR',   hu: 'HU'  };
      langCurrent.textContent = labels[lang];
      const flagEl = langTrigger.querySelector('.lang-flag');
      if (flagEl) flagEl.textContent = flags[lang];

      langMenu.querySelectorAll('[data-lang]').forEach(li => {
        li.setAttribute('aria-selected', li.getAttribute('data-lang') === lang ? 'true' : 'false');
      });

      document.body.classList.remove('lang-swapping');
      langLoader.classList.remove('is-active');
    }, 260);
  }

  function applyTranslations(lang) {
    const dict = translations[lang];
    if (!dict) return;

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key   = el.getAttribute('data-i18n');
      const value = getNested(dict, key);
      if (typeof value === 'string') {
        if (key === 'meta.title') document.title = value;
        else                      el.textContent = value;
      }
    });

    const phMap = {
      'cf-name':    'contact.form_name',
      'cf-email':   'contact.form_email',
      'cf-subject': 'contact.form_subject',
      'cf-message': 'contact.form_message',
      'join-email': 'join.email_label'
    };
    Object.entries(phMap).forEach(([id, key]) => {
      const el = document.getElementById(id);
      if (el) {
        const v = getNested(dict, key);
        if (typeof v === 'string') el.setAttribute('placeholder', v);
      }
    });
  }

  // ─── Year ───────────────────────────────────────────────────
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ─── Contact form (front-end only) ──────────────────────────
  if (contactForm) {
    contactForm.addEventListener('submit', e => {
      e.preventDefault();
      formFeedback.classList.remove('is-error');

      const name    = contactForm.name.value.trim();
      const email   = contactForm.email.value.trim();
      const message = contactForm.message.value.trim();

      if (!name || !email || !message) {
        const lang = document.documentElement.getAttribute('data-lang') || DEFAULT_LANG;
        const msg  = getNested(translations[lang] || {}, 'contact.form_error')
                     || 'Please fill in all required fields.';
        formFeedback.classList.add('is-error');
        formFeedback.textContent = msg;
        return;
      }

      const lang = document.documentElement.getAttribute('data-lang') || DEFAULT_LANG;
      const msg  = getNested(translations[lang] || {}, 'contact.form_success')
                   || 'Thank you — your message has been received.';
      formFeedback.textContent = msg;
      contactForm.reset();
    });
  }

  // ─── Join / newsletter form ─────────────────────────────────
  if (joinForm) {
    joinForm.addEventListener('submit', e => {
      e.preventDefault();
      const btn = joinForm.querySelector('button[type="submit"]');
      const lang = document.documentElement.getAttribute('data-lang') || DEFAULT_LANG;
      const msg  = getNested(translations[lang] || {}, 'join.success') || 'Thank you!';
      const original = btn.textContent;
      btn.textContent = '✓ ' + msg;
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = original;
        btn.disabled = false;
        joinForm.reset();
      }, 2600);
    });
  }

  // ─── News image sliders ──────────────────────────────────
  function initSlider(container, opts = {}) {
    const { autoStart = true } = opts;
    const track = container.querySelector('.news-slider-track');
    const imgs  = track.querySelectorAll('img');
    const dots  = container.querySelectorAll('.slider-dot');
    const prev  = container.querySelector('.slider-prev');
    const next  = container.querySelector('.slider-next');
    let idx = 0;
    let autoplay = null;
    const total = imgs.length;

    function goTo(i) {
      idx = (i + total) % total;
      track.style.transform = `translateX(-${idx * 100}%)`;
      dots.forEach((d, di) => d.classList.toggle('active', di === idx));
    }

    function start() {
      if (autoplay) return;
      autoplay = setInterval(() => goTo(idx + 1), 5000);
    }
    function stop() {
      if (autoplay) { clearInterval(autoplay); autoplay = null; }
    }

    if (prev) prev.addEventListener('click', () => goTo(idx - 1));
    if (next) next.addEventListener('click', () => goTo(idx + 1));
    dots.forEach((d, di) => d.addEventListener('click', () => goTo(di)));

    container.addEventListener('mouseenter', stop);
    container.addEventListener('mouseleave', () => { if (autoStart || autoplay !== null) start(); });

    if (autoStart) start();

    return { goTo, start, stop };
  }

  // Init card sliders (autoplay on load)
  document.querySelectorAll('.news-slider').forEach(s => initSlider(s));

  // ─── News Detail Modal ──────────────────────────────────
  const newsOverlay = document.getElementById('news-detail-overlay');
  const newsClose   = document.getElementById('news-detail-close');
  const newsDetailSlider = document.getElementById('news-detail-slider');
  let detailSliderCtrl = null;

  if (newsDetailSlider) {
    // Modal slider stays idle until the modal is opened
    detailSliderCtrl = initSlider(newsDetailSlider, { autoStart: false });
  }

  function openNewsDetail() {
    newsOverlay.classList.add('is-open');
    newsOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (detailSliderCtrl) {
      detailSliderCtrl.goTo(0);
      detailSliderCtrl.start();
    }
  }

  function closeNewsDetail() {
    newsOverlay.classList.remove('is-open');
    newsOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (detailSliderCtrl) detailSliderCtrl.stop();
  }

  const readMoreBtn = document.getElementById('news-read-more-1');
  if (readMoreBtn) {
    readMoreBtn.addEventListener('click', e => {
      e.preventDefault();
      openNewsDetail();
    });
  }

  if (newsClose) {
    newsClose.addEventListener('click', closeNewsDetail);
  }

  if (newsOverlay) {
    newsOverlay.addEventListener('click', e => {
      if (e.target === newsOverlay) closeNewsDetail();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && newsOverlay.classList.contains('is-open')) {
        closeNewsDetail();
      }
    });
  }

  // ─── Init ───────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    setLanguage(resolveStartLang());
  });

})();
