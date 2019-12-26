import state from './state.js';
import {initUI} from './ui.js';

const port = chrome.runtime.connect({name: 'popup'});
port.onMessage.addListener(({type, data}) => {
    if (type === 'app-data') {
        state.set(data);
        state.onChange(({settings}) => port.postMessage({type: 'change-settings', data: settings}));
    }
});

initUI();
port.postMessage({type: 'get-app-data'});
