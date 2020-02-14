import {ruRegexp, beRegexp} from '../utils/string.js';

export const publicDictionaryURL = 'https://raw.githubusercontent.com/alexanderby/mova/master/public/ru-be.txt';

const errorMessages = {
    NO_CRLF: 'Fajł maje kančatki radkoŭ CRLF, a pavinny być LF',
    NO_EMPTY_LINES: 'Nie pavinna być pustych strok (akramia apošniaj)',
    TAB: 'Ne chapaje tabulacyi (Tab)',
    SINGLE_TAB: 'Spatrebien tolki adzin znak tabulacyi (Tab)',
    NO_EXTRA_SPACE: 'Sustrakajucca lišnija prabieły',
    APOSTROPHE: 'Apostraf "’" treba zmianić na "\'"',
    RU_CHARS_ONLY: 'Zychodny tekst pavinien mieć tolki ruskija litary',
    BE_CHARS_ONLY: 'Pierakład pavinien mieć tolki biełaruskija litary',
};

/**
 * @param {string} $dict
 * @returns {{error: string; fixed: string}}
 */
export function validatePublicDictionary($dict) {
    if ($dict.includes('\r')) {
        return {error: errorMessages.NO_CRLF, fixed: ''};
    }

    const errors = [];
    const correctLines = [];
    const lines = $dict.split('\n');
    lines.forEach((ln, i) => {
        if (ln.startsWith('#')) {
            correctLines.push(ln);
            return;
        }
        if (ln === '') {
            if (i === lines.length - 1) {
                correctLines.push(ln);
                return;
            }
            errors.push([i, errorMessages.NO_EMPTY_LINES]);
            return;
        }
        if (!ln.includes('\t')) {
            errors.push([i, errorMessages.TAB]);
            return;
        }
        const parts = ln.split('\t');
        if (parts.length > 2) {
            errors.push([i, errorMessages.SINGLE_TAB]);
            return;
        }
        if (!parts.every((p) => p.trim() === p || p.includes('  '))) {
            errors.push([i, errorMessages.NO_EXTRA_SPACE]);
            return;
        }
        if (ln.includes('’')) {
            errors.push([i, errorMessages.APOSTROPHE]);
            return;
        }
        const [ru, be] = parts;
        if (!ru.split(' ').every((w) => {
            const m = w.match(ruRegexp);
            return m && m[0] === w;
        })) {
            errors.push([i, errorMessages.RU_CHARS_ONLY]);
            return;
        }
        if (!be.split(' ').every((w) => {
            const m = w.match(beRegexp);
            return m && m[0] === w;
        })) {
            errors.push([i, errorMessages.BE_CHARS_ONLY]);
            return;
        }
        correctLines.push(ln);
    });
    return {
        error: errors.map(([i, msg]) => `${i + 1}: ${msg}`).join('\n'),
        fixed: correctLines.join('\n'),
    };
}
