// stars.js
// Slowly turning star field drawn on the <canvas id="stars"> in the background.
// It uses the plain 2D canvas, so no Three.js is needed.
//
// How it works:
// - Every star is a point somewhere inside a sphere.
// - Each frame the sphere is turned a little, then every point is squashed
//   onto the screen (points that are further away end up smaller and dimmer).
// - Moving the mouse tilts the sphere slightly, which gives a parallax feel.

(function () {
  const canvas = document.getElementById('stars');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // People can ask their system for less motion. Then we draw one still frame only.
  // (head.js adds the "always-animate" class to skip this check)
  const alwaysAnimate = document.documentElement.classList.contains('always-animate');
  const reduceMotion = !alwaysAnimate && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Fewer stars on phones so older devices stay smooth
  const starCount = window.innerWidth < 768 ? 600 : 1666;
  const sphereRadius = 1.2;

  // The whole sphere is tilted 45 degrees, like the original template
  const tilt = Math.PI / 4;
  const tiltCos = Math.cos(tilt);
  const tiltSin = Math.sin(tilt);

  let width = 0;
  let height = 0;
  let focal = 1;          // how strongly points are scaled by distance
  let angleX = 0;         // current turn of the sphere
  let angleY = 0;
  let mouseX = 0;         // mouse position from -1 to 1
  let mouseY = 0;
  let smoothX = 0;        // mouse position eased over time, so it does not jump
  let smoothY = 0;
  let lastFrame = 0;
  let animationId = 0;

  // Make a list of random stars inside the sphere
  const stars = [];
  while (stars.length < starCount) {
    const x = Math.random() * 2 - 1;
    const y = Math.random() * 2 - 1;
    const z = Math.random() * 2 - 1;
    // keep only points that are inside the sphere
    if (x * x + y * y + z * z <= 1) {
      stars.push({ x: x * sphereRadius, y: y * sphereRadius, z: z * sphereRadius });
    }
  }

  // Match the canvas size to the screen (and sharp screens)
  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    focal = height * 0.65;
    draw();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = document.documentElement.getAttribute('data-theme') === 'light' ? '#64748b' : '#ffffff';

    // Total turn = slow spin + a small tilt from the mouse
    const ax = angleX + smoothY * 0.15;
    const ay = angleY + smoothX * 0.15;
    const cosX = Math.cos(ax);
    const sinX = Math.sin(ax);
    const cosY = Math.cos(ay);
    const sinY = Math.sin(ay);

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];

      // turn around the X axis
      const y1 = s.y * cosX - s.z * sinX;
      const z1 = s.y * sinX + s.z * cosX;
      // turn around the Y axis
      const x2 = s.x * cosY + z1 * sinY;
      const z2 = -s.x * sinY + z1 * cosY;
      // fixed 45 degree tilt
      const x3 = x2 * tiltCos - y1 * tiltSin;
      const y3 = x2 * tiltSin + y1 * tiltCos;

      // The camera sits at z = 1, so distance is 1 - z.
      // Skip stars that are too close to or behind the camera.
      const distance = 1 - z2;
      if (distance < 0.15) continue;

      const px = width / 2 + (x3 / distance) * focal;
      const py = height / 2 - (y3 / distance) * focal;
      if (px < 0 || px > width || py < 0 || py > height) continue;

      // closer stars are bigger and brighter
      const size = Math.min(2.4, Math.max(0.6, 1.8 / (distance + 0.5)));
      ctx.globalAlpha = Math.min(1, Math.max(0.25, 1 - distance / 2.4));
      ctx.fillRect(px, py, size, size);
    }
    ctx.globalAlpha = 1;
  }

  // Animation loop, capped at about 30 frames per second to save battery
  function loop(time) {
    animationId = requestAnimationFrame(loop);
    const elapsed = time - lastFrame;
    if (elapsed < 33) return;
    lastFrame = time;

    const seconds = Math.min(elapsed, 100) / 1000;
    angleX -= seconds / 20;
    angleY -= seconds / 30;
    smoothX += (mouseX - smoothX) * 0.05;
    smoothY += (mouseY - smoothY) * 0.05;
    draw();
  }

  function start() {
    if (!animationId) animationId = requestAnimationFrame(loop);
  }

  function stop() {
    cancelAnimationFrame(animationId);
    animationId = 0;
  }

  // On phones the address bar hides and shows while scrolling. That changes the height a
  // little and fires "resize". Redrawing the canvas each time made the stars flicker.
  // So: skip it when the width is the same and the height changed by less than 200px.
  window.addEventListener('resize', function () {
    if (window.innerWidth === width && Math.abs(window.innerHeight - height) < 200) return;
    resize();
  });
  resize();

  // Nothing else to do for people who want less motion
  if (reduceMotion) return;

  window.addEventListener('pointermove', function (e) {
    mouseX = (e.clientX / width - 0.5) * 2;
    mouseY = (e.clientY / height - 0.5) * 2;
  });

  // Stop drawing while the tab is hidden
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop();
    else start();
  });

  start();
})();
