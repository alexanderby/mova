import fs from 'fs-extra';
import {createExtendedDictionary} from '../src/translator/dictionary';

async function printExtendedDictionary() {
    const dict = await fs.readFile('./src/translator/dictionary.ru-be.txt', 'utf8');
    const end0 = await fs.readFile('./src/translator/endings.ru.txt', 'utf8');
    const end1 = await fs.readFile('./src/translator/endings.be.txt', 'utf8');
    const form = await fs.readFile('./src/translator/forms.ru-be.txt', 'utf8');

    const ext = createExtendedDictionary(dict, end0, end1, form);

    const path = './tasks/ext-dict.txt';
    const text = Array.from(ext.entries()).map(([k, v]) => `${k}\t${v}`).join('\n') + '\n';
    await fs.outputFile(path, text, {encoding: 'utf8'});
}

printExtendedDictionary();
