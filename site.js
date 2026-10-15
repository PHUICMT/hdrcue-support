// Fills the pages from i18n/en.json, draws the guide's pictures and plays the demo while it is
// on screen.
(function () {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // **Add app** in a text marks a name shown in the app, such as a button or page, in bold.
  function rich(element, text) {
    element.replaceChildren(...text.split(/\*\*(.+?)\*\*/).map((part, index) => {
      if (index % 2 === 0) return document.createTextNode(part);
      const name = document.createElement('b');
      name.className = 'ui';
      name.textContent = part;
      return name;
    }));
  }

  function fill(texts) {
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const text = texts[element.dataset.i18n];
      if (typeof text === 'string') element.textContent = text;
    });
    document.querySelectorAll('[data-i18n-rich]').forEach(element => {
      const text = texts[element.dataset.i18nRich];
      if (typeof text === 'string') rich(element, text);
    });
    document.querySelectorAll('[data-i18n-steps]').forEach(list => {
      list.replaceChildren(...(texts[list.dataset.i18nSteps] || []).map(item => {
        const entry = document.createElement('li');
        rich(entry, item);
        return entry;
      }));
    });
    document.querySelectorAll('[data-i18n-list]').forEach(list => {
      list.replaceChildren(...(texts[list.dataset.i18nList] || []).map(item => {
        const entry = document.createElement('li');
        entry.textContent = item;
        return entry;
      }));
    });
    document.querySelectorAll('[data-i18n-cards]').forEach(holder => {
      holder.replaceChildren(...(texts[holder.dataset.i18nCards] || []).map((item, index) => {
        const card = document.createElement('article');
        const title = document.createElement('h3');
        const text = document.createElement('p');
        title.textContent = item.title;
        text.textContent = item.text;
        // The picture is decoration; the card's text says the same.
        const picture = typeof ProArt !== 'undefined' && ProArt[item.art];
        if (picture) {
          const art = document.createElement('div');
          art.className = 'art';
          art.setAttribute('aria-hidden', 'true');
          // Cards side by side take turns a little, so a row doesn't change all at once.
          art.style.setProperty('--stagger', `${(index % 4) * 0.5}s`);
          art.innerHTML = picture;
          card.append(art);
        }
        card.append(title, text);
        // A link down to how the feature is set up, in the guide.
        if (item.guide && texts['pro.howTo']) {
          const link = document.createElement('a');
          link.className = 'how-link';
          link.href = `#${item.guide}`;
          link.textContent = texts['pro.howTo'];
          const arrow = document.createElement('span');
          arrow.setAttribute('aria-hidden', 'true');
          arrow.textContent = '→';
          link.append(arrow);
          card.append(link);
        }
        return card;
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

  // The pictures on the Pro cards move only while their card is on screen (site.css).
  function playArt() {
    if (reducedMotion) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.target.classList.toggle('playing', entry.isIntersecting));
    }, { threshold: 0.25 });
    document.querySelectorAll('.features article').forEach(card => {
      if (card.querySelector('.art')) observer.observe(card);
    });
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
    const links = [...document.querySelectorAll('.top nav a[href^="#"]')];
    const sections = links.map(link => document.querySelector(link.getAttribute('href')));
    // Links in the footer lead to the same sections and flash them too.
    document.querySelectorAll('.bottom-links a[href^="#"]').forEach(link => {
      const index = links.findIndex(other => other.hash === link.hash);
      if (index >= 0) link.addEventListener('click', () => links[index].click());
    });
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

  // A part of the Pro guide reached from a link, such as a card's "How to set it up", lights
  // its border up once the page has stopped scrolling to it.
  function flashPart(part) {
    const section = part.closest('section');
    if (section) section.classList.add('shown');
    part.classList.remove('arrived');
    let flashed = false;
    const flash = () => {
      if (flashed) return;
      flashed = true;
      part.classList.add('arrived');
    };
    addEventListener('scrollend', flash, { once: true });
    setTimeout(flash, 900);
  }

  function followGuideLinks() {
    document.addEventListener('click', event => {
      const link = event.target.closest('a[href^="#pro-"]');
      const part = link && document.getElementById(link.hash.slice(1));
      if (part) flashPart(part);
    });
  }

  // The guide's pictures of the app's pages, drawn by demo/view.js.
  function drawWindows() {
    if (typeof DemoView === 'undefined') return;
    document.querySelectorAll('[data-window]').forEach(host => DemoView.draw(host, host.dataset.window));
  }

  revealSections();
  followSections();
  followGuideLinks();
  watchDemo();
  drawWindows();

  // no-cache asks the server whether the file changed, so new text shows at once.
  fetch('i18n/en.json', { cache: 'no-cache' })
    .then(response => response.json())
    .then(texts => {
      fill(texts);
      playArt();
      // The text above a linked section was not there when the browser jumped to it, so the
      // jump is made again now that the page has its full length.
      const linked = location.hash.length > 1 && document.getElementById(location.hash.slice(1));
      if (linked) linked.scrollIntoView({ behavior: 'instant' });
      if (linked && linked.matches('.pro-setup article')) flashPart(linked);
    })
    .catch(() => {
      // The text already in the page stays when the file cannot load.
    });
})();
