/** @type {Set<chrome.runtime.Port>} */
const tabPorts = new Set();

/**
 * @typedef Message
 * @property {string} type
 * @property {any} data
 */

/** 
 * @typedef {(msg: Message, sendMessage: (msg: Message) => void) => void} PortMessageListener
 */

/** @type {Set<PortMessageListener>} */
const popupListeners = new Set();

/**
 * @param {PortMessageListener} listener
 */
function onPopupMessage(listener) {
    popupListeners.add(listener);
}

/** @type {Set<PortMessageListener>} */
const tabListeners = new Set();

/**
 * @param {PortMessageListener} listener
 */
function onTabMessage(listener) {
    tabListeners.add(listener);
}

/**
 * @typedef {(sendMessage: (msg: Message) => void) => void} TabConnectListener
 */

/** @type {Set<TabConnectListener>} */
const tabConnectListeners = new Set();

/**
 * @param {TabConnectListener} listener
 */
function onTabConnect(listener) {
    tabConnectListeners.add(listener);
}

/**
 * @param {chrome.runtime.Port} port
 * @returns {(message: Message) => void}
 */
function createPortCallback(port) {
    return (message) => port.postMessage(message);
}

/**
 * @param {Message} data
 */
function sendToAllTabs(data) {
    tabPorts.forEach((port) => port.postMessage(data));
}

/**
 * @param {chrome.runtime.Port} port
 */
function connectTab(port) {
    tabPorts.add(port);
    port.onDisconnect.addListener(() => tabPorts.delete(port));
    port.onMessage.addListener((message) => {
        const sendMessage = createPortCallback(port);
        tabListeners.forEach((listener) => listener(message, sendMessage));
    });

    const sendMessage = createPortCallback(port);
    tabConnectListeners.forEach((listener) => listener(sendMessage));
}

/**
 * @param {chrome.runtime.Port} port
 */
function connectPopup(port) {
    port.onMessage.addListener((message) => {
        const sendMessage = createPortCallback(port);
        popupListeners.forEach((listener) => listener(message, sendMessage));
    });
}

const connectors = {
    'tab': connectTab,
    'popup': connectPopup,
};

chrome.runtime.onConnect.addListener((port) => connectors[port.name](port));

export default {
    onPopupMessage,
    onTabConnect,
    onTabMessage,
    sendToAllTabs,
};
