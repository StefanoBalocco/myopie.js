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
	private static readonly _document: Document = document;
	private static readonly _objectToString: ( this: any ) => string = Object.prototype.toString;
	private static readonly _nodeTypeElement: number = Node.ELEMENT_NODE;
	private static readonly _nodeTypeText: number = Node.TEXT_NODE;
	private static readonly _regexpPathSplit: RegExp = /(?<!(?<!\\)\\)\//;
	private static readonly _comparators: Record<string, ( node1: HTMLElement, node2: HTMLElement ) => boolean> = {
		input: ( node1: HTMLElement, node2: HTMLElement ): boolean => {
			const tmpItem1 = node1 as HTMLInputElement;
			const tmpItem2 = node2 as HTMLInputElement;
			return (
				( tmpItem1.type === tmpItem2.type ) &&
				( tmpItem1.name === tmpItem2.name )
			);
		},
		img: ( node1: HTMLElement, node2: HTMLElement ): boolean => {
			const tmpItem1 = node1 as HTMLImageElement;
			const tmpItem2 = node2 as HTMLImageElement;
			return (
				!!tmpItem1.src && ( tmpItem1.src === tmpItem2.src )
			);
		},
		script: ( node1: HTMLElement, node2: HTMLElement ): boolean => {
			const tmpItem1 = node1 as HTMLScriptElement;
			const tmpItem2 = node2 as HTMLScriptElement;
			return (
				!!tmpItem1.src && ( tmpItem1.src === tmpItem2.src )
			);
		},
		a: ( node1: HTMLElement, node2: HTMLElement ): boolean => {
			const tmpItem1 = node1 as HTMLAnchorElement;
			const tmpItem2 = node2 as HTMLAnchorElement;
			return (
				!!tmpItem1.href && ( tmpItem1.href === tmpItem2.href )
			);
		},
		link: ( node1: HTMLElement, node2: HTMLElement ): boolean => {
			const tmpItem1 = node1 as HTMLLinkElement;
			const tmpItem2 = node2 as HTMLLinkElement;
			return (
				!!tmpItem1.href && ( tmpItem1.href === tmpItem2.href )
			);
		}
	};
	private static readonly _extractors: Record<string, ( element: HTMLElement ) => any> = {
		input: ( element: HTMLElement ): Undefinedable<string | boolean> => {
			const input = element as HTMLInputElement;
			let returnValue;
			switch( input.type ) {
				case 'checkbox':
				case 'radio': {
					if( input.checked ) {
						returnValue = input.value;
					}
					break;
				}
				default: {
					returnValue = input.value;
				}
			}
			return returnValue;
		},
		select: ( element: HTMLElement ): string => ( element as HTMLSelectElement ).value,
		textarea: ( element: HTMLElement ): string => ( element as HTMLTextAreaElement ).value
	};
	private static readonly _navigators: Record<string, ( container: any, path: string, create: boolean ) => [ boolean, any ]> = {
		Array: ( container: any, path: string, create: boolean = false ): [ boolean, any ] => {
			const returnValue: [ boolean, any ] = [ false, undefined ];
			const index: number = Number( path );
			if( !isNaN( index ) ) {
				if( create ) {
					if( undefined === container[ index ] ) {
						container[ index ] = {};
						returnValue[ 0 ] = true;
					}
				}
				returnValue[ 1 ] = container[ index ];
			}
			return returnValue;
		},
		Map: ( container: any, path: string, create: boolean = false ): [ boolean, any ] => {
			const returnValue: [ boolean, any ] = [ false, undefined ];
			if( create ) {
				if( !container.has( path ) ) {
					returnValue[ 0 ] = true;
					container.set( path, {} );
				}
			}
			returnValue[ 1 ] = container.get( path );
			return returnValue;
		},
		Object: ( container: any, path: string, create: boolean = false ): [ boolean, any ] => {
			const returnValue: [ boolean, any ] = [ false, undefined ];
			if( create ) {
				if( undefined === container[ path ] ) {
					returnValue[ 0 ] = true;
					container[ path ] = {};
				}
			}
			returnValue[ 1 ] = container[ path ];
			return returnValue;
		},
		Set: ( container: any, path: string, _create: boolean = false ): [ boolean, any ] => {
			const returnValue: [ boolean, any ] = [ false, undefined ];
			const index: number = Number( path );
			if( !isNaN( index ) ) {
				const tmpValue: any[] = Array.from( container );
				if( undefined !== tmpValue[ index ] ) {
					returnValue[ 1 ] = tmpValue[ index ];
				}
			}
			return returnValue;
		}
	};
	private readonly _inputToPath: string[][] = [];
	private readonly _selector: string;
	private readonly _template: TemplateEngine;
	private readonly _templateElement: HTMLTemplateElement;
	private readonly _timeout: number;
	private readonly _onInput: Undefinedable<( event: Event ) => void>;
	private readonly _handlersPermanent: Map<string, EventHandler[]> = new Map<string, EventHandler[]>();
	private _dataCurrent: any;
	private _dataPrevious: any;
	private _inited: boolean = false;
	private _lastRendering: Undefinedable<string>;
	private _timer: Undefinedable<number>;
	private _hooks: Hooks = { init: { pre: [], post: [] }, render: { pre: [], post: [] } };

	public constructor( selector: string, template: TemplateEngine, initialData: any = {}, inputToPath: string[][] = [], timeout: number = 100, renderOnInput: boolean = true ) {
		this._selector = selector;
		this._template = template;
		this._timeout = timeout;
		this._dataCurrent = Myopie._deepClone( initialData );
		this._templateElement = document.createElement( 'template' );
		if( Array.isArray( inputToPath ) && ( 0 < inputToPath.length ) ) {
			this._inputToPath = inputToPath;
			this._onInput = ( event: Event ): void => {
				const target: Nullable<EventTarget> = event?.target;
				if( target instanceof HTMLElement ) {
					const tagName: string = target.tagName.toLowerCase();
					if( Myopie._extractors[ tagName ] ) {
						this._inputToPath.some( ( [ selector, path ]: string[] ): boolean => {
							let returnValue: boolean = false;
							if( target.matches( selector ) ) {
								returnValue = true;
								this.set( path, Myopie._extractors[ tagName ]( target ), renderOnInput );
							}
							return returnValue;
						} );
					}
				}
			};
			Myopie._document.addEventListener( 'input', this._onInput );
		}
	}

	// Initially ripped from https://github.com/angus-c/just
	// Package: collection-clone
	private static _deepClone( element: any ): any {
		let returnValue: any = element;
		const type: string = Myopie._objectToString.call( element ).slice( 8, -1 );
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
			case 'Set': {
				returnValue = new Set();
				for( const value of element ) {
					returnValue.add( Myopie._deepClone( value ) );
				}
				break;
			}
			case 'Map': {
				returnValue = new Map();
				for( const [ key, value ] of element ) {
					returnValue.set( key, Myopie._deepClone( value ) );
				}
				break;
			}
		}
		return returnValue;
	}

	private static _removeEventListeners( items: NodeListOf<HTMLElement>, handlers: EventHandler[] ): void {
		if( items.length && handlers.length ) {
			for( const item of items ) {
				for( const { event: event, listener: listener } of handlers ) {
					item.removeEventListener( event, listener );
				}
			}
		}
	}

	private static _attributesFilter( attribute: Attr ): boolean {
		return attribute.name.startsWith( 'data-' ) && !attribute.name.startsWith( 'data-myopie-' );
	}

	private static _attributesMap( attribute: Attr ): string {
		return [ attribute.name, attribute.value ].join( String.fromCharCode( 0 ) );
	}

	private static _nodeSimilar( node1: Element, node2: Element ): boolean {
		let returnValue: boolean = ( node1.nodeType === Myopie._nodeTypeElement ) && ( node1.nodeType === node2.nodeType ) && ( node1.tagName === node2.tagName ) && ( node1.id === node2.id );
		if( !node1.id && returnValue ) {
			const tagName: string = node1.tagName.toLowerCase();
			if( tagName && Myopie._comparators[ tagName ] ) {
				returnValue = Myopie._comparators[ tagName ]( node1 as HTMLElement, node2 as HTMLElement );
			} else {
				const attributes1: Attr[] = Array.from( node1.attributes ).filter( Myopie._attributesFilter );
				const attributes2: Attr[] = Array.from( node2.attributes ).filter( Myopie._attributesFilter );
				if( attributes1.length || attributes2.length ) {
					const tmpValue1: string = attributes1.map( Myopie._attributesMap ).sort().join( String.fromCharCode( 0 ) );
					const tmpValue2: string = attributes2.map( Myopie._attributesMap ).sort().join( String.fromCharCode( 0 ) );
					returnValue = ( tmpValue1 === tmpValue2 );
				} else {
					if( node1.classList.length && node2.classList.length ) {
						returnValue = ( Array.from( node1.classList ).sort().join( ' ' ) === Array.from( node2.classList ).sort().join( ' ' ) );
					} else {
						returnValue = ( node1.childElementCount === node2.childElementCount );
					}
				}
			}
		}
		return returnValue;
	}

	private static _nodeDiff( nodeTemplate: ParentNode, nodeExisting: ParentNode, ignore: { content: boolean, style: boolean } ): void {
		const nodesTemplate: NodeListOf<ChildNode> = nodeTemplate.childNodes;
		const nodesExisting: NodeListOf<ChildNode> = nodeExisting.childNodes;
		const nodesExistingArray: ChildNode[] = Array.from( nodesExisting );
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
					const ahead: Undefinedable<Element> = ( similar ? undefined : nodesExistingArray.slice( iL1 + 1 ).find(
							( branch: ChildNode ): boolean => Myopie._nodeSimilar( tmpItem, branch as Element )
						) as Undefinedable<Element>
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

	public renderDebounce(): void {
		if( this._timeout > 0 ) {
			if( undefined !== this._timer ) {
				clearTimeout( this._timer );
			}
			this._timer = setTimeout( () => this.render(), this._timeout );
		} else {
			this.render();
		}
	}

	public destroy(): void {
		if( undefined !== this._timer ) {
			clearTimeout( this._timer );
			this._timer = undefined;
		}
		if( this._onInput ) {
			Myopie._document.removeEventListener( 'input', this._onInput );
		}
		for( const [ selector, handlers ] of this._handlersPermanent ) {
			const items: NodeListOf<HTMLElement> = Myopie._document.querySelectorAll<HTMLElement>( selector );
			Myopie._removeEventListeners( items, handlers );
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
		let returnValue: boolean = !items.some( ( item: EventHandler ): boolean => ( event === item.event && listener === item.listener ) );
		if( returnValue ) {
			this._handlersPermanent.set( selector, [ ...items, { event: event, listener: listener } ] );
		}
		return returnValue;
	}

	public handlersPermanentDel( selector: string, event?: string, listener?: ( event: Event ) => void ): boolean {
		let returnValue: boolean = false;
		let handlers: EventHandler[] = this._handlersPermanent.get( selector ) ?? [];
		if( 0 < handlers.length ) {
			if( event ) {
				const itemsToKeep: EventHandler[] = handlers.filter(
					( item: EventHandler ): boolean => !( item.event === event && ( !listener || listener === item.listener ) )
				);
				if( itemsToKeep.length < handlers.length ) {
					if( itemsToKeep.length ) {
						handlers = handlers.filter( ( item: EventHandler ): boolean => !itemsToKeep.includes( item ) );
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
			const items: NodeListOf<HTMLElement> = Myopie._document.querySelectorAll<HTMLElement>( selector );
			Myopie._removeEventListeners( items, handlers );
		}
		return returnValue;
	}

	public render(): boolean {
		let returnValue = true;
		clearTimeout( this._timer );
		this._timer = undefined;
		const htmlExisting: Nullable<HTMLElement> = Myopie._document.querySelector<HTMLElement>( this._selector );
		if( null != htmlExisting ) {
			const tmpValue: string = this._template( this._dataCurrent );
			if( tmpValue !== this._lastRendering ) {
				this._lastRendering = tmpValue;
				this._templateElement.innerHTML = tmpValue;
				for( const [ selector, handlers ] of this._handlersPermanent ) {
					const items: NodeListOf<HTMLElement> = Myopie._document.querySelectorAll<HTMLElement>( selector );
					Myopie._removeEventListeners( items, handlers );
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
					const items: NodeListOf<HTMLElement> = Myopie._document.querySelectorAll<HTMLElement>( selector );
					if( items.length && handlers.length ) {
						for( const item of items ) {
							for( const { event: event, listener: listener } of handlers ) {
								item.addEventListener( event, listener );
							}
						}
					}
				}
			}
			this._dataPrevious = undefined;
		} else {
			returnValue = false;
		}
		return returnValue;
	}

	public get( path: Nullable<string> ): any {
		let returnValue: any;
		if( null != path ) {
			const components: string [] = path.split( Myopie._regexpPathSplit );
			const cL1: number = components.length;
			if( 0 < cL1 ) {
				returnValue = components.reduce(
					( current: any, component: string ): any => {
						if( undefined !== current ) {
							const tag: string = Myopie._objectToString.call( current ).slice( 8, -1 );
							const tmpValue: [ boolean, any ] = Myopie._navigators[ tag ] ? Myopie._navigators[ tag ]( current, component, false ) : [ false, undefined ];
							current = tmpValue[ 1 ];
						}
						return current;
					},
					this._dataCurrent
				);
			}
		}
		if( 'function' === typeof returnValue ) {
			returnValue = returnValue();
		}
		return returnValue;
	}

	public set( path: string, value: any, render = true ): boolean {
		let returnValue: boolean = false;
		let resetPrevious: boolean = false;
		if( !this._dataPrevious ) {
			resetPrevious = true;
			this._dataPrevious = Myopie._deepClone( this._dataCurrent );
		}
		let changed: boolean = false;
		const components: string[] = path.split( Myopie._regexpPathSplit );
		const lastComponentIndex: number = components.length - 1;
		const target: any = components.slice( 0, lastComponentIndex ).reduce(
			( current: any, component: string ): any => {
				if( undefined !== current ) {
					const tag: string = Myopie._objectToString.call( current ).slice( 8, -1 );
					let result: boolean;
					[ result, current ] = Myopie._navigators[ tag ] ? Myopie._navigators[ tag ]( current, component, true ) : [ false, undefined ];
					changed ||= result;
				}
				return current;
			},
			this._dataCurrent
		);
		if( undefined !== target ) {
			returnValue = true;
			const lastComponent: string = components[ lastComponentIndex ];
			const currentValue: any = target[ lastComponent ];
			if( currentValue !== value ) {
				changed = true;
				if( undefined !== value ) {
					target[ lastComponent ] = value;
				} else {
					delete target[ lastComponent ];
				}
			}
			if( changed ) {
				if( render ) {
					this.renderDebounce();
				}
			} else if( resetPrevious ) {
				this._dataPrevious = undefined;
			}
		}
		return returnValue;
	}
}
