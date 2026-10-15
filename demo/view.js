// The HDRcue window for the demo: its state, its markup and a small DOM patcher. The patcher
// keeps the nodes that stay, so CSS transitions run when a class changes, and inserts new nodes,
// so their entrance animations run, the same way the app animates between states.
const DemoView = (function () {
  const text = {
    title: 'HDRcue',
    addTitle: 'HDRcue · Add app',
    rules: 'Rules',
    settings: 'Settings',
    pause: 'Pause',
    rulesLead: 'What each display does when an app opens',
    addApp: 'Add app',
    rightNow: 'Right now',
    nowBy: 'HDR on · for Cinema Player',
    nowNone: 'SDR · no active rule',
    apps: count => `Apps (${count})`,
    games: count => `Games (${count})`,
    when: { open: 'While open', front: 'In front', full: 'Full screen' },
    pro: 'PRO',
    active: 'Active',
    waiting: 'Waiting',
    off: 'Off',
    steps: ['Choose app', 'Display settings', 'When'],
    chooseLead: 'Easiest way: open the app, then pick it from the first tab.',
    openNow: 'Open now',
    allApps: 'All apps',
    search: 'Search apps and games',
    hasRule: 'Has a rule',
    browse: 'Browse for .exe…',
    displayTitle: app => `What should happen when ${app} opens?`,
    displayLead: 'Pick a display, then choose what changes. Leave the rest as is.',
    hdrDescription: 'Brighter, richer color for HDR movies and games',
    keep: "Don't change",
    on: 'On',
    offButton: 'Off',
    whenLead: 'When the app closes or the condition ends, the display always goes back.',
    whenChoices: [
      { id: 'open', title: 'While the app is open', description: 'Simplest. Changes as soon as the app opens.' },
      { id: 'front', title: 'While the app is in front', description: 'Goes back when you switch to another app' },
      { id: 'full', title: 'While the app is full screen', description: 'Good for games and video players' },
    ],
    recommended: 'Recommended',
    sentence: (app, display) => `When <b>${app}</b> is open → <b>${display}</b>: HDR <span class="k">on</span>`,
    goesBack: app => `Goes back when ${app} closes`,
    cancel: 'Cancel',
    back: 'Back',
    next: 'Next',
    addRule: 'Add rule',
  };

  // Made-up apps with letter icons in the app's own icon colors. Games are listed apart from
  // apps, on the rules page and when choosing an app.
  const apps = {
    cinema: { name: 'Cinema Player', color: '#0a84ff' },
    music: { name: 'Music Box', color: '#e34d8c' },
    racer: { name: 'Night Racer', color: '#5b6b7f', game: true },
    notes: { name: 'Notes', color: '#5b6b7f' },
    arena: { name: 'Space Arena', color: '#1f9d7a' },
    cutter: { name: 'Video Cutter', color: '#e34d8c' },
    photo: { name: 'Photo Studio', color: '#d97a1c' },
  };
  const openApps = ['cinema', 'music', 'notes', 'arena', 'cutter', 'racer'];

  // The desk layout of the screenshots: a wide main display and a smaller one to its left.
  const displays = [
    { id: 'left', name: 'Left display', x: -2560, y: -40, width: 2560, height: 1080, hertz: 144, hdr: false },
    { id: 'main', name: 'Main display', x: 0, y: 0, width: 3440, height: 1440, hertz: 175, hdr: true },
  ];

  const svg = (body, className = 'i', box = 16) =>
    `<svg class="${className}" viewBox="0 0 ${box} ${box}" aria-hidden="true">${body}</svg>`;

  function gear() {
    const point = (radius, degrees) => {
      const angle = (degrees - 90) * Math.PI / 180;
      return `${(8 + radius * Math.cos(angle)).toFixed(2)} ${(8 + radius * Math.sin(angle)).toFixed(2)}`;
    };
    let path = '';
    for (let tooth = 0; tooth < 8; tooth++) {
      const middle = tooth * 45;
      path += `${tooth ? 'L' : 'M'}${point(5.3, middle - 15)} L${point(6.9, middle - 8)} `;
      path += `L${point(6.9, middle + 8)} L${point(5.3, middle + 15)} `;
    }
    return svg(`<path d="${path}Z"/><circle cx="8" cy="8" r="2.2"/>`);
  }

  const icon = {
    monitor: svg('<rect x="1.5" y="2.5" width="13" height="9" rx="1"/><path d="M8 11.5v2.3M5 13.8h6"/>'),
    gear: gear(),
    pause: svg('<rect x="3.5" y="2.5" width="3" height="11" rx="0.8"/><rect x="9.5" y="2.5" width="3" height="11" rx="0.8"/>'),
    plus: svg('<path d="M8 2v12M2 8h12"/>'),
    more: svg('<circle cx="3" cy="8" r="1"/><circle cx="8" cy="8" r="1"/><circle cx="13" cy="8" r="1"/>', 'i dots'),
    search: svg('<circle cx="6.5" cy="6.5" r="4.7"/><path d="M10 10l4.3 4.3"/>'),
    folder: svg('<path d="M1.5 4a1 1 0 0 1 1-1h3.4l1.6 1.6h6a1 1 0 0 1 1 1v6.9a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1z"/><path d="M1.5 6.2h13"/>'),
    check: svg('<path d="M3 8.6l3.1 3.1L13 4.7"/>'),
    sun: svg('<circle cx="8" cy="8" r="2.7"/><path d="M8 1.6v1.3M8 13.1v1.3M1.6 8h1.3M13.1 8h1.3M3.5 3.5l.9.9M11.6 11.6l.9.9M3.5 12.5l.9-.9M11.6 4.4l.9-.9"/>'),
    // The "when" choices: two windows for while open, a window brought out for in front, and
    // arrows to the corners for full screen.
    open: svg('<rect x="1.5" y="5.5" width="9" height="9" rx="1.2"/><path d="M5.5 5.5V2.7a1.2 1.2 0 0 1 1.2-1.2h6.6a1.2 1.2 0 0 1 1.2 1.2v6.6a1.2 1.2 0 0 1-1.2 1.2h-2.8"/>'),
    front: svg('<path d="M13.5 9.5v3.8a1.2 1.2 0 0 1-1.2 1.2H2.7a1.2 1.2 0 0 1-1.2-1.2V3.7a1.2 1.2 0 0 1 1.2-1.2h3.8"/><path d="M9.5 1.5h5v5M14.5 1.5L8 8"/>'),
    full: svg('<path d="M9.5 1.5h5v5M14.5 1.5l-5 5M6.5 14.5h-5v-5M1.5 14.5l5-5"/>'),
    minimize: svg('<path d="M0.5 5h9"/>', 'i', 10),
    maximize: svg('<rect x="0.5" y="0.5" width="9" height="9" rx="1"/>', 'i', 10),
    close: svg('<path d="M0.5 0.5l9 9M9.5 0.5l-9 9"/>', 'i', 10),
  };

  const initialState = () => ({
    page: 'rules',
    rules: [
      { app: 'cinema', when: 'open', hdr: 'on', enabled: true, status: 'active' },
      { app: 'photo', when: 'front', hdr: 'off', enabled: false, status: 'waiting' },
      { app: 'racer', when: 'full', hdr: 'on', enabled: true, status: 'waiting' },
    ],
    wizard: null,
  });

  let state = initialState();
  let root = null;

  /* ---------- markup ---------- */

  const appIcon = id => `<span class="appic" style="background:${apps[id].color}">${apps[id].name[0]}</span>`;
  // Shown on Pro options until Pro is bought, so also during the trial the demo shows.
  const proBadge = (size = '') => `<span class="probadge ${size}">${text.pro}</span>`;
  const isGame = id => !!apps[id].game;

  // "Apps (2)" or "Games (1)" and what is under it; nothing for an empty group.
  const groupHtml = (key, heading, count, body, first = false) => count
    ? `<div class="group" data-key="group-${key}"><div class="sect ${first ? 'first' : ''}">${heading(count)}</div>${body}</div>`
    : '';

  function windowHtml() {
    const wizard = state.page === 'wizard';
    return `<div class="tb"><img class="logo" src="../images/icon.png" alt=""><span>${wizard ? text.addTitle : text.title}</span>
      <div class="caps"><span>${icon.minimize}</span><span>${icon.maximize}</span><span>${icon.close}</span></div></div>
      <div class="wbody">${navHtml()}<div class="wc" data-key="wc-${state.page}">${wizard ? wizardHtml() : rulesHtml()}</div></div>`;
  }

  function navHtml() {
    return `<div class="wnav"><span class="navind"></span>
      <a class="on">${icon.monitor}${text.rules}</a><a>${icon.gear}${text.settings}</a>
      <span class="spacer"></span><a>${icon.pause}${text.pause}</a></div>`;
  }

  function rulesHtml() {
    const nowCard = (name, line, hdr) => `<div class="card">${icon.monitor}<div class="grow"><b>${name}</b>
      <div class="small muted">${line}</div></div><span class="chip ${hdr ? '' : 'mute'}">${hdr ? 'HDR' : 'SDR'}</span></div>`;
    return `<div class="row head"><div class="grow"><h1>${text.rules}</h1><p class="lead">${text.rulesLead}</p></div>
        <button class="btn primary" data-target="add">${icon.plus}${text.addApp}</button></div>
      <div class="sect first">${text.rightNow}</div>
      <div class="now">${nowCard('Main display', text.nowBy, true)}${nowCard('Left display', text.nowNone, false)}</div>
      ${ruleGroupHtml('apps', text.apps, state.rules.filter(rule => !isGame(rule.app)))}
      ${ruleGroupHtml('games', text.games, state.rules.filter(rule => isGame(rule.app)))}`;
  }

  function ruleGroupHtml(key, heading, rules) {
    return groupHtml(key, heading, rules.length, `<div class="list">${rules.map(ruleHtml).join('')}</div>`);
  }

  function ruleHtml(rule, index) {
    const pill = !rule.enabled
      ? `<span class="pill"><span class="dot"></span>${text.off}</span>`
      : rule.status === 'active'
        ? `<span class="pill ok"><span class="dot"></span>${text.active}</span>`
        : `<span class="pill"><span class="dot"></span>${text.waiting}</span>`;
    return `<div class="card rule ${rule.enabled ? '' : 'off'}" data-key="rule-${rule.app}" style="--d:${index}">${appIcon(rule.app)}
      <div class="grow"><div class="line1"><b>${apps[rule.app].name}</b></div>
        <div class="line2"><span class="tag">${icon[rule.when]}${text.when[rule.when]}${rule.when === 'full' ? proBadge('small') : ''}</span>
          <span class="tag">${icon.monitor}Main display</span><span class="tag change">HDR ${rule.hdr}</span></div></div>
      ${pill}<span class="tgl ${rule.enabled ? 'on' : ''}"></span><span class="iconbtn">${icon.more}</span></div>`;
  }

  function wizardHtml() {
    const wizard = state.wizard;
    const step = number => {
      const status = wizard.step === number ? 'on' : wizard.step > number ? 'done' : '';
      return `<div class="s ${status}"><span class="n">${wizard.step > number ? icon.check : number}</span>${text.steps[number - 1]}</div>`;
    };
    const line = number => `<span class="line ${wizard.step > number ? 'done' : ''}"></span>`;
    const steps = `<div class="steps">${step(1)}${line(1)}${step(2)}${line(2)}${step(3)}</div>`;
    const bodies = { 1: chooseAppHtml, 2: displayHtml, 3: whenHtml };
    const canGoOn = wizard.step === 1 ? !!wizard.app : wizard.step === 2 ? wizard.hdr !== 'keep' : true;
    const forward = wizard.step < 3
      ? `<button class="btn primary" data-key="next" data-target="next" ${canGoOn ? '' : 'disabled'}>${text.next}</button>`
      : `<button class="btn primary fadein" data-key="save" data-target="save">${text.addRule}</button>`;
    const foot = `<div class="wfoot"><button class="btn">${text.cancel}</button><span class="grow"></span>
      ${wizard.step > 1 ? `<button class="btn fadein" data-key="back">${text.back}</button>` : ''}${forward}</div>`;
    return `${steps}<div class="stepbody" data-key="step-${wizard.step}" style="--dx:28px">${bodies[wizard.step]()}</div>${foot}`;
  }

  function chooseAppHtml() {
    const tile = (id, index) => {
      const hasRule = state.rules.some(rule => rule.app === id);
      const sub = hasRule
        ? `<div class="sub has">${icon.check}${text.hasRule}</div>`
        : `<div class="sub">${apps[id].name}.exe</div>`;
      return `<div class="tile ${state.wizard.app === id ? 'sel' : ''}" data-key="tile-${id}" data-target="tile-${id}" style="--d:${index}">
        ${appIcon(id)}<div><div class="name">${apps[id].name}</div>${sub}</div><span class="run"></span></div>`;
    };
    return `<h1>${text.steps[0]}</h1><p class="lead">${text.chooseLead}</p>
      <div class="row tabsrow"><div class="tabs"><a class="on">${text.openNow}</a><a>${text.allApps}</a></div>
        <div class="search">${icon.search}<span>${text.search}</span></div></div>
      ${tileGroupHtml('apps', text.apps, openApps.filter(id => !isGame(id)), tile, 0, true)}
      ${tileGroupHtml('games', text.games, openApps.filter(isGame), tile, openApps.filter(id => !isGame(id)).length)}
      <button class="btn ghost browse">${icon.folder}${text.browse}</button>`;
  }

  function tileGroupHtml(key, heading, ids, tile, firstIndex, first = false) {
    const tiles = ids.map((id, index) => tile(id, firstIndex + index)).join('');
    return groupHtml(key, heading, ids.length, `<div class="grid">${tiles}</div>`, first);
  }

  function displayHtml() {
    const wizard = state.wizard;
    const options = [['keep', text.keep], ['on', text.on], ['off', text.offButton]];
    const chosen = options.findIndex(([value]) => value === wizard.hdr);
    const segments = options.map(([value, label]) =>
      `<button class="${value === wizard.hdr ? 'on' : ''}" data-target="hdr-${value}">${label}</button>`).join('');
    return `<h1>${text.displayTitle(apps[wizard.app].name)}</h1><p class="lead">${text.displayLead}</p>
      ${mapHtml()}
      <div class="card box hdrcard"><div class="opt">${icon.sun}<div class="label">HDR<small>${text.hdrDescription}</small></div>
        <div class="seg" style="--n:3;--i:${chosen}">${segments}</div></div></div>`;
  }

  // Displays drawn to scale where Windows places them, 600 px across like the app.
  function mapHtml() {
    const left = -2560, right = 3440, top = -40, bottom = 1440, width = 600;
    const scale = width / (right - left);
    const tiles = displays.map(display => {
      const selected = display.id === 'main';
      const badge = selected && state.wizard.hdr !== 'keep'
        ? `<span class="badge" data-key="badge-${state.wizard.hdr}">HDR ${state.wizard.hdr}</span>` : '';
      const place = `left:${(display.x - left) * scale + 3}px;top:${(display.y - top) * scale + 3}px;`
        + `width:${display.width * scale - 6}px;height:${display.height * scale - 6}px`;
      return `<div class="mon ${selected ? 'sel' : ''}" data-key="mon-${display.id}" style="${place}">${badge}
        <b>${display.name}</b><small>${display.width} × ${display.height} · ${display.hertz} Hz</small>
        <span class="chip ${display.hdr ? '' : 'mute'}">${display.hdr ? 'HDR' : 'SDR'}</span></div>`;
    }).join('');
    return `<div class="map" style="width:${width}px;height:${(bottom - top) * scale}px">${tiles}</div>`;
  }

  function whenHtml() {
    const name = apps[state.wizard.app].name;
    return `<h1>${text.steps[2]}</h1><p class="lead">${text.whenLead}</p>
      ${text.whenChoices.map(whenChoiceHtml).join('')}
      <div class="card summary"><div class="sentence">${text.sentence(name, 'Main display')}</div>
        <div class="small muted">${text.goesBack(name)}</div></div>`;
  }

  // A choice with its radio, icon, title and description, "Recommended" on the first and the
  // PRO badge on full screen. The demo keeps the first choice.
  function whenChoiceHtml(choice, index) {
    const badge = choice.id === 'full' ? proBadge() : '';
    const recommended = choice.id === 'open' ? `<span class="pill plain">${text.recommended}</span>` : '';
    return `<div class="radio ${choice.id === 'open' ? 'on' : ''}" style="--d:${index}"><span class="r"></span>${icon[choice.id]}
        <div class="grow"><div class="title"><b>${choice.title}</b>${badge}</div><div class="small muted">${choice.description}</div></div>
        ${recommended}</div>`;
  }

  /* ---------- patcher ---------- */

  function morph(container, html) {
    const template = document.createElement('template');
    template.innerHTML = html;
    morphChildren(container, template.content);
  }

  const keyOf = node => node.nodeType === 1 ? node.getAttribute('data-key') : null;
  const sameKind = (a, b) => a.nodeType === b.nodeType && (a.nodeType !== 1 || a.tagName === b.tagName);

  function morphChildren(oldParent, newParent) {
    const keyed = new Map();
    oldParent.childNodes.forEach(node => { const key = keyOf(node); if (key) keyed.set(key, node); });
    const used = new Set();
    // Keyed nodes on their way out must not hold the cursor, or every node after them is moved
    // (which restarts its entrance animation) or rebuilt.
    const nextKeys = new Set([...newParent.childNodes].map(keyOf).filter(Boolean));
    const goingAway = node => { const key = keyOf(node); return key && !nextKeys.has(key); };
    let cursor = oldParent.firstChild;
    const skip = () => { while (cursor && (used.has(cursor) || goingAway(cursor))) cursor = cursor.nextSibling; };
    [...newParent.childNodes].forEach(next => {
      skip();
      const key = keyOf(next);
      let match = null;
      if (key) {
        const candidate = keyed.get(key);
        if (candidate && sameKind(candidate, next)) match = candidate;
      } else if (cursor && !keyOf(cursor) && sameKind(cursor, next)) {
        match = cursor;
      }
      if (match) {
        used.add(match);
        if (match !== cursor) oldParent.insertBefore(match, cursor);
        else cursor = cursor.nextSibling;
        patch(match, next);
      } else {
        const fresh = document.importNode(next, true);
        used.add(fresh);
        oldParent.insertBefore(fresh, cursor);
      }
    });
    [...oldParent.childNodes].forEach(node => { if (!used.has(node)) node.remove(); });
  }

  function patch(oldNode, newNode) {
    if (oldNode.nodeType !== 1) {
      if (oldNode.nodeValue !== newNode.nodeValue) oldNode.nodeValue = newNode.nodeValue;
      return;
    }
    [...oldNode.attributes].forEach(attribute => {
      if (!newNode.hasAttribute(attribute.name)) oldNode.removeAttribute(attribute.name);
    });
    [...newNode.attributes].forEach(attribute => {
      if (oldNode.getAttribute(attribute.name) !== attribute.value) oldNode.setAttribute(attribute.name, attribute.value);
    });
    morphChildren(oldNode, newNode);
  }

  /* ---------- state changes the tour clicks through ---------- */

  function render() { morph(root, windowHtml()); }

  const actions = {
    add() { state.page = 'wizard'; state.wizard = { step: 1, app: null, hdr: 'keep' }; },
    'tile-arena'() { state.wizard.app = 'arena'; },
    next() { state.wizard.step++; },
    'hdr-on'() { state.wizard.hdr = 'on'; },
    save() {
      state.rules.push({ app: state.wizard.app, when: 'open', hdr: state.wizard.hdr, enabled: true, status: 'waiting' });
      state.page = 'rules';
      state.wizard = null;
    },
  };

  return {
    mount(element) { root = element; render(); },
    target(name) { return root.querySelector(`[data-target="${name}"]`); },
    act(name) { actions[name](); render(); },
    // Back to the first screen, built fresh so the rules page animates in as it does on open.
    reset() { state = initialState(); root.replaceChildren(); render(); },
  };
})();
