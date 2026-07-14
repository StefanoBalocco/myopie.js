import test from 'ava';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runTarget, transformStringLiterals } from './build.mjs';
const execFileAsync = promisify(execFile);
{
    const prefix = 'string literal aliasing safety';
    test(prefix + ': should not alias string-literal getter/setter names', (t) => {
        const source = `
const obj = {
	get "myGetter"() { return "hello"; },
	set "mySetter"(v) {},
	"propName": "hello"
};
const x = "hello";
const y = "hello";
`;
        const result = transformStringLiterals(source, 'test.js');
        t.true(result.includes('"myGetter"'), 'getter name should remain quoted');
        t.true(result.includes('"mySetter"'), 'setter name should remain quoted');
        t.is((result.match(/"hello"/g) || []).length, 1, '"hello" should appear quoted only in alias declaration');
        t.is((result.match(/\b_s0\b/g) || []).length, 5, 'alias _s0 should appear in declaration and 4 use sites');
    });
    test(prefix + ': should not alias import attribute name/value', (t) => {
        const source = `
import data from "./data.json" with { "type": "json" };
const type = "type";
const other = "type";
const a = "hello";
const b = "hello";
`;
        const result = transformStringLiterals(source, 'test.js');
        t.true(result.includes('import data from "./data.json" with { "type": "json" }'), 'import attribute should remain unchanged');
        t.is((result.match(/"type"/g) || []).length, 2, '"type" quoted: import attribute name + alias decl');
        t.is((result.match(/\b_s0\b/g) || []).length, 3, 'alias _s0: declaration + 2 use sites');
        t.is((result.match(/"hello"/g) || []).length, 1, '"hello" quoted only in alias declaration');
    });
    test(prefix + ': mixed-value: unsafe occurrences remain quoted, safe ones aliased', (t) => {
        const source = `
const obj = { "longUnsafeName": "value" };
const a = "longUnsafeName";
const b = "longUnsafeName";
`;
        const result = transformStringLiterals(source, 'test.js');
        t.is((result.match(/"longUnsafeName"/g) || []).length, 2, 'property key + alias decl');
        t.true(result.startsWith('const _s0='), 'alias declaration should be at the top');
        t.is((result.match(/\b_s0\b/g) || []).length, 3, 'alias _s0: declaration + 2 const initializers');
    });
}
{
    const prefix = 'build CLI';
    test.serial(prefix + ': "all" target should build library and tests', async (t) => {
        t.timeout(120000);
        const { stdout } = await execFileAsync('node', ['build.mjs', 'all'], { timeout: 60000 });
        t.true(stdout.includes('[LIBRARY]'));
        t.true(stdout.includes('[TESTS]'));
        const stats = fs.statSync('myopie.min.js');
        t.true(stats.isFile());
        const dom = new (await import('jsdom')).JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'http://localhost' });
        const window = dom.window;
        globalThis.document = window.document;
        globalThis.window = window;
        globalThis.Node = window.Node;
        globalThis.HTMLElement = window.HTMLElement;
        globalThis.HTMLInputElement = window.HTMLInputElement;
        globalThis.HTMLSelectElement = window.HTMLSelectElement;
        globalThis.HTMLTextAreaElement = window.HTMLTextAreaElement;
        globalThis.HTMLTemplateElement = window.HTMLTemplateElement;
        const url = './myopie.min.js?cache=' + Date.now();
        const MyopieMin = (await import(url)).default;
        document.body.innerHTML = '<div id="container"></div>';
        const template = (data) => `<div>${data.content}</div>`;
        const myopie = new MyopieMin('#container', template, { content: 'hello' });
        t.is(myopie.get('content'), 'hello');
        myopie.set('content', 'world', false);
        t.is(myopie.get('content'), 'world');
        t.true(myopie.render());
        const container = document.querySelector('#container');
        t.is(container?.textContent, 'world');
    });
    test.serial(prefix + ': "all library library" should deduplicate targets and build in order', async (t) => {
        t.timeout(120000);
        const { stdout } = await execFileAsync('node', ['build.mjs', 'all', 'library', 'library'], { timeout: 60000 });
        t.true(stdout.includes('[LIBRARY]'));
        t.true(stdout.includes('[TESTS]'));
        const libraryCompileCount = stdout.split('[LIBRARY] Compiling TypeScript...').length - 1;
        const testsCompileCount = stdout.split('[TESTS] Compiling TypeScript...').length - 1;
        t.is(libraryCompileCount, 1, '[LIBRARY] compile should appear exactly once (Set dedup)');
        t.is(testsCompileCount, 1, '[TESTS] compile should appear exactly once');
        const libIndex = stdout.indexOf('[LIBRARY]');
        const testsIndex = stdout.indexOf('[TESTS]');
        t.true(libIndex < testsIndex, '[LIBRARY] should appear before [TESTS]');
    });
    test.serial(prefix + ': "all unknown" should reject with unknown target diagnostic', async (t) => {
        let caughtError;
        try {
            await execFileAsync('node', ['build.mjs', 'all', 'unknown'], { timeout: 60000 });
            t.fail('Expected error to be thrown');
        }
        catch (err) {
            caughtError = err;
        }
        if (caughtError) {
            t.is(caughtError.code, 1, 'exit code should be 1');
            t.true(caughtError.stderr.includes('Unknown target(s): unknown'));
            t.false(caughtError.stdout.includes('[LIBRARY]'));
            t.false(caughtError.stderr.includes('[LIBRARY]'));
            t.false(caughtError.stdout.includes('[TESTS]'));
            t.false(caughtError.stderr.includes('[TESTS]'));
        }
    });
    test.serial(prefix + ': no arguments should print usage and exit nonzero', async (t) => {
        let caughtError;
        try {
            await execFileAsync('node', ['build.mjs'], { timeout: 60000 });
            t.fail('Expected error to be thrown');
        }
        catch (err) {
            caughtError = err;
        }
        if (caughtError) {
            t.is(caughtError.code, 1, 'exit code should be 1');
            t.true(caughtError.stdout.includes('Usage:'));
            t.true(caughtError.stdout.includes('Available targets:'));
            t.false(caughtError.stdout.includes('[LIBRARY]'));
            t.false(caughtError.stdout.includes('[TESTS]'));
        }
    });
    test.serial(prefix + ': "tests library" should build library before tests despite CLI order', async (t) => {
        t.timeout(120000);
        const { stdout } = await execFileAsync('node', ['build.mjs', 'tests', 'library'], { timeout: 60000 });
        t.true(stdout.includes('[LIBRARY]'));
        t.true(stdout.includes('[TESTS]'));
        const libIndex = stdout.indexOf('[LIBRARY]');
        const testsIndex = stdout.indexOf('[TESTS]');
        t.true(libIndex < testsIndex, '[LIBRARY] should appear before [TESTS] despite CLI order');
    });
    test.serial(prefix + ': prefix + multi-file integration', async (t) => {
        t.timeout(120000);
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const tempDir = fs.mkdtempSync(path.join(__dirname, 'myopie-test-prefix-'));
        try {
            fs.writeFileSync(path.join(tempDir, 'tsconfig.json'), JSON.stringify({
                compilerOptions: {
                    target: 'esnext',
                    module: 'esnext',
                    moduleResolution: 'bundler',
                    strict: true,
                    declaration: false,
                    sourceMap: false
                },
                files: ['one.ts', 'two.ts']
            }));
            fs.writeFileSync(path.join(tempDir, 'one.ts'), 'export const hello: string = "world";');
            fs.writeFileSync(path.join(tempDir, 'two.ts'), 'export const foo: number = 42;');
            await runTarget(['fixture', 'tsconfig.json', ['one.js', 'two.js'], path.basename(tempDir)]);
            t.true(fs.existsSync(path.join(tempDir, 'one.js')), 'one.js should exist');
            t.true(fs.existsSync(path.join(tempDir, 'two.js')), 'two.js should exist');
            t.true(fs.existsSync(path.join(tempDir, 'one.min.js')), 'one.min.js should exist');
            t.true(fs.existsSync(path.join(tempDir, 'two.min.js')), 'two.min.js should exist');
            const oneContent = fs.readFileSync(path.join(tempDir, 'one.js'), 'utf8');
            t.false(oneContent.includes('const _s'), 'input JS should not have alias preamble');
            const twoContent = fs.readFileSync(path.join(tempDir, 'two.js'), 'utf8');
            t.false(twoContent.includes('const _s'), 'input JS should not have alias preamble');
        }
        finally {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });
}
