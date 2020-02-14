import {replaceYo} from '../utils/string.js';

/** @typedef {Map<string, Map<string, Map|string>|string>} PhrasesTree */

/**
 * @param {string} $phrases
 * @returns {PhrasesTree}
 */
export default function parsePhrases($phrases) {
    const tree = /** @type {Map<string, any>} */(new Map());
    $phrases
        .toLowerCase()
        .split('\n')
        .filter((ln) => ln.trim() && !ln.startsWith('#'))
        .map((ln) => {
            const parts = ln.split('\t');
            return [replaceYo(parts[0]), parts[1]];
        })
        .sort((a, b) => b[0].length - a[0].length)
        .forEach(([src, tgt]) => {
            const words = src.split(' ');
            let node = tree;
            for (let i = 0; i < words.length; i++) {
                const w = words[i];
                if (node.has(w)) {
                    node = node.get(w);
                } else if (i < words.length - 1) {
                    const map = new Map();
                    node.set(w, map);
                    node = map;
                } else {
                    node.set(w, tgt);
                }
            }
        });
    return tree;
}
