import messenger from './messenger.js';
import {onStateChange, setState} from './state.js';
import {initUI} from './ui.js';

messenger.onMessage((type, data) => {
    if (type === 'app-data') {
        setState({
            ...data,
            isLoading: false,
        });
        onStateChange(({settings}) => messenger.sendMessage('change-settings', settings));
    }
});

async function start() {
    await initUI();
    messenger.sendMessage('get-app-data');
}

start();
