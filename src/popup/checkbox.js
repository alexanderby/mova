export default class CheckBox extends HTMLElement {
    constructor() {
        super();

        const root = this.attachShadow({mode: 'open'});

        const label = document.createElement('label');
        root.append(label);

        this.input = document.createElement('input');
        this.input.type = 'checkbox';
        label.append(this.input);

        this.content = document.createElement('span');
        label.append(this.content);

        const slot = document.createElement('slot');
        this.content.append(slot);
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

customElements.define('m-checkbox', CheckBox);
