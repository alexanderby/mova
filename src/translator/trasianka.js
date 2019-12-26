import {getUnicodeRegexpPart} from '../utils/string.js';

/**
 * @param {string} word
 * @param {string[][]} rules
 * @returns {string}
 */
function getTrasianka(word, rules) {
    return rules.reduce((word, [$ru, by]) => {
        const ru = $ru.replace(/^\^/, '').replace(/\$$/, '');
        const isBeginning = $ru.startsWith('^');
        const isEnding = $ru.endsWith('$');
        const regexp = new RegExp(`${isBeginning ? '^' : ''}${getUnicodeRegexpPart(ru)}${isEnding ? '$' : ''}`, 'ig');
        return word.replace(regexp, by);
    }, word);
}

/**
 * @param {string} rulesText
 * @returns {(text: string) => string}
 */
export default function createKalhoznik(rulesText) {
    const rules = rulesText
        .split('\n')
        .filter((ln) => ln)
        .map((ln) => ln.split(' '))
        .sort((a, b) => b[0].length - a[0].length);

    return (text) => getTrasianka(text, rules);
}
