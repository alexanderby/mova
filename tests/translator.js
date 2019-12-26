import fs from 'fs-extra';
import {createExtendedDictionary} from '../src/translator/dictionary';
import createTranslator from '../src/translator';
import createTrasliterator from '../src/transliterator';
import createKalhoznik from '../src/translator/trasianka';

async function translate(sentence) {
    const dict = await fs.readFile('./src/translator/dictionary.ru-be.txt', 'utf8');
    const end0 = await fs.readFile('./src/translator/endings.ru.txt', 'utf8');
    const end1 = await fs.readFile('./src/translator/endings.be.txt', 'utf8');
    const tras = await fs.readFile('./src/translator/trasianka.txt', 'utf8');
    const lat = await fs.readFile('./src/transliterator/lacinka.classic.txt', 'utf8');

    const ext = createExtendedDictionary(dict, end0, end1);
    const luka = createKalhoznik(tras);
    const trans = createTranslator({dictionary: ext, fallback: (word) => luka(word)});
    const translit = createTrasliterator(lat);

    const start = Date.now();
    const result = translit(trans(sentence));
    const end = Date.now();
    console.log(end - start, 'ms');

    return result;
}

function assert(value, expected, name) {
    if (value === expected) {
        console.log(`${name}: OK`);
    } else {
        console.error(`${name}: Expected "${expected}", but got "${value}"`);
    }
}

translate('Привет, как дела?')
    .then((translation) => {
        assert(translation, 'Pryvitannie, jak spravy?', 'translation');
    });
