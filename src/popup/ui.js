import {isWebsiteEnabled} from '../background/storage.js';
import transliteratorTypes from '../transliterator/transliterator-types.js';
import {query} from '../utils/dom.js';
import CheckBox from '../widgets/checkbox/index.js';
import DropDown from '../widgets/dropdown/index.js';
import Link from '../widgets/link/index.js';
import {loadWebComponents} from '../widgets/index.js';
import {
    changeEnabledByDefault,
    changeEnabledForCurrentWebsite,
    changeTranslation,
    changeTransliteration,
} from './actions.js';
import {onStateChange} from './state.js';

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

async function initLinks() {
    await loadWebComponents([Link]);
}

async function initEnabledForWebsite() {
    await loadWebComponents([CheckBox]);
    query('.js-enabled-for-website', (el) => {
        const checkBox = /** @type {CheckBox} */(el);
        onStateChange(({host, settings}) => {
            const isEnabled = isWebsiteEnabled(host, settings);
            checkBox.setChecked(isEnabled);
        });
        checkBox.onChange((isChecked) => changeEnabledForCurrentWebsite(isChecked));
    });
    query('.js-website-hostname', (el) => {
        onStateChange(({host}) => el.textContent = host);
    });
}

async function initEnabledByDefault() {
    await loadWebComponents([CheckBox]);
    query('.js-enabled-by-default', (el) => {
        const checkBox = /** @type {CheckBox} */(el);
        onStateChange(({settings}) => checkBox.setChecked(settings.enabledByDefault));
        checkBox.onChange((isChecked) => changeEnabledByDefault(isChecked));
    });
}

async function initTranslation() {
    await loadWebComponents([CheckBox]);
    query('.js-translation', (el) => {
        const checkBox = /** @type {CheckBox} */(el);
        onStateChange(({settings}) => checkBox.setChecked(settings.translation !== 'none'));
        checkBox.onChange((isChecked) => changeTranslation(isChecked ? 'ru-be' : 'none'));
    });
}

async function initTransliteration() {
    /** @typedef {import('../definitions').TransliterationType} TransliterationType */

    await loadWebComponents([DropDown]);

    const values = Object.fromEntries(
        transliteratorTypes
            .concat('none')
            .map((type) => {
                const message = chrome.i18n.getMessage(`transliteration_${type}`);
                return [type, message];
            })
    );

    query('.js-transliteration', (el) => {
        const dropDown =/** @type {DropDown} */(el);
        dropDown.setItems(values);
        onStateChange(({settings}) => dropDown.setSelectedValue(settings.transliteration));
        dropDown.onChange((/** @type {TransliterationType} */selected) => changeTransliteration(selected));
    });
}

function initLoading() {
    onStateChange(({isLoading}) => document.body.classList.toggle('loading', isLoading));
}

export async function initUI() {
    initLocale();
    initVersion();
    await initLinks();
    await initEnabledForWebsite();
    await initEnabledByDefault();
    await initTranslation();
    await initTransliteration();
    initLoading();
}
