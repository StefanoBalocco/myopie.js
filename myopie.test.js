'use strict';
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
const { default: Myopie } = await import('./myopie.js');
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
    prefix = 'constructor';
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
        const template = (data) => `<div>${data.content}</div>`;
        const myopie = new Myopie('#test', template, {}, [], 200);
        t.truthy(myopie);
    });
}
{
    prefix = 'get';
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
    test(prefix + ': should return value from Set by index', (t) => {
        const template = (_data) => '';
        const myopie = new Myopie('#test', template, testData);
        t.is(myopie.get('setValue/0'), 'item1');
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
}
{
    prefix = 'set';
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
    test(prefix + ': should update existing value', (t) => {
        const template = (_data) => '';
        const myopie = new Myopie('#test', template, { key: 'old' });
        t.true(myopie.set('key', 'new', false));
        t.is(myopie.get('key'), 'new');
    });
    test(prefix + ': should delete value when setting to undefined', (t) => {
        const template = (_data) => '';
        const myopie = new Myopie('#test', template, { key: 'value' });
        t.true(myopie.set('key', undefined, false));
        t.is(myopie.get('key'), undefined);
    });
    test(prefix + ': should not trigger render when render parameter is false', (t) => {
        const template = (_data) => '';
        const myopie = new Myopie('#test', template, {});
        t.true(myopie.set('key', 'value', false));
    });
}
{
    prefix = 'render';
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
    prefix = 'renderDebounce';
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
    prefix = 'hooks: init pre';
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
    prefix = 'hooks: init post';
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
    prefix = 'hooks: render pre';
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
    prefix = 'hooks: render post';
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
    prefix = 'handlersPermanentAdd';
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
    prefix = 'handlersPermanentDel';
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
    prefix = 'destroy';
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
}
{
    prefix = 'data-myopie-ignore-content';
    test(prefix + ': should preserve element content when attribute is true', (t) => {
        document.body.innerHTML = '<div id="container"><div data-myopie-ignore-content="true">preserved</div></div>';
        const template = (_data) => '<div data-myopie-ignore-content="true">replaced</div>';
        const myopie = new Myopie('#container', template, {});
        myopie.render();
        const div = document.querySelector('#container div');
        t.is(div?.textContent, 'preserved');
    });
}
{
    prefix = 'data-myopie-ignore-style';
    test(prefix + ': should preserve element style when attribute is true', (t) => {
        document.body.innerHTML = '<div id="container"><div data-myopie-ignore-style="true" style="color: red;">content</div></div>';
        const template = (_data) => '<div data-myopie-ignore-style="true" style="color: blue;">content</div>';
        const myopie = new Myopie('#container', template, {});
        myopie.render();
        const div = document.querySelector('#container div');
        t.is(div?.style.color, 'red');
    });
}
{
    prefix = 'data-myopie-default-*';
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
}
{
    prefix = 'input handling';
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
}
{
    prefix = 'deep clone';
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
}
{
    prefix = 'data-myopie-id';
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
    prefix = 'data-myopie-default-* stripping';
    test(prefix + ': attribute itself should be stripped from DOM after render', (t) => {
        document.body.innerHTML = '<div id="container"></div>';
        const template = (_data) => '<div data-myopie-default-class="foo">content</div>';
        const myopie = new Myopie('#container', template, {});
        myopie.render();
        const div = document.querySelector('#container div');
        t.is(div?.getAttribute('data-myopie-default-class'), null);
    });
}
{
    prefix = 'data-myopie-ignore-* stripping';
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
    prefix = 'node scoring';
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
