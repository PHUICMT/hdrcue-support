// Fills the pages from i18n/en.json and plays the walkthrough video.
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

  // The walkthrough is a real recording that loops. Its steps say when each one starts and
  // where its click lands, so the step bubble and a ring on each click follow the video.
  function startTour(texts) {
    const root = document.getElementById('tour');
    if (!root) return;
    const video = root.querySelector('video');
    const mark = root.querySelector('.click-mark');
    const bubble = root.querySelector('.bubble');
    let steps = [];
    let current = -1;
    let lastTime = 0;

    function showStep(index) {
      if (index === current) return;
      current = index;
      bubble.querySelector('.bubble-number').textContent = index + 1;
      bubble.querySelector('.bubble-text').textContent = texts[steps[index].caption] || '';
      bubble.classList.remove('show');
      void bubble.offsetWidth;
      bubble.classList.add('show');
    }

    function showClick(click) {
      mark.style.left = `${click.x * 100}%`;
      mark.style.top = `${click.y * 100}%`;
      mark.classList.remove('pop');
      void mark.offsetWidth;
      mark.classList.add('pop');
    }

    function update() {
      const time = video.currentTime;
      let index = 0;
      steps.forEach((step, position) => { if (step.start <= time + 0.05) index = position; });
      showStep(index);
      // A ring on each click passed since the last frame; none when the video starts over.
      if (time >= lastTime && time - lastTime < 0.5) {
        steps.forEach(step => {
          if (step.click && step.click.time > lastTime && step.click.time <= time) {
            showClick(step.click);
          }
        });
      }
      lastTime = time;
      if (!video.paused) requestAnimationFrame(update);
    }

    video.addEventListener('play', () => requestAnimationFrame(update));

    fetch('images/walkthrough/walkthrough.json', { cache: 'no-cache' })
      .then(response => response.json())
      .then(walkthrough => {
        steps = walkthrough.steps;
        update();
        // Visitors who turned motion down get the player's own controls instead.
        if (reducedMotion) {
          video.controls = true;
          return;
        }
        // Play only while the walkthrough is on screen.
        new IntersectionObserver(entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) video.play().catch(() => {});
            else video.pause();
          });
        }, { threshold: 0.3 }).observe(video);
      })
      .catch(() => { root.hidden = true; });
  }

  // no-cache asks the server whether the file changed, so new text shows at once.
  fetch('i18n/en.json', { cache: 'no-cache' })
    .then(response => response.json())
    .then(texts => {
      fill(texts);
      startTour(texts);
    })
    .catch(() => {
      // The text already in the page stays when the file cannot load.
    });
})();
