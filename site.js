// Fills every page from i18n/<language>.json and plays the walkthrough. The language comes
// from ?lang=, then the visitor's last choice, then the browser; the button switches it.
(function () {
  const languages = ['en', 'th'];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function chooseLanguage() {
    const fromAddress = new URLSearchParams(location.search).get('lang');
    if (languages.includes(fromAddress)) return fromAddress;
    try {
      const saved = localStorage.getItem('language');
      if (languages.includes(saved)) return saved;
    } catch (error) {
      // Storage can be blocked; the browser language decides then.
    }
    return (navigator.language || 'en').toLowerCase().startsWith('th') ? 'th' : 'en';
  }

  function fill(texts, language) {
    document.documentElement.lang = language;
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const text = texts[element.dataset.i18n];
      if (typeof text === 'string') element.textContent = text;
    });
    document.querySelectorAll('[data-i18n-label]').forEach(element => {
      const text = texts[element.dataset.i18nLabel];
      if (typeof text === 'string') {
        element.setAttribute('aria-label', text);
        element.title = text;
      }
    });
    document.querySelectorAll('[data-i18n-list]').forEach(list => {
      list.replaceChildren(...(texts[list.dataset.i18nList] || []).map(item => {
        const entry = document.createElement('li');
        entry.textContent = item;
        return entry;
      }));
    });
    document.querySelectorAll('[data-i18n-questions]').forEach(holder => {
      holder.replaceChildren(...(texts[holder.dataset.i18nQuestions] || []).map(item => {
        const details = document.createElement('details');
        const summary = document.createElement('summary');
        const answer = document.createElement('p');
        summary.textContent = item.question;
        answer.textContent = item.answer;
        details.append(summary, answer);
        return details;
      }));
    });
    document.querySelectorAll('[data-shot]').forEach(image => {
      image.src = `images/${language}/${image.dataset.shot}`;
    });
    if (texts['meta.description']) {
      document.querySelector('meta[name=description]')?.setAttribute('content', texts['meta.description']);
    }
  }

  // The walkthrough: a capture per step, and a pointer that moves to where the click landed,
  // presses, and the next capture appears as if the click had happened.
  const tour = {
    root: document.getElementById('tour'),
    steps: [],
    texts: {},
    folder: '',
    index: 0,
    playing: !reducedMotion,
    timers: [],
  };

  function later(milliseconds, action) {
    tour.timers.push(setTimeout(action, milliseconds));
  }

  function stopTimers() {
    tour.timers.forEach(clearTimeout);
    tour.timers = [];
  }

  function placePointer(click, animate) {
    const pointer = tour.root.querySelector('.pointer');
    pointer.classList.toggle('moving', animate && !reducedMotion);
    pointer.style.opacity = click ? '1' : '0';
    if (click) {
      pointer.style.left = `${click.x * 100}%`;
      pointer.style.top = `${click.y * 100}%`;
    }
  }

  function press() {
    const pointer = tour.root.querySelector('.pointer');
    pointer.classList.remove('pressing');
    void pointer.offsetWidth;
    pointer.classList.add('pressing');
  }

  function showStep(index, animate) {
    stopTimers();
    tour.index = index;
    const step = tour.steps[index];
    const count = tour.steps.length;
    tour.root.querySelector('.frame').src = `${tour.folder}/${step.image}`;
    tour.root.querySelector('.tour-caption').textContent = tour.texts[step.caption] || '';
    tour.root.querySelector('.tour-count').textContent = (tour.texts['tour.step'] || '{n} / {count}')
      .replace('{n}', index + 1).replace('{count}', count);
    updatePlayButton();

    if (!step.click) {
      placePointer(null, false);
      if (tour.playing) later(3500, () => showStep(0, true));
      return;
    }

    if (!tour.playing || !animate) {
      placePointer(step.click, false);
      return;
    }

    // Read the screen for a moment, glide to the target, press, then show the result.
    later(700, () => placePointer(step.click, true));
    later(1700, press);
    later(2100, () => showStep(index + 1, true));
  }

  function updatePlayButton() {
    const button = tour.root.querySelector('[data-tour=play]');
    button.innerHTML = tour.playing ? '&#10074;&#10074;' : '&#9654;';
    const key = tour.playing ? 'tour.pause' : 'tour.play';
    button.setAttribute('aria-label', tour.texts[key] || key);
    button.title = tour.texts[key] || key;
  }

  async function loadTour(language, texts) {
    if (!tour.root) return;
    tour.texts = texts;
    tour.folder = `images/${language}/walkthrough`;
    try {
      const response = await fetch(`${tour.folder}/walkthrough.json`);
      tour.steps = await response.json();
    } catch (error) {
      tour.root.hidden = true;
      return;
    }
    // Load every capture first, so steps change at once like the real window does.
    tour.steps.forEach(step => { new Image().src = `${tour.folder}/${step.image}`; });
    showStep(0, true);
  }

  if (tour.root) {
    tour.root.querySelector('[data-tour=play]').addEventListener('click', () => {
      tour.playing = !tour.playing;
      showStep(tour.index, true);
    });
    tour.root.querySelector('[data-tour=next]').addEventListener('click', () => {
      tour.playing = false;
      showStep((tour.index + 1) % tour.steps.length, false);
    });
    tour.root.querySelector('[data-tour=previous]').addEventListener('click', () => {
      tour.playing = false;
      showStep((tour.index - 1 + tour.steps.length) % tour.steps.length, false);
    });
  }

  async function show(language) {
    try {
      const response = await fetch(`i18n/${language}.json`);
      const texts = await response.json();
      fill(texts, language);
      loadTour(language, texts);
    } catch (error) {
      // The English text already in the page stays when the file cannot load.
    }
  }

  let current = chooseLanguage();
  show(current);

  document.querySelectorAll('.language').forEach(button => {
    button.addEventListener('click', () => {
      current = current === 'th' ? 'en' : 'th';
      try { localStorage.setItem('language', current); } catch (error) { /* not saved */ }
      show(current);
    });
  });
})();
