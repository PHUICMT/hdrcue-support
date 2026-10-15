# HDRcue

HDRcue switches HDR on or off for the apps you choose. Open your movie player and the
display turns HDR on. Close it and the display goes back to how it was.

This repository holds HDRcue's website and takes feedback. The app's source code is not
here.

- Guide: https://hdrcue.phu-space.com/guide/
- Common questions: https://hdrcue.phu-space.com/#help
- Privacy policy: https://hdrcue.phu-space.com/privacy.html
- Report a problem or suggest an idea: [open an issue](https://github.com/PHUICMT/hdrcue-support/issues/new/choose)

## The website

Static pages served by GitHub Pages from this branch, with no build step.

| Path | What it is |
|---|---|
| `index.html` | The home page: what HDRcue does, the tour, how it works, help, feedback and Pro. A short script at the top sends old links to the guide (`#guide`, `#pro-setup`, `#pro-*`) to the same part of `guide/`. |
| `guide/index.html` | The guide, one part per feature, with its contents beside it on a wide screen and above it on a phone. |
| `privacy.html` | The privacy policy. |
| `i18n/en.json` | Every text on the site. |
| `site.css` | The styles for every page, in sections with a comment each. Shared values are custom properties at the top. |
| `layout.js` | Draws the header and footer on every page. A page says where the site's root is (`data-root` on `body`) and which page it is (`data-page`). |
| `site.js` | Fills each page from `i18n/en.json`, draws the guide's pictures and plays the tour while it is on screen. It sends a `site-texts-filled` event when the text is in. |
| `guide.js` | On the guide page: marks the part being read in the contents, and lights up a part reached by a link. |
| `open-app.js` | The "Open in HDRcue" buttons, which open a page of the app through a `hdrcue://` link. They show only on Windows PCs. |
| `lightbox.js` | Opens a guide picture larger when it is clicked or tapped. |
| `pro-art.js` | The small moving pictures on the Pro cards, in inline SVG. |
| `demo/` | The app's window drawn in HTML and CSS: `view.js` draws it, `demo.css` styles it, and `demo/index.html` with `demo.js` plays the tour. |
| `images/` | The icon, the Store badge and the picture for shared links. |

In a text, `**Add app**` marks a name shown in the app and is set in bold, and
`[label](address)` is a link.

### The guide

The app links to the guide's parts by id, so keep them as they are: `#guide` (the top),
`#getting-started`, `#add-app`, `#rules-page`, `#tray`, `#restore`, `#settings`, `#rules`,
`#several-rules`, `#rule-order`, `#players`, `#mpv`, `#vlc`, `#potplayer`, `#backup`,
`#backup-auto`, `#backup-restore`, `#backup-export`, `#pro-setup`, `#pro-hdr-by-file`,
`#pro-refresh`, `#pro-couch`, `#pro-full-screen`, `#pro-follow`, `#pro-brightness`,
`#pro-conditions` and `#pro-games`.

The Pro parts follow the order of the Pro cards on the home page, and each card links to its
part through `guideLink` in `pro.features`.

### Pictures and the tour

The tour on the home page and the guide's pictures are drawn by the same `demo/view.js`, so they
stay sharp at any size. The window is laid out at its own size (1344 x 850) and scaled to fit.
The tour clicks through adding an app by itself, with the `tour.*` texts as captions. It loops,
pauses while it is off screen or the tab is hidden, and shows only the first step to visitors
who ask for reduced motion.

Each `data-window` element in the guide gets a page of the app in a shadow root that loads
`demo/demo.css`: a whole window (`choose`, `display`, `settings`) or a strip of one (`strips`
in `view.js`), from one element of a page to another, across the page's content column, with the
same padding all round. `view.js` asks for `demo.css` with its own `?v=`, so give both the same
number when either changes. Give a changed file a new `?v=` wherever it is loaded.

Each Pro card has a small moving picture from `pro-art.js`, named by the card's `art`.
`site.css` animates them only while the card is on screen or under the pointer, and shows them
standing still, with the feature on, to visitors who ask for reduced motion.
