import {replaceYo} from '../utils/string.js'

/**
 * @param {string} $prefixes
 * @returns {Map<string, string>}
 */
export default function parsePrefixes($prefixes) {
    const map = new Map();
    $prefixes
        .split('\n')
        .filter((ln) => ln.trim() && !ln.startsWith('#'))
        .sort((a, b) => b.length - a.length)
        .forEach((ln) => {
            let [src, tgt] = ln.split('\t');
            src = replaceYo(src);
            if (!map.has(src)) {
                map.set(src, tgt);
            }
        });
    return map;
}
