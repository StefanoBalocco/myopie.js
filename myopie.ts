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
	private static readonly _regexpPathUnescapeSlash: RegExp = /(?<!\\)\\\//g;
	private static readonly _regexpMyopieDefaultOrIgnore: RegExp = /^data-myopie-(?:default|ignore)-/;
	private static readonly _regexpMyopieDefault: RegExp = /^data-myopie-default-.+/;
	private static readonly _comparators: Record<string, ( node1: HTMLElement, node2: HTMLElement ) => boolean> = {
		input: ( node1: HTMLElement, node2: HTMLElement ): boolean => {
			const tmpItem1: HTMLInputElement = node1 as HTMLInputElement;
			const tmpItem2: HTMLInputElement = node2 as HTMLInputElement;
			return (
				!!tmpItem1.type &&
				( tmpItem1.type === tmpItem2.type ) &&
				!!tmpItem1.name &&
				( tmpItem1.name === tmpItem2.name ) &&
				!tmpItem1.name.endsWith( '[]' )
			);
		},
		img: ( node1: HTMLElement, node2: HTMLElement ): boolean => {
			const tmpItem1: HTMLImageElement = node1 as HTMLImageElement;
			const tmpItem2: HTMLImageElement = node2 as HTMLImageElement;
			return (
				!!tmpItem1.src && ( tmpItem1.src === tmpItem2.src )
			);
		},
		script: ( node1: HTMLElement, node2: HTMLElement ): boolean => {
			const tmpItem1: HTMLScriptElement = node1 as HTMLScriptElement;
			const tmpItem2: HTMLScriptElement = node2 as HTMLScriptElement;
			return (
				!!tmpItem1.src && ( tmpItem1.src === tmpItem2.src )
			);
		},
		a: ( node1: HTMLElement, node2: HTMLElement ): boolean => {
			const tmpItem1: HTMLAnchorElement = node1 as HTMLAnchorElement;
			const tmpItem2: HTMLAnchorElement = node2 as HTMLAnchorElement;
			return (
				!!tmpItem1.href && ( tmpItem1.href === tmpItem2.href )
			);
		},
		link: ( node1: HTMLElement, node2: HTMLElement ): boolean => {
			const tmpItem1: HTMLLinkElement = node1 as HTMLLinkElement;
			const tmpItem2: HTMLLinkElement = node2 as HTMLLinkElement;
			return (
				!!tmpItem1.href && ( tmpItem1.href === tmpItem2.href )
			);
		}
	};
	private static readonly _extractors: Record<string, ( element: HTMLElement ) => any> = {
		input: ( element: HTMLElement ): Undefinedable<string | boolean> => {
			const input: HTMLInputElement = element as HTMLInputElement;
			let returnValue: Undefinedable<string>;
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
	};
	private readonly _inputToPath: string[][] = [];
	private readonly _selector: string;
	private readonly _template: TemplateEngine;
	private readonly _templateElement: HTMLTemplateElement;
	private readonly _timeout: number;
	private readonly _onInput: Undefinedable<( event: Event ) => void>;
	private readonly _handlersPermanent: Map<string, EventHandler[]> = new Map<string, EventHandler[]>();
	private readonly _dataCurrent: any;
	private _dataPrevious: any;
	private _inited: boolean = false;
	private _lastRendering: Undefinedable<string>;
	private _timer: Undefinedable<ReturnType<typeof setTimeout>>;
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
					if( Object.hasOwn( element, key ) && ( '__proto__' !== key ) ) {
						const value: any = element[ key ];
						returnValue[ key ] = Myopie._deepClone( value );
					}
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

	private static _nodeSimilarityCoefficient( node1: Element, node2: Element ): number {
		let returnValue: number = 0;
		if( node1.isEqualNode( node2 ) ) {
			returnValue |= 1 << 30;
		} else if( Myopie._nodeTypeElement === node1.nodeType ) {
			if( node1.nodeType === node2.nodeType ) {
				if( node1.tagName === node2.tagName ) {
					if( node1.id === node2.id ) {
						if( node1.getAttribute( 'data-myopie-id' ) === node2.getAttribute( 'data-myopie-id' ) ) {
							if( node1.getAttribute( 'data-myopie-id' ) ) {
								returnValue |= 1 << 28;
							}
							if( node1.id ) {
								returnValue |= 1 << 27;
							}
							if( !returnValue ) {
								if( node1.childElementCount === node2.childElementCount ) {
									returnValue |= 1 << 21;
									if( node1.childNodes.length === node2.childNodes.length ) {
										returnValue |= 1 << 22;
										if( node1.textContent === node2.textContent ) {
											returnValue |= 1 << 23;
										}
									}
								}

								const tagName: string = node1.tagName.toLowerCase();
								if( tagName && Myopie._comparators[ tagName ] && Myopie._comparators[ tagName ]( node1 as HTMLElement, node2 as HTMLElement ) ) {
									returnValue |= 1 << 26;
								}

								const attributes1: Attr[] = Array.from( node1.attributes ).filter( Myopie._attributesFilter );
								const attributes2: Attr[] = Array.from( node2.attributes ).filter( Myopie._attributesFilter );
								if( attributes1.length === attributes2.length ) {
									const tmpValue1: string = attributes1.map( Myopie._attributesMap ).sort().join( String.fromCharCode( 0 ) );
									const tmpValue2: string = attributes2.map( Myopie._attributesMap ).sort().join( String.fromCharCode( 0 ) );
									if( tmpValue1 === tmpValue2 ) {
										returnValue |= 1 << 25;
									}
								}

								if( node1.classList.length && node2.classList.length ) {
									const node1Classes: string = Array.from( node1.classList ).sort().join( ' ' );
									const node2Classes: string = Array.from( node2.classList ).sort().join( ' ' );
									if( node1Classes === node2Classes ) {
										returnValue |= 1 << 24;
									}
								}
							}
						}
					}
				}
			}
		}
		return returnValue;
	}

	private static _nodeDiff( nodeTemplate: ParentNode, nodeExisting: ParentNode, ignore: { content: boolean, style: boolean }, force: boolean = false ): void {
		const nodesTemplate: NodeListOf<ChildNode> = nodeTemplate.childNodes;
		const nodesExisting: NodeListOf<ChildNode> = nodeExisting.childNodes;
		const nodesExistingArray: ChildNode[] = Array.from( nodesExisting );
		const cL1: number = nodesTemplate.length;
		for( let iL1: number = 0; iL1 < cL1; iL1++ ) {
			const tmpItem: Element = nodesTemplate[ iL1 ] as Element;
			if( [ Myopie._nodeTypeElement, Myopie._nodeTypeText ].includes( nodesTemplate[ iL1 ].nodeType ) ) {
				let forceCurrent: boolean = force;
				let skipReconciliation: boolean = false;
				let currentItem: Undefinedable<Element>;
				if( !nodesExistingArray.length ) {
					switch( tmpItem.nodeType ) {
						case Myopie._nodeTypeText:
						case Myopie._nodeTypeElement: {
							currentItem = tmpItem.cloneNode( true ) as Element;
							nodeExisting.append( currentItem );
							forceCurrent = true;
							break;
						}
					}
				} else {
					let element: Undefinedable<Element>;
					let score: number = 0;
					nodesExistingArray.find(
						( candidate: ChildNode ): boolean => {
							const value: number = Myopie._nodeSimilarityCoefficient( tmpItem, candidate as Element );
							if( value > score ) {
								score = value;
								element = candidate as Element;
							}
							return ( score >= ( 1 << 25 ) );
						}
					);
					if( element ) {
						nodesExistingArray.splice( nodesExistingArray.indexOf( element ), 1 );
					} else {
						element = tmpItem.cloneNode( true ) as Element;
						forceCurrent = true;
					}
					skipReconciliation = !forceCurrent && ( 0 !== ( score & ( 1 << 30 ) ) );
					currentItem = nodesExisting[ iL1 ] as Element;
					if( !currentItem.isEqualNode( element ) ) {
						currentItem = nodeExisting.insertBefore<Element>(
							element,
							nodesExisting[ iL1 ]
						);
					}
				}
				if( currentItem && !skipReconciliation ) {
					const templateContent: Nullable<string> = ( ( tmpItem.childNodes.length ) ? null : tmpItem.textContent );
					const existingContent: Nullable<string> = ( ( currentItem.childNodes.length ) ? null : currentItem.textContent );
					if( Myopie._nodeTypeElement === tmpItem.nodeType ) {
						const localIgnore: { content: boolean, style: boolean } = {
							content: ignore.content || ( 'true' === tmpItem.getAttribute( 'data-myopie-ignore-content' ) ),
							style: ignore.style || ( 'true' === tmpItem.getAttribute( 'data-myopie-ignore-style' ) )
						};
						const addedDefault: string[] = [];
						if( !localIgnore.content ) {
							if( templateContent != existingContent ) {
								currentItem.textContent = templateContent;
							}
						}
						for( let { name, value } of tmpItem.attributes ) {
							if( Myopie._regexpMyopieDefault.test( name ) ) {
								const realName: string = name.substring( 20 );
								if( null === currentItem.getAttribute( realName ) ) {
									addedDefault.push( realName );
									currentItem.setAttribute( realName, value );
								}
							} else if( !Myopie._regexpMyopieDefaultOrIgnore.test( name ) ) {
								const protectedStyle: boolean = localIgnore.style && ( 'style' === name );
								const protectedAttribute: boolean = ( [ 'input', 'option', 'textarea' ].includes( currentItem.tagName.toLowerCase() ) && [ 'value', 'selected', 'checked' ].includes( name ) );
								const existingAttribute: Nullable<string> = currentItem.getAttribute( name );
								if( ( ( existingAttribute !== value ) && !protectedStyle && !protectedAttribute ) || ( null === existingAttribute ) ) {
									currentItem.setAttribute( name, value );
								}
							}
						}
						for( let { name } of Array.from( currentItem.attributes ) ) {
							if( null === tmpItem.getAttribute( name ) && !addedDefault.includes( name ) ) {
								if( !localIgnore.style || ( name !== 'style' ) ) {
									currentItem.removeAttribute( name );
								}
							}
						}
						// content
						if( !localIgnore.content && tmpItem.childNodes.length ) {
							Myopie._nodeDiff( tmpItem, currentItem, localIgnore, forceCurrent );
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
		let returnValue: boolean = true;
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
							if( attr.name.startsWith( 'data-myopie-default-' ) || attr.name.startsWith( 'data-myopie-ignore-' ) ) {
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
			const components: string[] = path.split( Myopie._regexpPathSplit );
			const cL1: number = components.length;
			if( 0 < cL1 ) {
				returnValue = components.reduce(
					( current: any, component: string ): any => {
						if( undefined !== current ) {
							component = component.replace( Myopie._regexpPathUnescapeSlash, '/' );
							if( '__proto__' === component ) {
								current = undefined;
							} else {
								const tag: string = Myopie._objectToString.call( current ).slice( 8, -1 );
								const tmpValue: [ boolean, any ] = Myopie._navigators[ tag ] ? Myopie._navigators[ tag ]( current, component, false ) : [ false, undefined ];
								current = tmpValue[ 1 ];
							}
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

	public del( path: string, render: boolean = true ): boolean {
		let returnValue: boolean = false;
		const components: string[] = path.split( Myopie._regexpPathSplit );
		let resetPrevious: boolean = false;
		if( !this._dataPrevious ) {
			resetPrevious = true;
			this._dataPrevious = Myopie._deepClone( this._dataCurrent );
		}
		const lastComponentIndex: number = components.length - 1;
		const target: any = components.slice( 0, lastComponentIndex ).reduce(
			( current: any, component: string ): any => {
				if( undefined !== current ) {
					component = component.replace( Myopie._regexpPathUnescapeSlash, '/' );
					if( '__proto__' === component ) {
						current = undefined;
					} else {
						const tag: string = Myopie._objectToString.call( current ).slice( 8, -1 );
						[ , current ] = Myopie._navigators[ tag ] ? Myopie._navigators[ tag ]( current, component, false ) : [ false, undefined ];
					}
				}
				return current;
			},
			this._dataCurrent
		);
		if( undefined !== target ) {
			let lastComponent: string = components[ lastComponentIndex ];
			lastComponent = lastComponent.replace( Myopie._regexpPathUnescapeSlash, '/' );
			if( '__proto__' !== lastComponent ) {
				const tag: string = Myopie._objectToString.call( target ).slice( 8, -1 );
				switch( tag ) {
					case 'Map': {
						const targetMap: Map<string, any> = target as Map<string, any>;
						if( targetMap.has( lastComponent ) ) {
							targetMap.delete( lastComponent );
							returnValue = true;
						}
						break;
					}
					case 'Object':
					case 'Array': {
						if( Object.hasOwn( target, lastComponent ) ) {
							const descriptor: Undefinedable<PropertyDescriptor> = Object.getOwnPropertyDescriptor( target, lastComponent );
							if( descriptor?.configurable ) {
								delete target[ lastComponent ];
								returnValue = true;
							}
						}
						break;
					}
				}
			}
			if( returnValue ) {
				if( render ) {
					this.renderDebounce();
				}
			} else if( resetPrevious ) {
				this._dataPrevious = undefined;
			}
		} else if( resetPrevious ) {
			this._dataPrevious = undefined;
		}
		return returnValue;
	}

	public set( path: string, value: any, render = true ): boolean {
		let returnValue: boolean = false;
		const components: string[] = path.split( Myopie._regexpPathSplit );
		let resetPrevious: boolean = false;
		if( !this._dataPrevious ) {
			resetPrevious = true;
			this._dataPrevious = Myopie._deepClone( this._dataCurrent );
		}
		let changed: boolean = false;
		const lastComponentIndex: number = components.length - 1;
		const target: any = components.slice( 0, lastComponentIndex ).reduce(
			( current: any, component: string ): any => {
				if( undefined !== current ) {
					component = component.replace( Myopie._regexpPathUnescapeSlash, '/' );
					if( '__proto__' === component ) {
						current = undefined;
					} else {
						const tag: string = Myopie._objectToString.call( current ).slice( 8, -1 );
						let result: boolean;
						[ result, current ] = Myopie._navigators[ tag ] ? Myopie._navigators[ tag ]( current, component, true ) : [ false, undefined ];
						changed ||= result;
					}
				}
				return current;
			},
			this._dataCurrent
		);
		if( undefined !== target ) {
			let lastComponent: string = components[ lastComponentIndex ];
			lastComponent = lastComponent.replace( Myopie._regexpPathUnescapeSlash, '/' );
			if( '__proto__' !== lastComponent ) {
				const tag: string = Myopie._objectToString.call( target ).slice( 8, -1 );
				switch( tag ) {
					case 'Map': {
						const targetMap: Map<string, any> = target as Map<string, any>;
						const currentValueExists: boolean = targetMap.has( lastComponent );
						const currentValue: any = targetMap.get( lastComponent );
						if( !currentValueExists || ( currentValue !== value ) ) {
							changed = true;
							targetMap.set( lastComponent, value );
						}
						returnValue = true;
						break;
					}
					case 'Object':
					case 'Array': {
						const currentValueExists: boolean = Object.hasOwn( target, lastComponent );
						const currentValue: any = target[ lastComponent ];
						if( !currentValueExists || ( currentValue !== value ) ) {
							changed = true;
							target[ lastComponent ] = value;
						}
						returnValue = true;
						break;
					}
				}
			}
		}
		if( changed ) {
			if( render ) {
				this.renderDebounce();
			}
		} else if( resetPrevious ) {
			this._dataPrevious = undefined;
		}
		return returnValue;
	}
}
