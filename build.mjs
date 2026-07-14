import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { minify } from 'terser';
import ts from 'typescript';

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );
const isMain = process.argv[ 1 ] && path.resolve( process.argv[ 1 ] ) === __filename;

// ── Tuple manifest ────────────────────────────────────────────────────────────
// [ name, tsconfigFileName, filesToMinify[], prefix? ]

const buildTargets = [
	[ 'library', 'tsconfig.json', [ 'myopie.js' ] ],
	[ 'tests', 'tsconfig.tests.json', [] ]
];

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

// ── Tuple validation ──────────────────────────────────────────────────────────

function validateBuildTargets( targets ) {
	const cL1 = targets.length;
	for( let iL1 = 0; iL1 < cL1; iL1++ ) {
		const tuple = targets[ iL1 ];
		const errorPrefix = `Build target ${ iL1 }:`;
		if( !Array.isArray( tuple ) || ( 3 !== tuple.length && 4 !== tuple.length ) ) {
			throw new Error( `${ errorPrefix } must be a tuple of length 3 or 4` );
		}
		const [ name, configFile, filesToMinify, prefix ] = tuple;
		if( 'string' !== typeof name || '' === name ) {
			throw new Error( `${ errorPrefix } name must be a non-empty string` );
		}
		if( 'string' !== typeof configFile || '' === configFile ) {
			throw new Error( `${ errorPrefix } tsconfig file must be a non-empty string` );
		}
		if( !Array.isArray( filesToMinify ) ) {
			throw new Error( `${ errorPrefix } filesToMinify must be an array` );
		}
		if( undefined !== prefix && 'string' !== typeof prefix ) {
			throw new Error( `${ errorPrefix } prefix must be a string when provided` );
		}
		const cL2 = filesToMinify.length;
		for( let iL2 = 0; iL2 < cL2; iL2++ ) {
			if( 'string' !== typeof filesToMinify[ iL2 ] || !filesToMinify[ iL2 ].endsWith( '.js' ) ) {
				throw new Error( `${ errorPrefix } file '${ filesToMinify[ iL2 ] }' must end in '.js'` );
			}
		}
	}
}

// ── Per-file literal aliasing ─────────────────────────────────────────────────

function isUnsafeStringLiteral( node, parent ) {
	let unsafe = false;
	if( parent ) {
		if( ts.isExpressionStatement( parent ) && parent.expression === node ) {
			unsafe = true;
		}
		if( ( ts.isImportDeclaration( parent ) || ts.isExportDeclaration( parent ) ) && parent.moduleSpecifier === node ) {
			unsafe = true;
		}
		if( ts.isCallExpression( parent ) && ts.isImportKeyword( parent.expression ) && 0 < parent.arguments.length && parent.arguments[ 0 ] === node ) {
			unsafe = true;
		}
		if( ( ts.isImportAttribute( parent ) ) && ( parent.value === node || parent.name === node ) ) {
			unsafe = true;
		}
		if( ( ts.isPropertyAssignment( parent ) || ts.isMethodDeclaration( parent ) || ts.isPropertyDeclaration( parent ) || ts.isGetAccessorDeclaration( parent ) || ts.isSetAccessorDeclaration( parent ) || ts.isPropertyAccessExpression( parent ) || ts.isElementAccessExpression( parent ) ) && parent.name === node ) {
			unsafe = true;
		}
		if( ts.isBindingElement( parent ) && parent.propertyName === node ) {
			unsafe = true;
		}
		if( ( ts.isImportSpecifier( parent ) || ts.isExportSpecifier( parent ) ) && ( parent.name === node || parent.propertyName === node ) ) {
			unsafe = true;
		}
	}
	return unsafe;
}

function collectStringCandidates( sourceFile ) {
	const identifiers = new Set();
	const stringLiterals = new Map();

	function visit( node, parent ) {
		if( ts.isIdentifier( node ) ) {
			identifiers.add( node.text );
		}
		if( ts.isStringLiteral( node ) ) {
			const text = node.text;
			if( !isUnsafeStringLiteral( node, parent ) ) {
				if( !stringLiterals.has( text ) ) {
					stringLiterals.set( text, [] );
				}
				stringLiterals.get( text ).push( { node, parent } );
			}
		}
		ts.forEachChild( node, child => visit( child, node ) );
	}

	visit( sourceFile, null );

	return { identifiers, stringLiterals };
}

function findInsertionPoint( sourceFile ) {
	let returnValue = 0;
	let go = true;
	const cL1 = sourceFile.statements.length;
	for( let iL1 = 0; iL1 < cL1 && go; iL1++ ) {
		const stmt = sourceFile.statements[ iL1 ];
		if( ts.isExpressionStatement( stmt ) && ts.isStringLiteral( stmt.expression ) ) {
			returnValue = stmt.end;
		} else if( ts.isImportDeclaration( stmt ) ) {
			returnValue = stmt.end;
		} else {
			go = false;
		}
	}
	return returnValue;
}

async function minifyFile( absPath ) {
	const source = await fs.readFile( absPath, 'utf8' );

	const baselineResult = await minify( source, {
		module: true,
		toplevel: true,
		compress: true,
		mangle: { properties: { regex: /^_/ } }
	} );
	const baselineCode = baselineResult.code;

	const outPath = absPath.replace( /\.js$/, '.min.js' );
	let outputCode;

	const transformed = transformStringLiterals( source, absPath );

	if( transformed !== source ) {
		const transformedResult = await minify( transformed, {
			module: true,
			toplevel: true,
			compress: { defaults: true, reduce_vars: false },
			mangle: { properties: { regex: /^_/ } }
		} );
		const size = [
			Buffer.byteLength( baselineCode, 'utf8' ),
			Buffer.byteLength( transformedResult.code, 'utf8' )
		];
		log( 'MINIFY', `Baseline    output size: ${size[0]}` );
		log( 'MINIFY', `Transformed output size: ${size[1]}` );
		if( size[ 1 ] < size[ 0 ] ) {
			outputCode = transformedResult.code;
			log( 'MINIFY', `Transformed output written — ${ outPath }` );
		} else {
			outputCode = baselineCode;
			log( 'MINIFY', `Baseline output written — ${ outPath }` );
		}
	} else {
		log( 'MINIFY', 'Code not transformed' );
		outputCode = baselineCode;
		log( 'MINIFY', `Baseline output written — ${ outPath }` );
	}

	await fs.writeFile( outPath, outputCode );
}

// ── Target runner ─────────────────────────────────────────────────────────────

async function runTarget( target ) {
	const [ name, configFile, filesToMinify, prefix ] = target;
	const dir = path.resolve( __dirname, prefix ?? '.' );
	const absConfig = path.resolve( dir, configFile );

	log( name.toUpperCase(), 'Compiling TypeScript...' );
	compileTsc( absConfig );

	const cL1 = filesToMinify.length;
	for( let iL1 = 0; iL1 < cL1; iL1++ ) {
		const absFile = path.resolve( dir, filesToMinify[ iL1 ] );
		log( name.toUpperCase(), `Minifying ${ path.relative( __dirname, absFile ) }...` );
		await minifyFile( absFile );
	}

	log( name.toUpperCase(), '✓ Built.' );
}

function transformStringLiterals( source, sourceFilePath ) {
	const sourceFile = ts.createSourceFile( sourceFilePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS );
	const { identifiers, stringLiterals } = collectStringCandidates( sourceFile );

	const aliases = [];
	let nextSuffix = 0;
	for( const [ text, nodes ] of stringLiterals ) {
		if( 3 < text.length && 1 < nodes.length ) {
			let alias = '_s' + nextSuffix;
			while( identifiers.has( alias ) ) {
				nextSuffix++;
				alias = '_s' + nextSuffix;
			}
			identifiers.add( alias );
			aliases.push( { alias, text, nodes } );
			nextSuffix++;
		}
	}

	let returnValue = source;

	if( 0 < aliases.length ) {
		const constLines = aliases.map( ( { alias, text } ) => `${ alias }=${ JSON.stringify( text ) }` ).join( ',' );
		const constDecl = `const ${ constLines };`;

		const replacements = [];
		const cL3 = aliases.length;
		for( let iL3 = 0; iL3 < cL3; iL3++ ) {
			const { alias, nodes } = aliases[ iL3 ];
			const cL4 = nodes.length;
			for( let iL4 = 0; iL4 < cL4; iL4++ ) {
				const { node: literalNode } = nodes[ iL4 ];
				replacements.push( {
					start: literalNode.getStart( sourceFile ),
					end: literalNode.end,
					text: alias
				} );
			}
		}
		replacements.sort( ( a, b ) => b.start - a.start );

		const insertionPoint = findInsertionPoint( sourceFile );

		let transformed = source;
		const cL5 = replacements.length;
		for( let iL5 = 0; iL5 < cL5; iL5++ ) {
			const rep = replacements[ iL5 ];
			transformed = transformed.slice( 0, rep.start ) + rep.text + transformed.slice( rep.end );
		}

		transformed = transformed.slice( 0, insertionPoint ) + constDecl + '\n' + transformed.slice( insertionPoint );

		returnValue = transformed;
	}

	return returnValue;
}

export { collectStringCandidates, isUnsafeStringLiteral, runTarget, transformStringLiterals };

// ── Dispatch ──────────────────────────────────────────────────────────────────

if( isMain ) {
	validateBuildTargets( buildTargets );

	const targetNamesAllowed = new Set(
		buildTargets.flatMap( ( [ targetName ] ) => [ targetName ] )
	);
	let targetNamesArgs = new Set( process.argv.slice( 2 ) );

	if( targetNamesArgs.has( 'all' ) ) {
		targetNamesArgs.delete( 'all' );
		for( const targetName of targetNamesAllowed ) {
			targetNamesArgs.add( targetName );
		}
	}

	const targetNamesSelected = targetNamesAllowed.intersection( targetNamesArgs );
	const targetNamesInvalid = targetNamesArgs.difference( targetNamesAllowed );

	if( 0 < targetNamesSelected.size && 0 === targetNamesInvalid.size ) {
		async function main() {
			for( const target of buildTargets ) {
				if( targetNamesSelected.has( target[ 0 ] ) ) {
					await runTarget( target );
				}
			}
		}

		main().catch( err => {
			console.error( err );
			process.exit( 1 );
		} );
	} else {
		if( 0 < targetNamesInvalid.size ) {
			console.error( 'Unknown target(s): ' + [ ...targetNamesInvalid ].join( ', ' ) );
		}
		console.log( 'Usage: node build.mjs <target> [<target> ...]' );
		console.log( 'Available targets: ' + [ ...targetNamesAllowed ].join( ', ' ) + ', all' );
		process.exitCode = 1;
	}
}
