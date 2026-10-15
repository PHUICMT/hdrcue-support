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
| `i18n/` | Every text on the site, one file per language: `en.json`, `th.json`, `zh-Hans.json` and `ja.json`, all with the same keys. |
| `language.js` | Picks the language, sets `<html lang>`, loads the Thai font when needed, fills the language menus and changes the page's language in place. Every page loads it in `<head>`. |
| `fonts.css` | The font for each language, as `--font`. |
| `site.css` | The styles for every page, in sections with a comment each. Shared values are custom properties at the top. |
| `layout.js` | Draws the header and footer on every page. A page says where the site's root is (`data-root` on `body`) and which page it is (`data-page`). On a phone the menu folds into a button that opens it as a popup. |
| `site.js` | Fills each page with the texts of its language, draws the guide's pictures and plays the tour while it is on screen. It fills the page again when the language changes, and sends a `site-texts-filled` event each time the text is in. |
| `guide.js` | On the guide page: marks the part being read in the contents, and lights up a part reached by a link. |
| `open-app.js` | The "Open in HDRcue" buttons, which open a page of the app through a `hdrcue://` link. They show only on Windows PCs. |
| `lightbox.js` | Opens a guide picture larger when it is clicked or tapped. |
| `pro-art.js` | The small moving pictures on the Pro cards, in inline SVG. |
| `demo/` | The app's window drawn in HTML and CSS: `view.js` draws it, `demo.css` styles it, and `demo/index.html` with `demo.js` plays the tour. |
| `images/` | The icon, the Store badge and the picture for shared links. |

In a text, `**Add app**` marks a name shown in the app and is set in bold, and
`[label](address)` is a link. An element takes its text from `data-i18n` (plain),
`data-i18n-rich` (with bold and links), `data-i18n-list` and `data-i18n-steps` (a list), or
`data-i18n-alt`, `data-i18n-title` and `data-i18n-label` (`aria-label`) for an attribute. Each
page's title and description come from `meta.<page>.title` and `meta.<page>.description`.

### Languages

The site has the app's four languages: English, Thai, Simplified Chinese and Japanese. A page
shows the language from `?lang=` in its address (`en`, `th`, `zh-Hans` or `ja`, which the app
adds to the links it opens, such as `guide/?lang=th#players`), else the one the visitor chose
before, else the first of the browser's languages the site has, else English. Traditional
Chinese readers get another language from their browser's list if the site has it, and
Simplified Chinese otherwise. A language that came with `?lang=` is kept as the visitor's choice,
so it stays while they move around the site.

The globe button in the header and the row of languages in the footer change the language in
place: the page keeps the part being read where it was on the screen, the choice is saved in
the browser, and `?lang=` goes into the address so a shared link opens in the same language.
Each language has its own address for search engines (`<link rel="alternate" hreflang>`), and
the address without `?lang=` is the `x-default`.

Every key is in all four files. Names of buttons, pages and options in the guide are written
exactly as the app shows them in that language. The `app.*` texts are the app's own strings,
copied from its i18n files under the same keys with the same `{placeholders}`, for the pictures
of the app. Copy them again when the app's words change. `demo.*` are the names in the pictures
that the app doesn't have, such as the Desk rule.

Thai uses Noto Sans Thai from Google Fonts, loaded only on a Thai page. Japanese and Chinese use
the fonts the system has (Yu Gothic UI or Meiryo, and Microsoft YaHei UI on Windows).

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
stay sharp at any size, in the page's language. The tour's frame loads `language.js` too and
follows the page around it. The window is laid out at its own size (1344 x 850) and scaled to fit.
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
