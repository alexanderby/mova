import {createExtendedDictionary} from '../translator/dictionary.js';
import createTranslator from '../translator/index.js';
import parsePrefixes from '../translator/prefixes.js';
import createKalhoznik from '../translator/trasianka.js';
import createTrasliterator from '../transliterator/index.js';
import transliteratorTypes from '../transliterator/transliterator-types.js';
import {openFile} from '../utils/file.js';

/** @typedef {import('../definitions').TranslationSettings} TranslationSettings */

/** @type {(text: string) => string} */
let translate = null;

/** @type {(text: string, type: string) => string}} */
let transliterate = null;

async function init() {
    const $dictionary = await openFile('translator/dictionary.ru-be.txt');
    const $ruEnds = await openFile('translator/endings.ru.txt');
    const $beEnds = await openFile('translator/endings.be.txt');
    const $prefixes = await openFile('translator/prefixes.ru-be.txt');
    const $trasianka = await openFile('translator/trasianka.txt');
    const $lacinka = await Promise.all(
        transliteratorTypes.map((type) => openFile(`transliterator/lacinka.${type}.txt`))
    );

    const dictionary = createExtendedDictionary($dictionary, $ruEnds, $beEnds);
    const prefixes = parsePrefixes($prefixes);
    const luka = createKalhoznik($trasianka);
    translate = createTranslator({dictionary, prefixes, fallback: (word) => luka(word)});
    const transliterators = transliteratorTypes.reduce((map, type, i) => {
        const transliterator = createTrasliterator($lacinka[i]);
        return map.set(type, transliterator);
    }, /** @type {Map<string, (text: string) => string>} */ new Map());
    transliterate = (text, type) => transliterators.get(type)(text);
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
};
