import {cyrillicRegexp, getUnicodeRegexpPart, replaceYo} from '../utils/string.js';

/**
 * @param {string} $word
 * @param {Map<string, string>} dictionary
 * @param {Map<string, string>} prefixes
 * @param {(word: string) => string} fallback
 * @returns {string}
 */
function translateWord($word, dictionary, prefixes, fallback) {
    const word = replaceYo($word);
    if (dictionary.has(word)) {
        return dictionary.get(word);
    }

    // TODO: More efficient prefix search.
    for (const p of prefixes.keys()) {
        if (word.startsWith(`${p}`)) {
            const hasDash = word.charAt(p.length) === '-';
            const remainder = word.substring(p.length + (hasDash ? 1 : 0));
            const translation = translateWord(remainder, dictionary, prefixes, fallback);
            return `${prefixes.get(p)}${hasDash ? '-' : ''}${translation}`;
        }
    }

    return fallback($word);
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
 * @param {string} src
 * @param {string} tgt
 * @returns {string}
 */
function copyCase(src, tgt) {
    const first = src[0];
    if (first.toLowerCase() === first) {
        return tgt;
    }
    const last = src[src.length - 1]
    if (first.toUpperCase() === first && last.toUpperCase() === last) {
        return tgt.toUpperCase();
    }
    return `${tgt[0].toUpperCase()}${tgt.substring(1)}`;
}

/**
 * 
 * @param {string} text 
 * @param {Map<string, string>} dictionary
 * @param {Map<string, Map|string>} phrases
 * @param {Map<string, string>} prefixes
 * @param {(word: string) => string} fallback
 * @returns {string}
 */
function translateText(text, dictionary, phrases, prefixes, fallback) {
    const matches = Array.from(text.matchAll(cyrillicRegexp));
    if (matches.length === 0) {
        return text;
    }

    const parts =/** @type {string[]} */[];
    for (let i = 0; i < matches.length; i++) {
        const m = matches[i];
        const p = i === 0 ? null : matches[i - 1];
        parts.push(text.substring(i === 0 ? 0 : p.index + p[0].length, m.index));

        let didFindPhrase = false;
        for (let j = i, node = phrases; j < matches.length; j++) {
            if (j > i) {
                const currMatch = matches[j];
                const prevMatch = matches[j - 1];
                const space = text.substring(prevMatch.index + prevMatch[0].length, currMatch.index);
                if (space !== ' ') {
                    break;
                }
            }

            const currWord = matches[j][0].toLocaleLowerCase();
            if (node.has(currWord)) {
                const next = node.get(currWord);
                if (typeof next === 'string') {
                    const srcPhrase = text.substring(matches[i].index, matches[j].index + currWord.length);
                    const translatedPhrase = copyCase(srcPhrase, next);
                    parts.push(translatedPhrase);
                    didFindPhrase = true;
                    i = j;
                    break;
                } else {
                    node = next;
                }
            } else {
                break;
            }
        }

        if (!didFindPhrase) {
            const word = m[0];
            const translation = translateWord(word.toLocaleLowerCase(), dictionary, prefixes, fallback);
            parts.push(copyCase(word, translation));
        }
    }
    const last = matches[matches.length - 1];
    parts.push(text.substring(last.index + last[0].length));

    return fixShortU(parts.join(''));
}

/**
 * Creates text translator
 * @param {{dictionary: Map<string, string>; phrases: Map<string, Map|string>; prefixes: Map<string, string>; fallback: (word: string) => string}} options
 * @returns {(text: string) => string}
 */
export default function createTranslator({dictionary, phrases, prefixes, fallback}) {
    return (text) => translateText(text, dictionary, phrases, prefixes, fallback);
}
