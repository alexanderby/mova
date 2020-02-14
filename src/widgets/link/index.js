import templates from '../templates.js';

export default class Link extends HTMLElement {
    constructor() {
        super();

        const root = this.attachShadow({mode: 'open'});
        const template = templates.get(Link);
        root.append(template.content.cloneNode(true));
        this.anchor = root.querySelector('a');
    }

    static get observedAttributes() {
        return ['url'];
    }

    attributeChangedCallback(name, _, newValue) {
        if (name === 'url') {
            this.anchor.href = newValue;
        }
    }
}
