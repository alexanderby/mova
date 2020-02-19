# Mova

A browser extension for translating all Russian
texts into Belarusian latin scripts.

### Install

- [Chrome (Chromium)](https://chrome.google.com/webstore/detail/mova/allmpacagboplmpkggjldlnabgpjpocf?hl=ru)
- [Firefox](https://addons.mozilla.org/ru/firefox/addon/mova/)
- [Firefox for Android](https://addons.mozilla.org/ru/android/addon/mova/)

### Build

Running `npm install && npm run build` will produce a `build/mova-chrome.zip` and `build/mova-firefox.xpi` archives.

### Debug

- Checkout the repository.
- Run `npm install`.
- Open `chrome://extensions page`.
- Enable **Developer mode**.
- Click **Load unpacked**, navigate to `src/` folder.
- To debug the **background page** click `background/index.html`.
To inspect the **popup** right-click the extension's icon, click **Inspect Popup**.
To debug the **content script** open the dev tools on any page,
open **Sources** tab,
choose **Content scripts**,
open `Mova/content/index.js` file.
