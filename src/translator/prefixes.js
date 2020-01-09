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
        .map((ln) => {
            const parts = ln.toLocaleLowerCase().split('\t');
            return [replaceYo(parts[0]), parts[1]];
        })
        .sort((a, b) => b[0].length - a[0].length)
        .forEach(([src, tgt]) => {
            if (!map.has(src)) {
                map.set(src, tgt);
            }
        });
    return map;
}
