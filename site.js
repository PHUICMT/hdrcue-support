// Fills every page with the texts of the language language.js picked, draws the guide's
// pictures and plays the demo while it is on screen. When the visitor picks another language,
// it fills the page again in place and keeps the part being read where it was on the screen.
// Each time the text is in, it sends a site-texts-filled event, with the texts, for the scripts
// that come after it.
(function () {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const page = document.body.dataset.page;

  // In a text, **Add app** marks a name shown in the app, such as a button or page, set in bold,
  // and [label](address) is a link.
  function rich(element, text) {
    const pieces = text.split(/\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)/);
    const nodes = [];
    for (let index = 0; index < pieces.length; index += 4) {
      nodes.push(document.createTextNode(pieces[index]));
      const [name, label, address] = pieces.slice(index + 1, index + 4);
      if (name) {
        const bold = document.createElement('b');
        bold.className = 'ui';
        bold.textContent = name;
        nodes.push(bold);
      } else if (label) {
        const link = document.createElement('a');
        link.href = address;
        link.textContent = label;
        nodes.push(link);
      }
    }
    element.replaceChildren(...nodes);
  }

  // {year} in a text becomes this year, so the copyright line never goes stale.
  const withYear = text => text.replaceAll('{year}', String(new Date().getFullYear()));

  // Texts that go in an attribute: data-i18n-alt="key" sets alt, and so on.
  const attributeTexts = { 'data-i18n-alt': 'alt', 'data-i18n-title': 'title', 'data-i18n-label': 'aria-label' };

  function fill(texts) {
    const title = texts[`meta.${page}.title`];
    const description = texts[`meta.${page}.description`];
    if (title) document.title = title;
    if (description) document.querySelector('meta[name="description"]').content = description;
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const text = texts[element.dataset.i18n];
      if (typeof text === 'string') element.textContent = withYear(text);
    });
    Object.entries(attributeTexts).forEach(([source, attribute]) => {
      document.querySelectorAll(`[${source}]`).forEach(element => {
        const text = texts[element.getAttribute(source)];
        if (typeof text === 'string') element.setAttribute(attribute, text);
      });
    });
    document.querySelectorAll('[data-i18n-rich]').forEach(element => {
      const text = texts[element.dataset.i18nRich];
      if (typeof text === 'string') rich(element, text);
    });
    document.querySelectorAll('[data-i18n-steps], [data-i18n-list]').forEach(list => {
      const key = list.dataset.i18nSteps || list.dataset.i18nList;
      list.replaceChildren(...(texts[key] || []).map(item => {
        const entry = document.createElement('li');
        rich(entry, item);
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
        // A link to how the feature is set up, in the guide.
        if (item.guideLink && texts['pro.howTo']) {
          const link = document.createElement('a');
          link.className = 'how-link';
          link.href = item.guideLink;
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
      // A question left open stays open in another language.
      const wasOpen = [...holder.children].map(details => details.open);
      holder.replaceChildren(...(texts[holder.dataset.i18nQuestions] || []).map((item, index) => {
        const details = document.createElement('details');
        details.open = !!wasOpen[index];
        const summary = document.createElement('summary');
        const answer = document.createElement('div');
        const text = document.createElement('p');
        summary.textContent = item.question;
        answer.className = 'answer';
        rich(text, item.answer);
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

  // The pictures on the Pro cards move only while their card is on screen (site.css). The cards
  // are made again in each language, so each new card is watched.
  const artObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.target.classList.toggle('playing', entry.isIntersecting));
  }, { threshold: 0.25 });

  function playArt() {
    if (reducedMotion) return;
    document.querySelectorAll('.features article').forEach(card => {
      if (card.querySelector('.art')) artObserver.observe(card);
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

  // The guide's pictures of the app's pages, drawn by demo/view.js in the page's language. Done
  // once every picture has its final size.
  function drawWindows(texts) {
    if (typeof DemoView === 'undefined') return Promise.resolve();
    DemoView.setTexts(texts);
    return Promise.all([...document.querySelectorAll('[data-window]')]
      .map(host => DemoView.draw(host, host.dataset.window)));
  }

  // The first element below the header, and how far down the screen it is, so it can be put
  // back there once the page is in another language. Only elements that stay when the text
  // changes count.
  const lastingElements = ['[data-i18n]', '[data-i18n-rich]', '[data-i18n-list]', '[data-i18n-steps]',
    '[data-i18n-questions]', '[data-window]', '.stage'].map(selector => `main ${selector}`).join(', ');

  function readingPlace() {
    const below = document.querySelector('header.top').getBoundingClientRect().bottom;
    const element = [...document.querySelectorAll(lastingElements)]
      .find(candidate => candidate.getBoundingClientRect().bottom > below);
    return element && { element, offset: element.getBoundingClientRect().top };
  }

  function returnTo(place) {
    if (!place) return;
    const moved = place.element.getBoundingClientRect().top - place.offset;
    scrollTo({ top: scrollY + moved, behavior: 'instant' });
  }

  function show(texts) {
    fill(texts);
    playArt();
    document.dispatchEvent(new CustomEvent('site-texts-filled', { detail: texts }));
    return drawWindows(texts);
  }

  revealSections();
  followSections();
  watchDemo();

  SiteLanguage.texts()
    .then(texts => {
      const drawn = show(texts);
      // The text above a linked section was not there when the browser jumped to it, so the
      // jump is made again now that the page has its full length, and again once the pictures
      // above it have taken their final size.
      const linked = location.hash.length > 1 && document.getElementById(location.hash.slice(1));
      if (!linked) return;
      const jump = () => linked.scrollIntoView({ behavior: 'instant' });
      jump();
      drawn.then(jump);
    })
    .catch(() => {
      // The text already in the page stays when the file cannot load.
    });

  // Another language picked: once the new text and the pictures, which can change height, are
  // in, the part being read goes back to where it was on the screen.
  document.addEventListener('site-language-change', () => {
    const place = readingPlace();
    SiteLanguage.texts()
      .then(show)
      .then(() => returnTo(place))
      .catch(() => {
        // The page stays in the language it had.
      });
  });
})();
