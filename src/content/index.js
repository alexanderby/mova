(() => {
    'use strict';

    /** @typedef {import('../definitions').TranslationSettings} TranslationSettings */
    /** @typedef {import('../definitions').UserSettings} UserSettings */

    const storage = {
        /** @type {UserSettings} */
        settings: null,
    };

    const messenger = (() => {
        const port = chrome.runtime.connect({name: 'tab'});
        port.onMessage.addListener(({type, data}) => {
            listeners
                .get(type)
                .forEach((listener) => listener(data));
        });
        port.onDisconnect.addListener(() => {
            disconnectListeners.forEach((cb) => cb());
        });

        /**
         * @param {string} type
         * @param {any} data
         */
        function send(type, data) {
            if (!port) {
                console.warn('no port');
                return;
            }
            port.postMessage({type, data});
        }

        /** @type {Map<string, Set<(data: any) => void>>} */
        const listeners = new Map();

        /**
         * @param {string} type
         * @param {(data: any) => void} callback
         */
        function on(type, callback) {
            if (!listeners.has(type)) {
                listeners.set(type, new Set());
            }
            listeners.get(type).add(callback);
        }

        /**
         * @param {string} type
         * @param {(data: any) => void} callback
         */
        function off(type, callback) {
            if (listeners.has(type)) {
                listeners.get(type).delete(callback);
            }
        }

        const disconnectListeners = new Set();

        /**
         * @param {() => void} callback
         */
        function onDisconnect(callback) {
            disconnectListeners.add(callback);
        }

        return {
            on,
            off,
            send,
            onDisconnect,
        };
    })();

    const domQueue = (() => {
        /** @type {(() => void)[]} */
        const queue = [];
        const frameDuration = 1000 / 60;
        let frameId = null;

        function requestFrame() {
            if (frameId) {
                return;
            }

            frameId = requestAnimationFrame(() => {
                frameId = null;
                const start = Date.now();
            /** @type {() => void} */let cb;
                while (cb = queue.shift()) {
                    cb();
                    if (Date.now() - start >= frameDuration) {
                        requestFrame();
                        break;
                    }
                }
            });
        }

        /**
         * @param {() => void} callback
         */
        function add(callback) {
            queue.push(callback);
            requestFrame();
        }

        function clear() {
            if (frameId) {
                cancelAnimationFrame(frameId);
                frameId = null;
            }
            queue.splice(0);
        }

        return {add, clear};
    })();

    const textManager = (() => {
        const cyrillicCharRegexp = new RegExp(
            /[\u0401\u0406\u040e\u0410-\u044f\u0451\u0456\u045e]/
        );

        const beCharRegexp = new RegExp(
            /[\u0406\u040e\u0456\u045e]/
        );

        /**
         * @param {string} text
         * @returns {boolean}
         */
        function hasCyrillicChars(text) {
            return cyrillicCharRegexp.test(text);
        }

        /**
         * @param {string} text
         * @returns {boolean}
         */
        function hasBelarusianChars(text) {
            return beCharRegexp.test(text);
        }

        /**
         * @param {Node} node
         * @returns {boolean}
         */
        function isParentEditable(node) {
            const parent = node.parentElement;
            return parent && parent.isContentEditable;
        }

        /** @type {WeakSet<Text>} */
        let handledTextNodes;
        /** @type {WeakMap<Text, string>} */
        const sourceTexts = new WeakMap();
        let counter = 0;

        /** @type {Map<number, Text>} */
        const waitingNodes = new Map();

        /**
         * @param {Text} node
         * @param {boolean} force
         */
        function tryTranslateNode(node, force = false) {
            if (!force && handledTextNodes.has(node)) {
                return;
            }
            handledTextNodes.add(node);

            const text = sourceTexts.has(node) ? sourceTexts.get(node) : node.textContent;
            if (!text.trim()) {
                return;
            }

            const isCyrillic = hasCyrillicChars(text);
            if (isCyrillic) {
                const id = counter++;
                waitingNodes.set(id, node);

                const isBelarusian = hasBelarusianChars(text);
                if (isBelarusian && storage.settings.transliteration === 'none') {
                    return;
                }

                const shouldTranslate = storage.settings.translation !== 'none' && !isBelarusian;

                const settings = /** @type {TranslationSettings} */({
                    ...storage.settings,
                    translation: shouldTranslate ? 'ru-be' : 'none',
                });
                messenger.send('translate', {id, text, settings});
            }
        }

        /**
         * @param {Text} node
         */
        function restoreNode(node) {
            if (sourceTexts.has(node)) {
                node.textContent = sourceTexts.get(node);
            }
        }

        messenger.on('done', ({id, text}) => {
            const node = waitingNodes.get(id);
            waitingNodes.delete(id);
            if (text != null) {
                sourceTexts.set(node, node.textContent);
                domQueue.add(() => {
                    handleMutations(observer.takeRecords());
                    node.textContent = text;
                    observer.takeRecords();
                });
            }
        });

        /** @type {WeakSet<Node>} */
        let walkedNodes = new WeakSet();

        /**
         * @param {Node} root
         * @param {(node: Text) => void} callback
         */
        function walkTextNodes(root, callback) {
            const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);

            /** @type {Text} */
            let node;
            while (node = /** @type {Text} */(walker.nextNode())) {
                const parentName = node.parentNode.nodeName;

                if (
                    isParentEditable(node) ||
                    parentName === 'SCRIPT' ||
                    parentName === 'STYLE' ||
                    walkedNodes.has(node)
                ) {
                    continue;
                }

                walkedNodes.add(node);
                callback(node);
            }
        }

        /** @type {MutationObserver} */
        let observer;

        /**
         * @param {MutationRecord[]} mutations
         */
        function handleMutations(mutations) {
            mutations.forEach(({target, addedNodes}) => {
                if (target.nodeType === Node.TEXT_NODE && !isParentEditable(target)) {
                    tryTranslateNode(/** @type {Text} */(target), true);
                }
                addedNodes.forEach((node) => {
                    if (node.nodeType === Node.TEXT_NODE && !isParentEditable(target)) {
                        tryTranslateNode(/** @type {Text} */(node));
                    } else {
                        walkTextNodes(node, tryTranslateNode);
                    }
                });
                observer.takeRecords();
            });
        }

        function stop() {
            domQueue.clear();
            if (observer) {
                observer.disconnect();
                observer = null;
            }
        }

        function translateAndWatch() {
            stop();
            handledTextNodes = new WeakSet();
            walkedNodes = new WeakSet();

            walkTextNodes(document.documentElement, tryTranslateNode);
            observer = new MutationObserver(handleMutations);
            observer.observe(document.documentElement, {
                subtree: true,
                childList: true,
                characterData: true,
            });
        }

        function stopAndRestore() {
            stop();
            handledTextNodes = new WeakSet();
            walkedNodes = new WeakSet();

            walkTextNodes(document.documentElement, restoreNode);
        }

        return {
            translateAndWatch,
            stop,
            stopAndRestore,
        };
    })();

    const app = (() => {
        /** @type {string} */
        let host;

        /**
         * @returns {Promise<string>}
         */
        async function getTopHost() {
            try {
                return window.top.location.host;
            } catch (err) {
                return await requestTabHost();
            }
        }

        /**
         * @returns {Promise<string>}
         */
        function requestTabHost() {
            const requestId = Array.from(crypto.getRandomValues(new Uint8Array(16))).map(v => v.toString(16).padStart(2, '0')).join('');
            return new Promise((resolve) => {
                /** @type {(data: {id: string; url: any}) => void} */
                const onSenderTabUrl = (data) => {
                    if (data.id === requestId) {
                        messenger.off('sender-tab-url', onSenderTabUrl);
                        const anchor = document.createElement('a');
                        anchor.href = data.url;
                        resolve(anchor.host);
                    }
                };
                messenger.on('sender-tab-url', onSenderTabUrl);
                messenger.send('get-sender-tab-url', requestId);
            });
        }

        /**
         * @param {UserSettings} settings
         */
        function isEnabledForWebsite(settings) {
            return settings.enabledByDefault ?
                !settings.disabledFor.includes(host) :
                settings.enabledFor.includes(host);
        }

        /** @type {UserSettings} */
        let lastAppliedSettings = null;

        /**
         * @param {UserSettings} newSettings
         */
        function apply(newSettings) {
            const prevSettings = lastAppliedSettings;
            const isEnabled = isEnabledForWebsite(newSettings);
            const shouldRestore = prevSettings && (
                !isEnabled ||
                (prevSettings.translation !== newSettings.translation) ||
                (prevSettings.transliteration !== newSettings.transliteration)
            );

            lastAppliedSettings = newSettings;

            if (shouldRestore) {
                textManager.stopAndRestore();
            }

            if (isEnabled) {
                textManager.translateAndWatch();
            }
        }

        function refresh() {
            const isEnabled = isEnabledForWebsite(storage.settings);
            if (isEnabled) {
                textManager.stopAndRestore();
                textManager.translateAndWatch();
            }
        }

        let visibilityHandler = null;

        async function start() {
            host = await getTopHost();
            if (!host) {
                return;
            }

            document.addEventListener('visibilitychange', () => {
                if (!document.hidden && visibilityHandler) {
                    visibilityHandler();
                }
            });

            messenger.on('app-settings', (/** @type {UserSettings} */settings) => {
                storage.settings = settings;
                if (document.hidden) {
                    visibilityHandler = () => {
                        visibilityHandler = null;
                        apply(settings);
                    };
                } else {
                    apply(settings);
                }
            });

            messenger.on('dictionary-updated', () => {
                if (document.hidden) {
                    visibilityHandler = () => {
                        visibilityHandler = null;
                        refresh();
                    };
                } else {
                    refresh();
                }
            });

            messenger.onDisconnect(() => textManager.stop());
        }

        return {start};
    })();

    app.start();
})();
