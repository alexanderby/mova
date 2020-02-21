/** @type {Set<(type: string, data: any) => void>} */
const listeners = new Set();

const port = chrome.runtime.connect({name: 'popup'});
port.onMessage.addListener(({type, data}) => listeners.forEach((callback) => callback(type, data)));

/**
 * @param {(type: string, data: any) => void} callback
 */
function onMessage(callback) {
    listeners.add(callback);
}

/**
 * @param {string} type 
 * @param {any} [data]
 */
function sendMessage(type, data = null) {
    port.postMessage({type, data});
}

export default {
    onMessage,
    sendMessage,
};
