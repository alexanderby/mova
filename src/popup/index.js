import state from './state.js';
import {initComponents} from './components/index.js';

const port = chrome.runtime.connect({name: 'popup'});
port.onMessage.addListener(({type, data}) => {
    if (type === 'app-data') {
        state.set({
            ...data,
            isLoading: false,
        });
        state.onChange(({settings}) => {
            port.postMessage({type: 'change-settings', data: settings});
        });
    }
});

initComponents().then(() => {
    port.postMessage({type: 'get-app-data'});
});
