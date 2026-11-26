// Theme (light by default, dark on request), scroll progress and scroll reveal.
// Loaded in <head> on every page so the saved theme applies before first paint.
(function () {
  var root = document.documentElement;
  var saved = null;
  try { saved = localStorage.getItem('theme'); } catch (e) {}
  if (saved === 'dark') root.setAttribute('data-theme', 'dark');
  root.classList.add('js');

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ready() {
    // Theme toggle, added to the end of the main nav (or the header if a page has no nav).
    var top = document.querySelector('.top');
    if (top) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'theme-btn';
      b.innerHTML =
        '<svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6"/></svg>' +
        '<svg class="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7z"/></svg>';
      function label() {
        var dark = root.getAttribute('data-theme') === 'dark';
        b.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
        b.title = dark ? 'Light theme' : 'Dark theme';
      }
      label();
      b.addEventListener('click', function () {
        var dark = root.getAttribute('data-theme') === 'dark';
        if (dark) root.removeAttribute('data-theme'); else root.setAttribute('data-theme', 'dark');
        try { localStorage.setItem('theme', dark ? 'light' : 'dark'); } catch (e) {}
        label();
      });
      (top.querySelector('nav') || top).appendChild(b);
    }

    // Reading progress bar.
    var bar = document.createElement('div');
    bar.className = 'progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    var ticking = false;
    function prog() {
      var h = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, scrollY / h) : 0) + ')';
      ticking = false;
    }
    addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(prog); } }, { passive: true });
    prog();

    // Scroll reveal.
    if (reduce || !('IntersectionObserver' in window)) return;
    var sel = '.index li, .principles li, .smalls li, .intro, .about-grid > *, .tools > div, .record-head, .record tr, .contact .main > *, .prose > *, .tldr > div, .steps li, figure.diagram, .options-wrap, .next a, .ledger-wrap, .demo';
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    function watch(scope) {
      var n = 0, last = null;
      scope.querySelectorAll(sel).forEach(function (el) {
        if (el.classList.contains('reveal') || el.closest('.hero')) return;
        if (el.parentNode !== last) { n = 0; last = el.parentNode; }
        el.classList.add('reveal');
        el.style.transitionDelay = Math.min(n++, 5) * 70 + 'ms';
        io.observe(el);
      });
    }
    watch(document);
    document.querySelectorAll('section').forEach(function (s) { io.observe(s); });
    // Experience is rendered later by profile.js.
    var rb = document.getElementById('record-body');
    if (rb && 'MutationObserver' in window) new MutationObserver(function () { watch(rb); }).observe(rb, { childList: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready); else ready();
})();
