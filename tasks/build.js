import fs from 'fs-extra';
import globby from 'globby';
import yazl from 'yazl';
import {log} from './utils';

/**
 * @param {string} dir
 * @param {string} dest
 * @returns {Promise<void>}
 */
async function zipDir(dir, dest) {
    const files = await globby(`${dir}/**/*.*`);
    await new Promise((resolve) => {
        const archive = new yazl.ZipFile();
        files.forEach((file) => archive.addFile(file, file.substring(dir.length + 1)));
        archive.outputStream.pipe(fs.createWriteStream(dest)).on('close', () => resolve());
        archive.end();
    });
}

/**
 * @param {string} dir
 * @param {string} dest
 * @param {(buffer: Buffer, file: string) => Buffer} replacer
 */
async function copyDir(dir, dest, replacer) {
    const files = await globby(`${dir}/**/*.*`);
    for (const file of files) {
        const buffer = await fs.readFile(file);
        const edited = replacer(buffer, file);
        const destPath = `${dest}/${file.substring(dir.length + 1)}`;
        await fs.outputFile(destPath, edited);
    }
}

/**
 * @param {Buffer} buffer
 * @param {(text: string) => string} editor 
 */
function editBuffer(buffer, editor) {
    const content = buffer.toString();
    const edited = editor(content);
    return Buffer.from(edited);
}

const firefoxJSRegex = /\/\*\*\s*@firefox_start\s*\*\/[\s\S]*?\/\*\*\s*@firefox_end\s*\*\//gm;

async function buildChrome() {
    const destDir = 'build-chrome';
    const destFile = 'build-chrome.zip';
    await fs.remove(destDir);
    await copyDir('src', destDir, (buffer, file) => {
        if (file.endsWith('.js')) {
            return editBuffer(buffer, (content) => {
                return content.replace(firefoxJSRegex, '');
            });
        }
        return buffer;
    });
    await zipDir(destDir, destFile);
    log.ok(destFile);
}

const firefoxManifestExtension = {
    applications: {
        gecko: {
            id: 'addon@mova.org',
            strict_min_version: '70.0',
        },
    },
};

async function buildFirefox() {
    const destDir = 'build-firefox';
    const destFile = 'build-firefox.xpi';
    await fs.remove(destDir);
    await copyDir('src', destDir, (buffer, file) => {
        if (file.endsWith('manifest.json')) {
            return editBuffer(buffer, (content) => {
                const chromeManifest = JSON.parse(content);
                const firefoxManifest = {
                    ...chromeManifest,
                    ...firefoxManifestExtension,
                };
                return `${JSON.stringify(firefoxManifest, null, 4)}\n`;
            });
        }
        return buffer;
    });
    await zipDir(destDir, destFile);
    log.ok(destFile);
}

async function build() {
    await buildChrome();
    await buildFirefox();
}

build();
