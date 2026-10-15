// "Open in HDRcue" buttons. Each element with data-open-app="hdrcue://..." becomes a button that
// opens that page of the app, with a line on what it needs: HDRcue takes hdrcue: links from 1.1
// on, and a browser shows nothing when no app takes the link. The buttons are only for Windows
// PCs, so elsewhere, phones included, the elements are removed. site.js fills in the text.
(function () {
  const storeUrl = 'https://apps.microsoft.com/detail/9P06PWS591LH';

  function isWindowsComputer() {
    const hints = navigator.userAgentData;
    if (hints) return hints.platform === 'Windows' && !hints.mobile;
    return /Windows NT/.test(navigator.userAgent) && !/Mobile|Windows Phone/.test(navigator.userAgent);
  }

  const holders = document.querySelectorAll('[data-open-app]');
  if (!isWindowsComputer()) {
    holders.forEach(holder => holder.remove());
    return;
  }

  holders.forEach(holder => {
    holder.innerHTML = `<a class="button quiet" href="${holder.dataset.openApp}" data-i18n="openApp.button">Open in HDRcue</a>
      <p class="open-app-note"><span data-i18n="openApp.note">Needs HDRcue 1.1 or later. Don't have it?</span>
        <a href="${storeUrl}" data-i18n="openApp.store">Get it from the Microsoft Store</a></p>`;
    holder.hidden = false;
  });
})();
