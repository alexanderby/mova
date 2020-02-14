import {validatePublicDictionary} from '../translator/public.js';

const editor = (() => {
    /** @type {HTMLTextAreaElement} */
    const editorEl = document.querySelector('.js-editor');
    editorEl.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            document.execCommand('insertText', false, '\t');
        }
    });

    /**
     * @param {string} text
     */
    function setText(text) {
        editorEl.value = text;
    }

    const errorEl = document.querySelector('.js-error');

    /** @type {HTMLButtonElement} */
    const applyBtn = document.querySelector('.js-editor-apply');
    applyBtn.addEventListener('click', () => {
        const {error, fixed} = validatePublicDictionary(editorEl.value);
        if (error) {
            errorEl.textContent = error;
        } else {
            errorEl.textContent = '';
            messenger.send('change-user-dictionary', fixed);
        }
    });

    /** @type {HTMLButtonElement} */
    const shareBtn = document.querySelector('.js-editor-share');
    shareBtn.addEventListener('click', () => {
        chrome.tabs.create({
            url: 'https://github.com/alexanderby/mova/edit/master/public/ru-be.txt',
            active: true,
        });
    });

    return {setText};
})();

const messenger = (() => {
    const port = chrome.runtime.connect({name: 'editor'});
    port.onMessage.addListener(({type, data}) => {
        if (type === 'user-dictionary') {
            editor.setText(data);
        }
    });

    /**
     * @param {string} type
     * @param {any} [data]
     */
    function send(type, data) {
        port.postMessage({type, data});
    }

    return {send};
})();

messenger.send('get-user-dictionary');
