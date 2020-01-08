import {query} from '../../utils/dom.js';

/** @typedef {import('../../widgets/checkbox').default} CheckBox */

/**
 * @template TIn
 * @template TOut
 * @typedef {import('../stream').Stream<TIn, TOut>} Stream
 */

/**
 * @param {Stream<{enabled: boolean; host: string}, {enabled: boolean}>} stream
 */
export default function initEnabledForWebsite(stream) {
    query('.js-enabled-for-website', (/** @type {CheckBox} */el) => {
        stream.input(({enabled}) => el.setChecked(enabled));
        el.onChange((checked) => stream.output({enabled: checked}));
    });
    query('.js-website-hostname', (el) => {
        stream.input(({host}) => el.textContent = host);
    });
}
