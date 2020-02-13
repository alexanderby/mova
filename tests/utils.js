import {log, colors} from '../tasks/utils';

/**
 * @template T
 * @param {T} value
 * @param {T} expected
 * @param {string} message
 * @param {() => string} [getErrorDetails]
 */
export function assert(value, expected, message, getErrorDetails) {
    if (value === expected) {
        log(`${colors.green('OK')} ${message}`);
    } else {
        const details = getErrorDetails ? getErrorDetails() : '';
        log.error(`ER ${message}: expected ${expected}, but got ${value}${details ? ` (${details})` : ''}`);
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

/**
 * @param {string} text
 * @param {number} index
 */
export function getTextPositionMessage(text, index) {
    let line = 1;
    const col = index - text.lastIndexOf('\n', index);
    let i = -1;
    while ((i = text.indexOf('\n', i + 1)) >= 0 && i < index) {
        line++;
    }
    return `line ${line}, column ${col}`;
}
