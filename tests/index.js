import testDictionaries from './dictionaries';
import testTranslation from './translator';

async function test() {
    await testDictionaries();
    await testTranslation();
}

test();
