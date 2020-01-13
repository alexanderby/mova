import checkmark from '../icons/checkmark.js';
import templates from '../templates.js';

export default class CheckBox extends HTMLElement {
    constructor() {
        super();

        const root = this.attachShadow({mode: 'open'});
        const template = templates.get(CheckBox);
        root.append(template.content.cloneNode(true));
        root.querySelector('.icon').append(checkmark());

        this.input = root.querySelector('input');
    }

    /**
     * @returns {boolean}
     */
    getChecked() {
        return this.input.checked;
    }

    /**
     * @param {boolean} checked
     */
    setChecked(checked) {
        this.input.checked = checked;
    }

    /**
     * @param {(value: boolean) => void} callback
     */
    onChange(callback) {
        this.input.addEventListener('change', () => callback(this.input.checked));
    }
}
