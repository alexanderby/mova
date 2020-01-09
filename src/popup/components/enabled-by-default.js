import {query} from '../../utils/dom.js';

/** @typedef {import('../../widgets/checkbox').default} CheckBox */

/**
 * @template TIn
 * @template TOut
 * @typedef {import('../stream').Stream<TIn, TOut>} Stream
 */

/**
 * @param {Stream<{enabled: boolean}, {enabled: boolean}>} stream
 */
export default function initEnabledByDefault(stream) {
    query('.js-enabled-by-default', (/** @type {CheckBox} */el) => {
        stream.input(({enabled}) => el.setChecked(enabled));
        el.onChange((checked) => stream.output({enabled: checked}));
    });
}