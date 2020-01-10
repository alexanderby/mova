import fs from 'fs';
import globby from 'globby';
import yazl from 'yazl';

/**
 * @param {Object} options
 * @param {string[]} options.files
 * @param {string} options.dest
 * @param {string} options.cwd
 * @returns {Promise<void>}
 */
function archiveFiles({files, dest, cwd}) {
    return new Promise((resolve) => {
        const archive = new yazl.ZipFile();
        files.forEach((file) => archive.addFile(file, file.startsWith(`${cwd}/`) ? file.substring(cwd.length + 1) : file));
        archive.outputStream.pipe(fs.createWriteStream(dest)).on('close', () => resolve());
        archive.end();
    });
}

/**
 * @param {Object} options
 * @param {string} options.dir
 * @param {string} options.dest
 * @returns {Promise<void>}
 */
async function archiveDirectory({dir, dest}) {
    const files = await globby(`${dir}/**/*.*`);
    await archiveFiles({files, dest, cwd: dir});
}

async function build() {
    await archiveDirectory({dir: 'src', dest: 'build.zip'});
}

build();
