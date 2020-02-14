/** @typedef {import('../definitions').UserSettings} UserSettings */

/** @type {UserSettings} */
const defaultSettings = {
    enabledByDefault: true,
    enabledFor: [],
    disabledFor: [],
    translation: 'ru-be',
    transliteration: 'classic',
};

/**
 * @returns {Promise<UserSettings>}
 */
function getUserSettings() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(defaultSettings, (settings) => {
            resolve(/** @type {UserSettings} */(settings));
        });
    });
}

/**
 * @param {UserSettings} settings
 * @returns {Promise<void>}
 */
function setUserSettings(settings) {
    return new Promise((resolve) => {
        chrome.storage.sync.set(settings, () => {
            resolve();
        });
    });
}

/**
 * @param {string} host
 * @param {UserSettings} settings
 */
export function isWebsiteEnabled(host, settings) {
    const isForcedEnabled = settings.enabledFor.includes(host);
    const isForcedDisabled = settings.disabledFor.includes(host);
    return settings.enabledByDefault ?
        !isForcedDisabled :
        isForcedEnabled;
}

/**
 * @param {string} key
 * @returns {Promise<string>}
 */
export function getLocalStorageItem(key) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get({[key]: ''}, (items) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(items[key]);
            }
        });
    });
}

/**
 * @param {string} key
 * @param {string} value
 * @returns {Promise<void>}
 */
export function setLocalStorageItem(key, value) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.set({[key]: value}, () => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve();
            }
        });
    });
}

const storage = {
    getUserSettings,
    setUserSettings,
};

export default storage;
