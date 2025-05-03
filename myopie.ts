'use strict';

/*
 * Partially rip from https://github.com/cferdinandi/reef/
 */

type Undefinedable<T> = T | undefined;
type Nullable<T> = T | null;
type TemplateEngine = ( data: any ) => string;
type EventHandler = {
	event: string,
	listener: ( event: Event ) => void
};
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

export default class Myopie {
	private static readonly _nodeTypeElement: number = Node.ELEMENT_NODE;
	private static readonly _nodeTypeText: number = Node.TEXT_NODE;
	private static readonly _objectToString: ( this: any ) => string = Object.prototype.toString;
	private readonly _templateElement: HTMLTemplateElement;
	private readonly _selector: string;
	private readonly _template: TemplateEngine;
	private readonly _timeout: number = 0;
	private readonly _inputToPath: string[][];
	private readonly _document: Document;
	private readonly _onInput: ( event: Event ) => void;
	private _lastRendering: Undefinedable<string>;
	private _timer: Undefinedable<number> = undefined;
	private _dataCurrent: any = {};
	private _dataPrevious: any = null;
	private _inited: boolean = false;
	private readonly _handlersPermanent: Map<string, EventHandler[]> = new Map<string, EventHandler[]>();
	private _hooks: Hooks = { init: { pre: [], post: [] }, render: { pre: [], post: [] } };

	public constructor( document: Document, selector: string, template: TemplateEngine, initialData: any = {}, inputToPath: string[][] = [], timeout: number = 100, renderOnInput: boolean = true ) {
		this._document = document;
		this._selector = selector;
		this._template = template;
		this._timeout = timeout;
		this._inputToPath = inputToPath;
		this._dataCurrent = Myopie._deepClone( initialData );
		this._templateElement = document.createElement( 'template' );
		const extractors: Record<string, ( element: HTMLElement ) => any> = {
			input: ( element ) => {
				const input = element as HTMLInputElement;
				return ( input.type === 'checkbox' || input.type === 'radio' ) ? input.checked : input.value;
			},
			textarea: ( element ) => ( element as HTMLTextAreaElement ).value,
			select: ( element ) => ( element as HTMLSelectElement ).value
		};
		this._onInput = ( event: Event ): void => {
			const target: Nullable<EventTarget> = event?.target;
			if( target instanceof HTMLElement ) {
				const tagName: string = target.tagName.toLowerCase();
				const extractor: ( element: HTMLElement ) => any = extractors[ tagName ];
				if( !!extractor ) {
					this._inputToPath.some( ( [ selector, path ]: string[] ): boolean => {
						let returnValue: boolean = false;
						if( target.matches( selector ) ) {
							returnValue = true;
							this.set( path, extractor( target ), renderOnInput );
						}
						return returnValue;
					} );
				}
			}
		};
		this._document.addEventListener( 'input', this._onInput );
	}

	// Initially ripped from https://github.com/angus-c/just
	// Package: collection-clone
	private static _deepClone( element: any ): any {
		let returnValue: any;
		const sourceTypeOf: string = typeof element;
		const type: string = ( ( 'object' === sourceTypeOf ) ? Myopie._objectToString.call( element ).slice( 8, -1 ) : sourceTypeOf );
		switch( type ) {
			case 'Array':
			case 'Object': {
				returnValue = Array.isArray( element ) ? [] : {};
				for( const key in element ) {
					const value: any = element[ key ];
					returnValue[ key ] = Myopie._deepClone( value );
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

	private static _nodeSimilar( node1: Element, node2: Element ): boolean {
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

	private static _nodeDiff( nodeTemplate: ParentNode, nodeExisting: ParentNode, ignore: { content: boolean, style: boolean } ): void {
		const nodesTemplate: NodeListOf<ChildNode> = nodeTemplate.childNodes;
		const nodesExisting: NodeListOf<ChildNode> = nodeExisting.childNodes;
		const cL1: number = nodesTemplate.length;
		for( let iL1: number = 0; iL1 < cL1; iL1++ ) {
			const tmpItem: Element = nodesTemplate[ iL1 ] as Element;
			if( nodesExisting.length <= iL1 ) {
				switch( tmpItem.nodeType ) {
					case Myopie._nodeTypeElement: {
						nodeExisting.append( tmpItem.cloneNode( true ) );
						break;
					}
					case Myopie._nodeTypeText: {
						nodeExisting.append( tmpItem.nodeValue! );
						break;
					}
				}
			} else {
				let currentItem: Element = nodesExisting[ iL1 ] as Element;
				if( !currentItem.isEqualNode( tmpItem ) ) {
					const similar: boolean = Myopie._nodeSimilar( tmpItem, currentItem );
					const ahead: Undefinedable<Element> = ( similar ? undefined : Array.from( nodesExisting ).slice( iL1 + 1 ).find(
							( branch: ChildNode ): boolean => ( Myopie._nodeTypeElement === branch.nodeType ) && Myopie._nodeSimilar( tmpItem, branch as Element ) ) as Element
					);
					if( !similar ) {
						currentItem = nodeExisting.insertBefore<Element>( ( ahead ?? tmpItem.cloneNode( true ) ) as Element, ( ( iL1 < nodesExisting.length ) ? currentItem : null ) );
					}
					if( similar || ahead ) {
						const templateContent: Nullable<string> = ( ( tmpItem.childNodes.length ) ? null : tmpItem.textContent );
						const existingContent: Nullable<string> = ( ( currentItem.childNodes.length ) ? null : currentItem.textContent );
						if( templateContent != existingContent ) {
							currentItem.textContent = templateContent;
						}
						if( Myopie._nodeTypeElement === tmpItem.nodeType ) {
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
									Myopie._nodeDiff( tmpItem, currentItem, { ...ignore } );
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
		if( 'undefined' !== typeof this._timer ) {
			clearTimeout( this._timer );
			this._timer = undefined;
		}
		this._document.removeEventListener( 'input', this._onInput );
		for( const [ selector, handlers ] of this._handlersPermanent ) {
			const items: NodeListOf<HTMLElement> = this._document.querySelectorAll<HTMLElement>( selector );
			if( items.length && handlers.length ) {
				for( const item of items ) {
					for( const { event: event, listener: listener } of handlers ) {
						item.removeEventListener( event, listener );
					}
				}
			}
		}
	}

	public hooksInitAddPre( hookFunction: HookInit ): void {
		this._hooks.init.pre.push( hookFunction );
	}

	public hooksInitAddPost( hookFunction: HookInit ): void {
		this._hooks.init.post.push( hookFunction );
	}

	public hooksRenderAddPre( hookFunction: HookRender ): void {
		this._hooks.render.pre.push( hookFunction );
	}

	public hooksRenderAddPost( hookFunction: HookRender ): void {
		this._hooks.render.post.push( hookFunction );
	}

	public handlersPermanentAdd( selector: string, event: string, listener: ( event: Event ) => void ): boolean {
		const items: EventHandler[] = this._handlersPermanent.get( selector ) ?? [];
		let returnValue : boolean = !items.some( ( item: EventHandler ): boolean => ( event === item.event && listener === item.listener ) );
		if( returnValue ) {
			this._handlersPermanent.set( selector, [ ...items, { event: event, listener: listener } ] );
		}
		return returnValue;
	}

	public handlersPermanentDel( selector: string, event?: string, listener?: ( event: Event ) => void ): boolean {
		let returnValue: boolean = false;
		if( this._handlersPermanent.has( selector ) ) {
			let items: EventHandler[] = this._handlersPermanent.get( selector ) ?? [];
			if( event ) {
				const itemsToKeep: EventHandler[] = items.filter(
					( item: EventHandler ): boolean => !( item.event === event && ( !listener || listener === item.listener ) )
				);
				if( itemsToKeep.length < items.length ) {
					if( itemsToKeep.length ) {
						items = items.filter( ( item: EventHandler ): boolean => !itemsToKeep.includes( item ) );
						this._handlersPermanent.set( selector, itemsToKeep );
					} else {
						this._handlersPermanent.delete( selector );
					}
					returnValue = true;
				}
			} else {
				this._handlersPermanent.delete( selector );
				returnValue = true;
			}
			items.forEach(
				( { event, listener }: EventHandler ): void => {
					this._document.querySelectorAll<HTMLElement>( selector ).forEach( ( item: HTMLElement ): void => item.removeEventListener( event, listener ) );
				}
			);
		}
		return returnValue;
	}

	public render(): void {
		clearTimeout( this._timer );
		this._timer = undefined;
		const htmlExisting: Nullable<HTMLElement> = this._document.querySelector<HTMLElement>( this._selector );
		if( null != htmlExisting ) {
			const tmpValue: string = this._template( this._dataCurrent );
			if( tmpValue !== this._lastRendering ) {
				this._lastRendering = tmpValue;
				this._templateElement.innerHTML = tmpValue;
				for( const [ selector, handlers ] of this._handlersPermanent ) {
					const items: NodeListOf<HTMLElement> = this._document.querySelectorAll<HTMLElement>( selector );
					if( items.length && handlers.length ) {
						for( const item of items ) {
							for( const { event: event, listener: listener } of handlers ) {
								item.removeEventListener( event, listener );
							}
						}
					}
				}
				if( !this._inited ) {
					this._hooks.init.pre.forEach( ( hook: HookInit ): void => hook( this._dataCurrent ) );
				} else {
					this._hooks.render.pre.forEach( ( hook: HookRender ): void => hook( this._dataCurrent, this._dataPrevious ) );
				}
				Myopie._nodeDiff( this._templateElement.content, htmlExisting, { content: false, style: false } );
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
				for( const [ selector, handlers ] of this._handlersPermanent ) {
					const items: NodeListOf<HTMLElement> = this._document.querySelectorAll<HTMLElement>( selector );
					if( items.length && handlers.length ) {
						for( const item of items ) {
							for( const { event: event, listener: listener } of handlers ) {
								item.addEventListener( event, listener );
							}
						}
					}
				}
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
			this._dataPrevious = Myopie._deepClone( this._dataCurrent );
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