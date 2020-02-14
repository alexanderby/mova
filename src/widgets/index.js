import {openFile} from '../utils/extension.js';
import CheckBox from './checkbox/index.js';
import DropDown from './dropdown/index.js';
import Link from './link/index.js';
import templates from './templates.js';

const webComponents = {
    'checkbox': CheckBox,
    'dropdown': DropDown,
    'link': Link,
};
const webComponentsIds = Object.entries(webComponents).reduce((map, [id, wc]) => {
    map.set(wc, id);
    return map;
}, /** @type {Map<typeof HTMLElement, string>} */(new Map()));

/**
 * @param {typeof HTMLElement} wc
 */
async function loadWebComponent(wc) {
    if (templates.has(wc)) {
        return;
    }

    const id = webComponentsIds.get(wc);
    const tag = `mv-${id}`;
    const htmlURL = `widgets/${id}/index.html`;
    const cssURL = `widgets/${id}/style.css`;

    const [html, css] = await Promise.all([
        openFile(htmlURL),
        openFile(cssURL),
    ]);

    const template = new DOMParser().parseFromString(html, 'text/html').querySelector('template');
    const style = document.createElement('style');
    style.textContent = css;
    template.content.prepend(style);
    templates.set(wc, template);

    customElements.define(tag, wc);
}

/**
 * @param {(typeof HTMLElement)[]} wcs
 */
export async function loadWebComponents(wcs) {
    await Promise.all(wcs.map((wc) => loadWebComponent(wc)));
}
