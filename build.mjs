import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { minify } from 'terser';
import ts from 'typescript';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );

// ── Utilities ─────────────────────────────────────────────────────────────────

function log( step, message ) {
	const stamp = new Date().toISOString().substring( 11, 19 );
	console.log( `[${ stamp }] [${ step }] ${ message }` );
}

function compileTsc( configPath ) {
	const absConfig = path.resolve( __dirname, configPath );
	const configFile = ts.readConfigFile( absConfig, ts.sys.readFile );
	if( configFile.error ) {
		throw new Error( ts.formatDiagnosticsWithColorAndContext( [ configFile.error ], {
			getCurrentDirectory: ts.sys.getCurrentDirectory,
			getCanonicalFileName: f => f,
			getNewLine: () => '\n'
		} ) );
	}
	const parsed = ts.parseJsonConfigFileContent(
		configFile.config,
		ts.sys,
		path.dirname( absConfig )
	);
	const program = ts.createProgram( parsed.fileNames, parsed.options );
	const emitResult = program.emit();
	const diagnostics = ts.getPreEmitDiagnostics( program ).concat( emitResult.diagnostics );
	if( 0 < diagnostics.length ) {
		const message = ts.formatDiagnosticsWithColorAndContext( diagnostics, {
			getCurrentDirectory: ts.sys.getCurrentDirectory,
			getCanonicalFileName: f => f,
			getNewLine: () => '\n'
		} );
		throw new Error( message );
	}
}

// ── Library ───────────────────────────────────────────────────────────────────

async function buildLibrary() {
	log( 'LIBRARY', 'Compiling TypeScript...' );
	compileTsc( 'tsconfig.json' );
	log( 'LIBRARY', 'Minifying with terser...' );
	const code = await fs.readFile( 'myopie.js', 'utf8' );
	const result = await minify( code, {
		module: true,
		toplevel: true,
		compress: true,
		mangle: {
			properties: {
				regex: /^_/
			}
		}
	} );
	await fs.writeFile( 'myopie.min.js', result.code );
	log( 'LIBRARY', '✓ Library built.' );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

async function buildTests() {
	log( 'TESTS', 'Compiling...' );
	compileTsc( 'tsconfig.tests.json' );
	log( 'TESTS', '✓ Tests compiled.' );
}

// ── Dispatch ──────────────────────────────────────────────────────────────────

const targets = {
	library: buildLibrary,
	tests:   buildTests
};

const args = process.argv.slice( 2 );

if( 0 === args.length ) {
	console.log( 'Usage: node build.mjs <target> [<target> ...]' );
	console.log( 'Available targets: ' + Object.keys( targets ).join( ', ' ) );
	process.exit( 0 );
}

const unknown = args.filter( a => !( a in targets ) );
if( 0 < unknown.length ) {
	console.error( 'Unknown target(s): ' + unknown.join( ', ' ) );
	process.exit( 1 );
}

async function main() {
	const cL1 = args.length;
	for( let iL1 = 0; iL1 < cL1; iL1++ ) {
		await targets[ args[ iL1 ] ]();
	}
}

main().catch( err => {
	console.error( err );
	process.exit( 1 );
} );
