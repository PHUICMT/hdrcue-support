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

  // The walkthrough is a real recording. Its steps say when each one starts and where its
  // click lands, so the caption, the step bar and a ring on each click follow the video.
  function startTour(texts) {
    const root = document.getElementById('tour');
    if (!root) return;
    const video = root.querySelector('video');
    const mark = root.querySelector('.click-mark');
    const bubble = root.querySelector('.bubble');
    const caption = root.querySelector('.tour-caption');
    const count = root.querySelector('.tour-count');
    const fillBar = root.querySelector('.fill');
    const dots = root.querySelector('.dots');
    const playButton = root.querySelector('[data-tour=play]');
    const playLabel = root.querySelector('.play-label');
    let steps = [];
    let duration = 1;
    let current = -1;
    let lastTime = 0;
    let pausedByVisitor = reducedMotion;

    function stepAt(time) {
      let index = 0;
      steps.forEach((step, position) => { if (step.start <= time + 0.05) index = position; });
      return index;
    }

    function showStep(index) {
      if (index === current) return;
      current = index;
      const text = texts[steps[index].caption] || '';
      caption.textContent = text;
      bubble.querySelector('.bubble-number').textContent = index + 1;
      bubble.querySelector('.bubble-text').textContent = text;
      bubble.classList.remove('show');
      void bubble.offsetWidth;
      bubble.classList.add('show');
      count.textContent = `Step ${index + 1} of ${steps.length}`;
      dots.querySelectorAll('button').forEach((dot, position) => {
        dot.classList.toggle('done', position < index);
        dot.classList.toggle('current', position === index);
      });
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
      fillBar.style.transform = `scaleX(${Math.min(1, time / duration)})`;
      showStep(stepAt(time));
      // A ring on every click the video passed since the last update, but not after a jump.
      if (time >= lastTime && time - lastTime < 0.5) {
        steps.forEach(step => {
          if (step.click && step.click.time > lastTime && step.click.time <= time) {
            showClick(step.click);
          }
        });
      }
      lastTime = time;
    }

    function tick() {
      update();
      if (!video.paused) requestAnimationFrame(tick);
    }

    function setPlaying(playing) {
      root.classList.toggle('paused', !playing);
      playLabel.textContent = texts[playing ? 'tour.pause' : 'tour.play'] || '';
      playButton.setAttribute('aria-pressed', String(!playing));
    }

    function seek(index) {
      const step = steps[(index + steps.length) % steps.length];
      video.currentTime = step.start;
      lastTime = step.start;
      current = -1;
      update();
    }

    video.addEventListener('play', () => { setPlaying(true); requestAnimationFrame(tick); });
    video.addEventListener('pause', () => setPlaying(false));
    video.addEventListener('seeked', update);

    playButton.addEventListener('click', () => {
      if (video.paused) {
        pausedByVisitor = false;
        video.play();
      } else {
        pausedByVisitor = true;
        video.pause();
      }
    });
    root.querySelector('[data-tour=next]').addEventListener('click', () => seek(current + 1));
    root.querySelector('[data-tour=previous]').addEventListener('click', () => seek(current - 1));
    root.querySelector('[data-tour=restart]').addEventListener('click', () => {
      seek(0);
      pausedByVisitor = false;
      video.play();
    });

    fetch('images/walkthrough/walkthrough.json', { cache: 'no-cache' })
      .then(response => response.json())
      .then(walkthrough => {
        steps = walkthrough.steps;
        duration = walkthrough.duration;
        dots.replaceChildren(...steps.map((step, index) => {
          const dot = makeDot(index);
          dot.style.left = `${(step.start / duration) * 100}%`;
          dot.addEventListener('click', () => seek(index));
          return dot;
        }));
        setPlaying(false);
        update();
        // Play while the walkthrough is on screen, unless the visitor paused it.
        new IntersectionObserver(entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting && !pausedByVisitor) video.play().catch(() => {});
            if (!entry.isIntersecting && !video.paused) video.pause();
          });
        }, { threshold: 0.4 }).observe(video);
      })
      .catch(() => { root.hidden = true; });

    function makeDot(index) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'dot';
      dot.setAttribute('aria-label', `Step ${index + 1}`);
      return dot;
    }
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
