# HDRcue

HDRcue switches HDR on or off for the apps you choose. Open your movie player and the
display turns HDR on. Close it and the display goes back to how it was.

This repository holds HDRcue's website and takes feedback. The app's source code is not
here.

- Guide and common questions: https://hdrcue.phu-space.com/
- Privacy policy: https://hdrcue.phu-space.com/privacy.html
- Report a problem or suggest an idea: [open an issue](https://github.com/PHUICMT/hdrcue-support/issues/new/choose)

## The website

A static page served by GitHub Pages from this branch. The text lives in `i18n/en.json`, and
`site.js` fills the pages from it.

`demo/` draws the app's window in HTML and CSS and clicks through adding an app by itself, so
it stays sharp at any size. It is laid out at the window's own size (1344 x 850) and scaled to
fit its frame. The step captions are the `tour.*` texts in `i18n/en.json`. It loops, pauses
while it is off screen or the tab is hidden, and shows only the first step to visitors who
ask for reduced motion.

The pictures in the guide are drawn by the same `demo/view.js`, standing still: each
`data-window` element on the main page gets one page of the app (`choose`, `display` or
`settings`) in a shadow root that loads `demo/demo.css`. `view.js` asks for `demo.css` with its
own `?v=`, so give both the same number when either changes.

Each Pro card on the main page has a small moving picture drawn by `pro-art.js` in inline SVG,
named by the card's `art` in `i18n/en.json`. `site.css` animates them, only while the card is on
screen or under the pointer, and shows them standing still on the feature switched on to
visitors who ask for reduced motion.
