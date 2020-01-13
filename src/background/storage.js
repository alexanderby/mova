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

const storage = {
    getUserSettings,
    setUserSettings,
};

export default storage;
