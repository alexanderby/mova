import {createExtendedDictionary} from '../translator/dictionary.js';
import createTranslator from '../translator/index.js';
import parsePhrases from '../translator/phrases.js';
import parsePrefixes from '../translator/prefixes.js';
import {publicDictionaryURL, validatePublicDictionary} from '../translator/public.js';
import createKalhoznik from '../translator/trasianka.js';
import createTrasliterator from '../transliterator/index.js';
import transliteratorTypes from '../transliterator/transliterator-types.js';
import {openFile} from '../utils/extension.js';
import {getLocalStorageItem, setLocalStorageItem} from './storage.js';

/** @typedef {import('../definitions').TranslationSettings} TranslationSettings */

/** @type {(text: string) => string} */
let translate = null;

/** @type {(text: string, type: string) => string}} */
let transliterate = null;

/** @type {($dict: string) => void} */
let creator = null;

/**
 * @param {string} $userDict
 */
function update($userDict) {
    creator($userDict);
}

export async function loadPublicDictionary() {
    const cacheKey = 'public-dictionary-cache';
    /** @type {string} */let result;

    try {
        const response = await fetch(publicDictionaryURL);
        if (response.ok) {
            const text = await response.text();
            await setLocalStorageItem(cacheKey, text);
            result = text;
        }
    } catch (err) {
        console.error(err);
    }

    if (!result) {
        result = await getLocalStorageItem(cacheKey);
    }

    const {error, fixed} = validatePublicDictionary(result);
    if (error) {
        console.error(error);
    }

    return fixed;
}

async function init() {
    let [
        $dictionary,
        $ruEnds,
        $beEnds,
        $forms,
        $phrases,
        $prefixes,
        $trasianka,
        $lacinka,
        $publicDict,
        $userDict,
    ] = await Promise.all([
        openFile('translator/dictionary.ru-be.txt'),
        openFile('translator/endings.ru.txt'),
        openFile('translator/endings.be.txt'),
        openFile('translator/forms.ru-be.txt'),
        openFile('translator/phrases.ru-be.txt'),
        openFile('translator/prefixes.ru-be.txt'),
        openFile('translator/trasianka.txt'),
        Promise.all(
            transliteratorTypes.map((type) => openFile(`transliterator/lacinka.${type}.txt`)),
        ),
        loadPublicDictionary(),
        getLocalStorageItem('user-dictionary'),
    ]);

    const dictionary = createExtendedDictionary($dictionary, $ruEnds, $beEnds, $forms);
    const prefixes = parsePrefixes($prefixes);
    const luka = createKalhoznik($trasianka);
    creator = ($newUserDict) => {
        const phrases = parsePhrases(`${$phrases}\n${$publicDict}\n${$newUserDict}`);
        translate = createTranslator({dictionary, phrases, prefixes, fallback: (word) => luka(word)});
    };
    update($userDict);
    const transliterators = transliteratorTypes.reduce((map, type, i) => {
        const transliterator = createTrasliterator($lacinka[i]);
        return map.set(type, transliterator);
    }, /** @type {Map<string, (text: string) => string>} */new Map());
    transliterate = (text, type) => transliterators.get(type)(text);

    setInterval(async () => {
        const $newPublicDict = await loadPublicDictionary();
        if ($newPublicDict && $newPublicDict !== $publicDict) {
            $publicDict = $newPublicDict;
            const $userDict = await getLocalStorageItem('user-dictionary');
            update($userDict);
            console.log('Dictionary updated', new Date());
        }
    }, 1000 * 60 * 60 * 1);
}

/**
 * @param {string} text
 * @param {TranslationSettings} settings
 */
function process(text, settings) {
    let result = text;
    if (settings.translation === 'ru-be') {
        result = translate(result);
    }
    if (settings.transliteration !== 'none') {
        result = transliterate(result, settings.transliteration);
    }
    return result;
}

export default {
    init,
    process,
    update,
};
