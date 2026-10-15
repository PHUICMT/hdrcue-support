// The guide's pictures open larger when clicked or tapped. Each picture drawn by demo/view.js
// becomes a button, and the lightbox draws the same picture again as large as the screen
// allows. On a narrow screen it is drawn at a readable size instead and scrolls. A corner icon
// shows a picture can be enlarged whenever it is drawn smaller than its own size. The picture
// grows out of its place on the page and shrinks back into it when the lightbox closes.
(function () {
  if (typeof DemoView === 'undefined') return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  // Closing plays the opening backwards, so its ease-out curve turns into an ease-in.
  const growTiming = { duration: 260, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', fill: 'both' };
  const shrinkTiming = { ...growTiming, duration: 220, direction: 'reverse' };
  const fadeTiming = { duration: 120, easing: 'linear', fill: 'both' };

  // In the lightbox a picture is drawn at least this wide, or at its own size if smaller.
  const readableWidth = 820;
  // Room the lightbox keeps around the picture for its margins, close button and caption.
  const sideRoom = 48;
  const heightRoom = 150;

  const expandIcon = '<svg viewBox="0 0 16 16" aria-hidden="true">'
    + '<path d="M9.5 2.5h4v4M13.5 2.5L9 7M6.5 13.5h-4v-4M2.5 13.5L7 9"/></svg>';
  const closeIcon = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9"/></svg>';

  const labels = { enlarge: 'Enlarge picture: {title}', close: 'Close' };
  const pictureButtons = [];
  let dialog = null;
  let openedFrom = null;
  let animations = [];
  let isClosing = false;

  // The title of the guide part a picture belongs to.
  function titleOf(picture) {
    const part = picture.closest('article');
    const heading = part && part.querySelector('h3, h4');
    return heading ? heading.textContent.trim() : '';
  }

  function labelButton(button) {
    button.setAttribute('aria-label', labels.enlarge.replace('{title}', titleOf(button.firstElementChild)));
  }

  function makeButton(picture) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'picture-button';
    picture.replaceWith(button);
    button.append(picture);
    button.insertAdjacentHTML('beforeend', `<span class="zoom-hint">${expandIcon}</span>`);
    button.addEventListener('click', () => openLightbox(button));
    new ResizeObserver(() => {
      const naturalWidth = Number(picture.dataset.naturalWidth) || 0;
      button.classList.toggle('is-reduced', picture.clientWidth < naturalWidth);
    }).observe(picture);
    labelButton(button);
    pictureButtons.push(button);
  }

  function createDialog() {
    dialog = document.createElement('dialog');
    dialog.className = 'lightbox';
    dialog.innerHTML = `<div class="lightbox-shade"></div>
      <div class="lightbox-body">
        <button type="button" class="lightbox-close close-button" aria-label="${labels.close}">${closeIcon}</button>
        <div class="lightbox-frame"></div>
        <p class="lightbox-caption" id="lightbox-caption"></p>
      </div>`;
    dialog.setAttribute('aria-labelledby', 'lightbox-caption');
    dialog.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
    // A click on the dimmed page around the picture closes it.
    dialog.addEventListener('click', event => {
      if (event.target === dialog || event.target.classList.contains('lightbox-shade')) closeLightbox();
    });
    // Esc closes it the same way, with the picture shrinking back.
    dialog.addEventListener('cancel', event => {
      event.preventDefault();
      closeLightbox();
    });
    dialog.addEventListener('close', () => {
      animations.forEach(animation => animation.cancel());
      animations = [];
      isClosing = false;
      document.documentElement.classList.remove('scroll-locked');
      dialog.querySelector('.lightbox-frame').replaceChildren();
      if (openedFrom) openedFrom.focus();
    });
    document.body.append(dialog);
  }

  function openLightbox(button) {
    const picture = button.firstElementChild;
    if (!dialog) createDialog();
    openedFrom = button;
    dialog.querySelector('.lightbox-caption').textContent = titleOf(picture);
    const naturalWidth = Number(picture.dataset.naturalWidth) || picture.clientWidth;
    const shape = picture.clientWidth / picture.clientHeight;
    const fittingWidth = Math.min(naturalWidth, innerWidth - sideRoom, (innerHeight - heightRoom) * shape);
    const enlarged = document.createElement('div');
    enlarged.className = 'lightbox-picture';
    enlarged.style.width = `${Math.max(fittingWidth, Math.min(naturalWidth, readableWidth))}px`;
    enlarged.style.aspectRatio = getComputedStyle(picture).aspectRatio;
    dialog.querySelector('.lightbox-frame').replaceChildren(enlarged);
    DemoView.draw(enlarged, picture.dataset.window);
    document.documentElement.classList.add('scroll-locked');
    dialog.showModal();
    dialog.querySelector('.lightbox-close').focus();
    animations = animateLightbox(button, true);
  }

  // The picture moves and scales from the button's place to its own (FLIP), while the shade,
  // the close button and the caption fade. With reduced motion everything only fades, quickly.
  function animateLightbox(button, opening) {
    const frame = dialog.querySelector('.lightbox-frame');
    const fade = [{ opacity: 0 }, { opacity: 1 }];
    const timing = reducedMotion.matches
      ? { ...fadeTiming, direction: opening ? 'normal' : 'reverse' }
      : opening ? growTiming : shrinkTiming;
    let growth = fade;
    if (!reducedMotion.matches) {
      const from = button.getBoundingClientRect();
      const to = frame.getBoundingClientRect();
      growth = [
        { transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) `
          + `scale(${from.width / to.width}, ${from.height / to.height})` },
        { transform: 'none' },
      ];
    }
    return [
      frame.animate(growth, timing),
      ...['.lightbox-shade', '.lightbox-close', '.lightbox-caption']
        .map(selector => dialog.querySelector(selector).animate(fade, timing)),
    ];
  }

  // Shrinks the picture back and closes. Halfway through opening, the opening turns around
  // where it is. Clicks and Esc while it closes change nothing.
  async function closeLightbox() {
    if (!dialog.open || isClosing) return;
    isClosing = true;
    const opening = animations.filter(animation => animation.playState === 'running');
    if (opening.length) {
      opening.forEach(animation => animation.reverse());
    } else {
      animations.forEach(animation => animation.cancel());
      animations = animateLightbox(openedFrom, false);
    }
    await Promise.all(animations.map(animation => animation.finished.catch(() => {})));
    if (dialog.open) dialog.close();
  }

  document.querySelectorAll('.guide [data-window]').forEach(makeButton);

  // The labels and the parts' titles come with the page's text.
  document.addEventListener('site-texts-filled', event => {
    const texts = event.detail;
    if (texts['lightbox.enlarge']) labels.enlarge = texts['lightbox.enlarge'];
    if (texts['lightbox.close']) {
      labels.close = texts['lightbox.close'];
      if (dialog) dialog.querySelector('.lightbox-close').setAttribute('aria-label', labels.close);
    }
    pictureButtons.forEach(labelButton);
  });
})();
