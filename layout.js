// The header and footer every page shares. A page has an empty <header class="top"> and
// <footer class="bottom">, and says on <body> where the site's root is (data-root, such as
// "../") and which page it is (data-page), so the links work from any folder and the page
// being read is marked in the menu. On a phone the menu folds into a button that opens it as a
// popup. Both the header and the footer leave a place for the languages, which language.js
// fills. site.js fills in the text afterwards.
(function () {
  const root = document.body.dataset.root || './';
  const page = document.body.dataset.page;
  // The home page links its own sections by hash alone, so the menu can follow them.
  const home = page === 'home' ? '' : root;
  const reportUrl = 'https://github.com/PHUICMT/hdrcue-support/issues/new?template=problem.yml';
  const sponsorUrl = 'https://github.com/sponsors/PHUICMT';
  const destinations = {
    guide: `${root}guide/`,
    help: `${home}#help`,
    feedback: `${home}#feedback`,
    pro: `${home}#pro`,
    privacy: `${root}privacy.html`,
  };

  const link = (name, label, marksPage = true) => {
    const current = marksPage && name === page ? ' class="current" aria-current="page"' : '';
    return `<a href="${destinations[name]}" data-i18n="nav.${name}"${current}>${label}</a>`;
  };

  const menuLinks = `${link('guide', 'Guide')}${link('help', 'Help')}${link('feedback', 'Feedback')}`
    + `${link('pro', 'Pro')}${link('privacy', 'Privacy')}`;

  const brand = size => `<a class="brand" href="${root}">`
    + `<img src="${root}images/icon.png" alt="" width="${size}" height="${size}">HDRcue</a>`;

  const menuIcon = '<svg class="icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 4h12M2 8h12M2 12h12"/></svg>';

  document.querySelector('header.top').innerHTML = `${brand(28)}
    <nav class="top-links">${menuLinks}</nav>
    <div class="language-menu"></div>
    <button type="button" class="menu-button" popovertarget="site-menu">${menuIcon}<span class="sr-only" data-i18n="nav.menu">Menu</span></button>
    <div id="site-menu" class="popup" popover><nav>${menuLinks}</nav></div>`;

  document.querySelector('footer.bottom').innerHTML = `<div class="bottom-row">
      <div class="bottom-brand">${brand(24)}<p data-i18n="footer.tagline">HDR for the apps you choose</p></div>
      <nav class="bottom-links" aria-label="Site links" data-i18n-label="footer.menu">
        ${link('guide', 'Guide', false)}${link('help', 'Help', false)}${link('pro', 'Pro', false)}${link('privacy', 'Privacy', false)}
        <a href="${reportUrl}" data-i18n="feedback.bug">Report a problem</a>
        <a href="${sponsorUrl}" data-i18n="footer.sponsor">Sponsor</a>
      </nav>
    </div>
    <div class="bottom-end">
      <p class="copyright" data-i18n="footer.copyright">&copy; ${new Date().getFullYear()} PHUICMT</p>
      <div class="language-list"></div>
    </div>`;

  // A popup in the header opens just under the button that opens it, lined up with its right
  // edge. The browser closes it on a tap outside it or on Esc, and the menu's popup also closes
  // once one of its links is followed.
  document.addEventListener('beforetoggle', event => {
    const popup = event.target;
    if (event.newState !== 'open' || !popup.classList.contains('popup')) return;
    const button = document.querySelector(`[popovertarget="${popup.id}"]`).getBoundingClientRect();
    popup.style.top = `${button.bottom + 6}px`;
    popup.style.right = `${document.documentElement.clientWidth - button.right}px`;
  }, true);

  const siteMenu = document.getElementById('site-menu');
  siteMenu.addEventListener('click', event => {
    if (event.target.closest('a')) siteMenu.hidePopover();
  });
})();
