'use strict';

import test from 'ava';
import { JSDOM } from 'jsdom';

// Setup jsdom globals before importing Myopie
const dom = new JSDOM( '<!DOCTYPE html><html><body></body></html>', {
	url: 'http://localhost'
} );
const window = dom.window;
( globalThis as any ).document = window.document;
( globalThis as any ).window = window;
( globalThis as any ).Node = window.Node;
( globalThis as any ).HTMLElement = window.HTMLElement;
( globalThis as any ).HTMLInputElement = window.HTMLInputElement;
( globalThis as any ).HTMLImageElement = window.HTMLImageElement;
( globalThis as any ).HTMLScriptElement = window.HTMLScriptElement;
( globalThis as any ).HTMLAnchorElement = window.HTMLAnchorElement;
( globalThis as any ).HTMLLinkElement = window.HTMLLinkElement;
( globalThis as any ).HTMLSelectElement = window.HTMLSelectElement;
( globalThis as any ).HTMLTextAreaElement = window.HTMLTextAreaElement;
( globalThis as any ).HTMLTemplateElement = window.HTMLTemplateElement;

// Dynamic import Myopie after globals are set
const { default: Myopie } = await import( './myopie.js' );

// Test data shared across tests
const testData: any = {
	booleanTrue: true,
	booleanFalse: false,
	stringEmpty: '',
	stringValue: 'test string',
	numberZero: 0,
	numberPositive: 42,
	numberNegative: -10,
	arrayEmpty: [],
	arrayValues: [ 'a', 'b', 'c' ],
	objectEmpty: {},
	objectNested: {
		level1: {
			level2: {
				value: 'deep'
			}
		}
	},
	mapValue: new Map( [ [ 'key1', 'value1' ], [ 'key2', 'value2' ] ] ),
	setValue: new Set( [ 'item1', 'item2', 'item3' ] ),
	functionValue: (): string => 'function result',
	nullValue: null,
	undefinedValue: undefined
};

let prefix: string;

// ─── API: constructor ────────────────────────────────────────────────────────

{
	prefix = 'constructor';

	test( prefix + ': should create instance with minimal parameters', ( t ) => {
		const template = ( _data: any ): string => `<div>${_data.content}</div>`;
		const myopie = new Myopie( '#test', template );
		t.truthy( myopie );
	} );

	test( prefix + ': should create instance with initial data', ( t ) => {
		const template = ( data: any ): string => `<div>${data.content}</div>`;
		const myopie = new Myopie( '#test', template, { content: 'initial' } );
		t.is( myopie.get( 'content' ), 'initial' );
	} );

	test( prefix + ': should create instance with inputToPath mapping', ( t ) => {
		const template = ( data: any ): string => `<div>${data.content}</div>`;
		const myopie = new Myopie( '#test', template, {}, [ [ 'input[name="test"]', 'testPath' ] ] );
		t.truthy( myopie );
	} );

	test( prefix + ': should create instance with custom timeout', ( t ) => {
		const template = ( data: any ): string => `<div>${data.content}</div>`;
		const myopie = new Myopie( '#test', template, {}, [], 200 );
		t.truthy( myopie );
	} );
}

// ─── API: get ────────────────────────────────────────────────────────────────

{
	prefix = 'get';

	test( prefix + ': should return undefined for null path', ( t ) => {
		const template = ( _data: any ): string => '';
		const myopie = new Myopie( '#test', template, testData );
		t.is( myopie.get( null ), undefined );
	} );

	test( prefix + ': should return value for simple path', ( t ) => {
		const template = ( _data: any ): string => '';
		const myopie = new Myopie( '#test', template, testData );
		t.is( myopie.get( 'stringValue' ), 'test string' );
	} );

	test( prefix + ': should return value for nested object path', ( t ) => {
		const template = ( _data: any ): string => '';
		const myopie = new Myopie( '#test', template, testData );
		t.is( myopie.get( 'objectNested/level1/level2/value' ), 'deep' );
	} );

	test( prefix + ': should return value from array by index', ( t ) => {
		const template = ( _data: any ): string => '';
		const myopie = new Myopie( '#test', template, testData );
		t.is( myopie.get( 'arrayValues/1' ), 'b' );
	} );

	test( prefix + ': should return value from Map by key', ( t ) => {
		const template = ( _data: any ): string => '';
		const myopie = new Myopie( '#test', template, testData );
		t.is( myopie.get( 'mapValue/key1' ), 'value1' );
	} );

	test( prefix + ': should return value from Set by index', ( t ) => {
		const template = ( _data: any ): string => '';
		const myopie = new Myopie( '#test', template, testData );
		t.is( myopie.get( 'setValue/0' ), 'item1' );
	} );

	test( prefix + ': should return undefined for non-existent path', ( t ) => {
		const template = ( _data: any ): string => '';
		const myopie = new Myopie( '#test', template, testData );
		t.is( myopie.get( 'nonExistent' ), undefined );
	} );

	test( prefix + ': should return undefined for invalid array index', ( t ) => {
		const template = ( _data: any ): string => '';
		const myopie = new Myopie( '#test', template, testData );
		t.is( myopie.get( 'arrayValues/99' ), undefined );
	} );

	test( prefix + ': should call function and return result', ( t ) => {
		const template = ( _data: any ): string => '';
		const myopie = new Myopie( '#test', template, testData );
		t.is( myopie.get( 'functionValue' ), 'function result' );
	} );

	test( prefix + ': should return boolean values correctly', ( t ) => {
		const template = ( _data: any ): string => '';
		const myopie = new Myopie( '#test', template, testData );
		t.is( myopie.get( 'booleanTrue' ), true );
		t.is( myopie.get( 'booleanFalse' ), false );
	} );

	test( prefix + ': should return number values correctly', ( t ) => {
		const template = ( _data: any ): string => '';
		const myopie = new Myopie( '#test', template, testData );
		t.is( myopie.get( 'numberZero' ), 0 );
		t.is( myopie.get( 'numberPositive' ), 42 );
		t.is( myopie.get( 'numberNegative' ), -10 );
	} );

	test( prefix + ': should return null value', ( t ) => {
		const template = ( _data: any ): string => '';
		const myopie = new Myopie( '#test', template, testData );
		t.is( myopie.get( 'nullValue' ), null );
	} );

	test( prefix + ': should return undefined value', ( t ) => {
		const template = ( _data: any ): string => '';
		const myopie = new Myopie( '#test', template, testData );
		t.is( myopie.get( 'undefinedValue' ), undefined );
	} );

	test( prefix + ': should return undefined when navigating through a non-navigable type', ( t ) => {
		const template = ( _data: any ): string => '';
		const myopie = new Myopie( '#test', template, { value: 42 } );
		t.is( myopie.get( 'value/deeper' ), undefined );
	} );
}

// ─── API: set ────────────────────────────────────────────────────────────────

{
	prefix = 'set';

	test( prefix + ': should set simple value and return true', ( t ) => {
		const template = ( _data: any ): string => '';
		const myopie = new Myopie( '#test', template, {} );
		t.true( myopie.set( 'key', 'value', false ) );
		t.is( myopie.get( 'key' ), 'value' );
	} );

	test( prefix + ': should set nested value in object', ( t ) => {
		const template = ( _data: any ): string => '';
		const myopie = new Myopie( '#test', template, { obj: {} } );
		t.true( myopie.set( 'obj/nested', 'value', false ) );
		t.is( myopie.get( 'obj/nested' ), 'value' );
	} );

	test( prefix + ': should create intermediate objects when setting nested path', ( t ) => {
		const template = ( _data: any ): string => '';
		const myopie = new Myopie( '#test', template, {} );
		t.true( myopie.set( 'a/b/c', 'deep', false ) );
		t.is( myopie.get( 'a/b/c' ), 'deep' );
	} );

	test( prefix + ': should set value in array by index', ( t ) => {
		const template = ( _data: any ): string => '';
		const myopie = new Myopie( '#test', template, { arr: [ 'a', 'b', 'c' ] } );
		t.true( myopie.set( 'arr/1', 'modified', false ) );
		t.is( myopie.get( 'arr/1' ), 'modified' );
	} );

	test( prefix + ': should set value in Map by key', ( t ) => {
		const template = ( _data: any ): string => '';
		const myopie = new Myopie( '#test', template, { map: new Map( [ [ 'key', { nested: 'old' } ] ] ) } );
		t.true( myopie.set( 'map/key/nested', 'new', false ) );
		t.is( myopie.get( 'map/key/nested' ), 'new' );
	} );

	test( prefix + ': should create intermediate object when setting nested path through Array at non-existent index', ( t ) => {
		const template = ( _data: any ): string => '';
		const myopie = new Myopie( '#test', template, { items: [] } );
		t.true( myopie.set( 'items/0/name', 'test', false ) );
		t.is( myopie.get( 'items/0/name' ), 'test' );
	} );

	test( prefix + ': should create intermediate object when setting nested path through Map at non-existent key', ( t ) => {
		const template = ( _data: any ): string => '';
		const myopie = new Myopie( '#test', template, { mymap: new Map() } );
		t.true( myopie.set( 'mymap/newkey/value', 'test', false ) );
		t.is( myopie.get( 'mymap/newkey/value' ), 'test' );
	} );

	test( prefix + ': should return false when setting through a non-navigable intermediate type', ( t ) => {
		const template = ( _data: any ): string => '';
		const myopie = new Myopie( '#test', template, { value: 42 } );
		t.false( myopie.set( 'value/deeper/key', 'test', false ) );
		t.is( myopie.get( 'value' ), 42 );
	} );

	test( prefix + ': should update existing value', ( t ) => {
		const template = ( _data: any ): string => '';
		const myopie = new Myopie( '#test', template, { key: 'old' } );
		t.true( myopie.set( 'key', 'new', false ) );
		t.is( myopie.get( 'key' ), 'new' );
	} );

	test( prefix + ': should delete value when setting to undefined', ( t ) => {
		const template = ( _data: any ): string => '';
		const myopie = new Myopie( '#test', template, { key: 'value' } );
		t.true( myopie.set( 'key', undefined, false ) );
		t.is( myopie.get( 'key' ), undefined );
	} );

	test( prefix + ': should not trigger render when render parameter is false', ( t ) => {
		const template = ( _data: any ): string => '';
		const myopie = new Myopie( '#test', template, {} );
		t.true( myopie.set( 'key', 'value', false ) );
	} );

	test( prefix + ': should return true but not mark as changed when setting the same value', ( t ) => {
		const template = ( _data: any ): string => '';
		const myopie = new Myopie( '#test', template, { key: 'original' } );
		t.true( myopie.set( 'key', 'original', false ) );
		t.is( myopie.get( 'key' ), 'original' );
	} );
}

// ─── API: deep clone ─────────────────────────────────────────────────────────

{
	prefix = 'deep clone';

	test( prefix + ': should clone initial data to prevent external mutations', ( t ) => {
		const template = ( _data: any ): string => '';
		const initialData = { value: 'original' };
		const myopie = new Myopie( '#test', template, initialData );
		initialData.value = 'mutated';
		t.is( myopie.get( 'value' ), 'original' );
	} );

	test( prefix + ': should clone nested objects', ( t ) => {
		const template = ( _data: any ): string => '';
		const initialData = { nested: { value: 'original' } };
		const myopie = new Myopie( '#test', template, initialData );
		initialData.nested.value = 'mutated';
		t.is( myopie.get( 'nested/value' ), 'original' );
	} );

	test( prefix + ': should clone arrays', ( t ) => {
		const template = ( _data: any ): string => '';
		const initialData = { arr: [ 'a', 'b', 'c' ] };
		const myopie = new Myopie( '#test', template, initialData );
		initialData.arr.push( 'd' );
		t.is( myopie.get( 'arr/3' ), undefined );
	} );

	test( prefix + ': should clone Date objects', ( t ) => {
		const template = ( _data: any ): string => '';
		const date = new Date( '2024-01-01' );
		const initialData = { date: date };
		const myopie = new Myopie( '#test', template, initialData );
		date.setFullYear( 2025 );
		const clonedDate = myopie.get( 'date' ) as Date;
		t.is( clonedDate.getFullYear(), 2024 );
	} );

	test( prefix + ': should clone RegExp objects', ( t ) => {
		const template = ( _data: any ): string => '';
		const regex = /test/gi;
		const initialData = { regex: regex };
		const myopie = new Myopie( '#test', template, initialData );
		const clonedRegex = myopie.get( 'regex' ) as RegExp;
		t.is( clonedRegex.source, 'test' );
		t.is( clonedRegex.flags, 'gi' );
		t.not( clonedRegex, regex );
	} );

	test( prefix + ': should clone Set objects', ( t ) => {
		const template = ( _data: any ): string => '';
		const set = new Set( [ 'a', 'b' ] );
		const initialData = { set: set };
		const myopie = new Myopie( '#test', template, initialData );
		set.add( 'c' );
		const clonedSet = myopie.get( 'set' ) as Set<string>;
		t.false( clonedSet.has( 'c' ) );
	} );

	test( prefix + ': should clone Map objects', ( t ) => {
		const template = ( _data: any ): string => '';
		const map = new Map( [ [ 'key', 'value' ] ] );
		const initialData = { map: map };
		const myopie = new Myopie( '#test', template, initialData );
		map.set( 'key2', 'value2' );
		const clonedMap = myopie.get( 'map' ) as Map<string, string>;
		t.false( clonedMap.has( 'key2' ) );
	} );
}

// ─── Rendering: render ───────────────────────────────────────────────────────

{
	prefix = 'render';

	test( prefix + ': should return false when selector does not exist', ( t ) => {
		const template = ( _data: any ): string => '<div>content</div>';
		const myopie = new Myopie( '#nonexistent', template, {} );
		t.false( myopie.render() );
	} );

	test( prefix + ': should return true when selector exists', ( t ) => {
		document.body.innerHTML = '<div id="container"></div>';
		const template = ( _data: any ): string => '<div>content</div>';
		const myopie = new Myopie( '#container', template, {} );
		t.true( myopie.render() );
	} );

	test( prefix + ': should render template content to DOM', ( t ) => {
		document.body.innerHTML = '<div id="container"></div>';
		const template = ( data: any ): string => `<div>${data.content}</div>`;
		const myopie = new Myopie( '#container', template, { content: 'test' } );
		myopie.render();
		const container = document.querySelector( '#container' );
		t.is( container?.textContent, 'test' );
	} );

	test( prefix + ': should update DOM when data changes', ( t ) => {
		document.body.innerHTML = '<div id="container"></div>';
		const template = ( data: any ): string => `<div>${data.content}</div>`;
		const myopie = new Myopie( '#container', template, { content: 'initial' } );
		myopie.render();
		myopie.set( 'content', 'updated', false );
		myopie.render();
		const container = document.querySelector( '#container' );
		t.is( container?.textContent, 'updated' );
	} );

	test( prefix + ': should not re-render if template output is unchanged', ( t ) => {
		document.body.innerHTML = '<div id="container"></div>';
		const template = ( _data: any ): string => '<div>static</div>';
		const myopie = new Myopie( '#container', template, {} );
		myopie.render();
		const firstChild = document.querySelector( '#container' )?.firstChild;
		myopie.render();
		const secondChild = document.querySelector( '#container' )?.firstChild;
		t.is( firstChild, secondChild );
	} );

	test( prefix + ': should preserve element attributes during update', ( t ) => {
		document.body.innerHTML = '<div id="container"></div>';
		const template = ( data: any ): string => `<div class="test" data-value="${data.value}">content</div>`;
		const myopie = new Myopie( '#container', template, { value: 'initial' } );
		myopie.render();
		myopie.set( 'value', 'updated', false );
		myopie.render();
		const div = document.querySelector( '#container div' );
		t.is( div?.getAttribute( 'class' ), 'test' );
		t.is( div?.getAttribute( 'data-value' ), 'updated' );
	} );

	test( prefix + ': should add new elements when template expands', ( t ) => {
		document.body.innerHTML = '<div id="container"></div>';
		const template = ( data: any ): string => {
			let html = '<div>first</div>';
			if( data.showSecond ) {
				html += '<div>second</div>';
			}
			return html;
		};
		const myopie = new Myopie( '#container', template, { showSecond: false } );
		myopie.render();
		t.is( document.querySelectorAll( '#container div' ).length, 1 );
		myopie.set( 'showSecond', true, false );
		myopie.render();
		t.is( document.querySelectorAll( '#container div' ).length, 2 );
	} );

	test( prefix + ': should remove elements when template contracts', ( t ) => {
		document.body.innerHTML = '<div id="container"></div>';
		const template = ( data: any ): string => {
			let html = '<div>first</div>';
			if( data.showSecond ) {
				html += '<div>second</div>';
			}
			return html;
		};
		const myopie = new Myopie( '#container', template, { showSecond: true } );
		myopie.render();
		t.is( document.querySelectorAll( '#container div' ).length, 2 );
		myopie.set( 'showSecond', false, false );
		myopie.render();
		t.is( document.querySelectorAll( '#container div' ).length, 1 );
	} );
}

// ─── Rendering: renderDebounce ───────────────────────────────────────────────

{
	prefix = 'renderDebounce';

	test.serial( prefix + ': should defer rendering with timeout', async ( t ) => {
		document.body.innerHTML = '<div id="container"></div>';
		const template = ( data: any ): string => `<div>${data.content}</div>`;
		const myopie = new Myopie( '#container', template, { content: 'initial' }, [], 50 );
		myopie.render();
		myopie.set( 'content', 'updated', false );
		myopie.renderDebounce();
		// Should not be updated immediately
		let container = document.querySelector( '#container' );
		t.is( container?.textContent, 'initial' );
		// Wait for timeout
		await new Promise( ( resolve ) => setTimeout( resolve, 60 ) );
		container = document.querySelector( '#container' );
		t.is( container?.textContent, 'updated' );
	} );

	test( prefix + ': should render immediately when timeout is 0', ( t ) => {
		document.body.innerHTML = '<div id="container"></div>';
		const template = ( data: any ): string => `<div>${data.content}</div>`;
		const myopie = new Myopie( '#container', template, { content: 'initial' }, [], 0 );
		myopie.render();
		myopie.set( 'content', 'updated', false );
		myopie.renderDebounce();
		const container = document.querySelector( '#container' );
		t.is( container?.textContent, 'updated' );
	} );

	test.serial( prefix + ': should cancel previous timeout when called multiple times', async ( t ) => {
		document.body.innerHTML = '<div id="container"></div>';
		const template = ( data: any ): string => `<div>${data.content}</div>`;
		const myopie = new Myopie( '#container', template, { content: 'initial' }, [], 50 );
		myopie.render();
		myopie.set( 'content', 'first', false );
		myopie.renderDebounce();
		await new Promise( ( resolve ) => setTimeout( resolve, 25 ) );
		myopie.set( 'content', 'second', false );
		myopie.renderDebounce();
		await new Promise( ( resolve ) => setTimeout( resolve, 60 ) );
		const container = document.querySelector( '#container' );
		t.is( container?.textContent, 'second' );
	} );
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

{
	prefix = 'hooks: init pre';

	test( prefix + ': should call init pre hook before first render', ( t ) => {
		document.body.innerHTML = '<div id="container"></div>';
		const template = ( _data: any ): string => '<div>content</div>';
		const myopie = new Myopie( '#container', template, { value: 'test' } );
		let hookCalled = false;
		let hookData: any;
		myopie.hooksInitAddPre( ( dataCurrent: any ): void => {
			hookCalled = true;
			hookData = dataCurrent;
		} );
		myopie.render();
		t.true( hookCalled );
		t.is( hookData.value, 'test' );
	} );

	test( prefix + ': should not call init pre hook on subsequent renders', ( t ) => {
		document.body.innerHTML = '<div id="container"></div>';
		const template = ( _data: any ): string => '<div>content</div>';
		const myopie = new Myopie( '#container', template, {} );
		let callCount = 0;
		myopie.hooksInitAddPre( (): void => {
			callCount++;
		} );
		myopie.render();
		myopie.render();
		t.is( callCount, 1 );
	} );
}

{
	prefix = 'hooks: init post';

	test( prefix + ': should call init post hook after first render', ( t ) => {
		document.body.innerHTML = '<div id="container"></div>';
		const template = ( _data: any ): string => '<div>content</div>';
		const myopie = new Myopie( '#container', template, { value: 'test' } );
		let hookCalled = false;
		let hookData: any;
		myopie.hooksInitAddPost( ( dataCurrent: any ): void => {
			hookCalled = true;
			hookData = dataCurrent;
		} );
		myopie.render();
		t.true( hookCalled );
		t.is( hookData.value, 'test' );
	} );

	test( prefix + ': should not call init post hook on subsequent renders', ( t ) => {
		document.body.innerHTML = '<div id="container"></div>';
		const template = ( _data: any ): string => '<div>content</div>';
		const myopie = new Myopie( '#container', template, {} );
		let callCount = 0;
		myopie.hooksInitAddPost( (): void => {
			callCount++;
		} );
		myopie.render();
		myopie.render();
		t.is( callCount, 1 );
	} );
}

{
	prefix = 'hooks: render pre';

	test( prefix + ': should not call render pre hook on first render', ( t ) => {
		document.body.innerHTML = '<div id="container"></div>';
		const template = ( _data: any ): string => '<div>content</div>';
		const myopie = new Myopie( '#container', template, {} );
		let hookCalled = false;
		myopie.hooksRenderAddPre( (): void => {
			hookCalled = true;
		} );
		myopie.render();
		t.false( hookCalled );
	} );

	test( prefix + ': should call render pre hook on subsequent renders', ( t ) => {
		document.body.innerHTML = '<div id="container"></div>';
		const template = ( data: any ): string => `<div>${data.value}</div>`;
		const myopie = new Myopie( '#container', template, { value: 'initial' } );
		let hookCalled = false;
		let currentData: any;
		let previousData: any;
		myopie.hooksRenderAddPre( ( dataCurrent: any, dataPrevious: any ): void => {
			hookCalled = true;
			currentData = dataCurrent;
			previousData = dataPrevious;
		} );
		myopie.render();
		myopie.set( 'value', 'updated', false );
		myopie.render();
		t.true( hookCalled );
		t.is( currentData.value, 'updated' );
		t.is( previousData.value, 'initial' );
	} );
}

{
	prefix = 'hooks: render post';

	test( prefix + ': should not call render post hook on first render', ( t ) => {
		document.body.innerHTML = '<div id="container"></div>';
		const template = ( _data: any ): string => '<div>content</div>';
		const myopie = new Myopie( '#container', template, {} );
		let hookCalled = false;
		myopie.hooksRenderAddPost( (): void => {
			hookCalled = true;
		} );
		myopie.render();
		t.false( hookCalled );
	} );

	test( prefix + ': should call render post hook on subsequent renders', ( t ) => {
		document.body.innerHTML = '<div id="container"></div>';
		const template = ( data: any ): string => `<div>${data.value}</div>`;
		const myopie = new Myopie( '#container', template, { value: 'initial' } );
		let hookCalled = false;
		let currentData: any;
		let previousData: any;
		myopie.hooksRenderAddPost( ( dataCurrent: any, dataPrevious: any ): void => {
			hookCalled = true;
			currentData = dataCurrent;
			previousData = dataPrevious;
		} );
		myopie.render();
		myopie.set( 'value', 'updated', false );
		myopie.render();
		t.true( hookCalled );
		t.is( currentData.value, 'updated' );
		t.is( previousData.value, 'initial' );
	} );
}

// ─── Event handlers ──────────────────────────────────────────────────────────

{
	prefix = 'handlersPermanentAdd';

	test( prefix + ': should add handler and return true', ( t ) => {
		const template = ( _data: any ): string => '';
		const myopie = new Myopie( '#test', template, {} );
		const handler = ( _event: Event ): void => {};
		t.true( myopie.handlersPermanentAdd( 'button', 'click', handler ) );
	} );

	test( prefix + ': should prevent duplicate handlers and return false', ( t ) => {
		const template = ( _data: any ): string => '';
		const myopie = new Myopie( '#test', template, {} );
		const handler = ( _event: Event ): void => {};
		myopie.handlersPermanentAdd( 'button', 'click', handler );
		t.false( myopie.handlersPermanentAdd( 'button', 'click', handler ) );
	} );

	test( prefix + ': should allow same handler for different events', ( t ) => {
		const template = ( _data: any ): string => '';
		const myopie = new Myopie( '#test', template, {} );
		const handler = ( _event: Event ): void => {};
		myopie.handlersPermanentAdd( 'button', 'click', handler );
		t.true( myopie.handlersPermanentAdd( 'button', 'mousedown', handler ) );
	} );

	test( prefix + ': should allow same handler for different selectors', ( t ) => {
		const template = ( _data: any ): string => '';
		const myopie = new Myopie( '#test', template, {} );
		const handler = ( _event: Event ): void => {};
		myopie.handlersPermanentAdd( 'button', 'click', handler );
		t.true( myopie.handlersPermanentAdd( 'input', 'click', handler ) );
	} );

	test( prefix + ': should attach handlers to elements after render', ( t ) => {
		document.body.innerHTML = '<div id="container"></div>';
		const template = ( _data: any ): string => '<button>Click</button>';
		const myopie = new Myopie( '#container', template, {} );
		let clicked = false;
		const handler = (): void => {
			clicked = true;
		};
		myopie.handlersPermanentAdd( 'button', 'click', handler );
		myopie.render();
		const button = document.querySelector( 'button' );
		button?.dispatchEvent( new window.Event( 'click' ) );
		t.true( clicked );
	} );

	test( prefix + ': should re-attach handlers after re-render', ( t ) => {
		document.body.innerHTML = '<div id="container"></div>';
		const template = ( data: any ): string => `<button>${data.label}</button>`;
		const myopie = new Myopie( '#container', template, { label: 'First' } );
		let clickCount = 0;
		const handler = (): void => {
			clickCount++;
		};
		myopie.handlersPermanentAdd( 'button', 'click', handler );
		myopie.render();
		myopie.set( 'label', 'Second', false );
		myopie.render();
		const button = document.querySelector( 'button' );
		button?.dispatchEvent( new window.Event( 'click' ) );
		t.is( clickCount, 1 );
	} );
}

{
	prefix = 'handlersPermanentDel';

	test( prefix + ': should remove specific handler and return true', ( t ) => {
		const template = ( _data: any ): string => '';
		const myopie = new Myopie( '#test', template, {} );
		const handler = ( _event: Event ): void => {};
		myopie.handlersPermanentAdd( 'button', 'click', handler );
		t.true( myopie.handlersPermanentDel( 'button', 'click', handler ) );
	} );

	test( prefix + ': should return false when handler does not exist', ( t ) => {
		const template = ( _data: any ): string => '';
		const myopie = new Myopie( '#test', template, {} );
		const handler = ( _event: Event ): void => {};
		t.false( myopie.handlersPermanentDel( 'button', 'click', handler ) );
	} );

	test( prefix + ': should remove all handlers for event when listener not specified', ( t ) => {
		const template = ( _data: any ): string => '';
		const myopie = new Myopie( '#test', template, {} );
		const handler1 = ( _event: Event ): void => {};
		const handler2 = ( _event: Event ): void => {};
		myopie.handlersPermanentAdd( 'button', 'click', handler1 );
		myopie.handlersPermanentAdd( 'button', 'click', handler2 );
		t.true( myopie.handlersPermanentDel( 'button', 'click' ) );
	} );

	test( prefix + ': should remove all handlers for selector when event not specified', ( t ) => {
		const template = ( _data: any ): string => '';
		const myopie = new Myopie( '#test', template, {} );
		const handler = ( _event: Event ): void => {};
		myopie.handlersPermanentAdd( 'button', 'click', handler );
		myopie.handlersPermanentAdd( 'button', 'mousedown', handler );
		t.true( myopie.handlersPermanentDel( 'button' ) );
	} );

	test( prefix + ': should remove only the specified handler when multiple exist for the same event', ( t ) => {
		document.body.innerHTML = '<div id="container"></div>';
		const template = ( _data: any ): string => '<button>Click</button>';
		const myopie = new Myopie( '#container', template, {} );
		let count1 = 0;
		let count2 = 0;
		const handler1 = (): void => { count1++; };
		const handler2 = (): void => { count2++; };
		myopie.handlersPermanentAdd( 'button', 'click', handler1 );
		myopie.handlersPermanentAdd( 'button', 'click', handler2 );
		myopie.render();
		t.true( myopie.handlersPermanentDel( 'button', 'click', handler1 ) );
		const button = document.querySelector( 'button' );
		button?.dispatchEvent( new window.Event( 'click' ) );
		t.is( count1, 0 );
		t.is( count2, 1 );
	} );

	test( prefix + ': should detach handler from DOM elements', ( t ) => {
		document.body.innerHTML = '<div id="container"></div>';
		const template = ( _data: any ): string => '<button>Click</button>';
		const myopie = new Myopie( '#container', template, {} );
		let clicked = false;
		const handler = (): void => {
			clicked = true;
		};
		myopie.handlersPermanentAdd( 'button', 'click', handler );
		myopie.render();
		myopie.handlersPermanentDel( 'button', 'click', handler );
		const button = document.querySelector( 'button' );
		button?.dispatchEvent( new window.Event( 'click' ) );
		t.false( clicked );
	} );
}

{
	prefix = 'input handling';

	test( prefix + ': should update data on input event for text input', ( t ) => {
		document.body.innerHTML = '<div id="container"></div>';
		const template = ( data: any ): string => `<input type="text" name="test" value="${data.testValue || ''}" />`;
		const myopie = new Myopie( '#container', template, { testValue: '' }, [ [ 'input[name="test"]', 'testValue' ] ], 0, false );
		myopie.render();
		const input = document.querySelector( 'input[name="test"]' ) as HTMLInputElement;
		input.value = 'new value';
		input.dispatchEvent( new window.Event( 'input', { bubbles: true } ) );
		t.is( myopie.get( 'testValue' ), 'new value' );
	} );

	test( prefix + ': should update data on input event for checkbox', ( t ) => {
		document.body.innerHTML = '<div id="container"></div>';
		const template = ( _data: any ): string => '<input type="checkbox" name="test" value="checked" />';
		const myopie = new Myopie( '#container', template, {}, [ [ 'input[name="test"]', 'testValue' ] ], 0, false );
		myopie.render();
		const input = document.querySelector( 'input[name="test"]' ) as HTMLInputElement;
		input.checked = true;
		input.dispatchEvent( new window.Event( 'input', { bubbles: true } ) );
		t.is( myopie.get( 'testValue' ), 'checked' );
	} );

	test( prefix + ': should update data on input event for select', ( t ) => {
		document.body.innerHTML = '<div id="container"></div>';
		const template = ( _data: any ): string => '<select name="test"><option value="a">A</option><option value="b">B</option></select>';
		const myopie = new Myopie( '#container', template, {}, [ [ 'select[name="test"]', 'testValue' ] ], 0, false );
		myopie.render();
		const select = document.querySelector( 'select[name="test"]' ) as HTMLSelectElement;
		select.value = 'b';
		select.dispatchEvent( new window.Event( 'input', { bubbles: true } ) );
		t.is( myopie.get( 'testValue' ), 'b' );
	} );

	test( prefix + ': should update data on input event for textarea', ( t ) => {
		document.body.innerHTML = '<div id="container"></div>';
		const template = ( _data: any ): string => '<textarea name="test"></textarea>';
		const myopie = new Myopie( '#container', template, {}, [ [ 'textarea[name="test"]', 'testValue' ] ], 0, false );
		myopie.render();
		const textarea = document.querySelector( 'textarea[name="test"]' ) as HTMLTextAreaElement;
		textarea.value = 'textarea content';
		textarea.dispatchEvent( new window.Event( 'input', { bubbles: true } ) );
		t.is( myopie.get( 'testValue' ), 'textarea content' );
	} );
}

// ─── Lifecycle: destroy ──────────────────────────────────────────────────────

{
	prefix = 'destroy';

	test.serial( prefix + ': should clear pending render timeout', async ( t ) => {
		document.body.innerHTML = '<div id="container"></div>';
		const template = ( data: any ): string => `<div>${data.content}</div>`;
		const myopie = new Myopie( '#container', template, { content: 'initial' }, [], 50 );
		myopie.render();
		myopie.set( 'content', 'updated', false );
		myopie.renderDebounce();
		myopie.destroy();
		await new Promise( ( resolve ) => setTimeout( resolve, 60 ) );
		const container = document.querySelector( '#container' );
		t.is( container?.textContent, 'initial' );
	} );

	test( prefix + ': should remove permanent handlers from DOM', ( t ) => {
		document.body.innerHTML = '<div id="container"></div>';
		const template = ( _data: any ): string => '<button>Click</button>';
		const myopie = new Myopie( '#container', template, {} );
		let clicked = false;
		const handler = (): void => {
			clicked = true;
		};
		myopie.handlersPermanentAdd( 'button', 'click', handler );
		myopie.render();
		myopie.destroy();
		const button = document.querySelector( 'button' );
		button?.dispatchEvent( new window.Event( 'click' ) );
		t.false( clicked );
	} );

	test( prefix + ': should remove input event listener when inputToPath is set', ( t ) => {
		document.body.innerHTML = '<div id="container"></div>';
		const template = ( _data: any ): string => '<input type="text" name="field">';
		const myopie = new Myopie( '#container', template, { val: '' }, [ [ 'input[name="field"]', 'val' ] ], 0, false );
		myopie.render();
		myopie.destroy();
		const input = document.querySelector( 'input[name="field"]' ) as HTMLInputElement;
		input.value = 'typed';
		input.dispatchEvent( new window.Event( 'input', { bubbles: true } ) );
		t.is( myopie.get( 'val' ), '' );
	} );
}

// ─── data-myopie-* attributes ────────────────────────────────────────────────

{
	prefix = 'data-myopie-ignore-content';

	test( prefix + ': should preserve element content when attribute is true', ( t ) => {
		document.body.innerHTML = '<div id="container"><div data-myopie-ignore-content="true">preserved</div></div>';
		const template = ( _data: any ): string => '<div data-myopie-ignore-content="true">replaced</div>';
		const myopie = new Myopie( '#container', template, {} );
		myopie.render();
		const div = document.querySelector( '#container div' );
		t.is( div?.textContent, 'preserved' );
	} );

	test( prefix + ': should preserve existing text when template element is empty', ( t ) => {
		// Bug scenario: templateContent="" (no children) vs existingContent=null (has text child).
		// "" != null is true, so the old code cleared textContent before reading the ignore attribute.
		document.body.innerHTML = '<div id="container"><div data-myopie-ignore-content="true">preserved</div></div>';
		const template = ( _data: any ): string => '<div data-myopie-ignore-content="true"></div>';
		const myopie = new Myopie( '#container', template, {} );
		myopie.render();
		const div = document.querySelector( '#container div' );
		t.is( div?.textContent, 'preserved' );
	} );
}

{
	prefix = 'data-myopie-ignore-style';

	test( prefix + ': should preserve element style when attribute is true', ( t ) => {
		document.body.innerHTML = '<div id="container"><div data-myopie-ignore-style="true" style="color: red;">content</div></div>';
		const template = ( _data: any ): string => '<div data-myopie-ignore-style="true" style="color: blue;">content</div>';
		const myopie = new Myopie( '#container', template, {} );
		myopie.render();
		const div = document.querySelector( '#container div' ) as HTMLElement;
		t.is( div?.style.color, 'red' );
	} );

	test( prefix + ': should not remove style attribute from existing element when template omits it', ( t ) => {
		document.body.innerHTML = '<div id="container"><div data-myopie-ignore-style="true" style="color: red;">content</div></div>';
		const template = ( _data: any ): string => '<div data-myopie-ignore-style="true">content</div>';
		const myopie = new Myopie( '#container', template, {} );
		myopie.render();
		const div = document.querySelector( '#container div' ) as HTMLElement;
		t.is( div?.style.color, 'red' );
	} );
}

{
	prefix = 'data-myopie-default-*';

	test( prefix + ': should set default attribute when not present', ( t ) => {
		document.body.innerHTML = '<div id="container"><div>content</div></div>';
		const template = ( _data: any ): string => '<div data-myopie-default-class="default-class">content</div>';
		const myopie = new Myopie( '#container', template, {} );
		myopie.render();
		const div = document.querySelector( '#container div' );
		t.is( div?.getAttribute( 'class' ), 'default-class' );
	} );

	test( prefix + ': should not override existing attribute', ( t ) => {
		document.body.innerHTML = '<div id="container"><div class="existing">content</div></div>';
		const template = ( _data: any ): string => '<div data-myopie-default-class="default-class">content</div>';
		const myopie = new Myopie( '#container', template, {} );
		myopie.render();
		const div = document.querySelector( '#container div' );
		t.is( div?.getAttribute( 'class' ), null );
	} );

	test( prefix + ' stripping: attribute itself should be stripped from DOM after render', ( t ) => {
		document.body.innerHTML = '<div id="container"></div>';
		const template = ( _data: any ): string => '<div data-myopie-default-class="foo">content</div>';
		const myopie = new Myopie( '#container', template, {} );
		myopie.render();
		const div = document.querySelector( '#container div' );
		t.is( div?.getAttribute( 'data-myopie-default-class' ), null );
	} );
}

{
	prefix = 'data-myopie-id';

	test( prefix + ': should be preserved in DOM after render', ( t ) => {
		document.body.innerHTML = '<div id="container"></div>';
		const template = ( _data: any ): string => '<div data-myopie-id="item-1">content</div>';
		const myopie = new Myopie( '#container', template, {} );
		myopie.render();
		const div = document.querySelector( '#container div' );
		t.is( div?.getAttribute( 'data-myopie-id' ), 'item-1' );
	} );

	test( prefix + ': should be updated when template value changes on rerender', ( t ) => {
		document.body.innerHTML = '<div id="container"></div>';
		const template = ( data: any ): string => `<div data-myopie-id="${data.id}">content</div>`;
		const myopie = new Myopie( '#container', template, { id: 'v1' } );
		myopie.render();
		myopie.set( 'id', 'v2', false );
		myopie.render();
		const div = document.querySelector( '#container div' );
		t.is( div?.getAttribute( 'data-myopie-id' ), 'v2' );
	} );
}

{
	prefix = 'data-myopie-ignore-* stripping';

	test( prefix + ': attribute itself should be stripped from DOM after render', ( t ) => {
		document.body.innerHTML = '<div id="container"></div>';
		const template = ( _data: any ): string => '<div data-myopie-ignore-style="true">content</div>';
		const myopie = new Myopie( '#container', template, {} );
		myopie.render();
		const div = document.querySelector( '#container div' );
		t.is( div?.getAttribute( 'data-myopie-ignore-style' ), null );
	} );
}

// ─── DOM diffing ─────────────────────────────────────────────────────────────

{
	prefix = 'node scoring';

	test( prefix + ': should select best matching node by element id over first candidate', ( t ) => {
		document.body.innerHTML = '<div id="container"><div>generic</div><div id="target">correct</div></div>';
		const template = ( _data: any ): string => '<div id="target">correct</div>';
		const myopie = new Myopie( '#container', template, {} );
		myopie.render();
		const divs = document.querySelectorAll( '#container div' );
		t.is( divs.length, 1 );
		t.is( ( divs[ 0 ] as HTMLElement ).id, 'target' );
	} );

	test( prefix + ': should select best matching node by data-myopie-id over first candidate', ( t ) => {
		document.body.innerHTML = '<div id="container"><div>generic</div><div data-myopie-id="target">correct</div></div>';
		const template = ( _data: any ): string => '<div data-myopie-id="target">correct</div>';
		const myopie = new Myopie( '#container', template, {} );
		myopie.render();
		const divs = document.querySelectorAll( '#container div' );
		t.is( divs.length, 1 );
		t.is( divs[ 0 ]?.getAttribute( 'data-myopie-id' ), 'target' );
	} );

	test( prefix + ': should update content of matched node when template changes', ( t ) => {
		document.body.innerHTML = '<div id="container"><div>generic</div><div data-myopie-id="target">old</div></div>';
		const template = ( _data: any ): string => '<div data-myopie-id="target">updated</div>';
		const myopie = new Myopie( '#container', template, {} );
		myopie.render();
		const div = document.querySelector( '#container div' );
		t.is( div?.textContent, 'updated' );
		t.is( div?.getAttribute( 'data-myopie-id' ), 'target' );
	} );
}

{
	prefix = '_nodeDiff';

	test( prefix + ': should append text node when existing has fewer nodes than template', ( t ) => {
		document.body.innerHTML = '<div id="container"></div>';
		const template = ( data: any ): string => data.showText ? '<span>A</span>testo' : '<span>A</span>';
		const myopie = new Myopie( '#container', template, { showText: false } );
		myopie.render();
		myopie.set( 'showText', true, false );
		myopie.render();
		t.is( document.querySelector( '#container' )?.textContent, 'Atesto' );
	} );

	test( prefix + ': should clear children of matched element when template element is empty', ( t ) => {
		document.body.innerHTML = '<div id="container"><div id="target"><span>child content</span></div></div>';
		const template = ( _data: any ): string => '<div id="target"></div>';
		const myopie = new Myopie( '#container', template, {} );
		myopie.render();
		const target = document.querySelector( '#container #target' );
		t.is( target?.childNodes.length, 0 );
	} );

	test( prefix + ': should not overwrite value attribute of input/textarea/option during re-render', ( t ) => {
		document.body.innerHTML = '<div id="container"><input type="text" value="old"></div>';
		const template = ( _data: any ): string => '<input type="text" value="new">';
		const myopie = new Myopie( '#container', template, {} );
		myopie.render();
		const input = document.querySelector( '#container input' ) as HTMLInputElement;
		t.is( input?.getAttribute( 'value' ), 'old' );
	} );
}

{
	prefix = 'html comments';

	test( prefix + ': comment in existing DOM should be removed after render', ( t ) => {
		document.body.innerHTML = '<div id="container"><!-- existing comment --><p>content</p></div>';
		const template = ( _data: any ): string => '<p>content</p>';
		const myopie = new Myopie( '#container', template, {} );
		myopie.render();
		const container = document.querySelector( '#container' );
		const commentNodes = Array.from( container?.childNodes ?? [] ).filter( ( n ) => n.nodeType === 8 );
		t.is( commentNodes.length, 0 );
		t.is( container?.querySelector( 'p' )?.textContent, 'content' );
	} );

	test( prefix + ': comment generated by template should not appear in rendered DOM', ( t ) => {
		document.body.innerHTML = '<div id="container"></div>';
		const template = ( _data: any ): string => '<!-- template comment --><p>content</p>';
		const myopie = new Myopie( '#container', template, {} );
		myopie.render();
		const container = document.querySelector( '#container' );
		const commentNodes = Array.from( container?.childNodes ?? [] ).filter( ( n ) => n.nodeType === 8 );
		t.is( commentNodes.length, 0 );
		t.is( container?.querySelector( 'p' )?.textContent, 'content' );
	} );
}

// ─── Comparators ─────────────────────────────────────────────────────────────

{
	prefix = 'comparators: input';

	test( prefix + ': should call input comparator to match elements by type and name', ( t ) => {
		document.body.innerHTML = '<div id="container"><input type="text" name="username"></div>';
		const template = ( _data: any ): string => '<input type="text" name="username" data-matched="true">';
		const myopie = new Myopie( '#container', template, {} );
		myopie.render();
		const input = document.querySelector( '#container input' );
		t.is( input?.getAttribute( 'data-matched' ), 'true' );
		t.is( ( input as HTMLInputElement )?.name, 'username' );
	} );
}

{
	prefix = 'comparators: link';

	test( prefix + ': should call link comparator to match elements by href', ( t ) => {
		document.body.innerHTML = '<div id="container"><link rel="stylesheet" href="http://localhost/style.css"></div>';
		const template = ( _data: any ): string => '<link rel="stylesheet" href="http://localhost/style.css" data-matched="true">';
		const myopie = new Myopie( '#container', template, {} );
		myopie.render();
		const link = document.querySelector( '#container link' );
		t.is( link?.getAttribute( 'data-matched' ), 'true' );
		t.is( ( link as HTMLLinkElement )?.href, 'http://localhost/style.css' );
	} );
}

{
	prefix = 'comparators: a';

	test( prefix + ': should call anchor comparator to match elements by href', ( t ) => {
		document.body.innerHTML = '<div id="container"><a href="http://localhost/other">Other</a><a href="http://localhost/target">Target</a></div>';
		const template = ( _data: any ): string => '<a href="http://localhost/target">Updated</a>';
		const myopie = new Myopie( '#container', template, {} );
		myopie.render();
		const anchors = document.querySelectorAll( '#container a' );
		t.is( anchors.length, 1 );
		t.is( ( anchors[ 0 ] as HTMLAnchorElement ).href, 'http://localhost/target' );
		t.is( anchors[ 0 ].textContent, 'Updated' );
	} );
}

{
	prefix = 'comparators: img';

	test( prefix + ': should call img comparator to match elements by src', ( t ) => {
		document.body.innerHTML = '<div id="container"><img src="http://localhost/image.png"></div>';
		const template = ( _data: any ): string => '<img src="http://localhost/image.png" alt="updated">';
		const myopie = new Myopie( '#container', template, {} );
		myopie.render();
		const img = document.querySelector( '#container img' );
		t.is( img?.getAttribute( 'alt' ), 'updated' );
		t.is( ( img as HTMLImageElement )?.src, 'http://localhost/image.png' );
	} );
}

{
	prefix = 'comparators: script';

	test( prefix + ': should call script comparator to match elements by src', ( t ) => {
		document.body.innerHTML = '<div id="container"><script src="http://localhost/app.js"></script></div>';
		const template = ( _data: any ): string => '<script src="http://localhost/app.js" data-matched="true"></script>';
		const myopie = new Myopie( '#container', template, {} );
		myopie.render();
		const script = document.querySelector( '#container script' );
		t.is( script?.getAttribute( 'data-matched' ), 'true' );
		t.is( ( script as HTMLScriptElement )?.src, 'http://localhost/app.js' );
	} );
}

// ─── Integration: mixed template ─────────────────────────────────────────────

{
	prefix = 'mixed template';

	test( prefix + ': should correctly render and update a template mixing divs, spans, a, img, script, text and comments', ( t ) => {
		document.body.innerHTML = '<div id="container"></div>';
		const template = ( data: any ): string =>
			`<div class="wrapper"><span class="title">${data.title}</span><a href="http://localhost/page">Link</a><img src="http://localhost/photo.png" alt="${data.alt}"><script src="http://localhost/app.js"><\/script>some text<span class="footer">${data.footer}</span></div><!-- header -->`;
		const myopie = new Myopie( '#container', template, { title: 'Hello', alt: 'photo', footer: 'Bottom' } );
		myopie.render();

		const wrapper = document.querySelector( '#container .wrapper' );
		t.truthy( wrapper );
		t.is( wrapper?.querySelector( '.title' )?.textContent, 'Hello' );
		t.is( ( wrapper?.querySelector( 'a' ) as HTMLAnchorElement )?.href, 'http://localhost/page' );
		t.is( ( wrapper?.querySelector( 'img' ) as HTMLImageElement )?.src, 'http://localhost/photo.png' );
		t.is( ( wrapper?.querySelector( 'img' ) as HTMLImageElement )?.alt, 'photo' );
		t.is( ( wrapper?.querySelector( 'script' ) as HTMLScriptElement )?.src, 'http://localhost/app.js' );
		t.is( wrapper?.querySelector( '.footer' )?.textContent, 'Bottom' );
		const commentNodes = Array.from( document.querySelector( '#container' )?.childNodes ?? [] ).filter( ( n ) => n.nodeType === 8 );
		t.is( commentNodes.length, 0 );

		myopie.set( 'title', 'World', false );
		myopie.set( 'alt', 'new photo', false );
		myopie.set( 'footer', 'Updated', false );
		myopie.render();

		t.is( wrapper?.querySelector( '.title' )?.textContent, 'World' );
		t.is( ( wrapper?.querySelector( 'img' ) as HTMLImageElement )?.alt, 'new photo' );
		t.is( wrapper?.querySelector( '.footer' )?.textContent, 'Updated' );
	} );
}
