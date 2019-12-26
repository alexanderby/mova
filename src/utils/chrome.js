/**
 * @returns {Promise<chrome.tabs.Tab>}
 */
function getActiveTab() {
    return new Promise((resolve) => {
        chrome.tabs.query({active: true, lastFocusedWindow: true}, (tabs) => resolve(tabs ? tabs[0] : null));
    });
}

function getURLHost(url) {
    const a = document.createElement('a');
    a.href = url;
    return a.host;
}

export async function getActiveTabHost() {
    const tab = await getActiveTab();
    if (!tab) {
        return null;
    }
    return getURLHost(tab.url);
}
