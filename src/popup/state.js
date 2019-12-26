/** @typedef {import('../background/storage').UserSettings} UserSettings */

/**
 * @typedef State
 * @property {string} host
 * @property {UserSettings} settings
 */

/** @type {State} */
const state = {
    host: null,
    settings: null,
};

/** @type {Set<(s: State) => void>} */
const stateChangeListeners = new Set();

/**
 * @param {Partial<State>} newState
 */
function setState(newState) {
    Object.assign(state, newState);
    stateChangeListeners.forEach((cb) => cb(state));
}

/**
 * @param {(s: State) => void} callback
 */
function onStateChange(callback) {
    stateChangeListeners.add(callback);
}

export default {
    get: () => state,
    set: setState,
    onChange: onStateChange,
};
