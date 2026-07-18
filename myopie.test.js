import test from 'ava';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost'
});
const window = dom.window;
globalThis.document = window.document;
globalThis.window = window;
globalThis.Node = window.Node;
globalThis.HTMLElement = window.HTMLElement;
globalThis.HTMLInputElement = window.HTMLInputElement;
globalThis.HTMLImageElement = window.HTMLImageElement;
globalThis.HTMLScriptElement = window.HTMLScriptElement;
globalThis.HTMLAnchorElement = window.HTMLAnchorElement;
globalThis.HTMLLinkElement = window.HTMLLinkElement;
globalThis.HTMLSelectElement = window.HTMLSelectElement;
globalThis.HTMLTextAreaElement = window.HTMLTextAreaElement;
globalThis.HTMLTemplateElement = window.HTMLTemplateElement;
const { default: MyopieOriginal } = await import('./myopie.js');
const { default: MyopieMinified } = await import('./myopie.min.js');
const targets = [
    { tag: '[myopie-original]', Myopie: MyopieOriginal },
    { tag: '[myopie-minified]', Myopie: MyopieMinified }
];
for (const target of targets) {
    const tag = target.tag;
    const Myopie = target.Myopie;
    const testData = {
        booleanTrue: true,
        booleanFalse: false,
        stringEmpty: '',
        stringValue: 'test string',
        numberZero: 0,
        numberPositive: 42,
        numberNegative: -10,
        arrayEmpty: [],
        arrayValues: ['a', 'b', 'c'],
        objectEmpty: {},
        objectNested: {
            level1: {
                level2: {
                    value: 'deep'
                }
            }
        },
        mapValue: new Map([['key1', 'value1'], ['key2', 'value2']]),
        setValue: new Set(['item1', 'item2', 'item3']),
        functionValue: () => 'function result',
        nullValue: null,
        undefinedValue: undefined
    };
    let prefix;
    {
        prefix = tag + 'constructor';
        test(prefix + ': should create instance with minimal parameters', (t) => {
            const template = (_data) => `<div>${_data.content}</div>`;
            const myopie = new Myopie('#test', template);
            t.truthy(myopie);
        });
        test(prefix + ': should create instance with initial data', (t) => {
            const template = (data) => `<div>${data.content}</div>`;
            const myopie = new Myopie('#test', template, { content: 'initial' });
            t.is(myopie.get('content'), 'initial');
        });
        test(prefix + ': should create instance with inputToPath mapping', (t) => {
            const template = (data) => `<div>${data.content}</div>`;
            const myopie = new Myopie('#test', template, {}, [['input[name="test"]', 'testPath']]);
            t.truthy(myopie);
        });
        test(prefix + ': should create instance with custom timeout', (t) => {
            const template = (_data) => `<div>${_data.content}</div>`;
            const myopie = new Myopie('#test', template, {}, [], 200);
            t.truthy(myopie);
        });
    }
    {
        prefix = tag + 'get';
        test(prefix + ': should return undefined for null path', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, testData);
            t.is(myopie.get(null), undefined);
        });
        test(prefix + ': should return value for simple path', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, testData);
            t.is(myopie.get('stringValue'), 'test string');
        });
        test(prefix + ': should return value for nested object path', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, testData);
            t.is(myopie.get('objectNested/level1/level2/value'), 'deep');
        });
        test(prefix + ': should handle escaped slash in path', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, { 'key/with/slash': 'value' });
            t.is(myopie.get('key\\/with\\/slash'), 'value');
        });
        test(prefix + ': should return value from array by index', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, testData);
            t.is(myopie.get('arrayValues/1'), 'b');
        });
        test(prefix + ': should return value from Map by key', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, testData);
            t.is(myopie.get('mapValue/key1'), 'value1');
        });
        test(prefix + ': should return undefined when traversing into a Set by index', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, testData);
            t.is(myopie.get('setValue/0'), undefined);
        });
        test(prefix + ': should return Set value for direct path', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, testData);
            const setValue = myopie.get('setValue');
            t.true(setValue instanceof Set);
            t.is(setValue.size, 3);
        });
        test(prefix + ': should return undefined for deep path through a Set', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, testData);
            t.is(myopie.get('setValue/0/name'), undefined);
        });
        test(prefix + ': should return undefined for non-existent path', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, testData);
            t.is(myopie.get('nonExistent'), undefined);
        });
        test(prefix + ': should return undefined for invalid array index', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, testData);
            t.is(myopie.get('arrayValues/99'), undefined);
        });
        test(prefix + ': should call function and return result', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, testData);
            t.is(myopie.get('functionValue'), 'function result');
        });
        test(prefix + ': should return boolean values correctly', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, testData);
            t.is(myopie.get('booleanTrue'), true);
            t.is(myopie.get('booleanFalse'), false);
        });
        test(prefix + ': should return number values correctly', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, testData);
            t.is(myopie.get('numberZero'), 0);
            t.is(myopie.get('numberPositive'), 42);
            t.is(myopie.get('numberNegative'), -10);
        });
        test(prefix + ': should return null value', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, testData);
            t.is(myopie.get('nullValue'), null);
        });
        test(prefix + ': should return undefined value', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, testData);
            t.is(myopie.get('undefinedValue'), undefined);
        });
        test(prefix + ': should return undefined when navigating through a non-navigable type', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, { value: 42 });
            t.is(myopie.get('value/deeper'), undefined);
        });
        test(prefix + ': should return undefined for __proto__ path', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, testData);
            t.is(myopie.get('__proto__'), undefined);
        });
        test(prefix + ': should return undefined for nested __proto__ path', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, { nested: { key: 'value' } });
            t.is(myopie.get('nested/__proto__'), undefined);
        });
        test(prefix + ': should return undefined for Map __proto__ key', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, { map: new Map([['__proto__', 'value']]) });
            t.is(myopie.get('map/__proto__'), undefined);
        });
        test(prefix + ': should allow escaped __proto__ path', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, { nested: { '__proto__/x': 'value' } });
            t.is(myopie.get('nested/__proto__\\/x'), 'value');
        });
    }
    {
        prefix = tag + 'set';
        test(prefix + ': should set simple value and return true', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, {});
            t.true(myopie.set('key', 'value', false));
            t.is(myopie.get('key'), 'value');
        });
        test(prefix + ': should set nested value in object', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, { obj: {} });
            t.true(myopie.set('obj/nested', 'value', false));
            t.is(myopie.get('obj/nested'), 'value');
        });
        test(prefix + ': should create intermediate objects when setting nested path', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, {});
            t.true(myopie.set('a/b/c', 'deep', false));
            t.is(myopie.get('a/b/c'), 'deep');
        });
        test(prefix + ': should set value in array by index', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, { arr: ['a', 'b', 'c'] });
            t.true(myopie.set('arr/1', 'modified', false));
            t.is(myopie.get('arr/1'), 'modified');
        });
        test(prefix + ': should set value in Map by key', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, { map: new Map([['key', { nested: 'old' }]]) });
            t.true(myopie.set('map/key/nested', 'new', false));
            t.is(myopie.get('map/key/nested'), 'new');
        });
        test(prefix + ': should set direct Map entry by key', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, { map: new Map([['key', 'old']]) });
            t.true(myopie.set('map/key', 'new', false));
            t.is(myopie.get('map/key'), 'new');
        });
        test(prefix + ': should not change Map entry when setting same value', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, { map: new Map([['key', 'old']]) });
            t.true(myopie.set('map/key', 'old', false));
            t.is(myopie.get('map/key'), 'old');
        });
        test(prefix + ': should store undefined in Map instead of deleting', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, { map: new Map([['key', 'old']]) });
            t.true(myopie.set('map/key', undefined, false));
            const mapValue = myopie.get('map');
            t.true(mapValue.has('key'));
            t.is(mapValue.get('key'), undefined);
        });
        test(prefix + ': should create Map entry when setting undefined on missing key', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, { map: new Map([['other', 'value']]) });
            t.true(myopie.set('map/missing', undefined, false));
            const mapValue = myopie.get('map');
            t.true(mapValue.has('missing'));
            t.is(mapValue.get('missing'), undefined);
            t.is(myopie.get('map/other'), 'value');
        });
        test(prefix + ': should create intermediate object when setting nested path through Array at non-existent index', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, { items: [] });
            t.true(myopie.set('items/0/name', 'test', false));
            t.is(myopie.get('items/0/name'), 'test');
        });
        test(prefix + ': should create intermediate object when setting nested path through Map at non-existent key', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, { mymap: new Map() });
            t.true(myopie.set('mymap/newkey/value', 'test', false));
            t.is(myopie.get('mymap/newkey/value'), 'test');
        });
        test(prefix + ': should return false when setting through a non-navigable intermediate type', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, { value: 42 });
            t.false(myopie.set('value/deeper/key', 'test', false));
            t.is(myopie.get('value'), 42);
        });
        test(prefix + ': should update existing value', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, { key: 'old' });
            t.true(myopie.set('key', 'new', false));
            t.is(myopie.get('key'), 'new');
        });
        test(prefix + ': should store undefined in object instead of deleting', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, { obj: { key: 'value' } });
            t.true(myopie.set('obj/key', undefined, false));
            const objectValue = myopie.get('obj');
            t.true(Object.hasOwn(objectValue, 'key'));
            t.is(objectValue.key, undefined);
        });
        test(prefix + ': should store undefined in array index', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, { array: ['value'] });
            t.true(myopie.set('array/0', undefined, false));
            const arrayValue = myopie.get('array');
            t.true(Object.hasOwn(arrayValue, '0'));
            t.is(arrayValue[0], undefined);
        });
        test.serial(prefix + ': should make undefined an own property on nested object and trigger render', (t) => {
            document.body.innerHTML = '<div id="container"></div>';
            const template = (data) => `<div>${Object.hasOwn(data.obj, 'missing')}</div>`;
            const myopie = new Myopie('#container', template, { obj: {} }, [], 0);
            myopie.render();
            t.is(document.querySelector('#container')?.textContent, 'false');
            myopie.set('obj/missing', undefined, true);
            t.is(document.querySelector('#container')?.textContent, 'true');
            t.true(Object.hasOwn(myopie.get('obj'), 'missing'));
        });
        test(prefix + ': should make undefined an own index on empty nested array', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, { items: [] });
            t.true(myopie.set('items/0', undefined, false));
            const items = myopie.get('items');
            t.true(Object.hasOwn(items, '0'));
            t.is(items[0], undefined);
        });
        test(prefix + ': should not trigger render when render parameter is false', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, {});
            t.true(myopie.set('key', 'value', false));
        });
        test(prefix + ': should return true but not mark as changed when setting the same value', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, { key: 'original' });
            t.true(myopie.set('key', 'original', false));
            t.is(myopie.get('key'), 'original');
        });
        test(prefix + ': should handle escaped slash in path', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, { key: { with: { slash: 'nested' } } });
            t.true(myopie.set('key\\/with\\/slash', 'value', false));
            t.is(myopie.get('key\\/with\\/slash'), 'value');
            t.is(myopie.get('key/with/slash'), 'nested');
        });
        test(prefix + ': should set a Set as a whole value', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, { items: new Set(['old']) });
            t.true(myopie.set('items', new Set(['new']), false));
            const setValue = myopie.get('items');
            t.true(setValue instanceof Set);
            t.true(setValue.has('new'));
            t.false(setValue.has('old'));
        });
        test(prefix + ': should return false when setting direct Set item by index', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, { items: new Set(['a', 'b']) });
            t.false(myopie.set('items/0', 'x', false));
            const setValue = myopie.get('items');
            t.true(setValue instanceof Set);
            t.true(setValue.has('a'));
            t.true(setValue.has('b'));
            t.is(setValue.size, 2);
            t.is(myopie.get('items/0'), undefined);
        });
        test(prefix + ': should return false when setting nested path through a Set', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, { items: new Set([{ name: 'old' }]) });
            t.false(myopie.set('items/0/name', 'new', false));
            const setValue = myopie.get('items');
            const itemsArray = Array.from(setValue);
            t.is(itemsArray[0].name, 'old');
        });
        test(prefix + ': should return false when setting property on Date value', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, { date: new Date('2026-01-01T00:00:00.000Z') });
            t.false(myopie.set('date/year', 2027, false));
            t.is(myopie.get('date/year'), undefined);
        });
        test(prefix + ': should return false when setting property on RegExp value', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, { pattern: /abc/ });
            t.false(myopie.set('pattern/source', 'def', false));
            t.is(myopie.get('pattern/source'), undefined);
        });
        test(prefix + ': should reject __proto__ path', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, {});
            t.false(myopie.set('__proto__', { evil: true }, false));
            t.is(myopie.get('evil'), undefined);
        });
        test(prefix + ': should reject Map __proto__ key', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, { map: new Map() });
            t.false(myopie.set('map/__proto__', 'value', false));
            t.is(myopie.get('map/__proto__'), undefined);
            const retrievedMap = myopie.get('map');
            t.false(retrievedMap.has('__proto__'));
        });
        test.serial(prefix + ': should reject __proto__ before creating intermediates', (t) => {
            document.body.innerHTML = '<div id="container"></div>';
            const template = (data) => `<div>${Object.hasOwn(data, 'created') ? 'created' : 'missing'}</div>`;
            const myopie = new Myopie('#container', template, {}, [], 0);
            let preState;
            myopie.hooksRenderAddPre((_dataCurrent, dataPrevious) => {
                preState = dataPrevious;
            });
            myopie.render();
            t.is(document.querySelector('#container')?.textContent, 'missing');
            const returnValue = myopie.set('created/__proto__/later', 'value', true);
            t.false(returnValue);
            const created = myopie.get('created');
            t.true(undefined !== created);
            t.false(Object.hasOwn(created, 'later'));
            t.false(Object.hasOwn(created, '__proto__'));
            t.is(document.querySelector('#container')?.textContent, 'created');
            t.false(Object.hasOwn(preState, 'created'));
        });
    }
    {
        prefix = tag + 'del';
        test(prefix + ': should expose del as a function', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, {});
            t.is(typeof myopie.del, 'function');
        });
        test(prefix + ': should not expose delete as an alias', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, {});
            t.is(typeof myopie.delete, 'undefined');
        });
        test(prefix + ': should delete existing nested Object property', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, { obj: { key: 'value' } });
            t.true(myopie.del('obj/key', false));
            t.is(myopie.get('obj/key'), undefined);
            const obj = myopie.get('obj');
            t.false(Object.hasOwn(obj, 'key'));
        });
        test(prefix + ': should return false for missing nested Object property', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, { obj: {} });
            t.false(myopie.del('obj/missing', false));
        });
        test(prefix + ': should delete existing Array index', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, { arr: ['a', 'b', 'c'] });
            t.true(myopie.del('arr/1', false));
            const arr = myopie.get('arr');
            t.is(arr.length, 3);
            t.is(arr[1], undefined);
            t.false(Object.hasOwn(arr, '1'));
        });
        test(prefix + ': should return false for missing Array index', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, { arr: [] });
            t.false(myopie.del('arr/0', false));
        });
        test(prefix + ': should delete existing Map key', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, { map: new Map([['key', 'value']]) });
            t.true(myopie.del('map/key', false));
            t.is(myopie.get('map/key'), undefined);
            const mapVal = myopie.get('map');
            t.false(mapVal.has('key'));
        });
        test(prefix + ': should return false for missing Map key', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, { map: new Map() });
            t.false(myopie.del('map/missing', false));
        });
        test(prefix + ': should not create intermediate containers', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, {});
            t.false(myopie.del('a/b/c', false));
            t.is(myopie.get('a'), undefined);
        });
        test(prefix + ': should delete escaped slash key', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, { 'key/with/slash': 'value' });
            t.true(myopie.del('key\\/with\\/slash', false));
            t.is(myopie.get('key\\/with\\/slash'), undefined);
        });
        test(prefix + ': should reject __proto__ path', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, {});
            t.false(myopie.del('__proto__', false));
        });
        test(prefix + ': should reject __proto__ intermediate in delete', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, { obj: { existing: 'value' } });
            t.false(myopie.del('obj/__proto__/key', false));
            const obj = myopie.get('obj');
            t.true(undefined !== obj);
            t.is(obj.existing, 'value');
            t.false(Object.hasOwn(obj, '__proto__'));
        });
        test(prefix + ': should reject Map __proto__ key', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, { map: new Map() });
            t.false(myopie.del('map/__proto__', false));
        });
        test(prefix + ': should reject deleting __proto__ from Map that already has it', (t) => {
            const template = (_data) => '';
            const mapWithProto = new Map([['__proto__', 'value']]);
            const myopie = new Myopie('#test', template, { map: mapWithProto });
            t.false(myopie.del('map/__proto__', false));
            const retrievedMap = myopie.get('map');
            t.true(retrievedMap.has('__proto__'));
            t.is(retrievedMap.get('__proto__'), 'value');
        });
        test(prefix + ': should return false when deleting through non-navigable intermediate', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, { value: 42 });
            t.false(myopie.del('value/deeper/key', false));
            t.is(myopie.get('value'), 42);
        });
        test.serial(prefix + ': should pass pre-delete value to render hook via dataPrevious', (t) => {
            document.body.innerHTML = '<div id="container"></div>';
            const template = (data) => `<div>${data.value}</div>`;
            const myopie = new Myopie('#container', template, { value: 'before' }, [], 0);
            let previousData;
            myopie.hooksRenderAddPre((_dataCurrent, dataPrevious) => {
                previousData = dataPrevious;
            });
            myopie.render();
            t.true(myopie.del('value', true));
            t.is(previousData?.value, 'before');
        });
        test.serial(prefix + ': should update DOM after deletion with render=true', async (t) => {
            document.body.innerHTML = '<div id="container"><div>old</div></div>';
            const template = (data) => `<div>${data.content}</div>`;
            const myopie = new Myopie('#container', template, { content: 'value' }, [], 0);
            myopie.render();
            t.is(document.querySelector('#container')?.textContent, 'value');
            myopie.del('content', true);
            const container = document.querySelector('#container');
            t.is(container?.textContent, 'undefined');
        });
        test(prefix + ': should return false when deleting non-configurable array length', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, { arr: ['a', 'b', 'c'] });
            t.false(myopie.del('arr/length', false));
            const arr = myopie.get('arr');
            t.is(arr.length, 3);
            t.is(arr[0], 'a');
            t.is(arr[1], 'b');
            t.is(arr[2], 'c');
        });
    }
    {
        prefix = tag + 'deep clone';
        test(prefix + ': should clone initial data to prevent external mutations', (t) => {
            const template = (_data) => '';
            const initialData = { value: 'original' };
            const myopie = new Myopie('#test', template, initialData);
            initialData.value = 'mutated';
            t.is(myopie.get('value'), 'original');
        });
        test(prefix + ': should clone nested objects', (t) => {
            const template = (_data) => '';
            const initialData = { nested: { value: 'original' } };
            const myopie = new Myopie('#test', template, initialData);
            initialData.nested.value = 'mutated';
            t.is(myopie.get('nested/value'), 'original');
        });
        test(prefix + ': should clone arrays', (t) => {
            const template = (_data) => '';
            const initialData = { arr: ['a', 'b', 'c'] };
            const myopie = new Myopie('#test', template, initialData);
            initialData.arr.push('d');
            t.is(myopie.get('arr/3'), undefined);
        });
        test(prefix + ': should clone Date objects', (t) => {
            const template = (_data) => '';
            const date = new Date('2024-01-01');
            const initialData = { date: date };
            const myopie = new Myopie('#test', template, initialData);
            date.setFullYear(2025);
            const clonedDate = myopie.get('date');
            t.is(clonedDate.getFullYear(), 2024);
        });
        test(prefix + ': should clone RegExp objects', (t) => {
            const template = (_data) => '';
            const regex = /test/gi;
            const initialData = { regex: regex };
            const myopie = new Myopie('#test', template, initialData);
            const clonedRegex = myopie.get('regex');
            t.is(clonedRegex.source, 'test');
            t.is(clonedRegex.flags, 'gi');
            t.not(clonedRegex, regex);
        });
        test(prefix + ': should clone Set objects', (t) => {
            const template = (_data) => '';
            const set = new Set(['a', 'b']);
            const initialData = { set: set };
            const myopie = new Myopie('#test', template, initialData);
            set.add('c');
            const clonedSet = myopie.get('set');
            t.false(clonedSet.has('c'));
        });
        test(prefix + ': should clone Map objects', (t) => {
            const template = (_data) => '';
            const map = new Map([['key', 'value']]);
            const initialData = { map: map };
            const myopie = new Myopie('#test', template, initialData);
            map.set('key2', 'value2');
            const clonedMap = myopie.get('map');
            t.false(clonedMap.has('key2'));
        });
        test(prefix + ': should reject __proto__ pollution via deep clone', (t) => {
            const template = (_data) => '';
            const payload = JSON.parse('{"__proto__":{"evil":true}}');
            const myopie = new Myopie('#test', template, payload);
            t.is(myopie.get('evil'), undefined);
            t.is({}.evil, undefined);
        });
    }
    {
        prefix = tag + 'render';
        test(prefix + ': should return false when selector does not exist', (t) => {
            const template = (_data) => '<div>content</div>';
            const myopie = new Myopie('#nonexistent', template, {});
            t.false(myopie.render());
        });
        test(prefix + ': should return true when selector exists', (t) => {
            document.body.innerHTML = '<div id="container"></div>';
            const template = (_data) => '<div>content</div>';
            const myopie = new Myopie('#container', template, {});
            t.true(myopie.render());
        });
        test(prefix + ': should render template content to DOM', (t) => {
            document.body.innerHTML = '<div id="container"></div>';
            const template = (data) => `<div>${data.content}</div>`;
            const myopie = new Myopie('#container', template, { content: 'test' });
            myopie.render();
            const container = document.querySelector('#container');
            t.is(container?.textContent, 'test');
        });
        test(prefix + ': should update DOM when data changes', (t) => {
            document.body.innerHTML = '<div id="container"></div>';
            const template = (data) => `<div>${data.content}</div>`;
            const myopie = new Myopie('#container', template, { content: 'initial' });
            myopie.render();
            myopie.set('content', 'updated', false);
            myopie.render();
            const container = document.querySelector('#container');
            t.is(container?.textContent, 'updated');
        });
        test(prefix + ': should not re-render if template output is unchanged', (t) => {
            document.body.innerHTML = '<div id="container"></div>';
            const template = (_data) => '<div>static</div>';
            const myopie = new Myopie('#container', template, {});
            myopie.render();
            const firstChild = document.querySelector('#container')?.firstChild;
            myopie.render();
            const secondChild = document.querySelector('#container')?.firstChild;
            t.is(firstChild, secondChild);
        });
        test(prefix + ': should preserve element attributes during update', (t) => {
            document.body.innerHTML = '<div id="container"></div>';
            const template = (data) => `<div class="test" data-value="${data.value}">content</div>`;
            const myopie = new Myopie('#container', template, { value: 'initial' });
            myopie.render();
            myopie.set('value', 'updated', false);
            myopie.render();
            const div = document.querySelector('#container div');
            t.is(div?.getAttribute('class'), 'test');
            t.is(div?.getAttribute('data-value'), 'updated');
        });
        test(prefix + ': should add new elements when template expands', (t) => {
            document.body.innerHTML = '<div id="container"></div>';
            const template = (data) => {
                let html = '<div>first</div>';
                if (data.showSecond) {
                    html += '<div>second</div>';
                }
                return html;
            };
            const myopie = new Myopie('#container', template, { showSecond: false });
            myopie.render();
            t.is(document.querySelectorAll('#container div').length, 1);
            myopie.set('showSecond', true, false);
            myopie.render();
            t.is(document.querySelectorAll('#container div').length, 2);
        });
        test(prefix + ': should remove elements when template contracts', (t) => {
            document.body.innerHTML = '<div id="container"></div>';
            const template = (data) => {
                let html = '<div>first</div>';
                if (data.showSecond) {
                    html += '<div>second</div>';
                }
                return html;
            };
            const myopie = new Myopie('#container', template, { showSecond: true });
            myopie.render();
            t.is(document.querySelectorAll('#container div').length, 2);
            myopie.set('showSecond', false, false);
            myopie.render();
            t.is(document.querySelectorAll('#container div').length, 1);
        });
    }
    {
        prefix = tag + 'renderDebounce';
        test.serial(prefix + ': should defer rendering with timeout', async (t) => {
            document.body.innerHTML = '<div id="container"></div>';
            const template = (data) => `<div>${data.content}</div>`;
            const myopie = new Myopie('#container', template, { content: 'initial' }, [], 50);
            myopie.render();
            myopie.set('content', 'updated', false);
            myopie.renderDebounce();
            let container = document.querySelector('#container');
            t.is(container?.textContent, 'initial');
            await new Promise((resolve) => setTimeout(resolve, 60));
            container = document.querySelector('#container');
            t.is(container?.textContent, 'updated');
        });
        test(prefix + ': should render immediately when timeout is 0', (t) => {
            document.body.innerHTML = '<div id="container"></div>';
            const template = (data) => `<div>${data.content}</div>`;
            const myopie = new Myopie('#container', template, { content: 'initial' }, [], 0);
            myopie.render();
            myopie.set('content', 'updated', false);
            myopie.renderDebounce();
            const container = document.querySelector('#container');
            t.is(container?.textContent, 'updated');
        });
        test.serial(prefix + ': should cancel previous timeout when called multiple times', async (t) => {
            document.body.innerHTML = '<div id="container"></div>';
            const template = (data) => `<div>${data.content}</div>`;
            const myopie = new Myopie('#container', template, { content: 'initial' }, [], 50);
            myopie.render();
            myopie.set('content', 'first', false);
            myopie.renderDebounce();
            await new Promise((resolve) => setTimeout(resolve, 25));
            myopie.set('content', 'second', false);
            myopie.renderDebounce();
            await new Promise((resolve) => setTimeout(resolve, 60));
            const container = document.querySelector('#container');
            t.is(container?.textContent, 'second');
        });
    }
    {
        prefix = tag + 'hooks: init pre';
        test(prefix + ': should call init pre hook before first render', (t) => {
            document.body.innerHTML = '<div id="container"></div>';
            const template = (_data) => '<div>content</div>';
            const myopie = new Myopie('#container', template, { value: 'test' });
            let hookCalled = false;
            let hookData;
            myopie.hooksInitAddPre((dataCurrent) => {
                hookCalled = true;
                hookData = dataCurrent;
            });
            myopie.render();
            t.true(hookCalled);
            t.is(hookData.value, 'test');
        });
        test(prefix + ': should not call init pre hook on subsequent renders', (t) => {
            document.body.innerHTML = '<div id="container"></div>';
            const template = (_data) => '<div>content</div>';
            const myopie = new Myopie('#container', template, {});
            let callCount = 0;
            myopie.hooksInitAddPre(() => {
                callCount++;
            });
            myopie.render();
            myopie.render();
            t.is(callCount, 1);
        });
    }
    {
        prefix = tag + 'hooks: init post';
        test(prefix + ': should call init post hook after first render', (t) => {
            document.body.innerHTML = '<div id="container"></div>';
            const template = (_data) => '<div>content</div>';
            const myopie = new Myopie('#container', template, { value: 'test' });
            let hookCalled = false;
            let hookData;
            myopie.hooksInitAddPost((dataCurrent) => {
                hookCalled = true;
                hookData = dataCurrent;
            });
            myopie.render();
            t.true(hookCalled);
            t.is(hookData.value, 'test');
        });
        test(prefix + ': should not call init post hook on subsequent renders', (t) => {
            document.body.innerHTML = '<div id="container"></div>';
            const template = (_data) => '<div>content</div>';
            const myopie = new Myopie('#container', template, {});
            let callCount = 0;
            myopie.hooksInitAddPost(() => {
                callCount++;
            });
            myopie.render();
            myopie.render();
            t.is(callCount, 1);
        });
    }
    {
        prefix = tag + 'hooks: render pre';
        test(prefix + ': should not call render pre hook on first render', (t) => {
            document.body.innerHTML = '<div id="container"></div>';
            const template = (_data) => '<div>content</div>';
            const myopie = new Myopie('#container', template, {});
            let hookCalled = false;
            myopie.hooksRenderAddPre(() => {
                hookCalled = true;
            });
            myopie.render();
            t.false(hookCalled);
        });
        test(prefix + ': should call render pre hook on subsequent renders', (t) => {
            document.body.innerHTML = '<div id="container"></div>';
            const template = (data) => `<div>${data.value}</div>`;
            const myopie = new Myopie('#container', template, { value: 'initial' });
            let hookCalled = false;
            let currentData;
            let previousData;
            myopie.hooksRenderAddPre((dataCurrent, dataPrevious) => {
                hookCalled = true;
                currentData = dataCurrent;
                previousData = dataPrevious;
            });
            myopie.render();
            myopie.set('value', 'updated', false);
            myopie.render();
            t.true(hookCalled);
            t.is(currentData.value, 'updated');
            t.is(previousData.value, 'initial');
        });
    }
    {
        prefix = tag + 'hooks: render post';
        test(prefix + ': should not call render post hook on first render', (t) => {
            document.body.innerHTML = '<div id="container"></div>';
            const template = (_data) => '<div>content</div>';
            const myopie = new Myopie('#container', template, {});
            let hookCalled = false;
            myopie.hooksRenderAddPost(() => {
                hookCalled = true;
            });
            myopie.render();
            t.false(hookCalled);
        });
        test(prefix + ': should call render post hook on subsequent renders', (t) => {
            document.body.innerHTML = '<div id="container"></div>';
            const template = (data) => `<div>${data.value}</div>`;
            const myopie = new Myopie('#container', template, { value: 'initial' });
            let hookCalled = false;
            let currentData;
            let previousData;
            myopie.hooksRenderAddPost((dataCurrent, dataPrevious) => {
                hookCalled = true;
                currentData = dataCurrent;
                previousData = dataPrevious;
            });
            myopie.render();
            myopie.set('value', 'updated', false);
            myopie.render();
            t.true(hookCalled);
            t.is(currentData.value, 'updated');
            t.is(previousData.value, 'initial');
        });
    }
    {
        prefix = tag + 'handlersPermanentAdd';
        test(prefix + ': should add handler and return true', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, {});
            const handler = (_event) => { };
            t.true(myopie.handlersPermanentAdd('button', 'click', handler));
        });
        test(prefix + ': should prevent duplicate handlers and return false', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, {});
            const handler = (_event) => { };
            myopie.handlersPermanentAdd('button', 'click', handler);
            t.false(myopie.handlersPermanentAdd('button', 'click', handler));
        });
        test(prefix + ': should allow same handler for different events', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, {});
            const handler = (_event) => { };
            myopie.handlersPermanentAdd('button', 'click', handler);
            t.true(myopie.handlersPermanentAdd('button', 'mousedown', handler));
        });
        test(prefix + ': should allow same handler for different selectors', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, {});
            const handler = (_event) => { };
            myopie.handlersPermanentAdd('button', 'click', handler);
            t.true(myopie.handlersPermanentAdd('input', 'click', handler));
        });
        test(prefix + ': should attach handlers to elements after render', (t) => {
            document.body.innerHTML = '<div id="container"></div>';
            const template = (_data) => '<button>Click</button>';
            const myopie = new Myopie('#container', template, {});
            let clicked = false;
            const handler = () => {
                clicked = true;
            };
            myopie.handlersPermanentAdd('button', 'click', handler);
            myopie.render();
            const button = document.querySelector('button');
            button?.dispatchEvent(new window.Event('click'));
            t.true(clicked);
        });
        test(prefix + ': should re-attach handlers after re-render', (t) => {
            document.body.innerHTML = '<div id="container"></div>';
            const template = (data) => `<button>${data.label}</button>`;
            const myopie = new Myopie('#container', template, { label: 'First' });
            let clickCount = 0;
            const handler = () => {
                clickCount++;
            };
            myopie.handlersPermanentAdd('button', 'click', handler);
            myopie.render();
            myopie.set('label', 'Second', false);
            myopie.render();
            const button = document.querySelector('button');
            button?.dispatchEvent(new window.Event('click'));
            t.is(clickCount, 1);
        });
    }
    {
        prefix = tag + 'handlersPermanentDel';
        test(prefix + ': should remove specific handler and return true', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, {});
            const handler = (_event) => { };
            myopie.handlersPermanentAdd('button', 'click', handler);
            t.true(myopie.handlersPermanentDel('button', 'click', handler));
        });
        test(prefix + ': should return false when handler does not exist', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, {});
            const handler = (_event) => { };
            t.false(myopie.handlersPermanentDel('button', 'click', handler));
        });
        test(prefix + ': should remove all handlers for event when listener not specified', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, {});
            const handler1 = (_event) => { };
            const handler2 = (_event) => { };
            myopie.handlersPermanentAdd('button', 'click', handler1);
            myopie.handlersPermanentAdd('button', 'click', handler2);
            t.true(myopie.handlersPermanentDel('button', 'click'));
        });
        test(prefix + ': should remove all handlers for selector when event not specified', (t) => {
            const template = (_data) => '';
            const myopie = new Myopie('#test', template, {});
            const handler = (_event) => { };
            myopie.handlersPermanentAdd('button', 'click', handler);
            myopie.handlersPermanentAdd('button', 'mousedown', handler);
            t.true(myopie.handlersPermanentDel('button'));
        });
        test(prefix + ': should remove only the specified handler when multiple exist for the same event', (t) => {
            document.body.innerHTML = '<div id="container"></div>';
            const template = (_data) => '<button>Click</button>';
            const myopie = new Myopie('#container', template, {});
            let count1 = 0;
            let count2 = 0;
            const handler1 = () => { count1++; };
            const handler2 = () => { count2++; };
            myopie.handlersPermanentAdd('button', 'click', handler1);
            myopie.handlersPermanentAdd('button', 'click', handler2);
            myopie.render();
            t.true(myopie.handlersPermanentDel('button', 'click', handler1));
            const button = document.querySelector('button');
            button?.dispatchEvent(new window.Event('click'));
            t.is(count1, 0);
            t.is(count2, 1);
        });
        test(prefix + ': should detach handler from DOM elements', (t) => {
            document.body.innerHTML = '<div id="container"></div>';
            const template = (_data) => '<button>Click</button>';
            const myopie = new Myopie('#container', template, {});
            let clicked = false;
            const handler = () => {
                clicked = true;
            };
            myopie.handlersPermanentAdd('button', 'click', handler);
            myopie.render();
            myopie.handlersPermanentDel('button', 'click', handler);
            const button = document.querySelector('button');
            button?.dispatchEvent(new window.Event('click'));
            t.false(clicked);
        });
    }
    {
        prefix = tag + 'input handling';
        test(prefix + ': should update data on input event for text input', (t) => {
            document.body.innerHTML = '<div id="container"></div>';
            const template = (data) => `<input type="text" name="test" value="${data.testValue || ''}" />`;
            const myopie = new Myopie('#container', template, { testValue: '' }, [['input[name="test"]', 'testValue']], 0, false);
            myopie.render();
            const input = document.querySelector('input[name="test"]');
            input.value = 'new value';
            input.dispatchEvent(new window.Event('input', { bubbles: true }));
            t.is(myopie.get('testValue'), 'new value');
        });
        test(prefix + ': should update data on input event for checkbox', (t) => {
            document.body.innerHTML = '<div id="container"></div>';
            const template = (_data) => '<input type="checkbox" name="test" value="checked" />';
            const myopie = new Myopie('#container', template, {}, [['input[name="test"]', 'testValue']], 0, false);
            myopie.render();
            const input = document.querySelector('input[name="test"]');
            input.checked = true;
            input.dispatchEvent(new window.Event('input', { bubbles: true }));
            t.is(myopie.get('testValue'), 'checked');
        });
        test(prefix + ': should update data on input event for select', (t) => {
            document.body.innerHTML = '<div id="container"></div>';
            const template = (_data) => '<select name="test"><option value="a">A</option><option value="b">B</option></select>';
            const myopie = new Myopie('#container', template, {}, [['select[name="test"]', 'testValue']], 0, false);
            myopie.render();
            const select = document.querySelector('select[name="test"]');
            select.value = 'b';
            select.dispatchEvent(new window.Event('input', { bubbles: true }));
            t.is(myopie.get('testValue'), 'b');
        });
        test(prefix + ': should update data on input event for textarea', (t) => {
            document.body.innerHTML = '<div id="container"></div>';
            const template = (_data) => '<textarea name="test"></textarea>';
            const myopie = new Myopie('#container', template, {}, [['textarea[name="test"]', 'testValue']], 0, false);
            myopie.render();
            const textarea = document.querySelector('textarea[name="test"]');
            textarea.value = 'textarea content';
            textarea.dispatchEvent(new window.Event('input', { bubbles: true }));
            t.is(myopie.get('testValue'), 'textarea content');
        });
        test(prefix + ': unchecked checkbox should store undefined', (t) => {
            document.body.innerHTML = '<div id="container"></div>';
            const template = (_data) => '<input type="checkbox" name="agree" value="yes">';
            const myopie = new Myopie('#container', template, { test: { accepted: 'yes' } }, [['input[name="agree"]', 'test/accepted']], 0, false);
            myopie.render();
            const input = document.querySelector('input[name="agree"]');
            input.checked = false;
            input.dispatchEvent(new window.Event('input', { bubbles: true }));
            t.is(myopie.get('test/accepted'), undefined);
            const testObj = myopie.get('test');
            t.true(Object.hasOwn(testObj, 'accepted'));
        });
        test(prefix + ': renderOnInput true should update rendered DOM', (t) => {
            document.body.innerHTML = '<div id="container"></div><input id="source">';
            const template = (data) => `<div>${data.text}</div>`;
            const myopie = new Myopie('#container', template, { text: 'initial' }, [['#source', 'text']], 0, true);
            myopie.render();
            const input = document.querySelector('#source');
            input.value = 'updated';
            input.dispatchEvent(new window.Event('input', { bubbles: true }));
            const container = document.querySelector('#container');
            t.is(container?.textContent, 'updated');
            myopie.destroy();
        });
    }
    {
        prefix = tag + 'destroy';
        test.serial(prefix + ': should clear pending render timeout', async (t) => {
            document.body.innerHTML = '<div id="container"></div>';
            const template = (data) => `<div>${data.content}</div>`;
            const myopie = new Myopie('#container', template, { content: 'initial' }, [], 50);
            myopie.render();
            myopie.set('content', 'updated', false);
            myopie.renderDebounce();
            myopie.destroy();
            await new Promise((resolve) => setTimeout(resolve, 60));
            const container = document.querySelector('#container');
            t.is(container?.textContent, 'initial');
        });
        test(prefix + ': should remove permanent handlers from DOM', (t) => {
            document.body.innerHTML = '<div id="container"></div>';
            const template = (_data) => '<button>Click</button>';
            const myopie = new Myopie('#container', template, {});
            let clicked = false;
            const handler = () => {
                clicked = true;
            };
            myopie.handlersPermanentAdd('button', 'click', handler);
            myopie.render();
            myopie.destroy();
            const button = document.querySelector('button');
            button?.dispatchEvent(new window.Event('click'));
            t.false(clicked);
        });
        test(prefix + ': should be idempotent when called twice', (t) => {
            const template = (_data) => '<div>content</div>';
            const myopie = new Myopie('#test', template, {});
            myopie.destroy();
            t.notThrows(() => myopie.destroy());
        });
        test(prefix + ': should work before any render', (t) => {
            const template = (_data) => '<div>content</div>';
            const myopie = new Myopie('#test', template, {});
            t.notThrows(() => myopie.destroy());
        });
        test(prefix + ': should remove input event listener when inputToPath is set', (t) => {
            document.body.innerHTML = '<div id="container"></div>';
            const template = (_data) => '<input type="text" name="field">';
            const myopie = new Myopie('#container', template, { val: '' }, [['input[name="field"]', 'val']], 0, false);
            myopie.render();
            myopie.destroy();
            const input = document.querySelector('input[name="field"]');
            input.value = 'typed';
            input.dispatchEvent(new window.Event('input', { bubbles: true }));
            t.is(myopie.get('val'), '');
        });
    }
    {
        prefix = tag + 'data-myopie-ignore-content';
        test(prefix + ': should preserve element content when attribute is true', (t) => {
            document.body.innerHTML = '<div id="container"><div data-myopie-ignore-content="true">preserved</div></div>';
            const template = (_data) => '<div data-myopie-ignore-content="true">replaced</div>';
            const myopie = new Myopie('#container', template, {});
            myopie.render();
            const div = document.querySelector('#container div');
            t.is(div?.textContent, 'preserved');
        });
        test(prefix + ': should preserve existing text when template element is empty', (t) => {
            document.body.innerHTML = '<div id="container"><div data-myopie-ignore-content="true">preserved</div></div>';
            const template = (_data) => '<div data-myopie-ignore-content="true"></div>';
            const myopie = new Myopie('#container', template, {});
            myopie.render();
            const div = document.querySelector('#container div');
            t.is(div?.textContent, 'preserved');
        });
        test(prefix + ': should not leak ignore-content to later sibling', (t) => {
            document.body.innerHTML = '<div id="container"><div data-myopie-ignore-content="true">preserved</div><div>old</div></div>';
            const template = (_data) => '<div data-myopie-ignore-content="true">replaced</div><div>new</div>';
            const myopie = new Myopie('#container', template, {});
            myopie.render();
            const divs = document.querySelectorAll('#container div');
            t.is(divs.length, 2);
            t.is(divs[0].textContent, 'preserved');
            t.is(divs[1].textContent, 'new');
        });
    }
    {
        prefix = tag + 'data-myopie-ignore-style';
        test(prefix + ': should preserve element style when attribute is true', (t) => {
            document.body.innerHTML = '<div id="container"><div data-myopie-ignore-style="true" style="color: red;">content</div></div>';
            const template = (_data) => '<div data-myopie-ignore-style="true" style="color: blue;">content</div>';
            const myopie = new Myopie('#container', template, {});
            myopie.render();
            const div = document.querySelector('#container div');
            t.is(div?.style.color, 'red');
        });
        test(prefix + ': should not remove style attribute from existing element when template omits it', (t) => {
            document.body.innerHTML = '<div id="container"><div data-myopie-ignore-style="true" style="color: red;">content</div></div>';
            const template = (_data) => '<div data-myopie-ignore-style="true">content</div>';
            const myopie = new Myopie('#container', template, {});
            myopie.render();
            const div = document.querySelector('#container div');
            t.is(div?.style.color, 'red');
        });
        test(prefix + ': should not leak ignore-style to later sibling', (t) => {
            document.body.innerHTML = '<div id="container"><div data-myopie-ignore-style="true" style="color: red;">content</div><div style="color: green;">text</div></div>';
            const template = (_data) => '<div data-myopie-ignore-style="true" style="color: blue;">content</div><div style="color: yellow;">text</div>';
            const myopie = new Myopie('#container', template, {});
            myopie.render();
            const divs = document.querySelectorAll('#container div');
            t.is(divs.length, 2);
            t.is(divs[0].style.color, 'red');
            t.is(divs[1].style.color, 'yellow');
        });
    }
    {
        prefix = tag + 'data-myopie-default-*';
        test(prefix + ': should set default attribute when not present', (t) => {
            document.body.innerHTML = '<div id="container"><div>content</div></div>';
            const template = (_data) => '<div data-myopie-default-class="default-class">content</div>';
            const myopie = new Myopie('#container', template, {});
            myopie.render();
            const div = document.querySelector('#container div');
            t.is(div?.getAttribute('class'), 'default-class');
        });
        test(prefix + ': should not override existing attribute', (t) => {
            document.body.innerHTML = '<div id="container"><div class="existing">content</div></div>';
            const template = (_data) => '<div data-myopie-default-class="default-class">content</div>';
            const myopie = new Myopie('#container', template, {});
            myopie.render();
            const div = document.querySelector('#container div');
            t.is(div?.getAttribute('class'), null);
        });
        test(prefix + ' stripping: attribute itself should be stripped from DOM after render', (t) => {
            document.body.innerHTML = '<div id="container"></div>';
            const template = (_data) => '<div data-myopie-default-class="foo">content</div>';
            const myopie = new Myopie('#container', template, {});
            myopie.render();
            const div = document.querySelector('#container div');
            t.is(div?.getAttribute('data-myopie-default-class'), null);
        });
        test(prefix + ': should apply default attribute on cloned root element', (t) => {
            document.body.innerHTML = '<div id="container"></div>';
            const template = (_data) => '<div data-myopie-default-class="default-class">content</div>';
            const myopie = new Myopie('#container', template, {});
            myopie.render();
            const div = document.querySelector('#container div');
            t.is(div?.getAttribute('class'), 'default-class');
            t.is(div?.getAttribute('data-myopie-default-class'), null);
        });
        test(prefix + ': should apply default attribute on cloned descendant', (t) => {
            document.body.innerHTML = '<div id="container"></div>';
            const template = (_data) => '<div><span data-myopie-default-title="child-title">child</span></div>';
            const myopie = new Myopie('#container', template, {});
            myopie.render();
            const span = document.querySelector('#container span');
            t.is(span?.getAttribute('title'), 'child-title');
            t.is(span?.getAttribute('data-myopie-default-title'), null);
        });
        test(prefix + ': should apply default attribute on unmatched candidate clone', (t) => {
            document.body.innerHTML = '<div id="container"><span>existing</span></div>';
            const template = (_data) => '<div data-myopie-default-class="default-class">new</div>';
            const myopie = new Myopie('#container', template, {});
            myopie.render();
            const div = document.querySelector('#container div');
            t.is(div?.getAttribute('class'), 'default-class');
            const span = document.querySelector('#container span');
            t.is(span, null);
        });
    }
    {
        prefix = tag + 'data-myopie-id';
        test(prefix + ': should be preserved in DOM after render', (t) => {
            document.body.innerHTML = '<div id="container"></div>';
            const template = (_data) => '<div data-myopie-id="item-1">content</div>';
            const myopie = new Myopie('#container', template, {});
            myopie.render();
            const div = document.querySelector('#container div');
            t.is(div?.getAttribute('data-myopie-id'), 'item-1');
        });
        test(prefix + ': should be updated when template value changes on rerender', (t) => {
            document.body.innerHTML = '<div id="container"></div>';
            const template = (data) => `<div data-myopie-id="${data.id}">content</div>`;
            const myopie = new Myopie('#container', template, { id: 'v1' });
            myopie.render();
            myopie.set('id', 'v2', false);
            myopie.render();
            const div = document.querySelector('#container div');
            t.is(div?.getAttribute('data-myopie-id'), 'v2');
        });
    }
    {
        prefix = tag + 'data-myopie-ignore-* stripping';
        test(prefix + ': attribute itself should be stripped from DOM after render', (t) => {
            document.body.innerHTML = '<div id="container"></div>';
            const template = (_data) => '<div data-myopie-ignore-style="true">content</div>';
            const myopie = new Myopie('#container', template, {});
            myopie.render();
            const div = document.querySelector('#container div');
            t.is(div?.getAttribute('data-myopie-ignore-style'), null);
        });
    }
    {
        prefix = tag + 'node scoring';
        test(prefix + ': should select best matching node by element id over first candidate', (t) => {
            document.body.innerHTML = '<div id="container"><div>generic</div><div id="target">correct</div></div>';
            const template = (_data) => '<div id="target">correct</div>';
            const myopie = new Myopie('#container', template, {});
            myopie.render();
            const divs = document.querySelectorAll('#container div');
            t.is(divs.length, 1);
            t.is(divs[0].id, 'target');
        });
        test(prefix + ': should select best matching node by data-myopie-id over first candidate', (t) => {
            document.body.innerHTML = '<div id="container"><div>generic</div><div data-myopie-id="target">correct</div></div>';
            const template = (_data) => '<div data-myopie-id="target">correct</div>';
            const myopie = new Myopie('#container', template, {});
            myopie.render();
            const divs = document.querySelectorAll('#container div');
            t.is(divs.length, 1);
            t.is(divs[0]?.getAttribute('data-myopie-id'), 'target');
        });
        test(prefix + ': should update content of matched node when template changes', (t) => {
            document.body.innerHTML = '<div id="container"><div>generic</div><div data-myopie-id="target">old</div></div>';
            const template = (_data) => '<div data-myopie-id="target">updated</div>';
            const myopie = new Myopie('#container', template, {});
            myopie.render();
            const div = document.querySelector('#container div');
            t.is(div?.textContent, 'updated');
            t.is(div?.getAttribute('data-myopie-id'), 'target');
        });
    }
    {
        prefix = tag + '_nodeDiff';
        test(prefix + ': should append text node when existing has fewer nodes than template', (t) => {
            document.body.innerHTML = '<div id="container"></div>';
            const template = (data) => data.showText ? '<span>A</span>testo' : '<span>A</span>';
            const myopie = new Myopie('#container', template, { showText: false });
            myopie.render();
            myopie.set('showText', true, false);
            myopie.render();
            t.is(document.querySelector('#container')?.textContent, 'Atesto');
        });
        test(prefix + ': should clear children of matched element when template element is empty', (t) => {
            document.body.innerHTML = '<div id="container"><div id="target"><span>child content</span></div></div>';
            const template = (_data) => '<div id="target"></div>';
            const myopie = new Myopie('#container', template, {});
            myopie.render();
            const target = document.querySelector('#container #target');
            t.is(target?.childNodes.length, 0);
        });
        test(prefix + ': should not overwrite value attribute of input/textarea/option during re-render', (t) => {
            document.body.innerHTML = '<div id="container"><input type="text" value="old"></div>';
            const template = (_data) => '<input type="text" value="new">';
            const myopie = new Myopie('#container', template, {});
            myopie.render();
            const input = document.querySelector('#container input');
            t.is(input?.getAttribute('value'), 'old');
        });
        test(prefix + ': should remove live attribute that is absent from template', (t) => {
            document.body.innerHTML = '<div id="container"><div data-custom="extra">content</div></div>';
            const template = (_data) => '<div>content</div>';
            const myopie = new Myopie('#container', template, {});
            myopie.render();
            const div = document.querySelector('#container div');
            t.is(div?.getAttribute('data-custom'), null);
        });
        test(prefix + ': should remove multiple live attributes absent from template', (t) => {
            document.body.innerHTML = '<div id="container"><div data-a="1" data-b="2">content</div></div>';
            const template = (_data) => '<div>content</div>';
            const myopie = new Myopie('#container', template, {});
            myopie.render();
            const div = document.querySelector('#container div');
            t.is(div?.getAttribute('data-a'), null);
            t.is(div?.getAttribute('data-b'), null);
        });
    }
    {
        prefix = tag + 'html comments';
        test(prefix + ': comment in existing DOM should be removed after render', (t) => {
            document.body.innerHTML = '<div id="container"><!-- existing comment --><p>content</p></div>';
            const template = (_data) => '<p>content</p>';
            const myopie = new Myopie('#container', template, {});
            myopie.render();
            const container = document.querySelector('#container');
            const commentNodes = Array.from(container?.childNodes ?? []).filter((n) => n.nodeType === 8);
            t.is(commentNodes.length, 0);
            t.is(container?.querySelector('p')?.textContent, 'content');
        });
        test(prefix + ': comment generated by template should not appear in rendered DOM', (t) => {
            document.body.innerHTML = '<div id="container"></div>';
            const template = (_data) => '<!-- template comment --><p>content</p>';
            const myopie = new Myopie('#container', template, {});
            myopie.render();
            const container = document.querySelector('#container');
            const commentNodes = Array.from(container?.childNodes ?? []).filter((n) => n.nodeType === 8);
            t.is(commentNodes.length, 0);
            t.is(container?.querySelector('p')?.textContent, 'content');
        });
    }
    {
        prefix = tag + 'comparators: input';
        test(prefix + ': should call input comparator to match elements by type and name', (t) => {
            document.body.innerHTML = '<div id="container"><input type="text" name="username"></div>';
            const template = (_data) => '<input type="text" name="username" data-matched="true">';
            const myopie = new Myopie('#container', template, {});
            myopie.render();
            const input = document.querySelector('#container input');
            t.is(input?.getAttribute('data-matched'), 'true');
            t.is(input?.name, 'username');
        });
    }
    {
        prefix = tag + 'comparators: link';
        test(prefix + ': should call link comparator to match elements by href', (t) => {
            document.body.innerHTML = '<div id="container"><link rel="stylesheet" href="http://localhost/style.css"></div>';
            const template = (_data) => '<link rel="stylesheet" href="http://localhost/style.css" data-matched="true">';
            const myopie = new Myopie('#container', template, {});
            myopie.render();
            const link = document.querySelector('#container link');
            t.is(link?.getAttribute('data-matched'), 'true');
            t.is(link?.href, 'http://localhost/style.css');
        });
    }
    {
        prefix = tag + 'comparators: a';
        test(prefix + ': should call anchor comparator to match elements by href', (t) => {
            document.body.innerHTML = '<div id="container"><a href="http://localhost/other">Other</a><a href="http://localhost/target">Target</a></div>';
            const template = (_data) => '<a href="http://localhost/target">Updated</a>';
            const myopie = new Myopie('#container', template, {});
            myopie.render();
            const anchors = document.querySelectorAll('#container a');
            t.is(anchors.length, 1);
            t.is(anchors[0].href, 'http://localhost/target');
            t.is(anchors[0].textContent, 'Updated');
        });
    }
    {
        prefix = tag + 'comparators: img';
        test(prefix + ': should call img comparator to match elements by src', (t) => {
            document.body.innerHTML = '<div id="container"><img src="http://localhost/image.png"></div>';
            const template = (_data) => '<img src="http://localhost/image.png" alt="updated">';
            const myopie = new Myopie('#container', template, {});
            myopie.render();
            const img = document.querySelector('#container img');
            t.is(img?.getAttribute('alt'), 'updated');
            t.is(img?.src, 'http://localhost/image.png');
        });
    }
    {
        prefix = tag + 'comparators: script';
        test(prefix + ': should call script comparator to match elements by src', (t) => {
            document.body.innerHTML = '<div id="container"><script src="http://localhost/app.js"></script></div>';
            const template = (_data) => '<script src="http://localhost/app.js" data-matched="true"></script>';
            const myopie = new Myopie('#container', template, {});
            myopie.render();
            const script = document.querySelector('#container script');
            t.is(script?.getAttribute('data-matched'), 'true');
            t.is(script?.src, 'http://localhost/app.js');
        });
    }
    {
        prefix = tag + 'mixed template';
        test(prefix + ': should correctly render and update a template mixing divs, spans, a, img, script, text and comments', (t) => {
            document.body.innerHTML = '<div id="container"></div>';
            const template = (data) => `<div class="wrapper"><span class="title">${data.title}</span><a href="http://localhost/page">Link</a><img src="http://localhost/photo.png" alt="${data.alt}"><script src="http://localhost/app.js"><\/script>some text<span class="footer">${data.footer}</span></div><!-- header -->`;
            const myopie = new Myopie('#container', template, { title: 'Hello', alt: 'photo', footer: 'Bottom' });
            myopie.render();
            const wrapper = document.querySelector('#container .wrapper');
            t.truthy(wrapper);
            t.is(wrapper?.querySelector('.title')?.textContent, 'Hello');
            t.is(wrapper?.querySelector('a')?.href, 'http://localhost/page');
            t.is(wrapper?.querySelector('img')?.src, 'http://localhost/photo.png');
            t.is(wrapper?.querySelector('img')?.alt, 'photo');
            t.is(wrapper?.querySelector('script')?.src, 'http://localhost/app.js');
            t.is(wrapper?.querySelector('.footer')?.textContent, 'Bottom');
            const commentNodes = Array.from(document.querySelector('#container')?.childNodes ?? []).filter((n) => n.nodeType === 8);
            t.is(commentNodes.length, 0);
            myopie.set('title', 'World', false);
            myopie.set('alt', 'new photo', false);
            myopie.set('footer', 'Updated', false);
            myopie.render();
            t.is(wrapper?.querySelector('.title')?.textContent, 'World');
            t.is(wrapper?.querySelector('img')?.alt, 'new photo');
            t.is(wrapper?.querySelector('.footer')?.textContent, 'Updated');
        });
    }
}
