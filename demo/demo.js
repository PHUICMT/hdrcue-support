// Plays the demo: a pointer moves to each control, clicks it, and the window changes the way
// the app does, with a caption for each step. It loops, pauses while the page is hidden, and
// follows {type: 'play'} and {type: 'pause'} messages from the page that embeds it.
(function () {
  const { width, height } = DemoView.size;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Each step: its caption in ../i18n/en.json, the control to click, and where on that
  // control the pointer lands (as a share of its width and height).
  const steps = [
    { caption: 'tour.add', target: 'add', at: [0.55, 0.55] },
    { caption: 'tour.pick', target: 'tile-arena', at: [0.42, 0.55] },
    { caption: 'tour.next', target: 'next', at: [0.5, 0.55] },
    { caption: 'tour.hdr', target: 'hdr-on', at: [0.5, 0.55] },
    { caption: 'tour.next', target: 'next', at: [0.5, 0.55] },
    { caption: 'tour.save', target: 'save', at: [0.5, 0.55] },
    { caption: 'tour.done', target: null },
  ];
  const timing = { start: 600, read: 1100, glide: 750, hover: 250, press: 140, result: 1300, done: 3500, fade: 450 };
  const restingPoint = { x: 740, y: 647 };

  const frame = document.getElementById('frame');
  const stage = document.getElementById('stage');
  const scene = document.getElementById('scene');
  const pointer = document.getElementById('pointer');
  const bubble = document.getElementById('bubble');
  let scale = 1;
  let pointerAt = { ...restingPoint };

  document.documentElement.dataset.motion = reducedMotion ? 'off' : 'on';
  DemoView.mount(document.getElementById('app-window'));

  /* ---------- fit the 1344 x 850 window into whatever size the frame has ---------- */

  function fit() {
    scale = Math.min(innerWidth / width, innerHeight / height);
    Object.assign(frame.style, {
      left: `${(innerWidth - width * scale) / 2}px`,
      top: `${(innerHeight - height * scale) / 2}px`,
      width: `${width * scale}px`,
      height: `${height * scale}px`,
    });
    stage.style.transform = `scale(${scale})`;
  }

  addEventListener('resize', fit);
  fit();

  /* ---------- a clock that only moves while the demo plays ---------- */

  // Waits and pointer moves run on this clock, so pausing stops the tour exactly where it is
  // and resuming carries on from there. Long gaps between frames count as one short frame.
  const clock = { time: 0, last: null, running: false, waits: [], tweens: [] };
  let frameRequest = 0;
  let heldAnimations = [];

  function tick(now) {
    frameRequest = 0;
    if (!clock.running) { clock.last = null; return; }
    if (clock.last !== null) clock.time += Math.min(now - clock.last, 64);
    clock.last = now;
    clock.tweens = clock.tweens.filter(tween => tween(clock.time));
    const due = clock.waits.filter(wait => wait.at <= clock.time);
    clock.waits = clock.waits.filter(wait => wait.at > clock.time);
    due.forEach(wait => wait.resolve());
    frameRequest = requestAnimationFrame(tick);
  }

  function setRunning(running) {
    if (running === clock.running) return;
    clock.running = running;
    if (running) {
      // CSS animations caught mid-way by a pause carry on as well.
      heldAnimations.forEach(animation => animation.play());
      heldAnimations = [];
      clock.last = null;
      if (!frameRequest) frameRequest = requestAnimationFrame(tick);
    } else {
      heldAnimations = document.getAnimations().filter(animation => animation.playState === 'running');
      heldAnimations.forEach(animation => animation.pause());
    }
  }

  const sleep = milliseconds => new Promise(resolve => clock.waits.push({ at: clock.time + milliseconds, resolve }));

  /* ---------- pointer ---------- */

  function placePointer(point) {
    pointerAt = { ...point };
    pointer.style.transform = `translate(${point.x}px, ${point.y}px)`;
  }

  // The point on a control where the pointer clicks, in the window's own 1344 x 850 pixels.
  function pointOn(element, [shareX, shareY]) {
    const box = element.getBoundingClientRect();
    const origin = stage.getBoundingClientRect();
    return {
      x: (box.left - origin.left + box.width * shareX) / scale,
      y: (box.top - origin.top + box.height * shareY) / scale,
    };
  }

  const easeInOut = progress => progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;

  // Moves along a slight curve, the way a hand moves a mouse, easing in and out.
  function glide(to, duration) {
    const from = { ...pointerAt };
    const start = clock.time;
    const distance = Math.hypot(to.x - from.x, to.y - from.y) || 1;
    const bend = Math.min(48, distance * 0.1);
    const control = {
      x: (from.x + to.x) / 2 - (to.y - from.y) / distance * bend,
      y: (from.y + to.y) / 2 + (to.x - from.x) / distance * bend,
    };
    return new Promise(resolve => clock.tweens.push(time => {
      const progress = Math.min(1, (time - start) / duration);
      const eased = easeInOut(progress);
      const along = (start, middle, end) =>
        (1 - eased) * (1 - eased) * start + 2 * (1 - eased) * eased * middle + eased * eased * end;
      placePointer({ x: along(from.x, control.x, to.x), y: along(from.y, control.y, to.y) });
      if (progress < 1) return true;
      resolve();
      return false;
    }));
  }

  function ripple(point) {
    const ring = document.createElement('span');
    ring.className = 'ripple';
    ring.style.left = `${point.x}px`;
    ring.style.top = `${point.y}px`;
    ring.addEventListener('animationend', () => ring.remove());
    scene.append(ring);
  }

  /* ---------- captions ---------- */

  function showCaption(index, texts) {
    bubble.querySelector('.bubble-number').textContent = index + 1;
    bubble.querySelector('.bubble-text').textContent = texts[steps[index].caption] || '';
    bubble.classList.remove('show');
    void bubble.offsetWidth;
    bubble.classList.add('show');
  }

  /* ---------- the tour ---------- */

  async function click(step) {
    const element = DemoView.target(step.target);
    if (!element) return;
    await glide(pointOn(element, step.at), timing.glide);
    element.classList.add('is-hover');
    await sleep(timing.hover);
    element.classList.add('is-press');
    pointer.classList.add('down');
    ripple(pointerAt);
    await sleep(timing.press);
    pointer.classList.remove('down');
    // The new markup has no hover or press classes, so the next render clears them.
    DemoView.act(step.target);
  }

  async function play(texts) {
    for (;;) {
      await sleep(timing.start);
      for (const [index, step] of steps.entries()) {
        showCaption(index, texts);
        await sleep(timing.read);
        if (!step.target) {
          await sleep(timing.done);
          continue;
        }
        await click(step);
        await sleep(timing.result);
      }
      // Fade out, put everything back as it was at the start, and fade in again.
      scene.classList.add('fading');
      bubble.classList.remove('show');
      await sleep(timing.fade);
      DemoView.reset();
      placePointer(restingPoint);
      scene.classList.remove('fading');
      await sleep(timing.fade);
    }
  }

  // Shows the first step without playing it, for visitors who asked for less motion.
  function showStill(texts) {
    showCaption(0, texts);
    const button = DemoView.target(steps[0].target);
    button.classList.add('is-hover');
    placePointer(pointOn(button, steps[0].at));
  }

  // On its own the demo plays at once; inside a page it waits until the page says it is seen.
  let wanted = window.parent === window;
  let ready = false;
  const update = () => setRunning(ready && wanted && !document.hidden);

  addEventListener('message', event => {
    if (event.source !== window.parent || !event.data) return;
    if (event.data.type === 'play') wanted = true;
    else if (event.data.type === 'pause') wanted = false;
    update();
  });
  document.addEventListener('visibilitychange', update);

  placePointer(restingPoint);

  fetch('../i18n/en.json', { cache: 'no-cache' })
    .then(response => response.json())
    .catch(() => ({}))
    .then(texts => {
      const list = document.getElementById('steps');
      list.replaceChildren(...steps.map(step => {
        const item = document.createElement('li');
        item.textContent = texts[step.caption] || '';
        return item;
      }));
      if (reducedMotion) {
        showStill(texts);
        return;
      }
      ready = true;
      play(texts);
      update();
    });
})();
