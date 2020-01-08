import checkmark from '../icons/checkmark.js';

export default class DropDown extends HTMLElement {
    static tag = 'mv-dropdown';
    static htmlURL = 'widgets/dropdown/index.html';
    static cssURL = 'widgets/dropdown/style.css';
    /** @type {HTMLTemplateElement} */static template;

    constructor() {
        super();

        const root = this.attachShadow({mode: 'open'});
        root.append(DropDown.template.content.cloneNode(true));
        root.querySelector('.icon').append(checkmark());

        this.itemTemplate = /** @type {HTMLTemplateElement} */(root.getElementById('dropdown-item-template'));
        this.select = root.querySelector('select');
        this.container = root.querySelector('.dropdown');
    }

    /**
     * @returns {string}
     */
    getSelectedValue() {
        return this.select.value;
    }

    /**
     * @param {string} value
     */
    setSelectedValue(value) {
        this.select.value = value;

        // TODO: Think about less hacky way.
        this.container.classList.toggle('unchecked', value === 'none');
    }

    /**
     * @param {{[id: string]: string}} items
     */
    setItems(items) {
        const entries = Object.entries(items);
        const currentItemsNodes = /** @type {HTMLOptionElement[]} */(Array.from(
            this.select.querySelectorAll('option')
        ));

        entries.forEach(([id, value], i) => {
            let node = currentItemsNodes[i];
            if (node == null) {
                const root = /** @type {DocumentFragment} */(this.itemTemplate.content.cloneNode(true));
                node = root.querySelector('option');
                this.itemTemplate.parentElement.append(root);
            }
            node.value = id;
            node.textContent = value;
        });

        currentItemsNodes
            .slice(entries.length)
            .forEach((node) => node.remove());
    }

    /**
     * @param {(selected: string) => void} callback
     */
    onChange(callback) {
        this.select.addEventListener('change', () => callback(this.select.value));
    }
}
