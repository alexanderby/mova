import fs from 'fs-extra';
import {parseEndings} from '../src/translator/dictionary';
import {log} from '../tasks/utils';
import {assert, assertLine} from './utils';

function checkLF(/** @type {string} */text) {
    assert(text.includes('\r') && text.includes('\n'), false, 'LF endings');
}

async function testMainDictionary() {
    log('Test main dictionary');
    const dict = await fs.readFile('./src/translator/dictionary.ru-be.txt', 'utf8');
    const nonEmpty = (/** @type {string} */ln) => ln;

    checkLF(dict);
    assertLine(dict, nonEmpty, (ln) => Array.from(ln.matchAll(/\t/g)).length === 1, true, 'pairs are separated with tabs');
    assertLine(dict, nonEmpty, (ln) => ln.split('\t').length === 2, true, '2 items on each line');
    assertLine(dict, nonEmpty, (ln) => ln.split('\t').every((w) => w.trim() === w), true, 'no extra spaces');
}

async function testEndings() {
    log('Test endings');
    const ru = await fs.readFile('./src/translator/endings.ru.txt', 'utf8');
    const be = await fs.readFile('./src/translator/endings.be.txt', 'utf8');
    const filter = (/** @type {string} */ln) => ln && !ln.startsWith('#') && !ln.startsWith('@');

    function checkDict(/** @type {string} */dict, /** @type {string} */name) {
        assert(dict.includes('\r') && dict.includes('\n'), false, `${name}: LF endings`);
        assertLine(dict, filter, (ln) => Array.from(ln.matchAll(/\t/g)).length > 0, true, `${name}: values are separated with tabs`);
        assertLine(dict, filter, (ln) => !ln.includes(' '), true, `${name}: no spaces`);
    }

    checkDict(ru, 'ru');
    checkDict(be, 'be');

    const ruEnds = parseEndings(ru);
    const beEnds = parseEndings(be);

    assert(Object.keys(ruEnds).join(','), Object.keys(beEnds).join(','), 'groups are the same');
    assert(Object.keys(ruEnds).every((g) => {
        const ends = Object.values(ruEnds[g]).concat(Object.values(beEnds[g]));
        if (!ends.every((e) => e.length === ends[0].length)) {
            console.log(g, ends[0].length, ends.find((e) => e.length !== ends[0].length));
        }
        return ends.every((e) => e.length === ends[0].length);
    }), true, 'count of endings in each group is the same');
}

/**
 * @param {string} dict
 */
function checkSimpleDictionary(dict) {
    const filter = (/** @type  {string} */ln) => ln && !ln.startsWith('#');
    assert(dict.includes('\r') && dict.includes('\n'), false, `LF endings`);
    assertLine(dict, filter, (ln) => Array.from(ln.matchAll(/\t/g)).length === 1, true, `values are separated with tabs`);
    assertLine(dict, filter, (ln) => ln.split('\t').every((w) => w.trim() === w), true, `no extra spaces`);
}

async function testForms() {
    log('Test forms');
    const dict = await fs.readFile('./src/translator/forms.ru-be.txt', 'utf8');
    checkSimpleDictionary(dict);
}

async function testPhrases() {
    log('Test phrases');
    const dict = await fs.readFile('./src/translator/phrases.ru-be.txt', 'utf8');
    checkSimpleDictionary(dict);
}

async function testPrefixes() {
    log('Test prefixes');
    const dict = await fs.readFile('./src/translator/prefixes.ru-be.txt', 'utf8');
    checkSimpleDictionary(dict);
}

async function testTrasianka() {
    log('Test trasianka');
    const dict = await fs.readFile('./src/translator/trasianka.txt', 'utf8');
    checkSimpleDictionary(dict);
}

export default async function test() {
    await testMainDictionary();
    await testEndings();
    await testForms();
    await testPrefixes();
    await testPhrases();
    await testTrasianka();
    log.ok('Dictionaries are correct');
}