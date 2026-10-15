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
    waitingFor: display => `Waiting for ${display}`,
    off: 'Off',
    // Several rules for one app share a card, with a numbered row for each.
    ruleCount: count => count === 1 ? '1 rule' : `${count} rules`,
    orderNote: 'When more than one applies, the higher rule wins. Drag a rule to change the order.',
    unnamedRule: number => `Rule ${number}`,
    steps: ['Choose app', 'Display settings', 'When'],
    chooseLead: 'Easiest way: open the app, then pick it from the first tab.',
    openNow: 'Open now',
    allApps: 'All apps',
    search: 'Search apps and games',
    browse: 'Browse for .exe…',
    displayTitle: app => `What should happen when ${app} opens?`,
    displayLead: 'Pick a display, then choose what changes. Leave the rest as is.',
    targets: ['A chosen display', 'Wherever the app is'],
    hdrDescription: 'Brighter, richer color for HDR movies and games',
    keep: "Don't change",
    on: 'On',
    offButton: 'Off',
    makeMain: 'Temporarily make it the main display',
    makeMainDescription: 'Pair it with a TV for couch mode',
    othersOff: 'Temporarily turn off other displays',
    othersOffDescription: 'They come back when the app closes',
    more: 'More settings',
    whenLead: 'When the app closes or the condition ends, the display always goes back.',
    whenChoices: [
      { id: 'open', title: 'While the app is open', description: 'Simplest. Changes as soon as the app opens.' },
      { id: 'front', title: 'While the app is in front', description: 'Goes back when you switch to another app' },
      { id: 'full', title: 'While the app is full screen', description: 'Good for games and video players' },
    ],
    recommended: 'Recommended',
    ruleName: ['Rule name (optional)', 'For example: Projector'],
    orderNew: app => `${app} has other rules. When more than one applies, the higher one wins. New rules go to the bottom. `
      + "To change that, drag the rule cards or use Move up in the rule's menu.",
    sentence: (app, display) => `When <b>${app}</b> is open → <b>${display}</b>: HDR <span class="k">on</span>`,
    goesBack: app => `Goes back when ${app} closes`,
    cancel: 'Cancel',
    back: 'Back',
    next: 'Next',
    addRule: 'Add rule',
    settingsLead: 'The defaults work for most people.',
    proFree: "You're on the free version",
    proFreeDescription: 'Pro adds HDR by file, refresh rates that match the movie, couch mode, '
      + 'setting up your games, brightness, color profiles and more conditions.',
    seePro: 'See Pro',
    general: 'General',
    startup: ['Start with Windows', 'Runs in the background and uses very little CPU or memory.'],
    tray: ['Show tray icon', 'Click it for HDR switches and pause.'],
    theme: ['Theme', 'System follows the app mode set in Windows.', ['System', 'Light', 'Dark']],
    animations: ['Animations', 'System follows the Animation effects setting in Windows.', ['System', 'On', 'Off']],
    accent: ['Accent color', 'Color of buttons, switches and highlights', ['HDRcue', 'Windows', 'Custom']],
    language: ['Language', 'English'],
    players: ['Video players', 'For HDR by file and refresh rates that match the movie', 'See list'],
    needsSetup: 'Needs setup',
    setUp: 'Set it up',
    displays: 'Displays',
    displaysLead: "Give each display a name that's easy to tell apart. The app uses these names everywhere. "
      + "Displays that aren't connected stay here, so you can still set up rules for them.",
    // The Pro options, for the guide's pictures of setting them up.
    byFile: 'By file',
    byFileDescription: 'Turns on for HDR files, and for SDR files the player converts to HDR. Works with 4 players',
    seeList: 'See list',
    followNote: 'Settings apply to the display the app window is on. Move the window and the settings follow.',
    needsSetupTitle: name => `${name} needs setup first.`,
    needsSetupText: "Until then, HDR by file won't work.",
    hdrParts: { on: 'HDR on', off: 'HDR off', file: 'HDR by file' },
    mainPart: 'Main display',
    othersPart: 'Others off',
    matchPart: 'Match the movie',
    resolution: 'Resolution',
    refresh: 'Refresh rate',
    matchPreview: 'On Main display: 24 fps → 144 Hz · 23.976 fps → 119.88 Hz · 25 fps → 100 Hz',
    brightness: ['Display brightness', "Uses DDC/CI. Turn it on in the monitor's menu first."],
    colorProfile: ['Color profile', 'Uses profiles installed in Windows. Changes the HDR default.'],
    sound: ['Sound output', 'Experimental. Windows has no official switch for this, so an update may stop it working.'],
    sentences: {
      open: app => `When <b>${app}</b> is open`,
      front: app => `While using <b>${app}</b>`,
      full: app => `When <b>${app}</b> is full screen`,
    },
    goesBackFrom: {
      open: app => `Goes back when ${app} closes`,
      front: app => `Goes back when you switch away from ${app} or close it`,
      full: app => `Goes back when ${app} leaves full screen or closes`,
    },
    appsDisplay: "App's display",
    onlyWindow: display => `Only when the app window is on ${display}`,
    onlyPower: ['Only when plugged in', 'For laptops'],
    onlyTime: ['Only between', 'and'],
    onlyDisplay: 'Only when this display is connected',
    gamesFound: count => `Found ${count} games on this PC`,
    gamesText: 'Set them up at once. HDR comes on only while you play full screen.',
    showGames: 'Show games',
    later: 'Later',
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
    // The player HDR by file and matching the movie work with, for the guide's pictures.
    mpv: { name: 'mpv', color: '#6b3fa0' },
  };
  const openApps = ['cinema', 'music', 'notes', 'arena', 'cutter', 'racer'];

  // The desk layout of the screenshots: a wide main display and a smaller one to its left.
  const displays = [
    { id: 'left', name: 'Left display', x: -2560, y: -40, width: 2560, height: 1080, hertz: 144, hdr: false },
    { id: 'main', name: 'Main display', x: 0, y: 0, width: 3440, height: 1440, hertz: 175, hdr: true },
  ];

  // A TV to the right of the main display, for the couch mode picture.
  const withTv = [...displays,
    { id: 'tv', name: 'Living room TV', x: 3440, y: 0, width: 3840, height: 2160, hertz: 60, hdr: true }];

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
    star: svg('<path d="M8 1.6l1.9 4 4.4.5-3.3 3 .9 4.3L8 11.2l-3.9 2.2.9-4.3-3.3-3 4.4-.5z"/>', 'i solid'),
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
      + '<circle cx="10" cy="8" r="1.1"/><circle cx="6" cy="12" r="1.1"/><circle cx="10" cy="12" r="1.1"/>', 'i handle'),
    warn: svg('<path d="M8 1.8l6.6 11.7H1.4z"/><path d="M8 6.2v3.6M8 11.6v.2"/>'),
    game: svg('<path d="M4.6 4.5h6.8a3.1 3.1 0 0 1 3 2.4l.6 3.2a1.8 1.8 0 0 1-3.1 1.5L10.4 10H5.6l-1.5 1.6A1.8 1.8 0 0 1 1 10.1l.6-3.2a3.1 3.1 0 0 1 3-2.4z"/><path d="M4.8 6.4v2.2M3.7 7.5h2.2M10.8 7.2v.1M12 8.1v.1"/>'),
    resolution: svg('<rect x="1.5" y="2.5" width="13" height="11" rx="1"/><path d="M4.5 5.5h2.5M4.5 5.5V8M11.5 10.5H9M11.5 10.5V8"/>'),
    refresh: svg('<path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9"/><path d="M12.2 1.6v2.8H9.4"/>'),
    brightness: svg('<circle cx="8" cy="8" r="3"/><path d="M8 5a3 3 0 0 1 0 6z" class="fill"/><path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1"/>'),
    sound: svg('<path d="M2 6h2.6L8 3v10L4.6 10H2z"/><path d="M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.8a6 6 0 0 1 0 8.4"/>'),
    minimize: svg('<path d="M0.5 5h9"/>', 'i', 10),
    maximize: svg('<rect x="0.5" y="0.5" width="9" height="9" rx="1"/>', 'i', 10),
    close: svg('<path d="M0.5 0.5l9 9M9.5 0.5l-9 9"/>', 'i', 10),
  };

  const initialState = () => ({
    page: 'rules',
    // Cinema Player has two rules: the higher one for the projector, which isn't connected,
    // and the other for the main display.
    rules: [
      { app: 'cinema', name: 'Projector', display: 'Projector', when: 'open', hdr: 'on', enabled: true, status: 'away' },
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

  // "Apps (2)" or "Games (1)" and what is under it; nothing for an empty group. On the rules
  // page the heading folds its group, with a chevron that points up while it is open.
  const groupHtml = (key, heading, count, body, first = false, folds = false) => count
    ? `<div class="group" data-key="group-${key}"><div class="sect ${first ? 'first' : ''} ${folds ? 'fold' : ''}">${heading(count)}`
      + `${folds ? `<span class="chev">${icon.chevron}</span>` : ''}</div>${body}</div>`
    : '';

  // A row of a settings card: icon, title with an optional description, and its control.
  const optionHtml = (glyph, title, description, control, className = '') =>
    `<div class="opt ${className}">${glyph}<div class="label">${title}${description ? `<small>${description}</small>` : ''}</div>${control}</div>`;

  // A segmented control. Each choice is a label, or [label, the tour's target for it].
  function segHtml(choices, chosen, className = '') {
    const buttons = choices.map((choice, index) => {
      const [label, target] = Array.isArray(choice) ? choice : [choice];
      return `<button class="${index === chosen ? 'on' : ''}" ${target ? `data-target="${target}"` : ''}>${label}</button>`;
    }).join('');
    return `<div class="seg ${className}" style="--n:${choices.length};--i:${chosen}">${buttons}</div>`;
  }

  const pages = { rules: rulesHtml, wizard: wizardHtml, settings: settingsHtml };

  function windowHtml(s) {
    return `<div class="tb"><img class="logo" src="${iconUrl}" alt=""><span>${s.page === 'wizard' ? text.addTitle : text.title}</span>
      <div class="caps"><span>${icon.minimize}</span><span>${icon.maximize}</span><span>${icon.close}</span></div></div>
      <div class="wbody">${navHtml(s.page)}<div class="wc" data-key="wc-${s.page}">${pages[s.page](s)}</div></div>`;
  }

  function navHtml(page) {
    const settings = page === 'settings';
    return `<div class="wnav"><span class="navind ${settings ? 'second' : ''}"></span>
      <a class="${settings ? '' : 'on'}">${icon.monitor}${text.rules}</a><a class="${settings ? 'on' : ''}">${icon.gear}${text.settings}</a>
      <span class="spacer"></span><a>${icon.pause}${text.pause}</a></div>`;
  }

  function rulesHtml(s) {
    const nowCard = (name, line, hdr) => `<div class="card">${icon.monitor}<div class="grow"><b>${name}</b>
      <div class="small muted">${line}</div></div><span class="chip ${hdr ? '' : 'mute'}">${hdr ? 'HDR' : 'SDR'}</span></div>`;
    return `<div class="row head"><div class="grow"><h1>${text.rules}</h1><p class="lead">${text.rulesLead}</p></div>
        <button class="btn primary" data-target="add">${icon.plus}${text.addApp}</button></div>
      ${s.gamesFound ? gamesBarHtml(s.gamesFound) : ''}
      <div class="sect first">${text.rightNow}</div>
      <div class="now">${nowCard('Main display', text.nowBy, true)}${nowCard('Left display', text.nowNone, false)}</div>
      ${ruleGroupHtml('apps', text.apps, s.rules.filter(rule => !isGame(rule.app)))}
      ${ruleGroupHtml('games', text.games, s.rules.filter(rule => isGame(rule.app)))}`;
  }

  // The bar above Right now that points out games without a rule. Finding games is Pro.
  function gamesBarHtml(count) {
    return `<div class="bar info gamesbar">${icon.game}<div class="grow"><b>${text.gamesFound(count)}</b>
      <div class="small muted">${text.gamesText}</div></div>${proBadge()}
      <button class="btn small">${text.showGames}</button><button class="btn small ghost">${text.later}</button></div>`;
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
    const label = rule.status === 'away' ? text.waitingFor(rule.display) : text.waiting;
    return `<span class="pill"><span class="dot"></span>${label}</span>`;
  }

  // When the rule runs, its display, what it changes and its extra conditions.
  const tagsHtml = rule => `<div class="line2"><span class="tag">${icon[rule.when]}${text.when[rule.when]}`
    + `${rule.when === 'full' ? proBadge('small') : ''}</span>`
    + `<span class="tag">${icon.monitor}${rule.display || 'Main display'}</span>`
    + `<span class="tag change">${text.hdrParts[rule.hdr]}${rule.hdr === 'file' ? proBadge('small') : ''}</span>`
    + `${rule.sound ? `<span class="tag">${icon.sound}${rule.sound}</span>` : ''}`
    + `${rule.extra ? `<span class="tag">${rule.extra}${proBadge('small')}</span>` : ''}</div>`;

  const switchesHtml = rule =>
    `${pillHtml(rule)}<span class="tgl ${rule.enabled ? 'on' : ''}"></span><span class="iconbtn">${icon.more}</span>`;

  function ruleHtml(rule, index) {
    return `<div class="card rule ${rule.enabled ? '' : 'off'}" data-key="rule-${rule.app}" style="--d:${index}">${icon.handle}${appIcon(rule.app)}
      <div class="grow"><div class="line1"><b>${apps[rule.app].name}</b></div>${tagsHtml(rule)}</div>${switchesHtml(rule)}</div>`;
  }

  // An app with several rules: its name once, then a numbered row for each rule, the higher
  // one first. A rule without a name is called by its number.
  function appCardHtml(appRules, index) {
    const app = appRules[0].app;
    const rows = appRules.map((rule, place) => `<div class="subrule ${rule.enabled ? '' : 'off'}">${icon.handle}
        <span class="place">${place + 1}</span><div class="grow"><div class="line1"><b>${rule.name || text.unnamedRule(place + 1)}</b></div>
        ${tagsHtml(rule)}</div>${switchesHtml(rule)}</div>`).join('');
    return `<div class="card rule appcard" data-key="app-${app}" style="--d:${index}">
      <div class="apphead">${icon.handle}${appIcon(app)}<div class="grow"><b>${apps[app].name}</b>
        <div class="small muted">${text.orderNote}</div></div><span class="small muted count">${text.ruleCount(appRules.length)}</span></div>
      ${rows}</div>`;
  }

  function wizardHtml(s) {
    const wizard = s.wizard;
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
    return `${steps}<div class="stepbody" data-key="step-${wizard.step}" style="--dx:28px">${bodies[wizard.step](s)}</div>${foot}`;
  }

  function chooseAppHtml(s) {
    const tile = (id, index) => {
      const ruleCount = s.rules.filter(rule => rule.app === id).length;
      const sub = ruleCount
        ? `<div class="sub has">${icon.check}${text.ruleCount(ruleCount)}</div>`
        : `<div class="sub">${apps[id].name}.exe</div>`;
      return `<div class="tile ${s.wizard.app === id ? 'sel' : ''}" data-key="tile-${id}" data-target="tile-${id}" style="--d:${index}">
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

  // The display step as in the app: where the rule applies, the map, then the HDR choice and
  // the couch mode switches in one card, with the rest folded under More settings.
  // The guide's pictures set more of it: the rule following its app, "By file" for a player,
  // the couch mode switches, and More settings opened.
  function displayHtml(s) {
    const wizard = s.wizard;
    const follows = wizard.target === 'app';
    const options = [['keep', text.keep], ['on', text.on], ['off', text.offButton]];
    if (wizard.player) options.push(['file', `${text.byFile}${proBadge('small')}`]);
    const hdr = segHtml(options.map(([value, label]) => [label, `hdr-${value}`]),
      options.findIndex(([value]) => value === wizard.hdr));
    const hdrDescription = wizard.hdr === 'file'
      ? `${text.byFileDescription} · <span class="link">${text.seeList}</span>` : text.hdrDescription;
    const proTitle = title => `<span class="title">${title}${proBadge('small')}</span>`;
    const toggle = on => `<span class="tgl ${on ? 'on' : ''}"></span>`;
    const target = segHtml([text.targets[0], `${text.targets[1]}${proBadge('small')}`], follows ? 1 : 0, 'target');
    const note = follows ? `<p class="note follownote">${text.followNote}</p>` : '';
    const setup = wizard.needsSetup
      ? `<div class="bar warn setupbar">${icon.warn}<div class="grow"><b>${text.needsSetupTitle(apps[wizard.app].name)}</b>
        <div class="small muted">${text.needsSetupText}</div></div><button class="btn small">${text.setUp}</button></div>`
      : '';
    return `<h1>${text.displayTitle(apps[wizard.app].name)}</h1><p class="lead">${text.displayLead}</p>
      <div>${target}</div>
      ${mapHtml(wizard)}${note}
      <div class="card box hdrcard">${optionHtml(icon.sun, 'HDR', hdrDescription, hdr, 'hdrrow')}
        ${optionHtml(icon.star, proTitle(text.makeMain), text.makeMainDescription, toggle(wizard.makesMain), 'mainrow')}
        ${optionHtml(icon.power, proTitle(text.othersOff), text.othersOffDescription, toggle(wizard.othersOff), 'othersrow')}
        ${moreHtml(wizard)}</div>${setup}`;
  }

  // "More settings", folded unless a picture opens it. Its summary lists what it changes.
  function moreHtml(wizard) {
    const more = wizard.more;
    const parts = more ? [more.refresh, more.brightness, more.profile].filter(Boolean) : [];
    const head = optionHtml(icon.sliders, text.more, '',
      `<span class="value">${parts.length ? parts.join(' · ') : text.keep}${icon.chevron}</span>`, `morehead ${more ? 'open' : ''}`);
    if (!more) return head;
    const combo = value => `<span class="combo">${value || text.keep}${icon.chevron}</span>`;
    const proTitle = title => `<span class="title">${title}${proBadge('small')}</span>`;
    const preview = more.refresh === text.matchPart ? `<div class="opt-sub preview small muted">${text.matchPreview}</div>` : '';
    return `${head}
      ${wizard.target === 'app' ? '' : optionHtml(icon.resolution, text.resolution, '', combo(), 'resrow')}
      <div class="option-group refreshrow">${optionHtml(icon.refresh, text.refresh, '', combo(more.refresh))}${preview}</div>
      ${optionHtml(icon.brightness, proTitle(text.brightness[0]), text.brightness[1], combo(more.brightness), 'brightrow')}
      ${optionHtml(icon.palette, proTitle(text.colorProfile[0]), text.colorProfile[1], combo(more.profile), 'profilerow')}
      ${optionHtml(icon.sound, text.sound[0], text.sound[1], combo(), 'soundrow')}`;
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
      const low = height < 70 ? 'low' : '';
      return `<div class="mon ${selected ? 'sel' : ''} ${low}" data-key="mon-${display.id}" style="${place}">${badge}
        <b>${display.name}</b><small>${display.width} × ${display.height} · ${display.hertz} Hz</small>
        <span class="chip ${display.hdr ? '' : 'mute'}">${display.hdr ? 'HDR' : 'SDR'}</span></div>`;
    }).join('');
    return `<div class="map" style="width:${width}px;height:${(bottom - top) * scale}px">${tiles}</div>`;
  }

  // The choices, the extra conditions under them, the summary and the rule's name, as in the
  // app. The tour keeps the first choice and shows its short summary. The guide's pictures
  // pick a choice and write the summary as the app does.
  function whenHtml(s) {
    const wizard = s.wizard;
    const name = apps[wizard.app].name;
    const when = wizard.when || 'open';
    const choices = text.whenChoices.map((choice, index) => whenChoiceHtml(choice, index, when)).join('');
    const order = wizard.otherRules ? `<div class="small muted ordernote">${text.orderNew(name)}</div>` : '';
    const naming = `<div class="namefield"><div>${text.ruleName[0]}</div><div class="textbox">${text.ruleName[1]}</div>${order}</div>`;
    if (!wizard.when) {
      return `<h1>${text.steps[2]}</h1><p class="lead">${text.whenLead}</p>${choices}${checksHtml(wizard)}
        <div class="card summary"><div class="sentence">${text.sentence(name, 'Main display')}</div>
          <div class="small muted">${text.goesBack(name)}</div></div>${naming}`;
    }
    const display = wizard.target === 'app' ? text.appsDisplay : 'Main display';
    const changes = [text.hdrParts[wizard.hdr || 'on']].map(part => `<span class="k">${part}</span>`).join(', ');
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
      ${wizard.target === 'app' ? '' : check(ticked.window, text.onlyWindow('Main display'))}
      ${check(ticked.power, text.onlyPower[0], `<span class="small muted">${text.onlyPower[1]}</span>`)}
      ${check(ticked.time, text.onlyTime[0], `${time(['18', '00'])}<span class="muted">${text.onlyTime[1]}</span>${time(['02', '00'])}`)}
      ${check(ticked.display, text.onlyDisplay, `<span class="combo">Main display${icon.chevron}</span>`)}</div>`;
  }

  // A choice with its radio, icon, title and description, "Recommended" on the first and the
  // PRO badge on full screen.
  function whenChoiceHtml(choice, index, chosen) {
    const badge = choice.id === 'full' ? proBadge() : '';
    const recommended = choice.id === 'open' ? `<span class="pill plain">${text.recommended}</span>` : '';
    return `<div class="radio ${choice.id === chosen ? 'on' : ''}" style="--d:${index}"><span class="r"></span>${icon[choice.id]}
        <div class="grow"><div class="title"><b>${choice.title}</b>${badge}</div><div class="small muted">${choice.description}</div></div>
        ${recommended}</div>`;
  }

  // Settings as a free user sees it: the Pro card with See Pro, then the General rows. The
  // window cuts the page off where the Displays section starts, as the app's screenshot does.
  function settingsHtml() {
    const toggle = '<span class="tgl on"></span>';
    const choice = (glyph, [title, description, choices]) => optionHtml(glyph, title, description, segHtml(choices, 0, 'compact'));
    const [playersTitle, playersDescription, seeList] = text.players;
    const players = `<div class="option-group">${optionHtml(icon.video, playersTitle, playersDescription, `<button class="btn">${seeList}</button>`)}
        <div class="opt-sub"><span class="grow">mpv</span><span class="pill warn"><span class="dot"></span>${text.needsSetup}</span>
          <button class="btn primary small">${text.setUp}</button></div></div>`;
    return `<h1>${text.settings}</h1><p class="lead">${text.settingsLead}</p>
      <div class="card box procard">${optionHtml(icon.star, `<b>${text.proFree}</b>`, text.proFreeDescription,
        `<button class="btn primary">${text.seePro}</button>`)}</div>
      <div class="sect">${text.general}</div>
      <div class="card box">${optionHtml(icon.power, ...text.startup, toggle)}
        ${optionHtml(icon.monitor, ...text.tray, toggle)}
        ${choice(icon.sun, text.theme)}
        ${choice(icon.bolt, text.animations)}
        ${choice(icon.palette, text.accent)}
        ${optionHtml(icon.language, text.language[0], '', `<span class="combo">${text.language[1]}${icon.chevron}</span>`)}
        ${players}</div>
      <div class="sect">${text.displays}</div><p class="lead">${text.displaysLead}</p>`;
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

  // The guide's pictures of setting up Pro: a strip of a page, from the element named by
  // `from` (less `pad` px above it, 16 unless set) down to `height` px, across the page's
  // content without the menu. The height is fixed, so the picture takes its place on the page
  // before it is drawn.
  const strips = {
    'hdr-file': {
      state: () => wizardAt(2, { app: 'mpv', hdr: 'file', player: true, needsSetup: true }),
      from: '.hdrcard', height: 346,
    },
    refresh: {
      state: () => wizardAt(2, { app: 'mpv', hdr: 'file', player: true, more: { refresh: text.matchPart } }),
      from: '.morehead', height: 213, pad: 0,
    },
    couch: {
      state: () => wizardAt(2, {
        app: 'cinema', hdr: 'on', displays: withTv, display: 'tv', makesMain: true, othersOff: true,
      }),
      from: '.map', height: 428,
    },
    'full-screen': {
      state: () => wizardAt(3, { app: 'racer', hdr: 'on', when: 'full' }),
      from: '.radio', height: 242,
    },
    follow: {
      state: () => wizardAt(2, { app: 'racer', hdr: 'on', target: 'app' }),
      from: '.seg.target', height: 336,
    },
    brightness: {
      state: () => wizardAt(2, { app: 'cinema', hdr: 'on', more: { brightness: '70%', profile: 'Wide Gamut Calibrated' } }),
      from: '.brightrow', height: 134, pad: 0,
    },
    conditions: {
      state: () => wizardAt(3, { app: 'cinema', hdr: 'on', when: 'open', checks: { time: true, display: true } }),
      from: '.checks', height: 180, pad: 6,
    },
    games: {
      state: () => ({ ...initialState(), gamesFound: 3 }),
      from: '.head', height: 172,
    },
    // Two rules for one player that both pick a sound output: the higher one for the projector,
    // only while the window is on it, and the other for the main display.
    'rule-order': {
      state: () => ({
        ...initialState(),
        rules: [
          {
            app: 'mpv', name: 'Projector', display: 'Projector', when: 'open', hdr: 'file', sound: 'Projector',
            extra: 'Window on Projector', enabled: true, status: 'away',
          },
          { app: 'mpv', name: 'Desk', when: 'open', hdr: 'file', sound: 'Headphones', enabled: true, status: 'waiting' },
        ],
      }),
      from: '.group', height: 262, pad: 12,
    },
    // The name box under the summary, for an app that has rules already.
    'rule-name': {
      state: () => wizardAt(3, { app: 'mpv', hdr: 'file', player: true, when: 'open', otherRules: true }),
      from: '.summary', height: 196,
    },
  };

  // The menu on the left, which the strips leave out (with the content's left border).
  const menuWidth = 212;

  // Draws a still into the element, in a shadow root so the window's styles and the page's
  // styles stay apart. It is laid out at the window's own size and scaled to the element's
  // width, with every animation at its end, and shows once its stylesheet has loaded.
  function draw(host, name) {
    const strip = strips[name];
    const state = strip ? strip.state() : stills[name]();
    const width = strip ? size.width - menuWidth : size.width;
    const shadow = host.shadowRoot || host.attachShadow({ mode: 'open' });
    shadow.innerHTML = `<link rel="stylesheet" href="${styleUrl}">
      <div class="stage" data-motion="off" style="visibility:hidden"><div class="win">${windowHtml(state)}</div></div>`;
    const stage = shadow.querySelector('.stage');
    let loaded = false;
    let top = null;
    if (strip) {
      host.style.aspectRatio = `${width} / ${strip.height}`;
      host.style.background = '#25282c';
      // Tall enough that nothing in the strip is cut off by the window's own height.
      stage.style.height = '1800px';
    }
    // Where the strip starts, in the window's own pixels, measured once it is laid out.
    const measure = scale => {
      stage.style.transform = `scale(${scale})`;
      const win = shadow.querySelector('.win').getBoundingClientRect();
      const from = shadow.querySelector(strip.from).getBoundingClientRect();
      return Math.max(0, (from.top - win.top) / scale - (strip.pad ?? 16));
    };
    const fit = () => {
      const scale = host.clientWidth / width;
      if (!strip) {
        stage.style.transform = `scale(${scale})`;
        return;
      }
      if (top === null && loaded && scale > 0) top = measure(scale);
      stage.style.transform = `scale(${scale}) translate(${-menuWidth}px, ${-(top || 0)}px)`;
    };
    shadow.querySelector('link').addEventListener('load', () => {
      loaded = true;
      fit();
      stage.style.visibility = '';
    });
    new ResizeObserver(fit).observe(host);
    fit();
  }

  return {
    size,
    draw,
    mount(element) { root = element; render(); },
    target(name) { return root.querySelector(`[data-target="${name}"]`); },
    act(name) { actions[name](); render(); },
    // Back to the first screen, built fresh so the rules page animates in as it does on open.
    reset() { state = initialState(); root.replaceChildren(); render(); },
  };
})();
