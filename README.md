# Mova

A browser extension for translating all Russian
texts into Belarusian latin scripts.

### Build

Running `npm install && npm run build` will produce a `build.zip` and `build-firefox.xpi` archives.

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
