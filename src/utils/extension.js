/**
 * @returns {Promise<chrome.tabs.Tab>}
 */
function getActiveTab() {
    return new Promise((resolve) => {
        chrome.tabs.query({active: true, lastFocusedWindow: true}, (tabs) => resolve(tabs ? tabs[0] : null));
    });
}

function getURLHost(url) {
    const a = document.createElement('a');
    a.href = url;
    return a.host;
}

/**
 * @returns {Promise<string>}
 */
export async function getActiveTabHost() {
    const tab = await getActiveTab();
    if (!tab) {
        return null;
    }
    return getURLHost(tab.url);
}

/**
 * @returns {Promise<chrome.tabs.Tab[]>}
 */
export function getAllTabs() {
    return new Promise((resolve) => {
        chrome.tabs.query({}, (tabs) => resolve(tabs));
    });
}

/**
 * @param {string} path
 * @returns {Promise<string>}
 */
export function openFile(path) {
    return new Promise((resolve, reject) => {
        chrome.runtime.getPackageDirectoryEntry((root) => {
            root.getFile(path, {}, (fileEntry) => {
                fileEntry.file((file) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        resolve(/** @type {string} */(reader.result));
                    };
                    reader.readAsText(file);
                }, reject);
            }, reject);
        });
    });
}

/**
 * @param {string} url
 * @returns {boolean}
 */
export function canInjectScript(url) {
    return !(
        url.startsWith('chrome://') ||
        url.startsWith('chrome-extension://') ||
        url.startsWith('https://chrome.google.com/webstore')
    );
}
