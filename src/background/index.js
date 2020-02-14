import {getActiveTabHost, getAllTabs, canInjectScript} from '../utils/extension.js';
import messenger from './messenger.js';
import storage, {setLocalStorageItem, getLocalStorageItem} from './storage.js';
import textProcessor from './text-processor.js';

/** @typedef {import('../definitions').TranslationSettings} TranslationSettings */
/** @typedef {import('../definitions').UserSettings} UserSettings */
/** @typedef {import('./messenger').Message} Message */
/** @typedef {import('./messenger').PortMessageListener} MessageListener */

/** @type {Function[]} */
const awaiting = [];
let isAppReady = false;

function whenAppReady() {
    if (isAppReady) {
        return;
    }

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
    await whenAppReady();

    if (type === 'translate') {
        onTextTranslate(data, sendMessage);
    }
}

/**
 * @param {(settings: Message) => void} sendMessage
 */
async function onTabConnect(sendMessage) {
    await whenAppReady();

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
async function onPopupMessage({type, data}, sendMessage) {
    await whenAppReady();

    if (type === 'get-app-data') {
        onGetAppData(sendMessage);
    } else if (type === 'change-settings') {
        onChangeSettings(data);
    }
}

/**
 * @param {string} $userDict
 */
async function onUpdateUserDictionary($userDict) {
    await setLocalStorageItem('user-dictionary', $userDict);
    textProcessor.update($userDict);
    messenger.sendToAllTabs({type: 'dictionary-updated', data: null});
}

/**
 * @param {(data: Message) => void} sendMessage
 */
async function onGetUserDictionary(sendMessage) {
    const $dict = await getLocalStorageItem('user-dictionary');
    sendMessage({type: 'user-dictionary', data: $dict});
}

/** @type {MessageListener} */
async function onEditorMessage({type, data}, sendMessage) {
    await whenAppReady();

    if (type === 'change-user-dictionary') {
        onUpdateUserDictionary(data);
    } else if (type === 'get-user-dictionary') {
        onGetUserDictionary(sendMessage);
    }
}

async function start() {
    messenger.onPopupMessage(onPopupMessage);
    messenger.onTabConnect(onTabConnect);
    messenger.onTabMessage(onTabMessage);
    messenger.onEditorMessage(onEditorMessage);

    await textProcessor.init();

    isAppReady = true;
    awaiting.forEach((resolve) => resolve);

    const tabs = await getAllTabs();
    tabs
        .filter((tab) => !tab.discarded)
        .filter((tab) => canInjectScript(tab.url))
        .filter((tab) => !messenger.isTabConnected(tab.id))
        .sort((a, b) => Number(b.active) - Number(a.active))
        .forEach((tab) => chrome.tabs.executeScript(tab.id, {
            runAt: 'document_start',
            file: '/content/index.js',
            allFrames: true,
            matchAboutBlank: true,
        }));
}

start();
