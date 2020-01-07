/**
 * @param {string} path
 * @returns {Promise<string>}
 */
export function openFile(path) {
    return new Promise((resolve, reject) => {
        chrome.runtime.getPackageDirectoryEntry((root) => {
            root.getFile(path, {}, (fileEntry) => {
                fileEntry.file((file) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        resolve(/** @type {string} */(reader.result));
                    };
                    reader.readAsText(file);
                }, reject);
            }, reject);
        });
    });
}
