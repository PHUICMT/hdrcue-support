// The header and footer every page shares. A page has an empty <header class="top"> and
// <footer class="bottom">, and says on <body> where the site's root is (data-root, such as
// "../") and which page it is (data-page), so the links work from any folder and the page
// being read is marked in the menu. site.js fills in the text afterwards.
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

  const brand = size => `<a class="brand" href="${root}">`
    + `<img src="${root}images/icon.png" alt="" width="${size}" height="${size}">HDRcue</a>`;

  document.querySelector('header.top').innerHTML = `${brand(28)}
    <nav>${link('guide', 'Guide')}${link('help', 'Help')}${link('feedback', 'Feedback')}${link('pro', 'Pro')}${link('privacy', 'Privacy')}</nav>`;

  document.querySelector('footer.bottom').innerHTML = `<div class="bottom-row">
      <div class="bottom-brand">${brand(24)}<p data-i18n="footer.tagline">HDR for the apps you choose</p></div>
      <nav class="bottom-links" aria-label="Footer">
        ${link('guide', 'Guide', false)}${link('help', 'Help', false)}${link('pro', 'Pro', false)}${link('privacy', 'Privacy', false)}
        <a href="${reportUrl}" data-i18n="feedback.bug">Report a problem</a>
        <a href="${sponsorUrl}" data-i18n="footer.sponsor">Sponsor</a>
      </nav>
    </div>
    <p class="copyright" data-i18n="footer.copyright">&copy; ${new Date().getFullYear()} PHUICMT</p>`;
})();
