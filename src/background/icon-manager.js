function showWaitBadge() {
    if (!chrome.browserAction.setBadgeText) {
        return;
    }
    chrome.browserAction.setBadgeBackgroundColor({color: 'white'});
    chrome.browserAction.setBadgeText({text: '⌛'});
}

function hideBadge() {
    if (!chrome.browserAction.setBadgeText) {
        return;
    }
    chrome.browserAction.setBadgeText({text: ''});
}

export default {
    showWaitBadge,
    hideBadge,
};
