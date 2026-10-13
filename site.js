// Fills every page from i18n/<language>.json. The language comes from ?lang=, then the
// visitor's last choice, then the browser; the button switches between English and Thai.
(function () {
  const languages = ['en', 'th'];

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

  async function show(language) {
    try {
      const response = await fetch(`i18n/${language}.json`);
      fill(await response.json(), language);
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
