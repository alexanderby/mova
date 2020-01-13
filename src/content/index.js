(() => {
    'use strict';

    /** @typedef {import('../definitions').TranslationSettings} TranslationSettings */
    /** @typedef {import('../definitions').UserSettings} UserSettings */

    const storage = {
        /** @type {TranslationSettings} */
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
            /[\u0401\u0406\u040e\u0410-\u044f\u0451\u0456\u045e\u04e2\u04e3]/
        );

        const beCharRegexp = new RegExp(
            /[\u0401\u0406\u045e\u04e2]/
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
                if (target.nodeType === Node.TEXT_NODE) {
                    tryTranslateNode(/** @type {Text} */(target), true);
                }
                addedNodes.forEach((node) => {
                    if (node.nodeType === Node.TEXT_NODE) {
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
        /**
         * @param {UserSettings} settings
         * @param {string} topHost
         */
        function apply(settings, topHost) {
            const prevSettings = storage.settings;

            const isEnabled = settings.enabledByDefault ?
                !settings.disabledFor.includes(topHost) :
                settings.enabledFor.includes(topHost);

            const shouldRestore = prevSettings && (
                !isEnabled ||
                (prevSettings.translation !== settings.translation) ||
                (prevSettings.transliteration !== settings.transliteration)
            );

            storage.settings = settings;

            if (shouldRestore) {
                textManager.stopAndRestore();
            }

            if (isEnabled) {
                textManager.translateAndWatch();
            }
        }

        let visibilityHandler = null;

        function start() {
            /** @type {string} */
            let topHost;
            try {
                topHost = window.top.location.host;
            } catch {
                return;
            }

            document.addEventListener('visibilitychange', () => {
                if (!document.hidden && visibilityHandler) {
                    visibilityHandler();
                }
            });

            messenger.on('app-settings', (/** @type {UserSettings} */settings) => {
                if (document.hidden) {
                    visibilityHandler = () => {
                        visibilityHandler = null;
                        apply(settings, topHost);
                    };
                } else {
                    apply(settings, topHost);
                }
            });

            messenger.onDisconnect(() => textManager.stop());
        }

        return {start};
    })();

    app.start();
})();
