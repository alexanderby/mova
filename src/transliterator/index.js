import {getCharHexCode, punctuationRegexpPart} from '../utils/string.js';

/** @typedef {[RegExp, (match: string) => string]} ReplacerTuple */

/**
 * @param {string} rulesText
 * @returns {ReplacerTuple[]}
 */
function parseRules(rulesText) {
    const rules = [];
    /** @type {{[group: string]: string[]}} */
    const groups = {};
    const lines = rulesText.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const ln = lines[i].trim();
        if (!ln) {
            continue;
        }
        if (ln.startsWith('[') && ln.endsWith(']')) {
            const groupName = ln.substring(1, ln.length - 1);
            groups[groupName] = lines[i + 1].trim().split(/\s+/g);
            i++;
            continue;
        }
        rules.push(ln.split(/\s+/g));
    }

    /** @type {ReplacerTuple[]} */
    const replacers = [];
    rules
        .sort(([a], [b]) => b.length - a.length)
        .forEach(([cyrillic, latin = '']) => {
            const start = cyrillic.startsWith('^')
                ? `(?<=^|\\s|[${punctuationRegexpPart}])`
                : cyrillic.startsWith('[')
                    ? `(?<=${groups[cyrillic.substring(1, cyrillic.indexOf(']'))]
                        .map(c => `\\u${getCharHexCode(c)}`)
                        .join('|')})`
                    : '';
            const end = cyrillic.endsWith('$')
                ? `(?=$|\\s|[${punctuationRegexpPart}])`
                : cyrillic.endsWith(']')
                    ? `(?=${groups[
                        cyrillic.substring(cyrillic.indexOf('[') + 1, cyrillic.length - 1)
                    ]
                        .map(c => `\\u${getCharHexCode(c)}`)
                        .join('|')})`
                    : '';
            const word = cyrillic
                .replace('^', '')
                .replace('$', '')
                .replace(/\[.*\]/g, '');
            const unicode = word
                .split('')
                .map(c => `\\u${getCharHexCode(c)}`)
                .join('');

            const regexp = new RegExp(`${start}${unicode}${end}`, 'ig');
            const replacer = (/** @type {string} */match) => {
                if (match === word) {
                    return latin;
                }
                return `${latin.charAt(0).toUpperCase()}${latin.substring(1)}`;
            };
            replacers.push([regexp, replacer]);
        });

    return replacers;
}

/**
 * @param {string} text
 * @param {ReplacerTuple[]} replacers
 */
function transliterate(text, replacers) {
    // TODO: Loop through characters, don't use RegExps.
    return replacers.reduce((result, [regexp, replacer]) => {
        return result.replace(regexp, replacer);
    }, text);
}

/**
 * @param {string} rulesText
 * @returns {(text: string) => string}
 */
export default function createTransliterator(rulesText) {
    const rules = parseRules(rulesText);
    return (text) => transliterate(text, rules);
}
