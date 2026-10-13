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
`site.js` fills the pages from it. Screenshots in `images/screens/` come from the app's own
repository (`docs/store/screenshots`).

`demo/` draws the app's window in HTML and CSS and clicks through adding an app by itself, so
it stays sharp at any size. It is laid out at the window's own size (1344 x 850) and scaled to
fit its frame. The step captions are the `tour.*` texts in `i18n/en.json`. It loops, pauses
while it is off screen or the tab is hidden, and shows only the first step to visitors who
ask for reduced motion.
