import {getCharHexCode} from '../utils/string.js';

/**
 * @typedef RulesObject
 * @property {string[][]} rules
 * @property {{[group: string]: string[]}} groups
 */

/**
 * @param {string} rulesText
 * @returns {RulesObject}
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
    return {rules, groups};
}

/**
 * @param {string} text
 * @param {RulesObject} options
 */
function transliterate(text, {rules, groups}) {
    return rules
        .slice()
        .sort(([a], [b]) => b.length - a.length)
        .reduce((result, [cyrillic, latin = '']) => {
            const start = cyrillic.startsWith('^')
                ? '(?<=^|\\s)'
                : cyrillic.startsWith('[')
                    ? `(?<=${groups[cyrillic.substring(1, cyrillic.indexOf(']'))]
                        .map(c => `\\u${getCharHexCode(c)}`)
                        .join('|')})`
                    : '';
            const end = cyrillic.endsWith('$')
                ? '(?=^|\\s)'
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
            return result.replace(
                new RegExp(`${start}${unicode}${end}`, 'ig'),
                match => {
                    if (match === word) {
                        return latin;
                    }
                    return `${latin.charAt(0).toUpperCase()}${latin.substring(1)}`;
                }
            );
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
