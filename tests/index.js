import testDictionaries from './dictionaries.tests';
import testTranslation from './translator.tests';

async function test() {
    await testDictionaries();
    await testTranslation();
}

test();
