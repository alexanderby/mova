import fs from 'fs-extra';
import {createExtendedDictionary} from '../src/translator/dictionary';
import parsePhrases from '../src/translator/phrases';
import parsePrefixes from '../src/translator/prefixes';
import createTranslator from '../src/translator';
import createTrasliterator from '../src/transliterator';
import createKalhoznik from '../src/translator/trasianka';

const green = (/** @type {string}*/text) => `\x1b[32m${text}\x1b[0m`;
const yellow = (/** @type {string}*/text) => `\x1b[33m${text}\x1b[0m`;
const red = (/** @type {string}*/text) => `\x1b[31m${text}\x1b[0m`;
const gray = (/** @type {string}*/text) => `\x1b[90m${text}\x1b[0m`;

/**
 * @returns {Promise<(text: string) => string>}
 */
async function createTextProcessor() {
    const dict = await fs.readFile('./src/translator/dictionary.ru-be.txt', 'utf8');
    const end0 = await fs.readFile('./src/translator/endings.ru.txt', 'utf8');
    const end1 = await fs.readFile('./src/translator/endings.be.txt', 'utf8');
    const form = await fs.readFile('./src/translator/forms.ru-be.txt', 'utf8');
    const phrs = await fs.readFile('./src/translator/phrases.ru-be.txt', 'utf8');
    const pref = await fs.readFile('./src/translator/prefixes.ru-be.txt', 'utf8');
    const tras = await fs.readFile('./src/translator/trasianka.txt', 'utf8');
    const lat = await fs.readFile('./src/transliterator/lacinka.classic.txt', 'utf8');

    const ext = createExtendedDictionary(dict, end0, end1, form);
    const luka = createKalhoznik(tras);
    const phrases = parsePhrases(phrs);
    const prefixes = parsePrefixes(pref);
    const trans = createTranslator({dictionary: ext, phrases, prefixes, fallback: (word) => luka(word)});
    const translit = createTrasliterator(lat);

    return (sentence) => translit(trans(sentence));
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
            console.log(green('OK'), result, gray(`${end - start}ms`));
        } else {
            console.error(red('ERROR'), `Expected ${green(expected)}, but got ${yellow(result)}`);
            fails++;
        }
        total++;
    }

    testTranslation('Привет, как дела?', 'Pryvitannie, jak spravy?');
    testTranslation('чего-то', 'čahości');
    testTranslation('экс-директору', 'eks-dyrektaru');
    testTranslation('белокраснобелый', 'biełačyrvonabieły');
    testTranslation('то моё, и это мое', 'to majo, i heta majo');
    testTranslation('получилось', 'atrymałasia');
    testTranslation('Что они друг другу сказали?', 'Što jany adzin adnamu skazali?');
    testTranslation('человек-паук', 'čałaviek-pavuk');

    if (fails === 0) {
        console.info(green('All tests passed successfully'));
    } else {
        console.error(fails, red('of'), total, red('tests failed'));
        process.exit(13);
    }
}

test();
