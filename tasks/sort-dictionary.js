import fs from 'fs-extra';

async function sortDictionary() {
    const path = './src/translator/dictionary.ru-be.txt';
    const text = await fs.readFile(path, 'utf8');
    const lines = text.split('\n').filter((ln) => ln);
    lines.sort((a, b) => a.localeCompare(b));
    const sorted = lines.join('\n') + '\n';
    await fs.outputFile(path, sorted, {encoding: 'utf8'});
}

sortDictionary();
