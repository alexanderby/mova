import {getActiveTabHost} from '../utils/chrome.js';
import messenger from './messenger.js';
import storage from './storage.js';
import textProcessor from './text-processor.js';

/** @typedef {import('./messenger').Message} Message */
/** @typedef {import('./messenger').PortMessageListener} MessageListener */
/** @typedef {import('./storage').TranslationSettings} TranslationSettings */
/** @typedef {import('./storage').UserSettings} UserSettings */

/** @type {Function[]} */
const awaiting = [];
let isReady = false;

function whenAppReady() {
    return new Promise((resolve) => awaiting.push(resolve));
};

/**
 * @param {{id: number; text: string; settings: TranslationSettings}} data
 * @param {(msg: Message) => void} sendMessage
 */
function onTextTranslate({id, text, settings}, sendMessage) {
    const result = textProcessor.process(text, settings);
    sendMessage({type: 'done', data: {id, text: result}});
}

/** @type {MessageListener} */
async function onTabMessage({type, data}, sendMessage) {
    if (!isReady) {
        await whenAppReady();
    }
    if (type === 'translate') {
        onTextTranslate(data, sendMessage);
    }
}

/**
 * @param {(settings: Message) => void} sendMessage
 */
async function onTabConnect(sendMessage) {
    const settings = await storage.getUserSettings();
    sendMessage({type: 'app-settings', data: settings});
}

/**
 * @param {(data: Message) => void} sendMessage
 */
async function onGetAppData(sendMessage) {
    const host = await getActiveTabHost();
    const settings = await storage.getUserSettings();
    sendMessage({type: 'app-data', data: {host, settings}});
}

/**
 * @param {UserSettings} settings 
 */
async function onChangeSettings(settings) {
    await storage.setUserSettings(settings);
    const saved = await storage.getUserSettings();
    messenger.sendToAllTabs({type: 'app-settings', data: saved});
}

/** @type {MessageListener} */
function onPopupMessage({type, data}, sendMessage) {
    if (type === 'get-app-data') {
        onGetAppData(sendMessage);
    } else if (type === 'change-settings') {
        onChangeSettings(data);
    }
}

async function start() {
    messenger.onPopupMessage(onPopupMessage);
    messenger.onTabConnect(onTabConnect);
    messenger.onTabMessage(onTabMessage);

    await textProcessor.init();

    isReady = true;
    awaiting.forEach((resolve) => resolve);
}

start();
