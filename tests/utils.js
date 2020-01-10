import {log, colors} from '../tasks/utils';

/**
 * @template T
 * @param {T} value
 * @param {T} expected
 * @param {string} message
 */
export function assert(value, expected, message) {
    if (value === expected) {
        log(`${colors.green('OK')} ${message}`);
    } else {
        log.error(`ER ${message}: expected ${expected}, but got ${value}`);
        process.exit(13);
    }
}

/**
 * @template T
 * @param {string} text
 * @param {(line: string) => any} pick
 * @param {(line: string) => T} iterator
 * @param {T} expected
 * @param {string} message
 */
export function assertLine(text, pick, iterator, expected, message) {
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const ln = lines[i];
        if (!pick(ln)) {
            continue;
        }
        const value = iterator(ln);
        if (value !== expected) {
            log.error(`ER ${message}: line ${i + 1}: expected ${expected}, but got ${value}`);
            process.exit(13);
        }
    }
    log(`${colors.green('OK')} ${message}`);
}
