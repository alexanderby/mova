import state from './state.js';

/** @typedef {import('../definitions').TranslationType} TranslationType */
/** @typedef {import('../definitions').TransliterationType} TransliterationType */
/** @typedef {import('../definitions').UserSettings} UserSettings */

/**
 * @param {Partial<UserSettings>} newSettings
 */
function changeSettings(newSettings) {
    state.set({
        settings: {
            ...state.get().settings,
            ...newSettings,
        },
    });
}

/**
 * @param {boolean} enabled
 */
export function changeEnabledByDefault(enabled) {
    changeSettings({enabledByDefault: enabled});
}

/**
 * @param {boolean} enabled
 */
export function changeEnabledForCurrentWebsite(enabled) {
    const {host, settings} = state.get();
    if (settings.enabledByDefault) {
        const sites = new Set(settings.disabledFor);
        if (enabled && sites.has(host)) {
            sites.delete(host);
        } else if (!enabled && !sites.has(host)) {
            sites.add(host);
        }
        changeSettings({disabledFor: Array.from(sites)});
    } else {
        const sites = new Set(settings.enabledFor);
        if (!enabled && sites.has(host)) {
            sites.delete(host);
        } else if (enabled && !sites.has(host)) {
            sites.add(host);
        }
        changeSettings({enabledFor: Array.from(sites)});
    }
}

/**
 * @param {TranslationType} type
 */
export function changeTranslation(type) {
    changeSettings({translation: type});
}

/**
 * @param {TransliterationType} type
 */
export function changeTransliteration(type) {
    changeSettings({transliteration: type});
}
