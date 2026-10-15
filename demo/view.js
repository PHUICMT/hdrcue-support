// The HDRcue window drawn in HTML: its markup for any state, a small DOM patcher for the tour,
// and still pictures of single pages for the guide on the main page. The patcher keeps the
// nodes that stay, so CSS transitions run when a class changes, and inserts new nodes, so their
// entrance animations run, the same way the app animates between states.
const DemoView = (function () {
  // The window's own size, the same as the app's screenshots.
  const size = { width: 1344, height: 850 };

  // Paths are worked out from this script, so any page can load it. The stylesheet is asked
  // for with this script's ?v=, so demo/index.html loads both with the same number.
  const here = document.currentScript.src;
  const iconUrl = new URL('../images/icon.png', here).href;
  const styleUrl = new URL(`demo.css${new URL(here).search}`, here).href;

  // The window's words, in the page's language, set by setTexts before anything is drawn. The
  // app's own words are the app.* texts: the app's i18n strings under the same keys, with the
  // same {placeholders}, so the pictures say exactly what the app says.
  let text = null;

  function setTexts(texts) {
    const app = (key, values = {}) => (texts[`app.${key}`] || '')
      .replace(/\{(\w+)\}/g, (placeholder, name) => (name in values ? values[name] : placeholder));
    const hdrParts = { on: app('part.hdr.On'), off: app('part.hdr.Off'), file: app('part.hdr.ByFile') };
    const preview = [[24, 144], [23.976, 119.88], [25, 100]]
      .map(([fps, rate]) => app('editor.refresh.example', { fps, rate })).join(' · ');
    text = {
      title: 'HDRcue',
      addTitle: `HDRcue · ${app('editor.title.add')}`,
      rules: app('nav.rules'),
      settings: app('nav.preferences'),
      pause: app('nav.pause'),
      rulesLead: app('rules.lead'),
      addApp: app('rules.add'),
      rightNow: app('rules.now'),
      nowBy: app('now.by', { app: apps.cinema.name }),
      nowNone: app('now.none'),
      apps: count => app('rules.group.apps', { count }),
      games: count => app('rules.group.games', { count }),
      when: { open: app('rule.when.open'), front: app('rule.when.front'), full: app('rule.when.full') },
      pro: 'PRO',
      active: app('status.active'),
      waiting: app('status.waiting'),
      waitingFor: display => app('status.waitingFor', { display }),
      off: app('status.off'),
      // Several rules for one app share a card, with a numbered row for each.
      ruleCount: count => app(count === 1 ? 'editor.app.ruleCount.one' : 'editor.app.ruleCount.many', { count }),
      orderNote: app('rule.order.note'),
      unnamedRule: number => app('rule.number', { number }),
      steps: [app('editor.step.app'), app('editor.step.display'), app('editor.step.when')],
      chooseLead: app('editor.app.lead'),
      openNow: app('editor.app.tab.running'),
      allApps: app('editor.app.tab.all'),
      search: app('editor.app.search'),
      browse: app('editor.app.browse'),
      displayTitle: name => app('editor.display.lead', { app: name }),
      displayLead: app('editor.display.note'),
      targets: [app('editor.target.chosen'), app('editor.target.application')],
      hdrDescription: app('editor.hdr.desc'),
      keepHdr: app('editor.hdr.Unchanged'),
      keep: app('editor.keep'),
      on: app('editor.hdr.On'),
      offButton: app('editor.hdr.Off'),
      makeMain: app('editor.layout.main'),
      makeMainDescription: app('editor.layout.main.desc'),
      othersOff: app('editor.layout.others'),
      othersOffDescription: app('editor.layout.others.desc'),
      more: app('editor.more'),
      whenLead: app('editor.when.lead'),
      whenChoices: ['open', 'front', 'full'].map(id => ({
        id, title: app(`editor.when.${id}.title`), description: app(`editor.when.${id}.desc`),
      })),
      recommended: app('editor.recommended'),
      ruleName: [app('editor.name.label'), app('editor.name.placeholder')],
      orderNew: name => app('editor.order.new', { app: name }),
      hdrIsOn: `${app('editor.sentence.hdr')} <span class="keyword">${app('editor.sentence.On')}</span>`,
      cancel: app('editor.cancel'),
      back: app('editor.back'),
      next: app('editor.next'),
      addRule: app('editor.add'),
      settingsLead: app('preferences.lead'),
      proFree: app('preferences.pro.free.title'),
      proFreeDescription: app('preferences.pro.free.desc'),
      seePro: app('pro.see'),
      general: app('preferences.general'),
      startup: [app('preferences.startup'), app('preferences.startup.desc')],
      tray: [app('preferences.trayIcon'), app('preferences.trayIcon.desc')],
      theme: [app('preferences.theme'), app('preferences.theme.desc'),
        ['System', 'Light', 'Dark'].map(choice => app(`preferences.theme.${choice}`))],
      animations: [app('preferences.animations'), app('preferences.animations.desc'),
        ['System', 'On', 'Off'].map(choice => app(`preferences.animations.${choice}`))],
      accent: [app('preferences.accent'), app('preferences.accent.desc'),
        ['HdrCue', 'Windows', 'Custom'].map(choice => app(`preferences.accent.${choice}`))],
      language: [app('preferences.language'), app('language.name')],
      players: [app('players.title'), app('preferences.players.desc'), app('preferences.players.seeList')],
      needsSetup: app('players.needsSetup'),
      setUp: app('players.setUp'),
      displays: app('preferences.displays'),
      displaysLead: app('preferences.displays.desc'),
      // The Pro options, for the guide's pictures of setting them up.
      byFile: app('editor.hdr.ByFile'),
      byFileDescription: app('editor.hdr.byFileDesc', { count: 4 }),
      seeList: app('editor.hdr.seePlayers'),
      followNote: app('editor.target.applicationNote'),
      needsSetupTitle: name => app('players.need.title', { name }),
      needsSetupText: app('players.need.text'),
      hdrParts,
      matchPart: app('part.match'),
      resolution: app('editor.resolution'),
      refresh: app('editor.refresh'),
      matchPreview: app('editor.refresh.preview', { display: app('display.main'), examples: preview }),
      percent: percent => app('editor.percent', { percent }),
      brightness: [app('editor.brightness'), app('editor.brightness.desc')],
      colorProfile: [app('editor.colorProfile'), app('editor.colorProfile.desc.Advanced')],
      sound: [app('editor.audio'), app('editor.audio.desc')],
      sentences: {
        open: name => app('editor.sentence.open', { app: name }),
        front: name => app('editor.sentence.front', { app: name }),
        full: name => app('editor.sentence.full', { app: name }),
      },
      goesBackFrom: {
        open: name => app('editor.sentence.restore', { app: name }),
        front: name => app('editor.sentence.restoreFront', { app: name }),
        full: name => app('editor.sentence.restoreFull', { app: name }),
      },
      appsDisplay: app('display.application'),
      onlyWindow: display => app('editor.only.window', { display }),
      windowOn: display => app('rule.tag.window', { display }),
      onlyPower: [app('editor.only.power'), app('editor.only.power.desc')],
      onlyTime: [app('editor.only.time'), app('editor.only.timeAnd')],
      onlyDisplay: app('editor.only.display'),
      gamesFound: count => app('games.bar.title.many', { count }),
      gamesText: app('games.bar.text'),
      showGames: app('games.bar.button'),
      later: app('games.bar.later'),
      // The names of the displays, sound outputs and rules in the pictures, by id.
      names: {
        main: app('display.main'),
        left: app('display.left'),
        tv: app('display.tv'),
        projector: app('display.projector'),
        headphones: texts['demo.sound.headphones'],
        desk: texts['demo.rule.desk'],
      },
    };
    if (root) render();
  }

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
    // The player HDR by file and matching the movie work with, for the guide's pictures.
    mpv: { name: 'mpv', color: '#6b3fa0' },
  };
  const openApps = ['cinema', 'music', 'notes', 'arena', 'cutter', 'racer'];

  // The desk layout of the screenshots: a wide main display and a smaller one to its left.
  const displays = [
    { id: 'left', x: -2560, y: -40, width: 2560, height: 1080, hertz: 144, hdr: false },
    { id: 'main', x: 0, y: 0, width: 3440, height: 1440, hertz: 175, hdr: true },
  ];

  // A TV to the right of the main display, for the couch mode picture.
  const withTv = [...displays,
    { id: 'tv', x: 3440, y: 0, width: 3840, height: 2160, hertz: 60, hdr: true }];

  const svg = (body, className = 'icon', box = 16) =>
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
    more: svg('<circle cx="3" cy="8" r="1"/><circle cx="8" cy="8" r="1"/><circle cx="13" cy="8" r="1"/>', 'icon dots'),
    search: svg('<circle cx="6.5" cy="6.5" r="4.7"/><path d="M10 10l4.3 4.3"/>'),
    folder: svg('<path d="M1.5 4a1 1 0 0 1 1-1h3.4l1.6 1.6h6a1 1 0 0 1 1 1v6.9a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1z"/><path d="M1.5 6.2h13"/>'),
    check: svg('<path d="M3 8.6l3.1 3.1L13 4.7"/>'),
    sun: svg('<circle cx="8" cy="8" r="2.7"/><path d="M8 1.6v1.3M8 13.1v1.3M1.6 8h1.3M13.1 8h1.3M3.5 3.5l.9.9M11.6 11.6l.9.9M3.5 12.5l.9-.9M11.6 4.4l.9-.9"/>'),
    // The "when" choices: two windows for while open, a window brought out for in front, and
    // arrows to the corners for full screen.
    open: svg('<rect x="1.5" y="5.5" width="9" height="9" rx="1.2"/><path d="M5.5 5.5V2.7a1.2 1.2 0 0 1 1.2-1.2h6.6a1.2 1.2 0 0 1 1.2 1.2v6.6a1.2 1.2 0 0 1-1.2 1.2h-2.8"/>'),
    front: svg('<path d="M13.5 9.5v3.8a1.2 1.2 0 0 1-1.2 1.2H2.7a1.2 1.2 0 0 1-1.2-1.2V3.7a1.2 1.2 0 0 1 1.2-1.2h3.8"/><path d="M9.5 1.5h5v5M14.5 1.5L8 8"/>'),
    full: svg('<path d="M9.5 1.5h5v5M14.5 1.5l-5 5M6.5 14.5h-5v-5M1.5 14.5l5-5"/>'),
    star: svg('<path d="M8 1.6l1.9 4 4.4.5-3.3 3 .9 4.3L8 11.2l-3.9 2.2.9-4.3-3.3-3 4.4-.5z"/>', 'icon solid'),
    power: svg('<path d="M4.9 3.8a5.6 5.6 0 1 0 6.2 0"/><path d="M8 1.5v6"/>'),
    bolt: svg('<path d="M9.6 1.5L3.6 9h4.1l-1.2 5.5 6-7.6H8.4z"/>'),
    palette: svg('<path d="M8 1.5a6.5 6.5 0 0 0 0 13c.9 0 1.4-.6 1.4-1.3 0-.9-.8-1.2-.8-2 0-.7.6-1.2 1.3-1.2h1.6a3 3 0 0 0 3-3C14.5 4 11.6 1.5 8 1.5z"/>'
      + '<circle cx="4.7" cy="7.2" r=".9"/><circle cx="6.9" cy="4.4" r=".9"/><circle cx="10.3" cy="4.7" r=".9"/>'),
    language: svg('<path d="M1.5 3.5h7M5 1.8v1.7M3 3.5c.6 2.4 2.2 4.3 4.5 5.3M7 3.5c-.6 2.4-2.2 4.3-4.5 5.3"/><path d="M8.5 14.5l3-7 3 7M9.6 12h3.8"/>'),
    video: svg('<rect x="1.5" y="4" width="9" height="8" rx="1.2"/><path d="M10.5 7.2l4-2.3v6.2l-4-2.3"/>'),
    sliders: svg('<path d="M1.5 4.5h13M1.5 11.5h13"/><circle class="knob" cx="10.5" cy="4.5" r="1.8"/><circle class="knob" cx="5.5" cy="11.5" r="1.8"/>'),
    chevron: svg('<path d="M4 6l4 4 4-4"/>'),
    // Six dots at a rule's left edge: it can be dragged to another place.
    handle: svg('<circle cx="6" cy="4" r="1.1"/><circle cx="10" cy="4" r="1.1"/><circle cx="6" cy="8" r="1.1"/>'
      + '<circle cx="10" cy="8" r="1.1"/><circle cx="6" cy="12" r="1.1"/><circle cx="10" cy="12" r="1.1"/>', 'icon drag-handle'),
    warn: svg('<path d="M8 1.8l6.6 11.7H1.4z"/><path d="M8 6.2v3.6M8 11.6v.2"/>'),
    game: svg('<path d="M4.6 4.5h6.8a3.1 3.1 0 0 1 3 2.4l.6 3.2a1.8 1.8 0 0 1-3.1 1.5L10.4 10H5.6l-1.5 1.6A1.8 1.8 0 0 1 1 10.1l.6-3.2a3.1 3.1 0 0 1 3-2.4z"/><path d="M4.8 6.4v2.2M3.7 7.5h2.2M10.8 7.2v.1M12 8.1v.1"/>'),
    resolution: svg('<rect x="1.5" y="2.5" width="13" height="11" rx="1"/><path d="M4.5 5.5h2.5M4.5 5.5V8M11.5 10.5H9M11.5 10.5V8"/>'),
    refresh: svg('<path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9"/><path d="M12.2 1.6v2.8H9.4"/>'),
    brightness: svg('<circle cx="8" cy="8" r="3"/><path d="M8 5a3 3 0 0 1 0 6z" class="fill"/><path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1"/>'),
    sound: svg('<path d="M2 6h2.6L8 3v10L4.6 10H2z"/><path d="M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.8a6 6 0 0 1 0 8.4"/>'),
    minimize: svg('<path d="M0.5 5h9"/>', 'icon', 10),
    maximize: svg('<rect x="0.5" y="0.5" width="9" height="9" rx="1"/>', 'icon', 10),
    close: svg('<path d="M0.5 0.5l9 9M9.5 0.5l-9 9"/>', 'icon', 10),
  };

  // A rule's name, display and sound output are ids in text.names, so a picture drawn again in
  // another language says them in that language.
  const initialState = () => ({
    page: 'rules',
    // Cinema Player has two rules: the higher one for the projector, which isn't connected,
    // and the other for the main display.
    rules: [
      { app: 'cinema', name: 'projector', display: 'projector', when: 'open', hdr: 'on', enabled: true, status: 'away' },
      { app: 'cinema', when: 'open', hdr: 'on', enabled: true, status: 'active' },
      { app: 'photo', when: 'front', hdr: 'off', enabled: false, status: 'waiting' },
      { app: 'racer', when: 'full', hdr: 'on', enabled: true, status: 'waiting' },
    ],
    wizard: null,
  });

  let state = null;
  let root = null;

  /* ---------- markup ---------- */

  const appIcon = id => `<span class="app-icon" style="background:${apps[id].color}">${apps[id].name[0]}</span>`;
  // Shown on Pro options until Pro is bought, so also during the trial the demo shows.
  const proBadge = (size = '') => `<span class="pro-badge ${size}">${text.pro}</span>`;
  const isGame = id => !!apps[id].game;

  // "Apps (2)" or "Games (1)" and what is under it; nothing for an empty group. On the rules
  // page the heading folds its group, with a chevron that points up while it is open.
  const groupHtml = (key, heading, count, body, first = false, folds = false) => count
    ? `<div class="group" data-key="group-${key}"><div class="section-heading ${first ? 'first' : ''} ${folds ? 'folds' : ''}">${heading(count)}`
      + `${folds ? `<span class="chevron">${icon.chevron}</span>` : ''}</div>${body}</div>`
    : '';

  // A row of a settings card: icon, title with an optional description, and its control.
  const optionHtml = (glyph, title, description, control, className = '') =>
    `<div class="option ${className}">${glyph}<div class="label">${title}${description ? `<small>${description}</small>` : ''}</div>${control}</div>`;

  // A segmented control. Each choice is a label, or [label, the tour's target for it].
  function segHtml(choices, chosen, className = '') {
    const buttons = choices.map((choice, index) => {
      const [label, target] = Array.isArray(choice) ? choice : [choice];
      return `<button class="${index === chosen ? 'on' : ''}" ${target ? `data-target="${target}"` : ''}>${label}</button>`;
    }).join('');
    return `<div class="segmented ${className}" style="--choice-count:${choices.length};--chosen-index:${chosen}">${buttons}</div>`;
  }

  const pages = { rules: rulesHtml, wizard: wizardHtml, settings: settingsHtml };

  function windowHtml(state) {
    return `<div class="title-bar"><img class="logo" src="${iconUrl}" alt=""><span>${state.page === 'wizard' ? text.addTitle : text.title}</span>
      <div class="caption-buttons"><span>${icon.minimize}</span><span>${icon.maximize}</span><span>${icon.close}</span></div></div>
      <div class="window-body">${navHtml(state.page)}<div class="window-content" data-key="content-${state.page}">${pages[state.page](state)}</div></div>`;
  }

  function navHtml(page) {
    const settings = page === 'settings';
    return `<div class="window-nav"><span class="nav-indicator ${settings ? 'second' : ''}"></span>
      <a class="${settings ? '' : 'on'}">${icon.monitor}${text.rules}</a><a class="${settings ? 'on' : ''}">${icon.gear}${text.settings}</a>
      <span class="spacer"></span><a>${icon.pause}${text.pause}</a></div>`;
  }

  function rulesHtml(state) {
    const nowCard = (name, line, hdr) => `<div class="card">${icon.monitor}<div class="grow"><b>${name}</b>
      <div class="small muted">${line}</div></div><span class="chip ${hdr ? '' : 'mute'}">${hdr ? 'HDR' : 'SDR'}</span></div>`;
    return `<div class="row head"><div class="grow"><h1>${text.rules}</h1><p class="lead">${text.rulesLead}</p></div>
        <button class="button primary" data-target="add">${icon.plus}${text.addApp}</button></div>
      ${state.gamesFound ? gamesBarHtml(state.gamesFound) : ''}
      <div class="section-heading first">${text.rightNow}</div>
      <div class="now">${nowCard(text.names.main, text.nowBy, true)}${nowCard(text.names.left, text.nowNone, false)}</div>
      ${ruleGroupHtml('apps', text.apps, state.rules.filter(rule => !isGame(rule.app)))}
      ${ruleGroupHtml('games', text.games, state.rules.filter(rule => isGame(rule.app)))}`;
  }

  // The bar above Right now that points out games without a rule. Finding games is Pro.
  function gamesBarHtml(count) {
    return `<div class="bar info games-bar">${icon.game}<div class="grow"><b>${text.gamesFound(count)}</b>
      <div class="small muted">${text.gamesText}</div></div>${proBadge()}
      <button class="button small">${text.showGames}</button><button class="button small ghost">${text.later}</button></div>`;
  }

  // One card for each app, in the order of their first rules. The group counts the cards.
  function ruleGroupHtml(key, heading, rules) {
    const byApp = new Map();
    rules.forEach(rule => byApp.set(rule.app, [...(byApp.get(rule.app) || []), rule]));
    const cards = [...byApp.values()].map((appRules, index) =>
      appRules.length === 1 ? ruleHtml(appRules[0], index) : appCardHtml(appRules, index)).join('');
    return groupHtml(key, heading, byApp.size, `<div class="list">${cards}</div>`, false, true);
  }

  function pillHtml(rule) {
    if (!rule.enabled) return `<span class="pill"><span class="dot"></span>${text.off}</span>`;
    if (rule.status === 'active') return `<span class="pill ok"><span class="dot"></span>${text.active}</span>`;
    const label = rule.status === 'away' ? text.waitingFor(text.names[rule.display]) : text.waiting;
    return `<span class="pill"><span class="dot"></span>${label}</span>`;
  }

  // When the rule runs, its display, what it changes and its extra conditions.
  const tagsHtml = rule => `<div class="tag-line"><span class="tag">${icon[rule.when]}${text.when[rule.when]}`
    + `${rule.when === 'full' ? proBadge('small') : ''}</span>`
    + `<span class="tag">${icon.monitor}${text.names[rule.display || 'main']}</span>`
    + `<span class="tag change">${text.hdrParts[rule.hdr]}${rule.hdr === 'file' ? proBadge('small') : ''}</span>`
    + `${rule.sound ? `<span class="tag">${icon.sound}${text.names[rule.sound]}</span>` : ''}`
    + `${rule.windowOn ? `<span class="tag">${text.windowOn(text.names[rule.windowOn])}${proBadge('small')}</span>` : ''}</div>`;

  const switchesHtml = rule =>
    `${pillHtml(rule)}<span class="toggle ${rule.enabled ? 'on' : ''}"></span><span class="icon-button">${icon.more}</span>`;

  function ruleHtml(rule, index) {
    return `<div class="card rule ${rule.enabled ? '' : 'off'}" data-key="rule-${rule.app}" style="--order:${index}">${icon.handle}${appIcon(rule.app)}
      <div class="grow"><div class="name-line"><b>${apps[rule.app].name}</b></div>${tagsHtml(rule)}</div>${switchesHtml(rule)}</div>`;
  }

  // An app with several rules: its name once, then a numbered row for each rule, the higher
  // one first. A rule without a name is called by its number.
  function appCardHtml(appRules, index) {
    const app = appRules[0].app;
    const rows = appRules.map((rule, place) => `<div class="rule-row ${rule.enabled ? '' : 'off'}">${icon.handle}
        <span class="rule-number">${place + 1}</span><div class="grow"><div class="name-line"><b>${rule.name ? text.names[rule.name] : text.unnamedRule(place + 1)}</b></div>
        ${tagsHtml(rule)}</div>${switchesHtml(rule)}</div>`).join('');
    return `<div class="card rule app-card" data-key="app-${app}" style="--order:${index}">
      <div class="app-header">${icon.handle}${appIcon(app)}<div class="grow"><b>${apps[app].name}</b>
        <div class="small muted">${text.orderNote}</div></div><span class="small muted rule-count">${text.ruleCount(appRules.length)}</span></div>
      ${rows}</div>`;
  }

  function wizardHtml(state) {
    const wizard = state.wizard;
    const step = number => {
      const status = wizard.step === number ? 'on' : wizard.step > number ? 'done' : '';
      return `<div class="step ${status}"><span class="step-number">${wizard.step > number ? icon.check : number}</span>${text.steps[number - 1]}</div>`;
    };
    const line = number => `<span class="step-line ${wizard.step > number ? 'done' : ''}"></span>`;
    const steps = `<div class="steps">${step(1)}${line(1)}${step(2)}${line(2)}${step(3)}</div>`;
    const bodies = { 1: chooseAppHtml, 2: displayHtml, 3: whenHtml };
    const canGoOn = wizard.step === 1 ? !!wizard.app : wizard.step === 2 ? wizard.hdr !== 'keep' : true;
    const forward = wizard.step < 3
      ? `<button class="button primary" data-key="next" data-target="next" ${canGoOn ? '' : 'disabled'}>${text.next}</button>`
      : `<button class="button primary fade-in" data-key="save" data-target="save">${text.addRule}</button>`;
    const footer = `<div class="wizard-footer"><button class="button">${text.cancel}</button><span class="grow"></span>
      ${wizard.step > 1 ? `<button class="button fade-in" data-key="back">${text.back}</button>` : ''}${forward}</div>`;
    return `${steps}<div class="step-body" data-key="step-${wizard.step}" style="--slide-from:28px">${bodies[wizard.step](state)}</div>${footer}`;
  }

  function chooseAppHtml(state) {
    const tile = (id, index) => {
      const ruleCount = state.rules.filter(rule => rule.app === id).length;
      const sub = ruleCount
        ? `<div class="subtitle has-rules">${icon.check}${text.ruleCount(ruleCount)}</div>`
        : `<div class="subtitle">${apps[id].name}.exe</div>`;
      return `<div class="tile ${state.wizard.app === id ? 'selected' : ''}" data-key="tile-${id}" data-target="tile-${id}" style="--order:${index}">
        ${appIcon(id)}<div><div class="name">${apps[id].name}</div>${sub}</div><span class="running-dot"></span></div>`;
    };
    return `<h1>${text.steps[0]}</h1><p class="lead">${text.chooseLead}</p>
      <div class="row tabs-row"><div class="tabs"><a class="on">${text.openNow}</a><a>${text.allApps}</a></div>
        <div class="search">${icon.search}<span>${text.search}</span></div></div>
      ${tileGroupHtml('apps', text.apps, openApps.filter(id => !isGame(id)), tile, 0, true)}
      ${tileGroupHtml('games', text.games, openApps.filter(isGame), tile, openApps.filter(id => !isGame(id)).length)}
      <button class="button ghost browse">${icon.folder}${text.browse}</button>`;
  }

  function tileGroupHtml(key, heading, ids, tile, firstIndex, first = false) {
    const tiles = ids.map((id, index) => tile(id, firstIndex + index)).join('');
    return groupHtml(key, heading, ids.length, `<div class="grid">${tiles}</div>`, first);
  }

  // The display step as in the app: where the rule applies, the map, then the HDR choice and
  // the couch mode switches in one card, with the rest folded under More settings.
  // The guide's pictures set more of it: the rule following its app, "By file" for a player,
  // the couch mode switches, and More settings opened.
  function displayHtml(state) {
    const wizard = state.wizard;
    const follows = wizard.target === 'app';
    const options = [['keep', text.keepHdr], ['on', text.on], ['off', text.offButton]];
    if (wizard.player) options.push(['file', `${text.byFile}${proBadge('small')}`]);
    const hdr = segHtml(options.map(([value, label]) => [label, `hdr-${value}`]),
      options.findIndex(([value]) => value === wizard.hdr));
    const hdrDescription = wizard.hdr === 'file'
      ? `${text.byFileDescription} · <span class="link">${text.seeList}</span>` : text.hdrDescription;
    const proTitle = title => `<span class="title">${title}${proBadge('small')}</span>`;
    const toggle = on => `<span class="toggle ${on ? 'on' : ''}"></span>`;
    const target = segHtml([text.targets[0], `${text.targets[1]}${proBadge('small')}`], follows ? 1 : 0, 'target');
    const note = follows ? `<p class="note follow-note">${text.followNote}</p>` : '';
    const setup = wizard.needsSetup
      ? `<div class="bar warn setup-bar">${icon.warn}<div class="grow"><b>${text.needsSetupTitle(apps[wizard.app].name)}</b>
        <div class="small muted">${text.needsSetupText}</div></div><button class="button small">${text.setUp}</button></div>`
      : '';
    return `<h1>${text.displayTitle(apps[wizard.app].name)}</h1><p class="lead">${text.displayLead}</p>
      <div>${target}</div>
      ${mapHtml(wizard)}${note}
      <div class="card box hdr-card">${optionHtml(icon.sun, 'HDR', hdrDescription, hdr, 'hdr-row')}
        ${optionHtml(icon.star, proTitle(text.makeMain), text.makeMainDescription, toggle(wizard.makesMain), 'main-row')}
        ${optionHtml(icon.power, proTitle(text.othersOff), text.othersOffDescription, toggle(wizard.othersOff), 'others-row')}
        ${moreHtml(wizard)}</div>${setup}`;
  }

  // "More settings", folded unless a picture opens it. Its summary lists what it changes.
  function moreHtml(wizard) {
    const more = wizard.more;
    const parts = more ? [more.refresh, more.brightness, more.profile].filter(Boolean) : [];
    const head = optionHtml(icon.sliders, text.more, '',
      `<span class="value">${parts.length ? parts.join(' · ') : text.keep}${icon.chevron}</span>`, `more-header ${more ? 'open' : ''}`);
    if (!more) return head;
    const combo = value => `<span class="combo">${value || text.keep}${icon.chevron}</span>`;
    const proTitle = title => `<span class="title">${title}${proBadge('small')}</span>`;
    const preview = more.refresh === text.matchPart ? `<div class="option-sub preview small muted">${text.matchPreview}</div>` : '';
    return `${head}
      ${wizard.target === 'app' ? '' : optionHtml(icon.resolution, text.resolution, '', combo(), 'resolution-row')}
      <div class="option-group refresh-row">${optionHtml(icon.refresh, text.refresh, '', combo(more.refresh))}${preview}</div>
      ${optionHtml(icon.brightness, proTitle(text.brightness[0]), text.brightness[1], combo(more.brightness), 'brightness-row')}
      ${optionHtml(icon.palette, proTitle(text.colorProfile[0]), text.colorProfile[1], combo(more.profile), 'profile-row')}
      ${optionHtml(icon.sound, text.sound[0], text.sound[1], combo(), 'sound-row')}`;
  }

  // Displays drawn to scale where Windows places them, 600 px across like the app. While the
  // rule follows its app, no display is picked.
  function mapHtml(wizard) {
    const list = wizard.displays || displays;
    const left = Math.min(...list.map(display => display.x));
    const right = Math.max(...list.map(display => display.x + display.width));
    const top = Math.min(...list.map(display => display.y));
    const bottom = Math.max(...list.map(display => display.y + display.height));
    const width = 600;
    const scale = width / (right - left);
    const chosen = wizard.target === 'app' ? null : wizard.display || 'main';
    const tiles = list.map(display => {
      const selected = display.id === chosen;
      const badge = selected && wizard.hdr !== 'keep'
        ? `<span class="badge" data-key="badge-${wizard.hdr}">${text.hdrParts[wizard.hdr]}</span>` : '';
      const height = display.height * scale - 6;
      const place = `left:${(display.x - left) * scale + 3}px;top:${(display.y - top) * scale + 3}px;`
        + `width:${display.width * scale - 6}px;height:${height}px`;
      // On a display too short to fit its name below the HDR or SDR chip, the name moves down
      // and to the left, clear of the chip.
      const shortClass = height < 70 ? 'short' : '';
      return `<div class="monitor-tile ${selected ? 'selected' : ''} ${shortClass}" data-key="monitor-${display.id}" style="${place}">${badge}
        <b>${text.names[display.id]}</b><small>${display.width} × ${display.height} · ${display.hertz} Hz</small>
        <span class="chip ${display.hdr ? '' : 'mute'}">${display.hdr ? 'HDR' : 'SDR'}</span></div>`;
    }).join('');
    return `<div class="map" style="width:${width}px;height:${(bottom - top) * scale}px">${tiles}</div>`;
  }

  // The choices, the extra conditions under them, the summary and the rule's name, as in the
  // app. The tour keeps the first choice and shows its short summary. The guide's pictures
  // pick a choice and write the summary as the app does.
  function whenHtml(state) {
    const wizard = state.wizard;
    const name = apps[wizard.app].name;
    const when = wizard.when || 'open';
    const choices = text.whenChoices.map((choice, index) => whenChoiceHtml(choice, index, when)).join('');
    const order = wizard.otherRules ? `<div class="small muted order-note">${text.orderNew(name)}</div>` : '';
    const naming = `<div class="name-field"><div>${text.ruleName[0]}</div><div class="text-box">${text.ruleName[1]}</div>${order}</div>`;
    if (!wizard.when) {
      return `<h1>${text.steps[2]}</h1><p class="lead">${text.whenLead}</p>${choices}${checksHtml(wizard)}
        <div class="card summary"><div class="sentence">${text.sentences.open(name)} → <b>${text.names.main}</b>: ${text.hdrIsOn}</div>
          <div class="small muted">${text.goesBackFrom.open(name)}</div></div>${naming}`;
    }
    const display = wizard.target === 'app' ? text.appsDisplay : text.names.main;
    const changes = [text.hdrParts[wizard.hdr || 'on']].map(part => `<span class="keyword">${part}</span>`).join(', ');
    return `<h1>${text.steps[2]}</h1><p class="lead">${text.whenLead}</p>${choices}${checksHtml(wizard)}
      <div class="card summary"><div class="sentence">${text.sentences[when](name)} → <b>${display}</b>: ${changes}</div>
        <div class="small muted">${text.goesBackFrom[when](name)}</div></div>${naming}`;
  }

  // The extra conditions, each a check box marked PRO. The first one is there only while the
  // rule uses a chosen display.
  function checksHtml(wizard) {
    const ticked = wizard.checks || {};
    const check = (on, label, after = '') => `<div class="check ${on ? 'on' : ''}"><span class="tick">${on ? icon.check : ''}</span>`
      + `<span class="title">${label}${proBadge('small')}</span>${after}</div>`;
    const time = value => `<span class="time"><span>${value[0]}</span><span>${value[1]}</span></span>`;
    return `<div class="checks">
      ${wizard.target === 'app' ? '' : check(ticked.window, text.onlyWindow(text.names.main))}
      ${check(ticked.power, text.onlyPower[0], `<span class="small muted">${text.onlyPower[1]}</span>`)}
      ${check(ticked.time, text.onlyTime[0], `${time(['18', '00'])}<span class="muted">${text.onlyTime[1]}</span>${time(['02', '00'])}`)}
      ${check(ticked.display, text.onlyDisplay, `<span class="combo">${text.names.main}${icon.chevron}</span>`)}</div>`;
  }

  // A choice with its radio, icon, title and description, "Recommended" on the first and the
  // PRO badge on full screen.
  function whenChoiceHtml(choice, index, chosen) {
    const badge = choice.id === 'full' ? proBadge() : '';
    const recommended = choice.id === 'open' ? `<span class="pill plain">${text.recommended}</span>` : '';
    return `<div class="radio ${choice.id === chosen ? 'on' : ''}" style="--order:${index}"><span class="radio-dot"></span>${icon[choice.id]}
        <div class="grow"><div class="title"><b>${choice.title}</b>${badge}</div><div class="small muted">${choice.description}</div></div>
        ${recommended}</div>`;
  }

  // Settings as a free user sees it: the Pro card with See Pro, then the General rows. The
  // window cuts the page off where the Displays section starts, as the app's screenshot does.
  function settingsHtml() {
    const toggle = '<span class="toggle on"></span>';
    const choice = (glyph, [title, description, choices]) => optionHtml(glyph, title, description, segHtml(choices, 0, 'compact'));
    const [playersTitle, playersDescription, seeList] = text.players;
    const players = `<div class="option-group">${optionHtml(icon.video, playersTitle, playersDescription, `<button class="button">${seeList}</button>`)}
        <div class="option-sub"><span class="grow">mpv</span><span class="pill warn"><span class="dot"></span>${text.needsSetup}</span>
          <button class="button primary small">${text.setUp}</button></div></div>`;
    return `<h1>${text.settings}</h1><p class="lead">${text.settingsLead}</p>
      <div class="card box pro-card">${optionHtml(icon.star, `<b>${text.proFree}</b>`, text.proFreeDescription,
        `<button class="button primary">${text.seePro}</button>`)}</div>
      <div class="section-heading">${text.general}</div>
      <div class="card box">${optionHtml(icon.power, ...text.startup, toggle)}
        ${optionHtml(icon.monitor, ...text.tray, toggle)}
        ${choice(icon.sun, text.theme)}
        ${choice(icon.bolt, text.animations)}
        ${choice(icon.palette, text.accent)}
        ${optionHtml(icon.language, text.language[0], '', `<span class="combo">${text.language[1]}${icon.chevron}</span>`)}
        ${players}</div>
      <div class="section-heading">${text.displays}</div><p class="lead">${text.displaysLead}</p>`;
  }

  /* ---------- patcher ---------- */

  function morph(container, html) {
    const template = document.createElement('template');
    template.innerHTML = html;
    morphChildren(container, template.content);
  }

  const keyOf = node => node.nodeType === 1 ? node.getAttribute('data-key') : null;
  const sameKind = (first, second) => first.nodeType === second.nodeType
    && (first.nodeType !== 1 || first.tagName === second.tagName);

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

  function render() { morph(root, windowHtml(state)); }

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

  /* ---------- still pictures for the guide ---------- */

  // One page each, in the state the app's screenshots show: Space Arena picked, then HDR on.
  const wizardAt = (step, wizard) => ({ ...initialState(), page: 'wizard', wizard: { step, hdr: 'keep', ...wizard } });
  const stills = {
    choose: () => wizardAt(1, { app: 'arena' }),
    display: () => wizardAt(2, { app: 'arena', hdr: 'on' }),
    settings: () => ({ ...initialState(), page: 'settings' }),
  };

  // The guide's pictures of setting up Pro: a strip of a page, from the top of the element
  // named by `from` to the bottom of the last element named by `to` (or `from`), across the
  // page's content column, with stripPadding all round. `height` is about how tall the strip
  // comes out, so the picture takes its place on the page before it is measured.
  const strips = {
    'hdr-file': {
      state: () => wizardAt(2, { app: 'mpv', hdr: 'file', player: true, needsSetup: true }),
      from: '.hdr-card', to: '.setup-bar', height: 390,
    },
    refresh: {
      state: () => wizardAt(2, { app: 'mpv', hdr: 'file', player: true, more: { refresh: text.matchPart } }),
      from: '.hdr-card', height: 640,
    },
    couch: {
      state: () => wizardAt(2, {
        app: 'cinema', hdr: 'on', displays: withTv, display: 'tv', makesMain: true, othersOff: true,
      }),
      from: '.map', to: '.hdr-card', height: 520,
    },
    'full-screen': {
      state: () => wizardAt(3, { app: 'racer', hdr: 'on', when: 'full' }),
      from: '.radio', height: 260,
    },
    follow: {
      state: () => wizardAt(2, { app: 'racer', hdr: 'on', target: 'app' }),
      from: '.segmented.target', to: '.hdr-card', height: 560,
    },
    brightness: {
      state: () => wizardAt(2, { app: 'cinema', hdr: 'on', more: { brightness: text.percent(70), profile: 'Wide Gamut Calibrated' } }),
      from: '.hdr-card', height: 640,
    },
    conditions: {
      state: () => wizardAt(3, { app: 'cinema', hdr: 'on', when: 'open', checks: { time: true, display: true } }),
      from: '.checks', height: 220,
    },
    games: {
      state: () => ({ ...initialState(), gamesFound: 3 }),
      from: '.head', to: '.games-bar', height: 200,
    },
    // Two rules for one player that both pick a sound output: the higher one for the projector,
    // only while the window is on it, and the other for the main display.
    'rule-order': {
      state: () => ({
        ...initialState(),
        rules: [
          {
            app: 'mpv', name: 'projector', display: 'projector', when: 'open', hdr: 'file', sound: 'projector',
            windowOn: 'projector', enabled: true, status: 'away',
          },
          { app: 'mpv', name: 'desk', when: 'open', hdr: 'file', sound: 'headphones', enabled: true, status: 'waiting' },
        ],
      }),
      from: '.group', height: 262,
    },
    // The name box under the summary, for an app that has rules already.
    'rule-name': {
      state: () => wizardAt(3, { app: 'mpv', hdr: 'file', player: true, when: 'open', otherRules: true }),
      from: '.summary', to: '.name-field', height: 196,
    },
  };

  // Hides every element before `first` and after `last`, up to the page's content.
  function hideOutside(first, last) {
    const hide = element => { element.style.visibility = 'hidden'; };
    for (let node = first; !node.classList.contains('window-content'); node = node.parentElement) {
      for (let before = node.previousElementSibling; before; before = before.previousElementSibling) hide(before);
    }
    for (let node = last; !node.classList.contains('window-content'); node = node.parentElement) {
      for (let after = node.nextElementSibling; after; after = after.nextElementSibling) hide(after);
    }
  }

  // The space around a strip's content, in the window's own pixels: about the gap the app
  // keeps around its cards. Scaled down with the picture, it is smaller on a phone.
  const stripPadding = 24;

  // How wide a strip is: the content column (the window less its menu and the content's own
  // padding) and stripPadding on both sides.
  const stripWidth = 1112;

  // Each picture fits itself to its element's width whenever that changes. Drawing the same
  // element again, in another language, swaps its fitting for the new one.
  const fits = new WeakMap();
  const resizeObserver = new ResizeObserver(entries => entries.forEach(entry => fits.get(entry.target)()));

  // Draws a still into the element, in a shadow root so the window's styles and the page's
  // styles stay apart. It is laid out at the window's own size and scaled to the element's
  // width, with every animation at its end, and shows once its stylesheet and fonts have
  // loaded. The promise it returns is kept then, when the picture has its final size.
  function draw(host, name) {
    const strip = strips[name];
    const state = strip ? strip.state() : stills[name]();
    const shadow = host.shadowRoot || host.attachShadow({ mode: 'open' });
    shadow.innerHTML = `<link rel="stylesheet" href="${styleUrl}">
      <div class="stage" data-motion="off" style="visibility:hidden"><div class="app-window">${windowHtml(state)}</div></div>`;
    const stage = shadow.querySelector('.stage');
    let box = null;
    if (strip) {
      // A first guess at the shape, until it is measured. Drawn again, it keeps the last shape.
      if (!host.style.aspectRatio) host.style.aspectRatio = `${stripWidth} / ${strip.height}`;
      host.style.background = '#25282c';
      // Tall enough that nothing in the strip is cut off by the window's own height.
      stage.style.height = '1800px';
    }
    // The strip's box in the window's own pixels, measured once it is laid out. A picture
    // can be drawn while the page scales it, as the lightbox does while it grows, so what the
    // screen shows is divided by how much the window is scaled.
    // What sits above `from` or below `to` is hidden, so nothing peeks into the padding.
    const measure = () => {
      stage.style.transform = 'none';
      const first = shadow.querySelector(strip.from);
      const last = [...shadow.querySelectorAll(strip.to || strip.from)].pop();
      hideOutside(first, last);
      const appWindow = shadow.querySelector('.app-window');
      const windowBox = appWindow.getBoundingClientRect();
      const scaleX = windowBox.width / appWindow.offsetWidth;
      const scaleY = windowBox.height / appWindow.offsetHeight;
      const content = shadow.querySelector('.window-content');
      const contentBox = content.getBoundingClientRect();
      const contentStyle = getComputedStyle(content);
      const left = (contentBox.left - windowBox.left) / scaleX + parseFloat(contentStyle.paddingLeft) - stripPadding;
      const right = (contentBox.right - windowBox.left) / scaleX - parseFloat(contentStyle.paddingRight) + stripPadding;
      const top = (first.getBoundingClientRect().top - windowBox.top) / scaleY - stripPadding;
      const bottom = (last.getBoundingClientRect().bottom - windowBox.top) / scaleY + stripPadding;
      return { left, top, width: right - left, height: bottom - top };
    };
    const fit = () => {
      if (!strip) {
        stage.style.transform = `scale(${host.clientWidth / size.width})`;
        return;
      }
      if (!box) return;
      const scale = host.clientWidth / box.width;
      stage.style.transform = `scale(${scale}) translate(${-box.left}px, ${-box.top}px)`;
    };
    const shown = new Promise(resolve => shadow.querySelector('link').addEventListener('load', () => {
      // Laying the window out starts loading the fonts its words need, such as Thai, and the
      // strip is measured once they are in.
      void stage.offsetWidth;
      document.fonts.ready.then(() => {
        if (strip) {
          box = measure();
          host.style.aspectRatio = `${box.width} / ${box.height}`;
        }
        // How wide the picture is at its own size, so a page can tell when it is drawn smaller.
        host.dataset.naturalWidth = strip ? box.width : size.width;
        fit();
        stage.style.visibility = '';
        resolve();
      });
    }));
    fits.set(host, fit);
    resizeObserver.observe(host);
    fit();
    return shown;
  }

  return {
    size,
    draw,
    setTexts,
    mount(element) { root = element; state = initialState(); render(); },
    target(name) { return root.querySelector(`[data-target="${name}"]`); },
    act(name) { actions[name](); render(); },
    // Back to the first screen, built fresh so the rules page animates in as it does on open.
    reset() { state = initialState(); root.replaceChildren(); render(); },
  };
})();
