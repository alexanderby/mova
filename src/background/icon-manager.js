function showWaitBadge() {
    if (!chrome.browserAction) {
        return;
    }
    chrome.browserAction.setBadgeBackgroundColor({color: 'white'});
    chrome.browserAction.setBadgeText({text: '⌛'});
}

function hideBadge() {
    if (!chrome.browserAction) {
        return;
    }
    chrome.browserAction.setBadgeText({text: ''});
}

export default {
    showWaitBadge,
    hideBadge,
};
