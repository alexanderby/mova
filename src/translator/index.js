import {cyrillicRegexp, getUnicodeRegexpPart} from '../utils/string.js';

/**
 * @param {string} word
 * @param {Map<string, string>} dictionary
 * @param {(word: string) => string} fallback
 * @returns {string}
 */
function translateWord(word, dictionary, fallback) {
    if (dictionary.has(word)) {
        return dictionary.get(word);
    }
    return fallback(word);
}

const shortURegex = new RegExp(
    `([${getUnicodeRegexpPart('аеёіоуыэюя')}]\\s?)(${getUnicodeRegexpPart('у')})`,
    'ig',
);

/**
 * @param {string} text
 * @return {string}
 */
function fixShortU(text) {
    return text.replace(shortURegex, (_, m0, m1) => {
        return `${m0}${m1 === 'у' ? 'ў' : 'Ў'}`;
    });
}

/**
 * 
 * @param {string} text 
 * @param {Map<string, string>} dictionary
 * @param {(word: string) => string} fallback
 * @returns {string}
 */
function translateText(text, dictionary, fallback) {
    const translated = text.replace(cyrillicRegexp, (word) => {
        const tr = translateWord(word.toLowerCase(), dictionary, fallback);
        const first = word[0];
        if (first.toLowerCase() === first) {
            return tr;
        }
        const last = word[word.length - 1]
        if (first.toUpperCase() === first && last.toUpperCase() === last) {
            return tr.toUpperCase();
        }
        return tr[0].toUpperCase() + tr.substring(1);
    });
    return fixShortU(translated);
}

/**
 * Creates text translator
 * @param {{dictionary: Map<string, string>; fallback: (word: string) => string}} options
 * @returns {(text: string) => string}
 */
export default function createTranslator({dictionary, fallback}) {
    return (text) => translateText(text, dictionary, fallback);
}
