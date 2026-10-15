// Small pictures for the Pro cards, one per card, named by its "art" in i18n/en.json.
// site.css moves them, and site.js plays them only while the card is on screen or under the
// pointer. Without animation each picture stands still on its finished state, the feature
// switched on. The classes below are what site.css animates:
//   on / off       fade in or out at the middle of the loop (base state: shown / hidden)
//   up-on / up-off the same, rising like a counter
//   pop            grows in at the middle of the loop
//   dim            a display fading to off
//   grow, slide    a window filling the screen or moving to the right-hand display
//   rays, bar, knob, turn, tick1-3: the pictures' own movements
(function () {
  const line = 'rgba(255,255,255,.4)';

  // A five-pointed star centred on (centerX, centerY).
  function star(centerX, centerY, radius) {
    const points = [];
    for (let i = 0; i < 10; i++) {
      const angle = (-90 + 36 * i) * Math.PI / 180;
      const length = i % 2 ? radius * 0.45 : radius;
      points.push(`${(centerX + length * Math.cos(angle)).toFixed(2)},${(centerY + length * Math.sin(angle)).toFixed(2)}`);
    }
    return `<polygon points="${points.join(' ')}"/>`;
  }

  // Upright marks along the bottom, one per refresh of the display.
  function ticks(step, count) {
    let path = '';
    for (let i = 0; i < count; i++) path += `M${(4 + step * i).toFixed(2)} 50V63`;
    return path;
  }

  function badge(x, y, label, fill, text, extra) {
    return `<rect x="${x}" y="${y}" width="28" height="14" rx="7" fill="${fill}" ${extra || ''}/>`
      + `<text x="${x + 14}" y="${y + 10.2}" text-anchor="middle" font-size="8.5" fill="${text}">${label}</text>`;
  }

  const sky = `<linearGradient id="pa-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ff8a3d"/><stop offset="1" stop-color="#ffd27a"/></linearGradient>`;
  const scene = (x, y, width, height, sunX, sunY) => {
    const bottom = y + height;
    const peaks = `M${x} ${bottom}L${x + width * 0.28} ${y + height * 0.45}L${x + width * 0.45} ${y + height * 0.7}`
      + `L${x + width * 0.63} ${y + height * 0.4}L${x + width} ${bottom}Z`;
    return {
      sdr: `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="2" fill="#3f4458"/>
        <circle cx="${sunX}" cy="${sunY}" r="5.5" fill="#8a8fa3"/>
        <path d="${peaks}" fill="#5d6275"/>`,
      hdr: `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="2" fill="url(#pa-sky)"/>
        <circle cx="${sunX}" cy="${sunY}" r="9" fill="#fff3c4" opacity=".55"/>
        <circle cx="${sunX}" cy="${sunY}" r="5.5" fill="#fffaf0"/>
        <path d="${peaks}" fill="#4b2d7a"/>`
    };
  };

  const film = scene(49, 9, 62, 46, 95, 21);
  const sprockets = [9, 19, 29, 39, 49]
    .map(y => `<rect x="41" y="${y}" width="4" height="5" rx="1"/><rect x="115" y="${y}" width="4" height="5" rx="1"/>`)
    .join('');

  const game = scene(28, 6, 96, 46, 104, 17);

  const screens = `<linearGradient id="pa-desk" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2f5a96"/><stop offset="1" stop-color="#1b2a55"/></linearGradient>
    <linearGradient id="pa-main" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#60cdff"/><stop offset="1" stop-color="#8b6cf0"/></linearGradient>`;

  const warm = `<radialGradient id="pa-warm" cx=".5" cy=".55" r=".7">
      <stop offset="0" stop-color="#ffd27a" stop-opacity=".95"/>
      <stop offset=".55" stop-color="#ff8a3d" stop-opacity=".5"/>
      <stop offset="1" stop-color="#ff8a3d" stop-opacity=".12"/></radialGradient>`;

  const monitor = (x, delay) => `<g class="dim">
      <rect class="bezel" x="${x}" y="12" width="40" height="27" rx="2.5"/>
      <rect class="off" x="${x + 2.5}" y="14.5" width="35" height="22" rx="1" fill="url(#pa-desk)"/>
      <path class="stand" d="M${x + 20} 39v5m-6 0h12"/>${delay || ''}</g>`;

  const rays = [];
  for (let i = 0; i < 8; i++) {
    const angle = i * Math.PI / 4;
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    rays.push(`M${(66 + 7.5 * cosine).toFixed(2)} ${(22 + 7.5 * sine).toFixed(2)}`
      + `L${(66 + 10.5 * cosine).toFixed(2)} ${(22 + 10.5 * sine).toFixed(2)}`);
  }

  const swatches = colors => colors
    .map((color, i) => `<rect x="122" y="${7 + 18 * i}" width="32" height="14" rx="3" fill="${color}"/>`)
    .join('');

  // Each sign sits in its ring at about half the ring's width, drawn smaller and shifted down by
  // shiftY so it looks centred; its lines come out as thick as the ring.
  const condition = (x, delay, shiftY, icon) => `<g transform="translate(${x} 30)">
      <g class="turn" style="--turn-delay:${delay}s">
        <circle r="14" fill="currentColor" fill-opacity=".12" stroke="currentColor" stroke-width="1.5"/>
        <g transform="translate(0 ${shiftY}) scale(.8)" fill="none" stroke="currentColor" stroke-width="1.9"
          stroke-linecap="round" stroke-linejoin="round">${icon}</g>
      </g></g>`;
  const display = '<path d="M-9 -7h18v12h-18z M0 5v3.5M-4.5 8.5h9"/>';

  const tile = (x, from, to, glyph) => `<linearGradient id="pa-tile${x}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient>
    <rect x="${x}" y="8" width="26" height="36" rx="3" fill="url(#pa-tile${x})"/>
    <g fill="#fff" fill-opacity=".6">${glyph}</g>`;
  const tick = (x, order) => `<g class="tick${order}">
      <circle cx="${x + 13}" cy="35" r="5.5" fill="#fff"/>
      <path d="M${x + 10.6} 35l1.7 1.9 3.3-3.8" fill="none" stroke="#1b2a55" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
    </g>`;

  window.ProArt = {
    // A film that plays in SDR, then an HDR one: the picture lights up and the badge changes.
    'hdr-file': `<defs>${sky}<radialGradient id="pa-glow"><stop offset="0" stop-color="#ffb547" stop-opacity=".4"/>
        <stop offset="1" stop-color="#ffb547" stop-opacity="0"/></radialGradient></defs>
      <ellipse class="on" cx="80" cy="32" rx="74" ry="34" fill="url(#pa-glow)"/>
      <rect x="37" y="5" width="86" height="54" rx="4" fill="#0a0e22" stroke="rgba(255,255,255,.3)"/>
      <g fill="rgba(255,255,255,.3)">${sprockets}</g>
      ${film.sdr}<g class="on">${film.hdr}</g>
      <g class="off">${badge(126, 4, 'SDR', '#3a3f52', '#c8cbe0', 'stroke="rgba(255,255,255,.25)"')}</g>
      <g class="pop">${badge(126, 4, 'HDR', '#ffb547', '#2a1600')}</g>`,

    // A 24 fps film: 60 Hz doesn't divide into its frames, 144 Hz lines up with every frame.
    'refresh': `<rect x="4" y="8" width="54" height="28" rx="6" fill="rgba(255,255,255,.06)" stroke="rgba(255,255,255,.22)"/>
      <text x="31" y="26.5" text-anchor="middle" font-size="11.5" fill="#fff">24 fps</text>
      <path d="M63 22h11m-4-4 4 4-4 4" fill="none" stroke="#8a8fa3" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <rect class="bezel" x="80" y="4" width="76" height="36" rx="3"/>
      <g class="up-off"><text x="118" y="26.5" text-anchor="middle" font-size="13" fill="#8a8fa3">60 Hz</text></g>
      <g class="up-on"><text x="118" y="26.5" text-anchor="middle" font-size="13" fill="#60cdff">144 Hz</text></g>
      <g fill="rgba(255,255,255,.13)">
        <rect x="4.5" y="53" width="36" height="7" rx="1.5"/><rect x="41.5" y="53" width="36" height="7" rx="1.5"/>
        <rect x="78.5" y="53" width="36" height="7" rx="1.5"/><rect x="115.5" y="53" width="36" height="7" rx="1.5"/>
      </g>
      <path class="off" d="${ticks(14.8, 11)}" stroke="#8a8fa3" stroke-width="1.2"/>
      <path class="on" d="${ticks(37 / 6, 25)}" stroke="#60cdff" stroke-width="1"/>`,

    // Two monitors and a TV: the TV becomes the main display and the monitors go dark.
    'couch': `<defs>${screens}</defs>
      ${monitor(4)}${monitor(48)}
      <rect class="bezel" x="94" y="4" width="62" height="38" rx="2.5"/>
      <path class="stand" d="M104 42l-3 4M146 42l3 4"/>
      <rect x="96.5" y="6.5" width="57" height="33" rx="1" fill="url(#pa-desk)" opacity=".7"/>
      <rect class="on" x="96.5" y="6.5" width="57" height="33" rx="1" fill="url(#pa-main)"/>
      <g class="off" fill="#fff">${star(24, 25.5, 6.5)}</g>
      <g class="pop" fill="#fff">${star(125, 23, 8.5)}</g>
      <g fill="none" stroke="#8a8fa3" stroke-width="1.5" stroke-linejoin="round">
        <path d="M109 52v-3a3 3 0 0 1 3-3h26a3 3 0 0 1 3 3v3"/>
        <path d="M104 61v-8a2.5 2.5 0 0 1 5 0v3h32v-3a2.5 2.5 0 0 1 5 0v8z"/>
      </g>`,

    // A game window grows to fill the screen, and only then does HDR light up.
    'fullscreen': `<defs>${sky.replace('pa-sky', 'pa-sky2')}</defs>
      <rect class="bezel" x="26" y="4" width="100" height="50" rx="3"/>
      <path class="stand" d="M76 54v5m-9 0h18"/>
      <g class="grow">${game.sdr}<g class="on">${game.hdr.replace('pa-sky', 'pa-sky2')}</g>
        <g class="off"><rect x="28" y="6" width="96" height="8" fill="#6b7080"/>
          <rect x="28" y="6" width="96" height="46" fill="none" stroke="rgba(255,255,255,.55)"/></g></g>
      ${badge(130, 8, 'HDR', 'none', '#6b7080', 'stroke="#5d6275"')}
      <g class="on">${badge(130, 8, 'HDR', '#ffb547', '#2a1600')}</g>`,

    // A window moves to the other display and the HDR glow goes with it.
    'follows': `<defs>${warm}</defs>
      <rect class="bezel" x="4" y="6" width="72" height="42" rx="2.5"/>
      <rect class="bezel" x="84" y="6" width="72" height="42" rx="2.5"/>
      <path class="stand" d="M40 48v5m-7 0h14M120 48v5m-7 0h14"/>
      <rect class="off" x="6.5" y="8.5" width="67" height="37" rx="1" fill="url(#pa-warm)"/>
      <rect class="on" x="86.5" y="8.5" width="67" height="37" rx="1" fill="url(#pa-warm)"/>
      <g font-size="7" text-anchor="middle">
        <text class="off" x="40" y="63" fill="#ffb547">HDR</text><text class="on" x="40" y="63" fill="#6b7080">SDR</text>
        <text class="on" x="120" y="63" fill="#ffb547">HDR</text><text class="off" x="120" y="63" fill="#6b7080">SDR</text>
      </g>
      <g class="slide">
        <rect x="22" y="15" width="36" height="24" rx="2" fill="#20263f" stroke="rgba(255,255,255,.65)"/>
        <rect x="22.5" y="15.5" width="35" height="5" fill="#60cdff" opacity=".75"/>
        <path d="M37 25.5l7 4-7 4z" fill="#fff"/>
      </g>`,

    // A video app, then a photo app: each brings its own brightness and colours.
    'brightness': `<rect x="4" y="14" width="36" height="36" rx="8" fill="rgba(255,255,255,.06)" stroke="rgba(255,255,255,.22)"/>
      <path class="off" d="M17 24.5l12 7.5-12 7.5z" fill="#60cdff"/>
      <g class="on" fill="#ffb547"><rect x="12" y="23" width="20" height="17" rx="2" fill="none" stroke="#ffb547" stroke-width="1.5"/>
        <path d="M13.5 38.5l6-7 4 4 3-3 4.5 6z"/><circle cx="26.5" cy="27.5" r="1.8"/></g>
      <g class="rays" stroke="#ffd27a" stroke-width="1.6" stroke-linecap="round"><path d="${rays.join('')}"/></g>
      <circle cx="66" cy="22" r="5" fill="#ffd27a"/>
      <path d="M52 44H110" stroke="rgba(255,255,255,.18)" stroke-width="4" stroke-linecap="round"/>
      <path class="bar" d="M52 44H104" stroke="#ffd27a" stroke-width="4" stroke-linecap="round"/>
      <circle class="knob" cx="104" cy="44" r="5" fill="#fff"/>
      <g class="off">${swatches(['#60cdff', '#8a9bff', '#e6e8f5'])}</g>
      <g class="on">${swatches(['#ff7a3d', '#ffb547', '#6fd98a'])}</g>`,

    // Plugged in, time of day, a display connected, the window on a display: lit one by one.
    'conditions': `<path d="M37.5 30h5M77.5 30h5M117.5 30h5" stroke="rgba(255,255,255,.22)" stroke-width="1.5" stroke-linecap="round"/>
      ${condition(20, 0, -0.2, '<path d="M-3.5 -9v4M3.5 -9v4M-6.5 -5h13v3a6.5 6.5 0 0 1 -13 0z M0 4.5v5"/>')}
      ${condition(60, 6, 0, '<circle r="8.5"/><path d="M0 -5v5l3.5 2.5"/>')}
      ${condition(100, 4, -0.6, display)}
      ${condition(140, 2, -0.6, `${display}<rect x="-6.5" y="-4.5" width="8" height="6" fill="currentColor" stroke="none"/>`)}`,

    // A controller and three game covers, each ticked off as it is set up.
    'games': `<path d="M18 18H46C52 18 55 21 56.5 27L59 39C60 44 54 47 51 43L46 37H18L13 43C10 47 4 44 5 39L7.5 27C9 21 12 18 18 18Z"
        fill="rgba(255,255,255,.08)" stroke="${line}" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M15 27.5h7M18.5 24v7" stroke="#c8cbe0" stroke-width="2" stroke-linecap="round"/>
      <g fill="#60cdff"><circle cx="44" cy="24" r="1.9"/><circle cx="48" cy="28" r="1.9"/>
        <circle cx="40" cy="28" r="1.9"/><circle cx="44" cy="32" r="1.9"/></g>
      ${tile(68, '#3b5bdb', '#60cdff', '<path d="M73 25l5.5-7 4 5 3-3 4.5 5z"/>')}
      ${tile(96, '#7b3fe4', '#d16ba5', star(109, 19.5, 6))}
      ${tile(124, '#ff7a3d', '#ffb547', '<circle cx="137" cy="20" r="5.5"/>')}
      ${tick(68, 1)}${tick(96, 2)}${tick(124, 3)}`
  };

  Object.keys(window.ProArt).forEach(name => {
    window.ProArt[name] = `<svg viewBox="0 0 160 64" width="160" height="64" focusable="false">${window.ProArt[name]}</svg>`;
  });
})();
