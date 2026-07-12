/*
   Meredith Share Closet — main.js
   Shared behavior for every page: mobile nav, active-link highlighting,
   scroll reveal animations, animated impact counters, sticky header shadow.

   This file is safe to include on every page (index, browse, donate, about).
   Each feature checks that its target elements exist before running, so
   nothing errors out on pages that don't have, say, a stats section.
*/

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  highlightActiveNavLink();
  initScrollReveal();
  initImpactCounters();
  initStickyHeader();
});

/* ------------------------------------------------------------------ */
/* 1. Mobile nav toggle                                               */
/* ------------------------------------------------------------------ */
function initMobileNav() {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('primary-nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  // Close the menu automatically when a link is tapped (mobile UX nicety)
  nav.addEventListener('click', (event) => {
    if (event.target.tagName === 'A') {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}

/* ------------------------------------------------------------------ */
/* 2. Highlight the current page in the nav                           */
/* ------------------------------------------------------------------ */
function highlightActiveNavLink() {
  const links = document.querySelectorAll('nav a[href]');
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  links.forEach((link) => {
    const linkPage = link.getAttribute('href');
    if (linkPage === currentPage) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

/* ------------------------------------------------------------------ */
/* 3. Fade/slide sections in as they scroll into view                 */
/* ------------------------------------------------------------------ */
function initScrollReveal() {
  const targets = document.querySelectorAll('main section, main aside');
  if (!targets.length) return;

  // If a user has motion-reduction turned on, just show everything instantly.
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  targets.forEach((el) => el.classList.add('reveal'));

  if (prefersReducedMotion) {
    targets.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  targets.forEach((el) => observer.observe(el));
}

/* ------------------------------------------------------------------ */
/* 4. Count-up animation for the impact stats                         */
/* ------------------------------------------------------------------ */
function initImpactCounters() {
  const counters = document.querySelectorAll('.stat-number[data-target]');
  if (!counters.length) return;

  const animateCounter = (el) => {
    const target = parseInt(el.dataset.target, 10) || 0;
    const duration = 1200; // ms
    const startTime = performance.now();

    function tick(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const value = Math.floor(progress * target);
      el.textContent = value.toLocaleString();
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = target.toLocaleString() + '+';
      }
    }

    requestAnimationFrame(tick);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach((el) => observer.observe(el));
}

/* ------------------------------------------------------------------ */
/* 5. Add a shadow to the header once the page scrolls                */
/* ------------------------------------------------------------------ */
function initStickyHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const onScroll = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}