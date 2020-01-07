import {createExtendedDictionary} from '../translator/dictionary.js';
import createTranslator from '../translator/index.js';
import createKalhoznik from '../translator/trasianka.js';
import createTrasliterator from '../transliterator/index.js';
import {getActiveTabHost} from '../utils/chrome.js';
import {openFile} from '../utils/file.js';
import storage from './storage.js';

/** @type {(text: string) => string} */
let translate = null;

/** @type {(text: string) => string} */
let transliterate = null;

/** @type {Function[]} */
const awaiting = [];
let didAppLoad = false;

function waitForAppLoading() {
    return new Promise((resolve) => awaiting.push(resolve));
};

async function init() {
    const $dictionary = await openFile('translator/dictionary.ru-be.txt');
    const $ruEnds = await openFile('translator/endings.ru.txt');
    const $beEnds = await openFile('translator/endings.be.txt');
    const $trasianka = await openFile('translator/trasianka.txt');
    const $lacinka = await openFile('transliterator/lacinka.classic.txt');

    const dictionary = createExtendedDictionary($dictionary, $ruEnds, $beEnds);
    const luka = createKalhoznik($trasianka);
    translate = createTranslator({dictionary, fallback: (word) => luka(word)});
    transliterate = createTrasliterator($lacinka);

    didAppLoad = true;
    awaiting.forEach((resolve) => resolve);
}

/** @type {Set<chrome.runtime.Port>} */
const tabPorts = new Set();

chrome.runtime.onConnect.addListener(async (port) => {
    if (port.name === 'tab') {
        tabPorts.add(port);
        port.onDisconnect.addListener(() => tabPorts.delete(port));
        port.onMessage.addListener(async ({type, data}) => {
            if (!didAppLoad) {
                await waitForAppLoading();
            }
            if (type === 'translate') {
                const {id, text} = data;
                port.postMessage({type: 'done', data: {id, text: transliterate(translate(text))}});
            }
            if (type === 'transliterate') {
                const {id, text} = data;
                port.postMessage({type: 'done', data: {id, text: transliterate(text)}});
            }
        });

        const settings = await storage.getUserSettings();
        port.postMessage({type: 'app-settings', data: settings});
    } else if (port.name === 'popup') {
        port.onMessage.addListener(async ({type, data}) => {
            if (type === 'get-app-data') {
                const host = await getActiveTabHost();
                const settings = await storage.getUserSettings();
                port.postMessage({type: 'app-data', data: {host, settings}});
            } else if (type === 'change-settings') {
                await storage.setUserSettings(data);
                const settings = await storage.getUserSettings();
                tabPorts.forEach((port) => {
                    port.postMessage({type: 'app-settings', data: settings});
                });
            }
        });
    }
});

init();
