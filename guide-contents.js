// The guide's contents on a phone, where the whole list would fill the first screen. The top of
// the guide shows a card for each group of the list instead, each a link to its group. Once the
// cards have scrolled away, a bar under the header names the part being read (guide.js says
// which), and tapping it opens the list as a sheet from the bottom of the screen. On a wider
// screen the list stays beside the guide.
(function () {
  const phone = matchMedia('(max-width: 720px)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const header = document.querySelector('header.top');
  const list = document.querySelector('.contents-list');
  const sideContents = document.querySelector('.guide-contents');
  const cards = document.querySelector('.contents-cards');
  const bar = document.querySelector('.contents-bar');
  const barCurrent = bar.querySelector('.contents-bar-current');
  const sheet = document.getElementById('contents-sheet');
  const sheetTop = sheet.querySelector('.contents-sheet-top');
  const sheetBody = sheet.querySelector('.contents-sheet-body');

  const ease = 'cubic-bezier(0.2, 0.8, 0.2, 1)';
  // Dragged down further than this, the sheet closes when let go.
  const closingDrag = 96;

  const icon = path => `<svg class="icon" viewBox="0 0 16 16" aria-hidden="true">${path}</svg>`;
  const groupIcons = {
    'getting-started': icon('<path d="M3.5 14.5V2M3.5 2.5h9l-2 3 2 3h-9"/>'),
    rules: icon('<path d="M6 4h7.5M6 8h7.5M6 12h7.5M2.5 4h.5M2.5 8h.5M2.5 12h.5"/>'),
    players: icon('<rect x="1.5" y="3" width="13" height="10" rx="2"/><path d="M6.5 6v4l3.5-2z"/>'),
    backup: icon('<path d="M4.5 12.5a3 3 0 0 1-.3-6 4 4 0 0 1 7.6 0 3 3 0 0 1-.3 6M8 14V8.5M6 10.5l2-2 2 2"/>'),
    'pro-setup': icon('<path d="M8 1.5l1.5 5 5 1.5-5 1.5-1.5 5-1.5-5-5-1.5 5-1.5z"/>'),
  };

  let topicCountText = '{count} topics';
  let currentLink = null;
  let sheetAnimations = [];
  let isClosing = false;

  /* ---------- the cards ---------- */

  // Each card takes its group's name from the list, so both follow the language together.
  function drawCards() {
    cards.querySelector('ul').replaceChildren(...[...list.children].map(group => {
      const groupLink = group.querySelector(':scope > a');
      const item = document.createElement('li');
      item.innerHTML = `<a class="contents-card" href="${groupLink.hash}">${groupIcons[groupLink.hash.slice(1)]}`
        + `<span class="contents-card-name" data-i18n="${groupLink.dataset.i18n}"></span>`
        + `<span class="contents-card-count" data-topic-count="${group.querySelectorAll('li').length}"></span></a>`;
      item.querySelector('.contents-card-name').textContent = groupLink.textContent;
      return item;
    }));
    countTopics();
  }

  function countTopics() {
    cards.querySelectorAll('[data-topic-count]').forEach(count => {
      count.textContent = topicCountText.replace('{count}', count.dataset.topicCount);
    });
  }

  /* ---------- the bar ---------- */

  function showCurrent(link) {
    currentLink = link || null;
    barCurrent.textContent = currentLink ? currentLink.textContent : '';
  }

  // The bar shows once the cards have gone up under the header.
  function showBarPastCards() {
    new IntersectionObserver(([entry]) => {
      const isPast = !entry.isIntersecting && entry.boundingClientRect.top < entry.rootBounds.top;
      bar.classList.toggle('shown', isPast);
    }, { rootMargin: `-${header.offsetHeight}px 0px 0px 0px` }).observe(cards);
  }

  // The bar sits right under the header, and parts the page scrolls to stop below both.
  function trackHeaderHeight() {
    new ResizeObserver(() => {
      document.documentElement.style.setProperty('--header-height', `${header.offsetHeight}px`);
    }).observe(header);
  }

  /* ---------- the sheet ---------- */

  function openSheet() {
    if (sheet.open) return;
    document.documentElement.classList.add('scroll-locked');
    sheet.showModal();
    bar.setAttribute('aria-expanded', 'true');
    revealCurrent();
    playSheet(true);
  }

  // Slides the sheet down from where it is, then closes it. Taps and Esc while it closes
  // change nothing.
  async function closeSheet(draggedBy = 0) {
    if (!sheet.open || isClosing) return;
    isClosing = true;
    await playSheet(false, draggedBy);
    sheet.close();
  }

  // The sheet rises from the bottom while the page behind dims, and closing plays it backwards
  // from wherever a drag left it. With reduced motion it only fades, quickly.
  function playSheet(opening, draggedBy = 0) {
    sheetAnimations.forEach(animation => animation.cancel());
    const dim = [{ opacity: 0 }, { opacity: 1 }];
    const rise = [{ transform: 'translateY(100%)' }, { transform: `translateY(${draggedBy}px)` }];
    const timing = {
      duration: reducedMotion.matches ? 120 : opening ? 280 : 220,
      easing: ease,
      direction: opening ? 'normal' : 'reverse',
      fill: opening ? 'backwards' : 'forwards',
    };
    sheetAnimations = [
      sheet.animate(reducedMotion.matches ? dim : rise, timing),
      sheet.animate(dim, { ...timing, pseudoElement: '::backdrop' }),
    ];
    return Promise.all(sheetAnimations.map(animation => animation.finished.catch(() => {})));
  }

  // The part being read is in the middle of the list and has the focus, so the keyboard
  // starts from it.
  function revealCurrent() {
    const link = currentLink || list.querySelector('a');
    sheetBody.scrollTop = link.offsetTop - (sheetBody.clientHeight - link.offsetHeight) / 2;
    link.focus({ preventScroll: true });
  }

  // The top of the sheet follows a finger or the mouse down, and closes when let go far enough
  // down; otherwise it springs back.
  function dragSheet(event) {
    if (event.button !== 0 || event.target.closest('button') || isClosing) return;
    const startY = event.clientY;
    let draggedBy = 0;
    const drag = new AbortController();
    sheetAnimations.forEach(animation => animation.cancel());
    sheetTop.setPointerCapture(event.pointerId);
    sheetTop.addEventListener('pointermove', moveEvent => {
      draggedBy = Math.max(0, moveEvent.clientY - startY);
      sheet.style.transform = `translateY(${draggedBy}px)`;
    }, { signal: drag.signal });
    const letGo = () => {
      drag.abort();
      sheet.style.transform = '';
      if (draggedBy > closingDrag) closeSheet(draggedBy);
      else if (draggedBy > 0) {
        sheet.animate([{ transform: `translateY(${draggedBy}px)` }, { transform: 'none' }], { duration: 200, easing: ease });
      }
    };
    sheetTop.addEventListener('pointerup', letGo, { signal: drag.signal });
    sheetTop.addEventListener('pointercancel', letGo, { signal: drag.signal });
  }

  // A topic chosen in the sheet: the page may scroll again at once, so it scrolls to the topic
  // while the sheet slides away.
  function chooseTopic() {
    document.documentElement.classList.remove('scroll-locked');
    closeSheet();
  }

  // The list sits beside the guide on a wide screen and in the sheet on a phone.
  function placeList() {
    (phone.matches ? sheetBody : sideContents).append(list);
    if (!phone.matches && sheet.open) sheet.close();
  }

  bar.addEventListener('click', openSheet);
  sheet.querySelector('.close-button').addEventListener('click', () => closeSheet());
  sheetTop.addEventListener('pointerdown', dragSheet);
  // A tap on the dimmed page around the sheet closes it, as does choosing a topic.
  sheet.addEventListener('click', event => {
    if (event.target === sheet) closeSheet();
    else if (event.target.closest('a[href^="#"]')) chooseTopic();
  });
  sheet.addEventListener('cancel', event => {
    event.preventDefault();
    closeSheet();
  });
  sheet.addEventListener('close', () => {
    sheetAnimations.forEach(animation => animation.cancel());
    sheetAnimations = [];
    isClosing = false;
    document.documentElement.classList.remove('scroll-locked');
    bar.setAttribute('aria-expanded', 'false');
    bar.focus({ preventScroll: true });
  });

  document.addEventListener('guide-reading', event => showCurrent(event.detail.link));
  document.addEventListener('site-texts-filled', event => {
    topicCountText = event.detail['guide.topicCount'] || topicCountText;
    countTopics();
    showCurrent(currentLink);
  });

  phone.addEventListener('change', placeList);
  placeList();
  drawCards();
  trackHeaderHeight();
  showBarPastCards();
})();
