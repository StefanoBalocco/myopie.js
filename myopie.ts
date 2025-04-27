'use strict';

/*
 * Partially rip from https://github.com/cferdinandi/reef/
 */

type Undefinedable<T> = T | undefined;
type Nullable<T> = T | null;

export default class myopie {
	private readonly _selector: string;
	private readonly _template: ( data: any ) => string;
	private readonly _timeout: number = 0;
	private readonly _inputToPath: string[][];
	private _timer: Undefinedable<number> = undefined;
	private _dataCurrent: any = {};
	private _dataPrevious: any = null;
	private _inited: boolean = false;
	private _hooks: {
		init: {
			pre: ( ( dataCurrent: any ) => void )[],
			post: ( ( dataCurrent: any ) => void )[],
		},
		render: {
			pre: ( ( dataCurrent: any, dataPrevious: any ) => void )[],
			post: ( ( dataCurrent: any, dataPrevious: any ) => void )[]
		}
	} = { init: { pre: [], post: [] }, render: { pre: [], post: [] } };

	public constructor( selector: string, template: ( data: any ) => string, initialData: any = {}, inputToPath: string[][] = [], timeout: number = 100, renderOnInput: boolean = true ) {
		this._selector = selector;
		this._template = template;
		this._timeout = timeout;
		this._inputToPath = inputToPath;
		this._dataCurrent = myopie._DeepClone( initialData );
		document.addEventListener( 'input', ( e ) => {
			const event: InputEvent = <InputEvent> e;
			let found: boolean = false;
			const cL1: number = this._inputToPath.length;
			for( let iL1: number = 0; !found && iL1 < cL1; iL1++ ) {
				if( event && event.target && ( <Element> event.target ).matches( this._inputToPath[ iL1 ][ 0 ] ) ) {
					switch( ( <HTMLInputElement> event.target ).type ) {
						case 'checkbox': {
							this.set( this._inputToPath[ iL1 ][ 1 ], ( <HTMLInputElement> event.target ).checked, renderOnInput );
							break;
						}
						case 'radio': {
							this.set( this._inputToPath[ iL1 ][ 1 ], ( <HTMLInputElement> event.target ).checked, renderOnInput );
							break;
						}
						default: {
							this.set( this._inputToPath[ iL1 ][ 1 ], ( <HTMLInputElement> event.target ).value, renderOnInput );
							// Text, number, password, date, email, ecc
						}
					}
				}
			}
		} );
	}

	// Ripped from https://github.com/angus-c/just
	// Package: collection-clone
	static _DeepClone( obj: any ): any {
		let returnValue: any = null;
		const sourceType = ( typeof obj );
		switch( sourceType ) {
			case 'undefined':
			case 'boolean':
			case 'number':
			case 'bigint':
			case 'string':
			case 'symbol':
			case 'function': {
				returnValue = obj;
				break;
			}
			case 'object': {
				if( null === obj ) {
					returnValue = null;
				} else {
					returnValue = Array.isArray( obj ) ? [] : {};
					for( let key in obj ) {
						// include prototype properties
						let value = obj[ key ];
						let type = {}.toString.call( value ).slice( 8, -1 );
						if( type == 'Array' || type == 'Object' ) {
							returnValue[ key ] = myopie._DeepClone( value );
						} else if( type == 'Date' ) {
							returnValue[ key ] = new Date( value.getTime() );
						} else if( type == 'RegExp' ) {
							let flags: string = '';
							if( typeof value.source.flags == 'string' ) {
								flags = value.source.flags;
							} else {
								let tmpValue: string[] = [];
								value.global && tmpValue.push( 'g' );
								value.ignoreCase && tmpValue.push( 'i' );
								value.multiline && tmpValue.push( 'm' );
								value.sticky && tmpValue.push( 'y' );
								value.unicode && tmpValue.push( 'u' );
								flags = tmpValue.join( '' );
							}
							returnValue[ key ] = RegExp( value.source, flags );
						} else {
							returnValue[ key ] = value;
						}
					}
				}
				break;
			}
		}
		return returnValue;
	}

	static _SimilarNode( node1: Element, node2: Element ) {
		return (
			( node1.nodeType === node2.nodeType ) &&
			( node1.tagName === node2.tagName ) &&
			( node1.id === node2.id ) &&
			(
				!!node1.id ||
				( ( <HTMLImageElement> node1 ).src && ( ( <HTMLImageElement> node1 ).src === ( <HTMLImageElement> node2 ).src ) ) ||
				( ( <HTMLLinkElement> node1 ).href && ( ( <HTMLLinkElement> node1 ).href === ( <HTMLLinkElement> node2 ).href ) ) ||
				( node1.className === node2.className ) ||
				( node1.childElementCount === node2.childElementCount ) ||
				(
					!( <HTMLImageElement> node1 ).src && !( <HTMLImageElement> node2 ).src &&
					!( <HTMLLinkElement> node1 ).href && !( <HTMLLinkElement> node2 ).href &&
					!node1.className && !node2.className
				)
			)
		);
	}

	private static _DiffNode( nodeTemplate: Element, nodeExisting: Element, ignore: { content: boolean, style: boolean } ) {
		const nodesTemplate = nodeTemplate.childNodes;
		const nodesExisting = nodeExisting.childNodes;
		const cL1 = nodesTemplate.length;
		for( let iL1 = 0; iL1 < cL1; iL1++ ) {
			const tmpItem: Element = <Element> nodesTemplate[ iL1 ];
			let currentItem: Element;
			if( nodesExisting.length <= iL1 ) {
				switch( tmpItem.nodeType ) {
					case 1: {
						nodeExisting.append( tmpItem.cloneNode( true ) );
						break;
					}
					case 3: {
						nodeExisting.append( <string> tmpItem.nodeValue );
						break;
					}
				}
			} else {
				currentItem = <Element> nodesExisting[ iL1 ];
				let skip: boolean = false;
				if( !currentItem.isEqualNode( tmpItem ) ) {
					if( !myopie._SimilarNode( tmpItem, currentItem ) ) {
						let ahead: Element = <Element> Array.from( nodesExisting ).slice( iL1 + 1 ).find( ( branch ) => myopie._SimilarNode( tmpItem, <Element> branch ) );
						if( !ahead ) {
							currentItem = nodeExisting.insertBefore<Element>( <Element> tmpItem.cloneNode( true ), ( ( iL1 < nodesExisting.length ) ? currentItem : null ) );
							skip = true;
						} else {
							currentItem = nodeExisting.insertBefore<Element>( <Element> ahead, ( ( iL1 < nodesExisting.length ) ? currentItem : null ) );
						}
					}
					if( !skip ) {
						const templateContent = ( tmpItem.childNodes && tmpItem.childNodes.length ) ? null : tmpItem.textContent;
						const existingContent = ( currentItem.childNodes && currentItem.childNodes.length ) ? null : currentItem.textContent;
						if( templateContent != existingContent ) {
							currentItem.textContent = templateContent;
						}
						if( 1 === tmpItem.nodeType ) {
							//attributes
							const attributesTemplate = tmpItem.attributes;
							const attributesExistings = currentItem.attributes;
							if( 'true' === attributesTemplate.getNamedItem( 'data-myopie-ignore-content' )?.value ) {
								ignore.content = true;
							}
							if( 'true' === attributesTemplate.getNamedItem( 'data-myopie-ignore-style' )?.value ) {
								ignore.style = true;
							}
							let addedDefault: string[] = [];
							for( let { name, value } of attributesTemplate ) {
								if( name.startsWith( 'data-myopie-default-' ) && ( 20 < name.length ) ) {
									const realName = name.substring( 20 );
									if( null === attributesExistings.getNamedItem( realName ) ) {
										addedDefault.push( realName );
										currentItem.setAttribute( realName, value );
									}
								} else if( !name.startsWith( 'data-myopie-' ) ) {
									if( ( ( !ignore?.style || 'style' != name ) && ( ( ![ 'input', 'option', 'textarea' ].includes( currentItem.tagName ) ) || ( ![ 'value', 'selected', 'checked' ].includes( name ) ) ) ) || ( null === attributesExistings.getNamedItem( name ) ) ) {
										currentItem.setAttribute( name, value );
									}
								}
							}
							// @ts-ignore
							for( let { name } of attributesExistings ) {
								if( null === attributesTemplate.getNamedItem( name ) && !addedDefault.includes( name ) ) {
									if( !ignore?.style || ( name !== 'style' ) ) {
										currentItem.removeAttribute( name );
									}
								}
							}
							// content
							if( !ignore.content ) {
								if( !tmpItem.childNodes.length && currentItem.childNodes.length ) {
									currentItem.innerHTML = '';
								} else if( !currentItem.childNodes.length && tmpItem.childNodes.length ) {
									myopie._DiffNode( tmpItem, currentItem, Object.assign( {}, ignore ) );
								} else {
									myopie._DiffNode( tmpItem, currentItem, Object.assign( {}, ignore ) );
								}
							}
						}
					}
				}
			}
		}
		for( let iL1 = ( nodesExisting.length - nodesTemplate.length ); iL1 > 0; iL1-- ) {
			nodesExisting[ nodesExisting.length - 1 ].remove();
		}
	}

	public HooksInitAddPre( hookFunction: ( ( dataCurrent: any ) => void ) ) {
		this._hooks.init.pre.push( hookFunction );
	}

	public HooksInitAddPost( hookFunction: ( ( dataCurrent: any ) => void ) ) {
		this._hooks.init.post.push( hookFunction );
	}

	public HooksRenderAddPre( hookFunction: ( ( dataCurrent: any, dataPrevious: any ) => void ) ) {
		this._hooks.render.pre.push( hookFunction );
	}

	public HooksRenderAddPost( hookFunction: ( ( dataCurrent: any, dataPrevious: any ) => void ) ) {
		this._hooks.render.post.push( hookFunction );
	}

	public render() {
		this._timer = undefined;
		const htmlExisting = document.querySelector<HTMLElement>( this._selector );
		if( null != htmlExisting ) {
			if( !this._inited ) {
				for( let iL1 = 0, cL1 = this._hooks.init.pre.length; iL1 < cL1; iL1++ ) {
					this._hooks.init.pre[ iL1 ]( this._dataCurrent );
				}
			} else {
				for( let iL1 = 0, cL1 = this._hooks.render.pre.length; iL1 < cL1; iL1++ ) {
					this._hooks.render.pre[ iL1 ]( this._dataCurrent, this._dataPrevious );
				}
			}
			const parser = new DOMParser();
			let tmpValue = parser.parseFromString( this._template( this._dataCurrent ), 'text/html' );
			if( tmpValue.head && tmpValue.head.childNodes && tmpValue.head.childNodes.length ) {
				Array.from( tmpValue.head.childNodes ).reverse().forEach( function( node ) { tmpValue.body.insertBefore( node, tmpValue.body.firstChild );} );
			}
			const htmlTemplate = ( tmpValue && tmpValue.body ) ? tmpValue.body : document.createElement( 'body' );
			myopie._DiffNode( htmlTemplate, htmlExisting, { content: false, style: false } );
			const items = htmlExisting.querySelectorAll( '*' );
			for( let iL1 = 0, cL1 = items.length; iL1 < cL1; iL1++ ) {
				for( let iL2 = 0, cL2 = items[ iL1 ].attributes?.length; iL2 < cL2; iL2++ ) {
					if( items[ iL1 ].attributes[ iL2 ].name.startsWith( 'data-myopie-' ) ) {
						items[ iL1 ].removeAttribute( items[ iL1 ].attributes[ iL2 ].name );
						iL2--;
						cL2--;
					}
				}
			}
			if( !this._inited ) {
				for( let iL1 = 0, cL1 = this._hooks.init.post.length; iL1 < cL1; iL1++ ) {
					this._hooks.init.post[ iL1 ]( this._dataCurrent );
				}
				this._inited = true;
			} else {
				for( let iL1 = 0, cL1 = this._hooks.render.post.length; iL1 < cL1; iL1++ ) {
					this._hooks.render.post[ iL1 ]( this._dataCurrent, this._dataPrevious );
				}
			}
			this._dataPrevious = null;
		} else {
			// Missing target id
		}
	}

	public get( path: Nullable<string> ) : any {
		let returnValue : any;
		if( null != path ) {
			let components = path.split( /(?<!(?<!\\)\\)\// );
			const cL1 = components.length;
			if( 0 < cL1 ) {
				returnValue = this._dataCurrent;
				for( let iL1 = 0; ( ( iL1 < cL1 ) && ( 'undefined' !== typeof returnValue ) ); iL1++ ) {
					if( Array.isArray( returnValue ) || ( 'object' === typeof ( returnValue ) ) ) {
						const elem = components[ iL1 ];
						if( 'undefined' !== typeof returnValue[ elem ] ) {
							returnValue = returnValue[ elem ];
						} else {
							returnValue = undefined;
						}
					} else {
						returnValue = undefined;
					}
				}
			}
		}
		if( 'function' === typeof returnValue ) {
			returnValue = returnValue();
		}
		return returnValue;
	}

	public set( path: string, value: any, render = true ) {
		let resetPrevious: boolean = false;
		if( null === this._dataPrevious ) {
			resetPrevious = true;
			this._dataPrevious = myopie._DeepClone( this._dataCurrent );
		}
		let tmpValue: any = this._dataCurrent;
		let components: string[] = path.split( /(?<!(?<!\\)\\)\// );
		let changed: boolean = false;
		const cL1: number = components.length;
		for( let iL1: number = 0; iL1 < cL1 - 1; iL1++ ) {
			let tmpPath: string = components[ iL1 ];
			if( 'undefined' === typeof tmpValue[ tmpPath ] ) {
				changed = true;
				tmpValue[ tmpPath ] = {};
			}
			tmpValue = tmpValue[ tmpPath ];
		}
		const lastComponent: string = components[ cL1 - 1 ];
		const currentValue: any = tmpValue[ lastComponent ];

		if( currentValue !== value ) {
			if( 'undefined' !== typeof value ) {
				changed = true;
				tmpValue[ lastComponent ] = value;
			} else if( 'undefined' !== typeof tmpValue[ lastComponent ] ) {
				changed = true;
				delete tmpValue[ lastComponent ];
			}
		}
		if( changed ) {
			if( render ) {
				if( this._timeout > 0 ) {
					if( 'undefined' != typeof this._timer ) {
						clearTimeout( this._timer );
					}
					this._timer = setTimeout( () => this.render(), this._timeout );
				} else {
					this.render();
				}
			}
		} else if( resetPrevious ) {
			this._dataPrevious = null;
		}
	}
}
