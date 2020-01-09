import {replaceYo} from '../utils/string.js';

/**
 * @param {string} $dict
 * @returns {[string, string][]}
 */
function parseDictionary($dict) {
    const pairs = $dict
        .split('\n')
        .filter((ln) => ln)
        .map((ln) => ln.split('\t'));
    const unsupportedChars = [' ', '.', '«', '»'];
    const data = pairs
        .filter((p) => p.every((w) => !unsupportedChars.some((c) => w.includes(c))))
        .map((p) => {
            return p
                .map((w) => w.toLocaleLowerCase())
                .map((w, i) => i === 0 ? replaceYo(w) : w);
        });
    return /** @type {[string, string][]} */(data);
}

/**
 * @typedef {{[nom: string]: string[]}} EndingsGroup
 */

/**
 * @typedef {{[group: string]: EndingsGroup}} EndingsCollection
 */

/**
 * @param {string} $ends
 * @returns {EndingsCollection}
 */
function parseEndings($ends) {
    const lines = $ends.split('\n').filter((ln) => ln && !ln.startsWith('#'));

    /** @type {EndingsCollection} */
    const groups = {};

    /** @type {string} */
    let g;

    lines.forEach((ln) => {
        if (ln.startsWith('@')) {
            g = ln.substring(1);
            groups[g] = {};
        } else {
            const rows = ln.split('\t');
            groups[g][rows[0]] = rows;
        }
    });

    return groups;
}

/**
 * @param {string} $forms
 * @returns {[string, string][]}
 */
function parseForms($forms) {
    return $forms
        .split('\n')
        .filter((ln) => ln.trim())
        .map((ln) => {
            const parts = ln.toLocaleLowerCase().split('\t');
            return [replaceYo(parts[0]), parts[1]];
        });
}

/**
 * @param {string} word
 * @param {EndingsCollection} ends
 * @returns {EndingsCollection}
 */
function getMatchedEndings(word, ends) {
    // TODO: Pick multiple matched groups (not longest only), then sort by longest match and choose best.
    let maxLen = 0;
    let matchedEnd = '';
    let matchedGroups = [];
    const groupNames = Object.keys(ends);
    for (const g of groupNames) {
        for (const end in ends[g]) {
            if (end.length === maxLen && end === matchedEnd) {
                matchedGroups.push(g)
            } else if (end.length > maxLen && word.endsWith(end)) {
                maxLen = end.length;
                matchedEnd = end;
                matchedGroups = [g];
            }
        }
    }
    return matchedGroups.reduce((obj, g) => {
        obj[g] = {[matchedEnd]: ends[g][matchedEnd]};
        return obj;
    }, {});
}

/**
 * @param {[string, string][]} dictionary
 * @param {EndingsCollection} srcEnds
 * @param {EndingsCollection} tgtEnds
 * @param {[string, string][]} forms
 * @returns {Map<string, string>}
 */
function buildExtendedDictionary(dictionary, srcEnds, tgtEnds, forms) {
    const extended = new Map(forms);
    dictionary.forEach(([src, tgt]) => {
        if (!extended.has(src)) {
            extended.set(src, tgt);
        }
    });

    dictionary.forEach(([src, tgt]) => {
        const mSrc = getMatchedEndings(src, srcEnds);
        const mTgt = getMatchedEndings(tgt, tgtEnds);
        const gSrc = Object.keys(mSrc);
        const gTgt = Object.keys(mTgt);
        const commonGroups = gSrc.filter((g) => gTgt.includes(g));
        if (commonGroups.length === 0 || src.length === 1 || tgt.length === 1) {
            extended.set(src, tgt);
            return;
        }

        /** @type {Map<string, string>} */
        const chosen = new Map();
        const majorSrcEnd = Object.keys(mSrc[commonGroups[0]])[0];
        const majorTgtEnd = Object.keys(mTgt[commonGroups[0]])[0];
        commonGroups.forEach((g) => {
            const srcEndGr = mSrc[g][majorSrcEnd];
            const tgtEndGr = mTgt[g][majorTgtEnd];
            for (let i = 0; i < srcEndGr.length; i++) {
                if (!chosen.has(srcEndGr[i])) {
                    chosen.set(srcEndGr[i], tgtEndGr[i]);
                }
            }
        });

        for (const [srcEnd, tgtEnd] of chosen) {
            const newSrc = src.substring(0, src.length - majorSrcEnd.length) + srcEnd;
            const newTgt = tgt.substring(0, tgt.length - majorTgtEnd.length) + tgtEnd;
            if (!extended.has(newSrc)) {
                extended.set(newSrc, newTgt);
            }
        }
    });

    return extended;
}

/**
 * Creates an extended dictionary with all the possible endings
 * @param {string} $dict Dictionary text
 * @param {string} $srcEnds Source endings text
 * @param {string} $tgtEnds Target endings text
 * @param {string} $forms Static dictionary with different word forms.
 * @returns {Map<string, string>}
 */
export function createExtendedDictionary($dict, $srcEnds, $tgtEnds, $forms) {
    const dict = parseDictionary($dict);
    const srcEnds = parseEndings(replaceYo($srcEnds));
    const tgtEnds = parseEndings($tgtEnds);
    const forms = parseForms($forms);
    return buildExtendedDictionary(dict, srcEnds, tgtEnds, forms);
}
