/* Vedant Dangi — portfolio interactions (vanilla JS, no deps) */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------- Theme toggle */
  var themeBtn = doc.getElementById('theme-toggle');
  var themeIcon = doc.getElementById('theme-icon');

  function syncThemeButton() {
    if (!themeBtn) return;
    var isDark = root.getAttribute('data-theme') === 'dark';
    if (themeIcon) themeIcon.textContent = isDark ? '☀️' : '🌙';
    themeBtn.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
  }

  if (themeBtn) {
    syncThemeButton();
    themeBtn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      syncThemeButton();
    });
  }

  /* --------------------------------------------------------- Mobile nav */
  var navToggle = doc.getElementById('nav-toggle');
  var navPanel = doc.getElementById('nav-panel');

  function setMenu(open) {
    if (!navPanel || !navToggle) return;
    navPanel.setAttribute('data-open', open ? 'true' : 'false');
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (navToggle.firstElementChild) navToggle.firstElementChild.textContent = open ? '✕' : '☰';
  }

  if (navToggle && navPanel) {
    navToggle.addEventListener('click', function () {
      setMenu(navPanel.getAttribute('data-open') !== 'true');
    });
    navPanel.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setMenu(false);
    });
    var wide = window.matchMedia('(min-width: 921px)');
    (wide.addEventListener ? wide.addEventListener.bind(wide, 'change') : wide.addListener.bind(wide))(function (m) {
      if (m.matches) setMenu(false);
    });
  }

  /* ---------------------------------------- Scroll-driven UI (robust) ---
     Uses scroll position + getBoundingClientRect rather than
     IntersectionObserver, so reveals never get stuck hidden in contexts
     where IO callbacks don't fire. */
  var revealables = Array.prototype.slice.call(doc.querySelectorAll('.reveal'));

  var navLinks = Array.prototype.slice.call(
    doc.querySelectorAll('.nav-links a.navlink[href^="#"]')
  );
  var sections = navLinks
    .map(function (a) { return doc.getElementById(a.getAttribute('href').slice(1)); })
    .filter(Boolean);

  function revealAll() {
    revealables.forEach(function (el) { el.classList.add('is-visible'); });
    revealables = [];
  }

  function inView(el) {
    var r = el.getBoundingClientRect();
    var vh = window.innerHeight || doc.documentElement.clientHeight;
    return r.top < vh * 0.9 && r.bottom > 0;
  }

  function updateActive() {
    if (!sections.length) return;
    var probe = window.pageYOffset + (window.innerHeight || 0) * 0.32;
    var current = sections[0].id;
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].offsetTop <= probe) current = sections[i].id;
    }
    navLinks.forEach(function (a) {
      a.classList.toggle('is-active', a.getAttribute('href') === '#' + current);
    });
  }

  // Direct (no requestAnimationFrame): rAF callbacks are throttled to a
  // near-halt in background/virtualized contexts, which would leave reveals
  // stuck hidden. getBoundingClientRect on ~17 nodes per tick is negligible.
  var lastRun = 0, trailing = null;
  function onFrame() {
    if (!reduceMotion) {
      for (var i = revealables.length - 1; i >= 0; i--) {
        if (inView(revealables[i])) {
          revealables[i].classList.add('is-visible');
          revealables.splice(i, 1);
        }
      }
    }
    updateActive();
  }
  function onScroll() {
    var now = Date.now();
    if (now - lastRun >= 90) {
      lastRun = now;
      onFrame();
    } else {
      clearTimeout(trailing);
      trailing = setTimeout(function () { lastRun = Date.now(); onFrame(); }, 100);
    }
  }

  if (reduceMotion || !revealables.length) {
    revealAll();
    updateActive();
  } else {
    onFrame(); // reveal what's already on screen
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  window.addEventListener('load', onFrame);
  // Final safety net: guarantee content is visible even if something above failed.
  setTimeout(function () { if (revealables.length) onFrame(); }, 1500);
})();
