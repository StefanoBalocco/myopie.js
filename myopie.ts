'use strict';

/*
 * Partially rip from https://github.com/cferdinandi/reef/
 */

type Undefinedable<T> = T | undefined;
type Nullable<T> = T | null;
type TemplateEngine = ( data: any ) => string;
type HookInit = ( dataCurrent: any ) => void;
type HookRender = ( dataCurrent: any, dataPrevious: any ) => void;
type Hooks = {
	init: {
		pre: HookInit[],
		post: HookInit[]
	},
	render: {
		pre: HookRender[],
		post: HookRender[]
	}
}

export default class myopie {
	private static _objectToString: ( this: any ) => string = Object.prototype.toString;
	private readonly _selector: string;
	private readonly _template: TemplateEngine;
	private readonly _timeout: number = 0;
	private readonly _inputToPath: string[][];
	private readonly _document: Document;
	private readonly _onInput: ( event: Event ) => void;
	private _timer: Undefinedable<number> = undefined;
	private _dataCurrent: any = {};
	private _dataPrevious: any = null;
	private _inited: boolean = false;
	private _hooks: Hooks = { init: { pre: [], post: [] }, render: { pre: [], post: [] } };

	public constructor( document: Document, selector: string, template: TemplateEngine, initialData: any = {}, inputToPath: string[][] = [], timeout: number = 100, renderOnInput: boolean = true ) {
		this._document = document;
		this._selector = selector;
		this._template = template;
		this._timeout = timeout;
		this._inputToPath = inputToPath;
		this._dataCurrent = myopie._DeepClone( initialData );
		this._onInput = ( event: Event ): void => {
			const target: Nullable<EventTarget> = event?.target;
			if( target instanceof HTMLInputElement ) {
				this._inputToPath.some( ( [ selector, path ]: string[] ): boolean => {
					let returnValue: boolean = false;
					if( target.matches( selector ) ) {
						// Ho trovato la corrispondenza: eseguo lo switch e interrompo
						switch( target.type ) {
							case 'checkbox':
							case 'radio': {
								this.set( path, target.checked, renderOnInput );
								break;
							}
							default: {
								this.set( path, target.value, renderOnInput );
								break;
							}
						}
						returnValue = true;
					}
					return returnValue;
				} );
			}
		};
		this._document.addEventListener( 'input', this._onInput );
	}

	// Initially ripped from https://github.com/angus-c/just
	// Package: collection-clone
	private static _DeepClone( element: any ): any {
		let returnValue: any;
		const sourceTypeOf: string = typeof element;
		const type: string = ( ( 'object' === sourceTypeOf ) ? myopie._objectToString.call( element ).slice( 8, -1 ) : sourceTypeOf );
		switch( type ) {
			case 'Array':
			case 'Object': {
				returnValue = Array.isArray( element ) ? [] : {};
				for( const key in element ) {
					const value: any = element[ key ];
					returnValue[ key ] = myopie._DeepClone( value );
				}
				break;
			}
			case 'Date': {
				returnValue = new Date( element.getTime() );
				break;
			}
			case 'RegExp': {
				returnValue = RegExp( element.source, element.flags );
				break;
			}
			default: {
				returnValue = element;
				break;
			}
		}
		return returnValue;
	}

	private static _SimilarNode( node1: Element, node2: Element ): boolean {
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

	private static _DiffNode( nodeTemplate: Element, nodeExisting: Element, ignore: { content: boolean, style: boolean } ): void {
		const nodesTemplate: NodeListOf<ChildNode> = nodeTemplate.childNodes;
		const nodesExisting: NodeListOf<ChildNode> = nodeExisting.childNodes;
		const cL1: number = nodesTemplate.length;
		for( let iL1: number = 0; iL1 < cL1; iL1++ ) {
			const tmpItem: Element = <Element> nodesTemplate[ iL1 ];
			if( nodesExisting.length <= iL1 ) {
				switch( tmpItem.nodeType ) {
					case Node.ELEMENT_NODE: {
						nodeExisting.append( tmpItem.cloneNode( true ) );
						break;
					}
					case Node.TEXT_NODE: {
						nodeExisting.append( <string> tmpItem.nodeValue );
						break;
					}
				}
			} else {
				let currentItem: Element = <Element> nodesExisting[ iL1 ];
				if( !currentItem.isEqualNode( tmpItem ) ) {
					const similar: boolean = myopie._SimilarNode( tmpItem, currentItem );
					const ahead: Undefinedable<Element> = ( similar ? undefined : <Element> Array.from( nodesExisting ).slice( iL1 + 1 ).find( ( branch: ChildNode ): boolean => myopie._SimilarNode( tmpItem, <Element> branch ) ) );
					if( !similar ) {
						currentItem = nodeExisting.insertBefore<Element>( <Element> ( ahead ?? tmpItem.cloneNode( true ) ), ( ( iL1 < nodesExisting.length ) ? currentItem : null ) );
					}
					if( similar || ahead ) {
						const templateContent: Nullable<string> = ( tmpItem.childNodes.length ) ? null : tmpItem.textContent;
						const existingContent: Nullable<string> = ( currentItem.childNodes.length ) ? null : currentItem.textContent;
						if( templateContent != existingContent ) {
							currentItem.textContent = templateContent;
						}
						if( Node.ELEMENT_NODE === tmpItem.nodeType ) {
							//attributes
							const attributesTemplate: NamedNodeMap = tmpItem.attributes;
							const attributesExistings: NamedNodeMap = currentItem.attributes;
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
								} else {
									myopie._DiffNode( tmpItem, currentItem, { ...ignore } );
								}
							}
						}
					}
				}
			}
		}
		for( let iL1: number = ( nodesExisting.length - 1 ); iL1 >= cL1; iL1-- ) {
			nodesExisting[ iL1 ].remove();
		}
	}

	public destroy(): void {
		this._document.removeEventListener( 'input', this._onInput );
		if( 'undefined' !== typeof this._timer ) {
			clearTimeout( this._timer );
			this._timer = undefined;
		}
	}

	public HooksInitAddPre( hookFunction: HookInit ): void {
		this._hooks.init.pre.push( hookFunction );
	}

	public HooksInitAddPost( hookFunction: HookInit ): void {
		this._hooks.init.post.push( hookFunction );
	}

	public HooksRenderAddPre( hookFunction: HookRender ): void {
		this._hooks.render.pre.push( hookFunction );
	}

	public HooksRenderAddPost( hookFunction: HookRender ): void {
		this._hooks.render.post.push( hookFunction );
	}

	public render(): void {
		clearTimeout( this._timer );
		this._timer = undefined;
		const htmlExisting: Nullable<HTMLElement> = this._document.querySelector<HTMLElement>( this._selector );
		if( null != htmlExisting ) {
			if( !this._inited ) {
				this._hooks.init.pre.forEach( ( hook: HookInit ): void => hook( this._dataCurrent ) );
			} else {
				this._hooks.render.pre.forEach( ( hook: HookRender ): void => hook( this._dataCurrent, this._dataPrevious ) );
			}
			const parser: DOMParser = new DOMParser();
			const tmpValue: Document = parser.parseFromString( this._template( this._dataCurrent ), 'text/html' );
			if( tmpValue.head && tmpValue.head.childNodes && tmpValue.head.childNodes.length ) {
				Array.from( tmpValue.head.childNodes ).reverse().forEach( function( node ) { tmpValue.body.insertBefore( node, tmpValue.body.firstChild );} );
			}
			const htmlTemplate: HTMLElement = ( tmpValue && tmpValue.body ) ? tmpValue.body : this._document.createElement( 'body' );
			myopie._DiffNode( htmlTemplate, htmlExisting, { content: false, style: false } );
			htmlExisting.querySelectorAll<HTMLElement>( '*' ).forEach(
				( item: HTMLElement ): void => Array.from( item.attributes ).forEach(
					( attr: Attr ): void => {
						if( attr.name.startsWith( 'data-myopie-' ) ) {
							item.removeAttribute( attr.name );
						}
					}
				)
			);
			if( !this._inited ) {
				this._hooks.init.post.forEach( ( hook: HookInit ): void => hook( this._dataCurrent ) );
				this._inited = true;
			} else {
				this._hooks.render.post.forEach( ( hook: HookRender ): void => hook( this._dataCurrent, this._dataPrevious ) );
			}
			this._dataPrevious = null;
		} else {
			// Missing target id
		}
	}

	public get( path: Nullable<string> ): any {
		let returnValue: any;
		if( null != path ) {
			const components: string [] = path.split( /(?<!(?<!\\)\\)\// );
			const cL1: number = components.length;
			if( 0 < cL1 ) {
				returnValue = this._dataCurrent;
				for( let iL1: number = 0; ( ( iL1 < cL1 ) && ( 'undefined' !== typeof returnValue ) ); iL1++ ) {
					if( Array.isArray( returnValue ) || ( 'object' === typeof ( returnValue ) ) ) {
						const elem: string = components[ iL1 ];
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

	public set( path: string, value: any, render = true ): void {
		let resetPrevious: boolean = false;
		if( null === this._dataPrevious ) {
			resetPrevious = true;
			this._dataPrevious = myopie._DeepClone( this._dataCurrent );
		}
		let tmpValue: any = this._dataCurrent;
		let changed: boolean = false;
		const components: string[] = path.split( /(?<!(?<!\\)\\)\// );
		const cL1: number = components.length - 1;
		for( let iL1: number = 0; iL1 < cL1; iL1++ ) {
			let tmpPath: string = components[ iL1 ];
			if( 'undefined' === typeof tmpValue[ tmpPath ] ) {
				changed = true;
				tmpValue[ tmpPath ] = {};
			}
			tmpValue = tmpValue[ tmpPath ];
		}
		const lastComponent: string = components[ cL1 ];
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
