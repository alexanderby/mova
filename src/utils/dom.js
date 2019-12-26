/**
 * @param {string} selector
 * @param {(el: HTMLElement) => void} callback
 */
export function query(selector, callback) {
    return Array.from(document.querySelectorAll(selector)).forEach(callback);
}
