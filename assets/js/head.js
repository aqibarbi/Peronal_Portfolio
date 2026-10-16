// head.js
// Runs in the <head>, before the page is drawn.
// 1) Adds a "js" class to <html>, so the CSS knows JavaScript is working
//    (the scroll reveal effect only turns on when this class exists).
// 2) Starts Google Analytics. This used to be an inline script in index.html,
//    it lives in a file now so the CSP does not need a hash for it.

document.documentElement.classList.add('js');

// Phones with "Remove animations" / Reduce Motion / Battery saver turned on tell the page
// "reduced motion", and then every animation stayed off.
// true  = play the animations anyway (CSS, main.js and stars.js all read this class)
// false = follow the phone setting again
const ALWAYS_ANIMATE = true;
if (ALWAYS_ANIMATE) document.documentElement.classList.add('always-animate');

// Theme: use the saved choice, otherwise dark. Runs before paint so there is no flash.
try {
  const savedTheme = localStorage.getItem('theme');
  document.documentElement.setAttribute('data-theme', savedTheme === 'light' ? 'light' : 'dark');
} catch (error) {
  document.documentElement.setAttribute('data-theme', 'dark');
}

window.dataLayer = window.dataLayer || [];
function gtag() {
  dataLayer.push(arguments);
}
gtag('js', new Date());
gtag('config', 'G-GMZSLBRW2M');
