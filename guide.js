// The guide page. Its contents list marks the part being read, and a part reached by a link,
// from the list, from another part or from the app (guide/#players), lights up once the page
// has stopped scrolling to it.
(function () {
  const contentsLinks = [...document.querySelectorAll('.guide-contents a[href^="#"]')];
  const targetOf = link => document.getElementById(link.hash.slice(1));

  // A part is a section with its heading, or an article inside one.
  function lightUp(part) {
    if (!part || !part.matches('.guide-section, .guide article')) return;
    part.classList.remove('arrived');
    let isLit = false;
    const light = () => {
      if (isLit) return;
      isLit = true;
      // Reading the width restarts the animation when the same part is reached twice.
      void part.offsetWidth;
      part.classList.add('arrived');
    };
    addEventListener('scrollend', light, { once: true });
    setTimeout(light, 900);
  }

  // The contents link of the part in the upper middle of the screen is marked as current.
  function followReading() {
    const linkFor = new Map(contentsLinks.map(link => [targetOf(link), link]));
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        contentsLinks.forEach(link => {
          const isCurrent = link === linkFor.get(entry.target);
          link.classList.toggle('current', isCurrent);
          if (isCurrent) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-25% 0px -65% 0px' });
    linkFor.forEach((link, part) => { if (part) observer.observe(part); });
  }

  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (link) lightUp(targetOf(link));
  });

  // site.js jumps to the linked part again once the text is first in; then it lights up. A
  // change of language later fills the page again without lighting anything.
  document.addEventListener('site-texts-filled', () => {
    if (location.hash.length > 1) lightUp(document.getElementById(location.hash.slice(1)));
  }, { once: true });

  followReading();
})();
