// main.js
// Small features for the page. Each block below is separate, so you can
// delete or change one without touching the others.
// No libraries: the letter-by-letter roles use the Web Animations API,
// the scroll effects use IntersectionObserver.

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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


// ---------- 6. Projects slider: arrows, dots, autoplay, mouse drag ----------
// The scrolling itself is native (CSS scroll-snap). Touch uses native swipe.
(function () {
  const root = document.querySelector('[data-slider]');
  if (!root) return;

  const track = root.querySelector('.slider-track');
  const dotsEl = root.querySelector('.slider-dots');
  const slides = Array.from(track.children);

  let index = 0;       // which "page" is active
  let pages = 1;       // how many positions the track can rest on
  let timer = null;
  let inView = false;
  let hovering = false;
  let frame = 0;

  // mouse drag state
  let pressed = false;
  let dragging = false;
  let moved = false;
  let startX = 0;
  let startLeft = 0;

  // stop the browser's own ghost-drag of images and links
  track.querySelectorAll('img, a').forEach(function (el) { el.draggable = false; });

  const style = function () { return getComputedStyle(track); };
  const gap = function () { return parseFloat(style().columnGap) || 0; };
  const padLeft = function () { return parseFloat(style().paddingLeft) || 0; };
  const slidePos = function (n) { return slides[n].offsetLeft - padLeft(); };

  // how many cards fit at once (1 on phones, 2 on tablets, 3 on desktop)
  function perView() {
    const step = slides[0].offsetWidth + gap();
    return Math.max(1, Math.round((track.clientWidth + gap()) / step));
  }

  const atEnd = function () {
    return Math.ceil(track.scrollLeft + track.clientWidth) >= track.scrollWidth - 1;
  };

  /* ----- dots ----- */
  function buildDots() {
    pages = Math.max(1, slides.length - perView() + 1);
    dotsEl.textContent = '';
    for (let n = 0; n < pages; n++) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'slider-dot';
      dot.setAttribute('aria-label', 'Go to position ' + (n + 1));
      dot.addEventListener('click', goTo.bind(null, n));
      dotsEl.append(dot);
    }
    setActive(Math.min(index, pages - 1));
  }

  function setActive(n) {
    index = n;
    Array.from(dotsEl.children).forEach(function (dot, i) {
      dot.classList.toggle('is-active', i === n);
    });
  }

  /* ----- moving ----- */
  function goTo(n) {
    const target = (n + pages) % pages;
    track.scrollTo({
      left: slidePos(target),
      behavior: prefersReducedMotion ? 'auto' : 'smooth'
    });
  }
  const next = function () { atEnd() ? goTo(0) : goTo(index + 1); };
  const prev = function () { index === 0 ? goTo(pages - 1) : goTo(index - 1); };

  root.querySelectorAll('.slider-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      btn.dataset.dir === '1' ? next() : prev();
    });
  });

  // the active dot follows the scroll position (swipe, drag, autoplay, keyboard)
  track.addEventListener('scroll', function () {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(function () {
      if (atEnd()) { setActive(pages - 1); return; }
      const x = track.scrollLeft;
      let best = 0;
      for (let n = 1; n < pages; n++) {
        if (Math.abs(slidePos(n) - x) < Math.abs(slidePos(best) - x)) best = n;
      }
      setActive(best);
    });
  }, { passive: true });

  /* ----- autoplay: only while visible, and never under the mouse or focus ----- */
  const stop = function () { clearInterval(timer); timer = null; };
  const play = function () { if (!timer && !prefersReducedMotion) timer = setInterval(next, 4000); };
  const sync = function () { (inView && !hovering && !document.hidden) ? play() : stop(); };

  new IntersectionObserver(function (entries) {
    inView = entries[0].isIntersecting;
    sync();
  }, { threshold: 0.3 }).observe(root);

  root.addEventListener('mouseenter', function () { hovering = true; sync(); });
  root.addEventListener('mouseleave', function () { hovering = false; sync(); });
  root.addEventListener('focusin', function () { hovering = true; sync(); });
  root.addEventListener('focusout', function () { hovering = false; sync(); });
  document.addEventListener('visibilitychange', sync);

  /* ----- mouse drag (touch swipe is native) ----- */
  track.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    pressed = true;
    moved = false;
    startX = e.clientX;
    startLeft = track.scrollLeft;
  });

  track.addEventListener('pointermove', function (e) {
    if (!pressed) return;
    const dx = e.clientX - startX;
    if (!dragging && Math.abs(dx) > 5) {
      dragging = true;
      moved = true;
      track.classList.add('is-dragging');
      track.setPointerCapture(e.pointerId); // only after the threshold, so plain clicks still work
    }
    if (dragging) track.scrollLeft = startLeft - dx;
  });

  function endDrag() {
    pressed = false;
    if (!dragging) return;
    dragging = false;
    track.classList.remove('is-dragging'); // snapping comes back and settles on the nearest card
  }
  track.addEventListener('pointerup', endDrag);
  track.addEventListener('pointercancel', endDrag);

  // a drag must not count as a click on the card link
  track.addEventListener('click', function (e) {
    if (moved) {
      e.preventDefault();
      e.stopPropagation();
      moved = false;
    }
  }, true);

  // number of dots depends on the screen width
  let resizeTimer = 0;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(buildDots, 150);
  });

  buildDots();
})();


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
    const hit = e.target.closest && e.target.closest('a, button, input, textarea, [role="tab"], .slider-track');
    ring.classList.toggle('hover', Boolean(hit));
  });

  /* ----- hero photo and black hole drift a little against the mouse ----- */
  const hero = document.getElementById('home');
  const visual = document.querySelector('.hero-visual');
  if (!hero || !visual) return;

  let px = 0, py = 0, tx = 0, ty = 0;
  let heroFrame = 0;
  let heroVisible = true;

  function driftHero() {
    px += (tx - px) * 0.08;
    py += (ty - py) * 0.08;
    visual.style.setProperty('--px', px.toFixed(3));
    visual.style.setProperty('--py', py.toFixed(3));
    const done = Math.abs(tx - px) < 0.001 && Math.abs(ty - py) < 0.001;
    heroFrame = (done || !heroVisible) ? 0 : requestAnimationFrame(driftHero);
  }

  window.addEventListener('pointermove', function (e) {
    if (!heroVisible || e.pointerType !== 'mouse') return;
    tx = (e.clientX / window.innerWidth - 0.5) * 2;
    ty = (e.clientY / window.innerHeight - 0.5) * 2;
    if (!heroFrame) heroFrame = requestAnimationFrame(driftHero);
  }, { passive: true });

  new IntersectionObserver(function (entries) {
    heroVisible = entries[0].isIntersecting;
  }).observe(hero);
})();


// ---------- 12. Tech stack graphic: animation only while on screen ----------
// The orbit and chip glow are SVG (SMIL) animations. CSS "reduced motion" rules do not
// reach them, so they are paused here: always with reduced motion, otherwise while off screen.
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


// ---------- 9. Back to top button with a ring that fills as you scroll ----------
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


// ---------- Dark / light theme toggle ----------
(function () {
  const root = document.documentElement;
  const button = document.getElementById('theme-toggle');
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');

  // Update the attribute, the button label and the browser bar color
  function setTheme(theme) {
    root.setAttribute('data-theme', theme);
    button.setAttribute('aria-label', theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
    if (themeColorMeta) themeColorMeta.setAttribute('content', theme === 'light' ? '#faf7f2' : '#050914');
    try {
      localStorage.setItem('theme', theme);
    } catch (error) {
      // Storage blocked: the theme still works, it just is not remembered
    }
  }

  // Match the label to the theme head.js already set
  setTheme(root.getAttribute('data-theme') === 'light' ? 'light' : 'dark');

  button.addEventListener('click', function () {
    setTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
  });
})();
