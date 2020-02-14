import {isWebsiteEnabled} from '../../background/storage.js';
import {query} from '../../utils/dom.js';
import CheckBox from '../../widgets/checkbox/index.js';
import DropDown from '../../widgets/dropdown/index.js';
import Link from '../../widgets/link/index.js';
import {loadWebComponents} from '../../widgets/index.js';
import {
    changeEnabledByDefault,
    changeEnabledForCurrentWebsite,
    changeTranslation,
    changeTransliteration,
} from '../actions.js';
import {createUIStream} from '../stream.js';
import initEnabledByDefault from './enabled-by-default.js';
import initEnabledForWebsite from './enabled-for-website.js';
import initTranslation from './translation.js';
import initTransliteration from './transliteration.js';

const webComponents = [
    CheckBox,
    DropDown,
    Link,
];

function initLocale() {
    query('[data-message]', (el) => {
        el.textContent = chrome.i18n.getMessage(el.dataset.message);
    });
}

function initVersion() {
    const version = chrome.runtime.getManifest().version;
    query('.js-version', (el) => {
        el.textContent = version;
    });
}

export async function initComponents() {
    await loadWebComponents(webComponents);

    initLocale();
    initVersion();

    initEnabledForWebsite(createUIStream({
        stateToInput: ({host, settings}) => {
            return {
                host,
                enabled: isWebsiteEnabled(host, settings),
            };
        },
        output: ({enabled}) => {
            changeEnabledForCurrentWebsite(enabled);
        },
    }));

    initEnabledByDefault(createUIStream({
        stateToInput: ({settings}) => {
            return {
                enabled: settings.enabledByDefault,
            };
        },
        output: ({enabled}) => changeEnabledByDefault(enabled),
    }));

    initTranslation(createUIStream({
        stateToInput: ({settings}) => {
            return {
                enabled: settings.translation !== 'none',
            };
        },
        output: ({enabled}) => changeTranslation(enabled ? 'ru-be' : 'none'),
    }));

    initTransliteration(createUIStream({
        stateToInput: ({settings}) => {
            return {
                selected: settings.transliteration,
            };
        },
        output: ({selected}) => changeTransliteration(selected),
    }));
}
