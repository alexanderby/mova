import {isWebsiteEnabled} from '../../background/storage.js';
import {query, loadWebComponent} from '../../utils/dom.js';
import CheckBox from '../../widgets/checkbox/index.js';
import DropDown from '../../widgets/dropdown/index.js';
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
];

async function loadWebComponents() {
    await Promise.all(webComponents.map((wc) => loadWebComponent(wc.htmlURL, wc.cssURL, wc.tag, wc)));
}

function initLocale() {
    query('[data-message]', (el) => {
        el.textContent = chrome.i18n.getMessage(el.dataset.message);
    });
}

export async function initComponents() {
    await loadWebComponents();

    initLocale();

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
