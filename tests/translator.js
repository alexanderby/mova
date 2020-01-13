import fs from 'fs-extra';
import {createExtendedDictionary} from '../src/translator/dictionary';
import parsePhrases from '../src/translator/phrases';
import parsePrefixes from '../src/translator/prefixes';
import createTranslator from '../src/translator';
import createTrasliterator from '../src/transliterator';
import createKalhoznik from '../src/translator/trasianka';
import {log, colors} from '../tasks/utils';

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

export default async function test() {
    log('Test translation');

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
            log(`${colors.green('OK')} ${result} ${colors.gray(`${end - start}ms`)}`);
        } else {
            log(`${colors.red('ER')} Expected ${colors.green(expected)}, but got ${colors.yellow(result)}`);
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
    testTranslation('немогуперевести', 'niemohupiereviesci');
    testTranslation('TV-программа', 'TV-prahrama');
    testTranslation('открыто на открытом', 'adčyniena na adčynienym');
    testTranslation('«ещё»', '"jašče"');
    testTranslation('Такой парень женился на такой девушке!', 'Taki chłopiec ažaniŭsia na takoj dziaŭčynie!');

    if (fails === 0) {
        log.ok('All translations are correct');
    } else {
        log.error(`${fails} of ${total} tests failed`);
        process.exit(13);
    }
}
