export const cyrillicRegexp = new RegExp(
    /[\u0027\u0401\u0406\u040e\u0410-\u044f\u0451\u0456\u045e\u2019\-]+/g
);

export const ruRegexp = new RegExp(
    /[\u0027\u0401\u0410-\u044f\u0451\u2019\-]+/g
);

export const beRegexp = new RegExp(
    /[\u0027\u0401\u0406\u040e\u0410-\u0417\u0419-\u0428\u042b-\u0437\u0439-\u0448\u044b-\u044f\u0451\u0456\u045e\u2019\-]+/g
);

export const punctuationRegexpPart = '\.,\?!\/\\"\'\<\>\(\)«»\\-_—';

/**
 * @param {string} c
 * @returns {string}
 */
export function getCharHexCode(c) {
    return c
        .charCodeAt(0)
        .toString(16)
        .padStart(4, '0');
}

/**
 * @param {string} text
 * @returns {string}
 */
export function getUnicodeRegexpPart(text) {
    return text
        .split('')
        .map((c) => `\\u${getCharHexCode(c)}`)
        .join('');
}

/**
 * @param {string} text
 */
export function replaceYo(text) {
    return text.replace(/\u0451/g, 'е');
}
