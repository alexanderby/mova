import {isWebsiteEnabled} from '../background/storage.js';
import {query} from '../utils/dom.js';
import './checkbox.js';
import state from './state.js';

/** @typedef {import('../background/storage').UserSettings} UserSettings */
/** @typedef {import('./checkbox').default} CheckBox */

/**
 * @template TIn
 * @template TOut
 * @typedef Stream
 * @property {(callback: (props: TIn) => void) => void} input
 * @property {(data: {enabled: boolean}) => void} output
 */

function initLocale() {
    query('[data-message]', (el) => {
        el.textContent = chrome.i18n.getMessage(el.dataset.message);
    });
}

/**
 * @param {Stream<{enabled: boolean; host: string}, {enabled: boolean}>} stream 
 */
function initEnabledForWebsite(stream) {
    query('.js-enabled-for-website', (/** @type {CheckBox} */el) => {
        stream.input(({enabled}) => el.setChecked(enabled));
        el.onChange((checked) => stream.output({enabled: checked}));
    });
    query('.js-website-hostname', (el) => {
        stream.input(({host}) => el.textContent = host);
    });
}

/**
 * @param {Stream<{enabled: boolean}, {enabled: boolean}>} stream 
 */
function initEnabledByDefault(stream) {
    query('.js-enabled-by-default', (/** @type {CheckBox} */el) => {
        stream.input(({enabled}) => el.setChecked(enabled));
        el.onChange((checked) => stream.output({enabled: checked}));
    });
}

/**
 * @param {Partial<UserSettings>} newSettings
 */
function changeSettings(newSettings) {
    state.set({settings: {...state.get().settings, ...newSettings}});
}

export function initUI() {
    initLocale();

    initEnabledForWebsite({
        input: (callback) => state.onChange(({settings, host}) => callback({
            host,
            enabled: isWebsiteEnabled(host, settings),
        })),
        output: ({enabled}) => {
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
        },
    });

    initEnabledByDefault({
        input: (callback) => state.onChange(({settings}) => callback({
            enabled: settings.enabledByDefault,
        })),
        output: ({enabled}) => changeSettings({
            enabledByDefault: enabled,
        }),
    });
}
