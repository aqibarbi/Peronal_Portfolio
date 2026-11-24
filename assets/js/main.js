// main.js
// Small features for the page. Each block below is separate, so you can
// delete or change one without touching the others.
// No libraries: the letter-by-letter roles use the Web Animations API,
// the scroll effects use IntersectionObserver.

// "always-animate" class comes from head.js. If it is there, ignore the phone's reduced-motion setting.
const alwaysAnimate = document.documentElement.classList.contains('always-animate');
const prefersReducedMotion = !alwaysAnimate && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;


// ---------- 1. Footer year ----------
document.getElementById('footer-year').textContent = new Date().getFullYear();


// ---------- 2. Mobile menu ----------
const navToggle = document.getElementById('nav-toggle');
const navMenu = document.getElementById('nav-menu');

function setMenu(open) {
  navMenu.classList.toggle('open', open);
  navToggle.setAttribute('aria-expanded', String(open));
  navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
}

navToggle.addEventListener('click', function () {
  setMenu(!navMenu.classList.contains('open'));
});

// close the menu after tapping a link, or when Escape is pressed
navMenu.querySelectorAll('a').forEach(function (link) {
  link.addEventListener('click', function () {
    setMenu(false);
  });
});
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') setMenu(false);
});


// ---------- 3. Highlight the nav link of the section on screen ----------
const sections = document.querySelectorAll('main section[id]');
const navLinks = document.querySelectorAll('.nav-links a');

const sectionObserver = new IntersectionObserver(
  function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      navLinks.forEach(function (link) {
        link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id);
      });
    });
  },
  // only counts a section when it crosses the middle of the screen
  { rootMargin: '-45% 0px -50% 0px' }
);
sections.forEach(function (section) {
  sectionObserver.observe(section);
});


// ---------- 4. Scroll reveal (up, left, right, with optional stagger) ----------
// Blocks marked .reveal slide in when they reach the screen. The direction comes
// from data-reveal="left | right | down" (CSS). Children of a [data-stagger] block
// appear one after the other.
(function () {
  document.querySelectorAll('[data-stagger]').forEach(function (group) {
    Array.from(group.children).forEach(function (child, i) {
      child.classList.add('reveal');
      child.style.setProperty('--d', i * 0.12 + 's');
    });
  });

  const items = document.querySelectorAll('.reveal');

  // very old browsers: just show everything
  if (!('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('show'); });
    return;
  }

  const revealObserver = new IntersectionObserver(
    function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('show');
        observer.unobserve(entry.target); // one time only
      });
    },
    { rootMargin: '0px 0px -8% 0px' }
  );
  items.forEach(function (el) {
    revealObserver.observe(el);
  });
})();


// ---------- 5. Hero roles: letters slide in, wait, slide out ----------
(function () {
  const el = document.getElementById('rotator');
  if (!el) return;

  const words = (el.dataset.words || '')
    .split('|')
    .map(function (w) { return w.trim(); })
    .filter(Boolean);

  // With reduced motion (or one word) the first role just stays as plain text
  if (prefersReducedMotion || words.length < 2 || !el.animate) return;

  const EASE_IN = 'cubic-bezier(0.16, 1, 0.3, 1)';
  const EASE_OUT = 'cubic-bezier(0.7, 0, 0.84, 0)';
  const wait = function (ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); };

  // one <span> per letter, so each letter can move on its own
  function split(word) {
    el.textContent = '';
    return Array.from(word).map(function (letter) {
      const span = document.createElement('span');
      span.className = 'ch';
      span.textContent = letter;
      el.append(span);
      return span;
    });
  }

  async function run() {
    let i = 0;
    let firstRound = true;
    while (true) {
      const letters = split(words[i]);
      // the first round waits a moment so it starts after the hero has slid in
      const startDelay = firstRound ? 700 : 0;
      firstRound = false;

      const showing = letters.map(function (ch, n) {
        return ch.animate(
          [{ transform: 'translateY(110%)' }, { transform: 'translateY(0)' }],
          { duration: 750, delay: startDelay + n * 45, easing: EASE_IN, fill: 'both' }
        );
      });
      await Promise.all(showing.map(function (a) { return a.finished; }));

      await wait(2600);

      const hiding = letters.map(function (ch, n) {
        return ch.animate(
          [{ transform: 'translateY(0)' }, { transform: 'translateY(-110%)' }],
          { duration: 450, delay: n * 25, easing: EASE_OUT, fill: 'both' }
        );
      });
      await Promise.all(hiding.map(function (a) { return a.finished; }));

      i = (i + 1) % words.length;
    }
  }

  // start hidden right away so the plain text never flashes before the animation
  run().catch(function () {
    el.textContent = words[0]; // if anything fails, fall back to plain text
  });
})();


// Show six practice projects on first load. All remain available without JavaScript.
const practiceToggle = document.querySelector('.practice-toggle');
const extraProjects = Array.from(document.querySelectorAll('#practice-grid > article')).slice(6);
if (practiceToggle && extraProjects.length) {
  extraProjects.forEach(function (project) { project.hidden = true; });
  practiceToggle.hidden = false;
  practiceToggle.addEventListener('click', function () {
    const expand = practiceToggle.getAttribute('aria-expanded') === 'false';
    extraProjects.forEach(function (project) { project.hidden = !expand; });
    practiceToggle.setAttribute('aria-expanded', String(expand));
    practiceToggle.textContent = expand ? 'Show fewer projects' : 'Show more projects';
    if (expand) extraProjects[0].querySelector('a').focus();
    else practiceToggle.focus();
  });
}

// ---------- 7. Experience / Education tabs ----------
const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('[role="tabpanel"]');

function showTab(selectedTab) {
  tabs.forEach(function (tab) {
    tab.setAttribute('aria-selected', String(tab === selectedTab));
  });
  panels.forEach(function (panel) {
    panel.hidden = panel.id !== selectedTab.getAttribute('aria-controls');
  });
}

tabs.forEach(function (tab, index) {
  tab.addEventListener('click', function () {
    showTab(tab);
  });
  // left and right arrow keys move between the tabs
  tab.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const step = e.key === 'ArrowRight' ? 1 : -1;
    const next = tabs[(index + step + tabs.length) % tabs.length];
    next.focus();
    showTab(next);
  });
});


// ---------- 8. Copy email button ----------
const copyButton = document.getElementById('copy-email');
const copyButtonText = copyButton.innerHTML;

copyButton.addEventListener('click', function () {
  // some in-app browsers have no clipboard API at all
  if (!navigator.clipboard) {
    copyButton.textContent = 'Could not copy, use the address above';
    setTimeout(function () { copyButton.innerHTML = copyButtonText; }, 2000);
    return;
  }
  navigator.clipboard
    .writeText(copyButton.dataset.email)
    .then(function () {
      copyButton.innerHTML = 'Email copied <i class="ri-check-line" aria-hidden="true"></i>';
    })
    .catch(function () {
      copyButton.textContent = 'Could not copy, use the address above';
    })
    .finally(function () {
      setTimeout(function () {
        copyButton.innerHTML = copyButtonText;
      }, 2000);
    });
});


// ---------- 9. Image popup for the review screenshots ----------
const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightbox-image');

// If the browser has no <dialog> support the links just open the image normally
if (typeof lightbox.showModal === 'function') {
  document.querySelectorAll('.js-lightbox').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      lightboxImage.src = link.getAttribute('href');
      lightbox.showModal();
    });
  });

  document.getElementById('lightbox-close').addEventListener('click', function () {
    lightbox.close();
  });

  // clicking the dark area around the image closes it too (Escape works by default)
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) lightbox.close();
  });
}


// ---------- 10. Contact form (sent to Netlify Forms) ----------
const form = document.getElementById('contact-form');
const formFeedback = document.getElementById('form-feedback');
const formSubmit = document.getElementById('form-submit');
const formSubject = document.getElementById('form-subject');
const formName = document.getElementById('form-name-input');
const submitText = formSubmit.innerHTML;

// the email subject line includes the sender's name
formName.addEventListener('input', function () {
  const name = formName.value.trim();
  formSubject.value = name ? 'New portfolio message from ' + name : 'New portfolio message';
});

function showFeedback(message, type) {
  formFeedback.textContent = message;
  formFeedback.className = 'form-feedback ' + type;
}

form.addEventListener('submit', function (e) {
  e.preventDefault();
  formSubmit.disabled = true;
  formSubmit.textContent = 'Sending...';
  formFeedback.textContent = '';

  fetch('/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(new FormData(form)).toString()
  })
    .then(function (response) {
      if (response.ok) {
        showFeedback("Message sent. I'll get back to you soon.", 'ok');
        form.reset();
        formSubject.value = 'New portfolio message';
      } else {
        showFeedback('Something went wrong. Please try again or email me directly.', 'error');
      }
    })
    .catch(function () {
      showFeedback('Network error. Check your connection and try again.', 'error');
    })
    .finally(function () {
      formSubmit.disabled = false;
      formSubmit.innerHTML = submitText;
    });
});


// ---------- 11. Mouse extras: cursor ring + hero parallax ----------
// Only runs with a real mouse and when the person has not asked for less motion.
(function () {
  if (!hasMouse || prefersReducedMotion) return;

  /* ----- cursor ring that trails the pointer and grows over clickable things ----- */
  const ring = document.createElement('div');
  ring.className = 'cursor';
  ring.setAttribute('aria-hidden', 'true');
  document.body.append(ring);

  let targetX = -100;
  let targetY = -100;
  let ringX = targetX;
  let ringY = targetY;
  let ringFrame = 0;

  function moveRing() {
    ringX += (targetX - ringX) * 0.22;
    ringY += (targetY - ringY) * 0.22;
    ring.style.transform = 'translate3d(' + ringX + 'px,' + ringY + 'px,0) translate(-50%,-50%)';
    // stop the loop once the ring has caught up, so it costs nothing while idle
    const done = Math.abs(targetX - ringX) < 0.1 && Math.abs(targetY - ringY) < 0.1;
    ringFrame = done ? 0 : requestAnimationFrame(moveRing);
  }

  window.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    targetX = e.clientX;
    targetY = e.clientY;
    ring.classList.add('on');
    if (!ringFrame) ringFrame = requestAnimationFrame(moveRing);
  }, { passive: true });

  document.documentElement.addEventListener('mouseleave', function () {
    ring.classList.remove('on');
  });

  document.addEventListener('pointerover', function (e) {
    const hit = e.target.closest && e.target.closest('a, button, input, textarea, [role="tab"]');
    ring.classList.toggle('hover', Boolean(hit));
  });

})();


// ---------- 12. Tech stack graphic: animation only while on screen ----------
// The orbit and chip glow are SVG (SMIL) animations. CSS "reduced motion" rules do not
// reach them, so they are paused here: while off screen (and with reduced motion, unless head.js has ALWAYS_ANIMATE = true).
(function () {
  const svg = document.querySelector('.stack-svg');
  if (!svg || typeof svg.pauseAnimations !== 'function') return;

  svg.pauseAnimations(); // starts frozen: logos sit at their first spot on each ring
  if (prefersReducedMotion || !('IntersectionObserver' in window)) return;

  new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) svg.unpauseAnimations();
      else svg.pauseAnimations();
    });
  }, { threshold: 0.1 }).observe(svg);
})();


// ---------- 13. Back to top button with a ring that fills as you scroll ----------
(function () {
  const toTop = document.getElementById('to-top');
  if (!toTop) return;
  let ticking = false;

  function updateToTop() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0;
    toTop.style.setProperty('--p', progress.toFixed(1));
    toTop.classList.toggle('show', window.scrollY > 400);
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateToTop);
    }
  }, { passive: true });

  // smooth scrolling (or none, with reduced motion) comes from the CSS scroll-behavior rule
  toTop.addEventListener('click', function () {
    window.scrollTo(0, 0);
  });

  updateToTop();
})();


// ---------- 14. Dark / light theme toggle ----------
(function () {
  const root = document.documentElement;
  const button = document.getElementById('theme-toggle');
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');

  // Update the attribute, the button label and the browser bar color
  function setTheme(theme, save) {
    root.setAttribute('data-theme', theme);
    button.setAttribute('aria-label', theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
    if (themeColorMeta) themeColorMeta.setAttribute('content', theme === 'light' ? '#faf7f2' : '#050914');
    if (!save) return; // first call on page load only fixes the label, nothing to remember
    try {
      localStorage.setItem('theme', theme);
    } catch (error) {
      // Storage blocked: the theme still works, it just is not remembered
    }
  }

  // Match the label to the theme head.js already set
  setTheme(root.getAttribute('data-theme') === 'light' ? 'light' : 'dark', false);

  button.addEventListener('click', function () {
    setTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light', true);
  });
})();
