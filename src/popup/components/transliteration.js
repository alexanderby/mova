import transliteratorTypes from '../../transliterator/transliterator-types.js';
import {query} from '../../utils/dom.js';

/** @typedef {import('../../widgets/dropdown').default} DropDown */
/** @typedef {import('../../definitions').TransliterationType} TransliterationType */

/**
 * @template TIn
 * @template TOut
 * @typedef {import('../stream').Stream<TIn, TOut>} Stream
 */

/**
 * @param {Stream<{selected: TransliterationType}, {selected: TransliterationType}>} stream
 */
export default function initTransliteration(stream) {
    const entries = transliteratorTypes
        .concat('none')
        .map((type) => {
            const message = chrome.i18n.getMessage(`transliteration_${type}`);
            return [type, message];
        });
    const values = Object.fromEntries(entries);

    query('.js-transliteration', (/** @type {DropDown} */el) => {
        el.setItems(values);
        stream.input(({selected}) => el.setSelectedValue(selected));
        el.onChange((/** @type {TransliterationType} */selected) => stream.output({selected}));
    });
}
