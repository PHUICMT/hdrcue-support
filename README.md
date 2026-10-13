# SceneShift

SceneShift switches HDR on or off for the apps you choose. Open your movie player and the
display turns HDR on. Close it and the display goes back to how it was.

This repository holds SceneShift's website and takes feedback. The app's source code is not
here.

- Guide and common questions: https://phuicmt.github.io/sceneshift-support/
- Privacy policy: https://phuicmt.github.io/sceneshift-support/privacy.html
- Report a problem or suggest an idea: [open an issue](https://github.com/PHUICMT/sceneshift-support/issues/new/choose)

## The website

A static page served by GitHub Pages from this branch. The text lives in `i18n/en.json`, and
`site.js` fills the pages from it. Screenshots in `images/screens/` come from the app's own
repository (`docs/store/screenshots`).

`images/walkthrough/` holds a screen recording of adding an app in demo mode, made by the app
repository's `tools/store/record-walkthrough.ps1`. Its `walkthrough.json` says when each step
starts and where each click lands, and the page shows the step captions and click marks from
it.
