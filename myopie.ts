/*
 * Partially rip from https://github.com/cferdinandi/reef/
 */

interface NodeWithChilds {
	childNodes: NodeListOf<ChildNode>,

	appendChild( node: ChildNode ): void;
}

class myopie {
	private readonly selector: string;
	private readonly template: ( data: any ) => string;
	private readonly timeout: number = 0;
	private readonly inputToPath: string[][];
	private timer: ( number | undefined ) = undefined;
	private dataCurrent: any = {};
	private dataPrevious: any = null;
	private inited: boolean = false;
	private hooks: {
		init: {
			pre: ( ( dataCurrent: any ) => void )[],
			post: ( ( dataCurrent: any ) => void )[],
		},
		render: {
			pre: ( ( dataCurrent: any, dataPrevious: any ) => void )[],
			post: ( ( dataCurrent: any, dataPrevious: any ) => void )[]
		}
	} = { init: { pre: [], post: [] }, render: { pre: [], post: [] } };

	public static Create( selector: string, template: ( data: any ) => string, initialData: any = {}, inputToPath: string[][] = [], timeout: number = 1000 ): myopie {
		return new myopie( selector, template, initialData, inputToPath, timeout );
	}

	private constructor( selector: string, template: ( data: any ) => string, initialData: any = {}, inputToPath: string[][] = [], timeout: number ) {
		this.selector = selector;
		this.template = template;
		this.timeout = timeout;
		this.inputToPath = inputToPath;
		this.dataCurrent = myopie.DeepClone( initialData );
		document.addEventListener( 'input', ( e ) => {
			const event = <InputEvent> e;
			const countFL = this.inputToPath.length;
			let found = false;
			for( let indexFL = 0; !found && indexFL < countFL; indexFL++ ) {
				if( event && event.target && ( <Element> event.target ).matches( this.inputToPath[ indexFL ][ 0 ] ) ) {
					switch( ( <HTMLInputElement> event.target ).type ) {
						case 'checkbox': {
							this.set( this.inputToPath[ indexFL ][ 1 ], ( <HTMLInputElement> event.target ).checked, false );
							break;
						}
						case 'radio': {
							this.set( this.inputToPath[ indexFL ][ 1 ], ( <HTMLInputElement> event.target ).checked, false );
							break;
						}
						default: {
							this.set( this.inputToPath[ indexFL ][ 1 ], ( <HTMLInputElement> event.target ).value, false );
							// Text, number, password, date, email, ecc
						}
					}
				}
			}
		} );
	}

	// Ripped from https://github.com/angus-c/just
	// Package: collection-clone
	static DeepClone( obj: any ): any {
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
							returnValue[ key ] = myopie.DeepClone( value );
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

	static SimilarNode( node1: Element, node2: Element ) {
		return (
			( node1.nodeType === node2.nodeType ) &&
			( node1.tagName === node2.tagName ) &&
			( node1.id === node2.id ) &&
			(
				node1.id ||
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

	private DiffNode( nodeTemplate: Element, nodeExisting: Element, ignore?: { content?: boolean, style?: boolean } ) {
		const nodesTemplate = nodeTemplate.childNodes;
		const nodesExisting = nodeExisting.childNodes;
		for( let indexFL = 0; indexFL < nodesTemplate.length; indexFL++ ) {
			const tmpItem: Element = <Element> nodesTemplate[ indexFL ];
			let currentItem: Element;
			if( nodesExisting.length <= indexFL ) {
				currentItem = nodeExisting.appendChild<HTMLElement>( <HTMLElement> tmpItem.cloneNode( true ) );
			} else {
				currentItem = <Element> nodesExisting[ indexFL ];
				let skip: boolean = false;
				if( !currentItem.isEqualNode( tmpItem ) ) {
					if( !myopie.SimilarNode( tmpItem, currentItem ) ) {
						let ahead: Element = <Element> Array.from( nodesExisting ).slice( indexFL + 1 ).find( ( branch ) => myopie.SimilarNode( tmpItem, <Element> branch ) );
						if( !ahead ) {
							currentItem = nodeExisting.insertBefore<Element>( <Element> tmpItem.cloneNode( true ), ( ( indexFL < nodesExisting.length ) ? currentItem : null ) );
							skip = true;
						} else {
							currentItem = nodeExisting.insertBefore<Element>( <Element> ahead.cloneNode( true ), ( ( indexFL < nodesExisting.length ) ? currentItem : null ) );
						}
					}
					if( !skip ) {
						const templateContent = ( tmpItem.childNodes && tmpItem.childNodes.length ) ? null : tmpItem.textContent;
						const existingContent = ( currentItem.childNodes && currentItem.childNodes.length ) ? null : currentItem.textContent;
						if( templateContent != existingContent ) {
							currentItem.textContent = templateContent;
						}
						if( 1 === tmpItem.nodeType ) {
							if( !ignore ) {
								ignore = { content: false, style: false };
							}
							//attributes
							const attributesTemplate = tmpItem.attributes;
							const attributesExistings = currentItem.attributes;
							if( 'true' === attributesTemplate.getNamedItem( 'data-myopie-ignore-content' )?.value ) {
								ignore.content = true;
							}
							if( 'true' === attributesTemplate.getNamedItem( 'data-myopie-ignore-style' )?.value ) {
								ignore.style = true;
							}
							for( let { name, value } of attributesTemplate ) {
								if( name.startsWith( 'data-myopie-default-' ) && ( 20 < name.length ) ) {
									const realName = name.substr( 20 );
									if( null === attributesExistings.getNamedItem( realName ) ) {
										currentItem.setAttribute( realName, value );
									}
								} else {
									if( !name.startsWith( 'data-myopie-' ) ) {
										if( ( ( !ignore?.style || 'style' != name ) && ( ( -1 === [ 'input', 'option', 'textarea' ].indexOf( currentItem.tagName ) ) || ( -1 === [ 'value', 'selected', 'checked' ].indexOf( name ) ) ) ) || ( null === attributesExistings.getNamedItem( name ) ) ) {
											currentItem.setAttribute( name, value );
										}
									}
								}
							}
							// @ts-ignore
							for( let { name } of attributesExistings ) {
								if( null === attributesTemplate.getNamedItem( name ) ) {
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
									this.DiffNode( tmpItem, currentItem, ignore );
								} else {
									this.DiffNode( tmpItem, currentItem, ignore );
								}
								for( let indexSL = ( nodesExisting.length - nodesTemplate.length ); indexSL > 0; indexSL-- ) {
									nodesExisting[ nodesExisting.length - 1 ].remove();
								}
							}
						}
					}
				}
			}
		}
	}

	public HooksInitAddPre( hookFunction: ( ( dataCurrent: any ) => void ) ) {
		this.hooks.init.pre.push( hookFunction );
	}

	public HooksInitAddPost( hookFunction: ( ( dataCurrent: any ) => void ) ) {
		this.hooks.init.post.push( hookFunction );
	}

	public HooksRenderAddPre( hookFunction: ( ( dataCurrent: any, dataPrevious: any ) => void ) ) {
		this.hooks.render.pre.push( hookFunction );
	}

	public HooksRenderAddPost( hookFunction: ( ( dataCurrent: any, dataPrevious: any ) => void ) ) {
		this.hooks.render.post.push( hookFunction );
	}

	public render() {
		this.timer = undefined;
		const htmlExisting = document.querySelector<HTMLElement>( this.selector );
		if( null != htmlExisting ) {
			if( !this.inited ) {
				const countFL = this.hooks.init.pre.length;
				for( let indexFL = 0; indexFL < countFL; indexFL++ ) {
					this.hooks.init.pre[ indexFL ]( this.dataCurrent );
				}
			} else {
				const countFL = this.hooks.render.pre.length;
				for( let indexFL = 0; indexFL < countFL; indexFL++ ) {
					this.hooks.render.pre[ indexFL ]( this.dataCurrent, this.dataPrevious );
				}
			}
			const parser = new DOMParser();
			let tmpValue = parser.parseFromString( this.template( this.dataCurrent ), 'text/html' );
			if( tmpValue.head && tmpValue.head.childNodes && tmpValue.head.childNodes.length ) {
				Array.from( tmpValue.head.childNodes ).reverse().forEach( function( node ) { tmpValue.body.insertBefore( node, tmpValue.body.firstChild );} );
			}
			const htmlTemplate = ( tmpValue && tmpValue.body ) ? tmpValue.body : document.createElement( 'body' );
			this.DiffNode( htmlTemplate, htmlExisting );
			if( !this.inited ) {
				const countFL = this.hooks.init.post.length;
				for( let indexFL = 0; indexFL < countFL; indexFL++ ) {
					this.hooks.init.post[ indexFL ]( this.dataCurrent );
				}
				this.inited = true;
			} else {
				const countFL = this.hooks.render.post.length;
				for( let indexFL = 0; indexFL < countFL; indexFL++ ) {
					this.hooks.render.post[ indexFL ]( this.dataCurrent, this.dataPrevious );
				}
			}
			this.dataPrevious = null;
		} else {
			// Missing target id
		}
	}

	public get( path: ( string | null ) ) {
		let returnValue = this.dataCurrent;
		if( null != path ) {
			let components = path.split( /(?<!(?<!\\)\\)\// );
			const lenFL = components.length;
			for( let indexFL = 0; ( ( indexFL < lenFL ) && ( 'undefined' !== typeof returnValue ) ); indexFL++ ) {
				if( Array.isArray( returnValue ) || ( 'object' === typeof ( returnValue ) ) ) {
					const elem = components[ indexFL ];
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
		return returnValue;
	}

	public set( path: string, value: any, render = true ) {
		if( null === this.dataPrevious ) {
			this.dataPrevious = myopie.DeepClone( this.dataCurrent );
		}
		let tmpValue = this.dataCurrent;
		let components = path.split( /(?<!(?<!\\)\\)\// );
		const lenFL = components.length;
		for( let indexFL = 0; indexFL < lenFL - 1; indexFL++ ) {
			let tmpPath = components[ indexFL ];
			if( 'undefined' === typeof tmpValue[ tmpPath ] ) {
				tmpValue[ tmpPath ] = {};
			}
			tmpValue = tmpValue[ tmpPath ];
		}
		tmpValue[ components[ lenFL - 1 ] ] = value;
		if( render ) {
			if( this.timeout > 0 ) {
				if( 'undefined' != typeof this.timer ) {
					clearTimeout( this.timer );
				}
				this.timer = setTimeout( () => this.render(), this.timeout );
			} else {
				this.render();
			}
		}
	}
}