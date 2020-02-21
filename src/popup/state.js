/** @typedef {import('../definitions').UserSettings} UserSettings */

/**
 * @typedef State
 * @property {string} host
 * @property {UserSettings} settings
 * @property {boolean} isLoading
 */

/** @type {State} */
const state = {
    host: null,
    settings: null,
    isLoading: true,
};

export function getState() {
    return state;
}

/** @type {Set<(s: State) => void>} */
const stateChangeListeners = new Set();

/**
 * @param {Partial<State>} newState
 */
export function setState(newState) {
    Object.assign(state, newState);
    stateChangeListeners.forEach((cb) => cb(state));
}

/**
 * @param {(s: State) => void} callback
 */
export function onStateChange(callback) {
    stateChangeListeners.add(callback);
}
