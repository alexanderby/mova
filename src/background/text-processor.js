import {createExtendedDictionary} from '../translator/dictionary.js';
import createTranslator from '../translator/index.js';
import createKalhoznik from '../translator/trasianka.js';
import createTrasliterator from '../transliterator/index.js';
import {openFile} from '../utils/file.js';

/** @typedef {import('./storage').TranslationSettings} TranslationSettings */

/** @type {(text: string) => string} */
let translate = null;

/** @type {(text: string) => string} */
let transliterate = null;

async function init() {
    const $dictionary = await openFile('translator/dictionary.ru-be.txt');
    const $ruEnds = await openFile('translator/endings.ru.txt');
    const $beEnds = await openFile('translator/endings.be.txt');
    const $trasianka = await openFile('translator/trasianka.txt');
    const $lacinka = await openFile('transliterator/lacinka.official.txt');

    const dictionary = createExtendedDictionary($dictionary, $ruEnds, $beEnds);
    const luka = createKalhoznik($trasianka);
    translate = createTranslator({dictionary, fallback: (word) => luka(word)});
    transliterate = createTrasliterator($lacinka);
}

/**
 * @param {string} text
 * @param {TranslationSettings} settings
 */
function process(text, settings) {
    let result = text;
    if (settings.translate) {
        result = translate(result);
    }
    if (settings.transliterate) {
        result = transliterate(result);
    }
    return result;
}

export default {
    init,
    process,
};
