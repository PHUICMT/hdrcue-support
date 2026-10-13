// Fills the pages from i18n/en.json and plays the demo while it is on screen.
(function () {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function fill(texts) {
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const text = texts[element.dataset.i18n];
      if (typeof text === 'string') element.textContent = text;
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
        const answer = document.createElement('div');
        const text = document.createElement('p');
        summary.textContent = item.question;
        answer.className = 'answer';
        text.textContent = item.answer;
        answer.append(text);
        details.append(summary, answer);
        summary.addEventListener('click', event => {
          event.preventDefault();
          toggleAnswer(details, answer);
          // A mouse click leaves no focus ring; Enter and Space from the keyboard keep it.
          if (event.detail > 0) summary.blur();
        });
        return details;
      }));
    });
    document.querySelectorAll('[data-shot]').forEach(image => {
      image.src = `images/screens/${image.dataset.shot}`;
    });
  }

  // A question opens and closes by sliding its answer, both ways. The browser would show or
  // hide the answer at once, so the open attribute is set before opening and after closing.
  function toggleAnswer(details, answer) {
    const opening = !details.open;
    if (opening) details.open = true;
    details.classList.toggle('opening', opening);
    const full = `${answer.scrollHeight}px`;
    answer.getAnimations().forEach(animation => animation.cancel());
    const animation = answer.animate(
      [{ height: opening ? '0px' : full, opacity: opening ? 0 : 1 },
        { height: opening ? full : '0px', opacity: opening ? 1 : 0 }],
      { duration: reducedMotion ? 0 : 280, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' });
    animation.onfinish = () => { if (!opening) details.open = false; };
  }

  // The demo plays by itself inside its frame. It runs only while it is on screen, so it costs
  // nothing elsewhere on the page. The frame loads lazily, so it hears the state again on load.
  function watchDemo() {
    const frame = document.querySelector('.demo-frame');
    if (!frame) return;
    let visible = false;
    const tell = () => {
      if (frame.contentWindow) frame.contentWindow.postMessage({ type: visible ? 'play' : 'pause' }, location.origin);
    };
    frame.addEventListener('load', tell);
    new IntersectionObserver(entries => {
      entries.forEach(entry => { visible = entry.isIntersecting; });
      tell();
    }, { threshold: 0.3 }).observe(frame);
  }

  // Sections rise in once as they come into view (the styles live in site.css).
  function revealSections() {
    if (reducedMotion) return;
    document.documentElement.classList.add('motion');
    const sections = document.querySelectorAll('main > section:not(.hero)');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('shown');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    sections.forEach(section => observer.observe(section));
  }

  // The menu underlines the section in the middle of the screen, and a section reached from
  // the menu flashes its heading.
  function followSections() {
    const links = [...document.querySelectorAll('nav a[href^="#"]')];
    const sections = links.map(link => document.querySelector(link.getAttribute('href')));
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        links.forEach((link, index) => {
          link.classList.toggle('current', sections[index] === entry.target);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(section => { if (section) observer.observe(section); });

    links.forEach((link, index) => {
      link.addEventListener('click', () => {
        const section = sections[index];
        if (!section) return;
        section.classList.add('shown');
        section.classList.remove('arrived');
        // Flash once the smooth scroll has stopped, or after a moment where scrollend is
        // not supported.
        let flashed = false;
        const flash = () => {
          if (flashed) return;
          flashed = true;
          section.classList.add('arrived');
        };
        addEventListener('scrollend', flash, { once: true });
        setTimeout(flash, 900);
      });
    });
  }

  revealSections();
  followSections();
  watchDemo();

  // no-cache asks the server whether the file changed, so new text shows at once.
  fetch('i18n/en.json', { cache: 'no-cache' })
    .then(response => response.json())
    .then(fill)
    .catch(() => {
      // The text already in the page stays when the file cannot load.
    });
})();
