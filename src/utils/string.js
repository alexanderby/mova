export const cyrillicRegexp = new RegExp(
    /[\u0027\u0401\u0406\u040e\u0410-\u044f\u0451\u0456\u045e\u04e2\u04e3\u2019\-]+/g
);

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
