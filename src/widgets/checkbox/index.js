import checkmark from '../icons/checkmark.js';

export default class CheckBox extends HTMLElement {
    static tag = 'mv-checkbox';
    static htmlURL = 'widgets/checkbox/index.html';
    static cssURL = 'widgets/checkbox/style.css';
    /** @type {HTMLTemplateElement} */static template;

    constructor() {
        super();

        const root = this.attachShadow({mode: 'open'});
        root.append(CheckBox.template.content.cloneNode(true));
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
