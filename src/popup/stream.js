import state from './state.js';

/** @typedef {import('./state').State} State */

/**
 * @template TIn
 * @template TOut
 * @typedef Stream
 * @property {(callback: (props: TIn) => void) => void} input
 * @property {(data: TOut) => void} output
 */

/**
 * @template TIn
 * @template TOut
 * @param {Object} options
 * @param {(state: State) => TIn} options.stateToInput
 * @param {(output: TOut) => void} options.output
 * @returns {Stream<TIn, TOut>}
 */
export function createUIStream({stateToInput, output: onOutput}) {
    return {
        input: (callback) => {
            state.onChange((newState) => {
                const input = stateToInput(newState);
                callback(input);
            });
        },
        output: (data) => onOutput(data),
    };
}
