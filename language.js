// The site's language: English, Thai, Simplified Chinese or Japanese, the same four as the app.
// Every page loads this in <head>, so <html lang> and the font are right before anything shows.
//
// The language comes from ?lang= in the address (the app sends it), else the visitor's earlier
// choice, else the browser's languages. Picking one from the language menus (layout.js leaves a
// place for them in the header and the footer) changes the page in place: the choice is saved,
// ?lang= goes into the address so a shared link keeps it, and a site-language-change event tells
// site.js to fill the page again. A page inside a frame of the site, such as the tour, follows
// the page around it.
const SiteLanguage = (function () {
  // Each language by its own name, Thai's written as escapes since Thai script stays out of
  // code files. Thai takes a web font; the others read well in the fonts Windows, macOS and
  // phones already have (fonts.css lists them).
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'th', name: '\u0E44\u0E17\u0E22', font: 'Noto+Sans+Thai:wght@400;600;700' },
    { code: 'zh-Hans', name: '简体中文' },
    { code: 'ja', name: '日本語' },
  ];
  const fallback = 'en';
  const storageKey = 'hdrcue-language';
  const siteRoot = new URL('./', document.currentScript.src);
  const textsByCode = new Map();

  const isSupported = code => languages.some(language => language.code === code);

  // A language tag such as th-TH, zh-CN or ja to one of the site's languages, or null. Every
  // Chinese tag maps to Simplified Chinese; isTraditionalChinese tells the other kind apart.
  function codeFor(tag) {
    const primary = String(tag).toLowerCase().split('-')[0];
    const code = primary === 'zh' ? 'zh-Hans' : primary;
    return isSupported(code) ? code : null;
  }

  function isTraditionalChinese(tag) {
    const [primary, ...rest] = tag.toLowerCase().split('-');
    if (primary !== 'zh' || rest.includes('hans')) return false;
    return rest.some(part => ['hant', 'tw', 'hk', 'mo'].includes(part));
  }

  // The first of the browser's languages the site has. Someone who reads Traditional Chinese gets
  // another language they listed if the site has it, and Simplified Chinese otherwise.
  function fromBrowser() {
    const tags = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ''];
    const listed = tags.filter(tag => !isTraditionalChinese(tag)).map(codeFor).find(Boolean);
    return listed || (tags.some(isTraditionalChinese) ? 'zh-Hans' : fallback);
  }

  // Browser storage can be blocked or missing; the language then lasts for this page only.
  function readSaved() {
    try { return codeFor(localStorage.getItem(storageKey) || ''); } catch { return null; }
  }

  function save(code) {
    try { localStorage.setItem(storageKey, code); } catch { /* kept for this page only */ }
  }

  // The page that holds this one in a frame, when it is a page of the site.
  function pageAround() {
    try {
      return window.parent !== window && window.parent.location.origin === location.origin ? window.parent : null;
    } catch {
      return null;
    }
  }

  const fromAddress = codeFor(new URLSearchParams(location.search).get('lang') || '');
  const around = pageAround();
  let current = fallback;

  function withLanguage(address, code) {
    const url = new URL(address);
    url.searchParams.set('lang', code);
    return url.href;
  }

  function loadFont(code) {
    const { font } = languages.find(language => language.code === code);
    if (!font || document.querySelector(`link[data-font="${code}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${font}&display=swap`;
    link.dataset.font = code;
    document.head.append(link);
  }

  function apply(code) {
    current = code;
    document.documentElement.lang = code;
    loadFont(code);
  }

  /* ---------- addresses for search engines ---------- */

  // Each language of a page has its own address with ?lang=, and the address without it
  // (x-default) picks the visitor's language. The canonical address follows the language
  // while it is in the address.
  const canonical = document.querySelector('link[rel="canonical"]');
  const plainAddress = canonical && canonical.href;
  const addressIn = code => withLanguage(plainAddress, code);

  function linkAlternates() {
    if (!canonical) return;
    const alternate = (hreflang, href) => Object.assign(document.createElement('link'), { rel: 'alternate', hreflang, href });
    canonical.after(...languages.map(language => alternate(language.code, addressIn(language.code))),
      alternate('x-default', plainAddress));
    if (fromAddress) canonical.href = addressIn(current);
  }

  /* ---------- the language menus ---------- */

  // The header has a button that opens a short list of the languages; the footer lists them in a
  // row. Each language is a link to this page in that language, written in its own language, so
  // it reads right to everyone and still works opened in a new tab. A click changes the page in
  // place instead. layout.js places the popup under its button.
  const globe = '<svg class="icon" viewBox="0 0 16 16" aria-hidden="true">'
    + '<circle cx="8" cy="8" r="6.5"/><path d="M1.5 8h13M8 1.5c-2.2 2.4-2.2 10.6 0 13M8 1.5c2.2 2.4 2.2 10.6 0 13"/></svg>';
  const chevron = '<svg class="icon chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4"/></svg>';
  const nameOf = code => languages.find(language => language.code === code).name;

  const addressFor = code => withLanguage(location.href, code);

  const choicesHtml = () => '<ul class="language-choices">' + languages.map(({ code, name }) =>
    `<li><a href="${addressFor(code)}" hreflang="${code}" lang="${code}" data-language="${code}">${name}</a></li>`).join('')
    + '</ul>';

  function drawMenus() {
    document.querySelectorAll('.language-menu').forEach(holder => {
      holder.innerHTML = `<button type="button" class="language-button" popovertarget="language-popup">${globe}`
        + `<span class="sr-only" data-i18n="language.label">Language</span>`
        + `<span class="language-name"></span>${chevron}</button>`
        + `<div id="language-popup" class="popup" popover>${choicesHtml()}</div>`;
    });
    document.querySelectorAll('.language-list').forEach(holder => {
      holder.innerHTML = `${globe}${choicesHtml()}`;
    });
    markCurrent();
  }

  // The language being read is named on the button and marked in each list.
  function markCurrent() {
    document.querySelectorAll('.language-name').forEach(name => {
      name.textContent = nameOf(current);
      name.lang = current;
    });
    document.querySelectorAll('[data-language]').forEach(link => {
      link.href = addressFor(link.dataset.language);
      if (link.dataset.language === current) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }

  document.addEventListener('click', event => {
    const link = event.target.closest('a[data-language]');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    const popup = link.closest('[popover]');
    if (popup) popup.hidePopover();
    choose(link.dataset.language);
  });

  function choose(code) {
    if (code === current || !isSupported(code)) return;
    apply(code);
    save(code);
    history.replaceState(history.state, '', addressFor(code));
    if (canonical) canonical.href = addressIn(code);
    markCurrent();
    announce();
  }

  const announce = () => document.dispatchEvent(new CustomEvent('site-language-change', { detail: { language: current } }));

  // The texts of a language, from i18n/, asked for once per language. no-cache asks the
  // server whether the file changed, so new text shows at once.
  function textsOf(code = current) {
    if (!textsByCode.has(code)) {
      const request = fetch(new URL(`i18n/${code}.json`, siteRoot), { cache: 'no-cache' })
        .then(response => {
          if (!response.ok) throw new Error(`i18n/${code}.json: ${response.status}`);
          return response.json();
        })
        .catch(error => {
          textsByCode.delete(code);
          throw error;
        });
      textsByCode.set(code, request);
    }
    return textsByCode.get(code);
  }

  /* ---------- start ---------- */

  // The pages are written in English, so another language would show English for a moment
  // before its text arrives. The page stays hidden until then, its text is asked for right
  // away instead of after the page loads, and it shows after a few seconds at the latest.
  const longestHold = 3000;

  function holdUntilTextsShow() {
    if (current === fallback) return;
    const root = document.documentElement;
    const style = document.createElement('style');
    style.textContent = 'html.texts-pending body { visibility: hidden; }';
    document.head.append(style);
    root.classList.add('texts-pending');
    const show = () => root.classList.remove('texts-pending');
    document.addEventListener('site-texts-filled', show, { once: true });
    setTimeout(show, longestHold);
    textsOf().catch(show);
  }

  if (around) {
    apply(codeFor(around.document.documentElement.lang) || fallback);
    holdUntilTextsShow();
    around.document.addEventListener('site-language-change', event => {
      apply(event.detail.language);
      announce();
    });
  } else {
    apply(fromAddress || readSaved() || fromBrowser());
    holdUntilTextsShow();
    // A language that came with a link stays while the visitor moves around the site.
    if (fromAddress) save(fromAddress);
    linkAlternates();
    document.addEventListener('DOMContentLoaded', drawMenus);
  }

  return {
    get current() { return current; },
    texts: textsOf,
  };
})();
