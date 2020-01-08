import fs from 'fs-extra';
import {createExtendedDictionary} from '../src/translator/dictionary';
import createTranslator from '../src/translator';
import createTrasliterator from '../src/transliterator';
import createKalhoznik from '../src/translator/trasianka';

/**
 * @returns {Promise<(text: string) => string>}
 */
async function createTextProcessor() {
    const dict = await fs.readFile('./src/translator/dictionary.ru-be.txt', 'utf8');
    const end0 = await fs.readFile('./src/translator/endings.ru.txt', 'utf8');
    const end1 = await fs.readFile('./src/translator/endings.be.txt', 'utf8');
    const tras = await fs.readFile('./src/translator/trasianka.txt', 'utf8');
    const lat = await fs.readFile('./src/transliterator/lacinka.classic.txt', 'utf8');

    const ext = createExtendedDictionary(dict, end0, end1);
    const luka = createKalhoznik(tras);
    const trans = createTranslator({dictionary: ext, fallback: (word) => luka(word)});
    const translit = createTrasliterator(lat);

    return (sentence) => translit(trans(sentence));
}

function assert(value, expected, name) {
    if (value === expected) {
        console.log(`${name}: OK`);
    } else {
        console.error(`${name}: Expected "${expected}", but got "${value}"`);
    }
}

async function test() {
    const translate = await createTextProcessor();
    let total = 0;
    let fails = 0;

    /**
     * @param {string} src
     * @param {string} expected
     */
    function testTranslation(src, expected) {
        const start = Date.now();
        const result = translate(src);
        const end = Date.now();
        if (result === expected) {
            console.log('OK', result, end - start, 'ms');
        } else {
            console.error('ERROR', `Expected "${expected}", but got "${result}"`);
            fails++;
        }
        total++;
    }

    testTranslation('Привет, как дела?', 'Pryvitannie, jak spravy?');
    testTranslation('чего-то', 'čahości');

    if (fails === 0) {
        console.info('All tests passed successfully');
    } else {
        throw new Error(`${fails} of ${total} tests failed`);
    }
}

test();
