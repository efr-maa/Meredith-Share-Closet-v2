/*
   Meredith Share Closet — main.js
   Shared behavior for every page: mobile nav, active-link highlighting,
   scroll reveal animations, animated impact counters.

   This file is safe to include on every page (index, browse, donate, about).
   Each feature checks that its target elements exist before running, so
   nothing errors out on pages that don't have, say, a stats section.
*/

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  highlightActiveNavLink();
  initScrollReveal();
  initImpactCounters();
  initAccordionDetails();
  initRangeOutputs();
  initAjaxForms();
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
/* 5. Accordion behavior for the browse-page category boxes           */
/*    (only one <details> open at a time — closing the others when    */
/*    a new one is opened keeps the long item lists manageable)       */
/* ------------------------------------------------------------------ */
function initAccordionDetails() {
  const detailsList = document.querySelectorAll('.category-box');
  if (!detailsList.length) return;

  detailsList.forEach((details) => {
    details.addEventListener('toggle', () => {
      if (details.open) {
        detailsList.forEach((other) => {
          if (other !== details) other.open = false;
        });
      }
    });
  });
}

/* ------------------------------------------------------------------ */
/* 6. Live numeric readout for range sliders (e.g. condition rating)  */
/* ------------------------------------------------------------------ */
function initRangeOutputs() {
  const ranges = document.querySelectorAll('input[type="range"][data-output]');
  if (!ranges.length) return;

  ranges.forEach((range) => {
    const output = document.getElementById(range.dataset.output);
    if (!output) return;

    const update = () => {
      output.textContent = range.value;
    };

    range.addEventListener('input', update);
    update();
  });
}

/* ------------------------------------------------------------------ */
/* 7. Submit forms via fetch instead of a full page reload            */
/*                                                                    */
/*    This is the fix for the "form doesn't submit anything" problem: */
/*    each <form data-ajax> below still has a real action="" pointing */
/*    at a Formspree endpoint, so it works even with JS disabled      */
/*    (progressive enhancement). When JS *is* available, we intercept */
/*    the submit, send it with fetch, and show a success/error        */
/*    message in place instead of leaving the page.                   */
/* ------------------------------------------------------------------ */
function initAjaxForms() {
  const forms = document.querySelectorAll('form[data-ajax]');
  if (!forms.length) return;

  forms.forEach((form) => {
    const statusEl = form.querySelector('.form-status');
    const submitBtn = form.querySelector('input[type="submit"], button[type="submit"]');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (!form.action || form.action.includes('YOUR_FORM_ID')) {
        if (statusEl) {
          statusEl.textContent =
            'Form endpoint not set up yet — see the setup note in the code comments.';
          statusEl.className = 'form-status form-status--error';
        }
        return;
      }

      if (statusEl) {
        statusEl.textContent = '';
        statusEl.className = 'form-status';
      }

      const originalLabel = submitBtn ? submitBtn.value : null;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.value = 'Submitting…';
      }

      try {
        const response = await fetch(form.action, {
          method: form.method || 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' },
        });

        if (response.ok) {
          form.reset();
          if (statusEl) {
            statusEl.textContent =
              "Thanks! Your submission was received — we'll follow up by email.";
            statusEl.className = 'form-status form-status--success';
          }
        } else {
          const data = await response.json().catch(() => null);
          const message =
            data && Array.isArray(data.errors)
              ? data.errors.map((e) => e.message).join(', ')
              : 'Something went wrong. Please try again or email us directly.';
          if (statusEl) {
            statusEl.textContent = message;
            statusEl.className = 'form-status form-status--error';
          }
        }
      } catch (error) {
        if (statusEl) {
          statusEl.textContent =
            'Network error — please check your connection and try again.';
          statusEl.className = 'form-status form-status--error';
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          if (originalLabel) submitBtn.value = originalLabel;
        }
      }
    });
  });
}


def find_nth_from_end(head, n):
    # Move the fast pointer n nodes ahead
    fast = head
    for _ in range(n):
        fast = fast.next

    # Move both pointers until fast reaches the end
    slow = head
    while fast is not None:
        slow = slow.next
        fast = fast.next

    return slow.value