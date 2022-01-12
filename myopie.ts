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
	private readonly timeout: number;
	private readonly inputToPath: string[][];
	private timer: ( number | null ) = null;
	private dataCurrent: any = {};
	private dataPrevious: any = null;
	private hooks: {
		init: {
			pre: ( ( dataCurrent: any, dataPrevious: any ) => void )[],
			post: ( ( dataCurrent: any, dataPrevious: any ) => void )[]
		},
		render: {
			pre: ( ( dataCurrent: any, dataPrevious: any ) => void )[],
			post: ( ( dataCurrent: any, dataPrevious: any ) => void )[]
		}
	} = { init: { pre: [], post: [] }, render: { pre: [], post: [] } };

	public static Create( selector: string, template: ( data: any ) => string, initialData: any = {}, inputToPath: string[][] = [], timeout: number = 1000 ): myopie {
		return new myopie( selector, template, initialData, inputToPath, timeout );
	}

	private constructor( selector: string, template: ( data: any ) => string, initialData: any = {}, inputToPath: string[][] = [], timeout: number = 1000 ) {
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
		let countFL = this.hooks.init.pre.length;
		for( let indexFL = 0; indexFL < countFL; indexFL++ ) {
			this.hooks.init.post[ indexFL ]( this.dataCurrent, {} );
		}
		this.render();
		countFL = this.hooks.init.post.length;
		for( let indexFL = 0; indexFL < countFL; indexFL++ ) {
			this.hooks.init.post[ indexFL ]( this.dataCurrent, {} );
		}
	}

	// Ripped from https://github.com/angus-c/just
	// Package: collection-clone
	static DeepClone( obj: any ): any {
		let returnValue: any = null;
		if( typeof obj == 'function' ) {
			returnValue = obj;
		}
		returnValue = Array.isArray( obj ) ? [] : {};
		for( var key in obj ) {
			// include prototype properties
			var value = obj[ key ];
			var type = {}.toString.call( value ).slice( 8, -1 );
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
		return returnValue;
	}

	static SameNode( node1: Element, node2: Element ) {
		return ( ( node1.nodeType === node2.nodeType ) &&
						 ( node1.tagName === node2.tagName ) &&
						 ( node1.id === node2.id ) &&
						 ( ( <HTMLImageElement> node1 ).src === ( <HTMLImageElement> node2 ).src )
		);
	}

	private DiffNode( nodeTemplate: NodeWithChilds, nodeExisting: NodeWithChilds ) {
		const nodesTemplate = nodeTemplate.childNodes;
		const nodesExisting = nodeExisting.childNodes;
		//const countFL = nodesTemplate.length;
		for( let indexFL = 0; indexFL < nodesTemplate.length; indexFL++ ) {
			const tmpItem: ChildNode = nodesTemplate[ indexFL ];
			if( 'undefined' === typeof nodesExisting[ indexFL ] ) {
				nodeExisting.appendChild( tmpItem );
			} else {
				let skip: boolean = false;
				if( !myopie.SameNode( <Element> tmpItem, <Element> nodesExisting[ indexFL ] ) ) {
					let ahead = Array.from( nodesExisting ).slice( indexFL + 1 ).find( ( branch ) => myopie.SameNode( <Element> tmpItem, <Element> branch ) );
					if( !ahead ) {
						nodesExisting[ indexFL ].before( tmpItem );
						skip = true;
					} else {
						nodesExisting[ indexFL ].before( ahead );
					}
				}
				if( !skip ) {
					const templateContent = ( tmpItem.childNodes && tmpItem.childNodes.length ) ? null : tmpItem.textContent;
					const existingContent = ( nodesExisting[ indexFL ].childNodes && nodesExisting[ indexFL ].childNodes.length ) ? null : nodesExisting[ indexFL ].textContent;
					if( templateContent != existingContent ) {
						nodesExisting[ indexFL ].textContent = templateContent;
					}
					if( 1 === tmpItem.nodeType ) {
						const attributesTemplate = ( <Element> tmpItem ).attributes;
						const attributesExistings = ( <Element> nodesExisting[ indexFL ] ).attributes;
						for( let { name, value } of attributesTemplate ) {
							if( name.startsWith( 'dataCurrent-myopie-default-' ) && ( 12 < name.length ) ) {
								const realName = name.substr( 12 );
								if( null === attributesExistings.getNamedItem( realName ) ) {
									( <Element> nodesExisting[ indexFL ] ).setAttribute( realName, value );
								}
							} else {
								if( ( -1 === [ 'input', 'option', 'textarea' ].indexOf( ( <Element> nodesExisting[ indexFL ] ).tagName ) ) ||
										( -1 === [ 'value', 'selected', 'checked' ].indexOf( name ) ) ||
										( null === attributesExistings.getNamedItem( name ) )
								) {
									( <Element> nodesExisting[ indexFL ] ).setAttribute( name, value );
								}
							}
						}
						// @ts-ignore
						for( let { name } of attributesExistings ) {
							if( null === attributesTemplate.getNamedItem( name ) ) {
								( <Element> nodesExisting[ indexFL ] ).removeAttribute( name );
							}
						}
					}
					//attributes
					if( !tmpItem.childNodes.length && nodesExisting[ indexFL ].childNodes.length ) {
						( <Element> nodesExisting[ indexFL ] ).innerHTML = '';
					} else if( !nodesExisting[ indexFL ].childNodes.length && tmpItem.childNodes.length ) {
						let fragment = document.createDocumentFragment();
						this.DiffNode( tmpItem, fragment );
					} else {
						this.DiffNode( tmpItem, nodesExisting[ indexFL ] );
					}
				}
			}
		}
	}

	public HooksInitAddPre( hookFunction: ( ( dataCurrent: any, dataPrevious: any ) => void ) ) {
		this.hooks.init.pre.push( hookFunction );
	}

	public HooksInitAddPost( hookFunction: ( ( dataCurrent: any, dataPrevious: any ) => void ) ) {
		this.hooks.init.post.push( hookFunction );
	}

	public HooksRenderAddPre( hookFunction: ( ( dataCurrent: any, dataPrevious: any ) => void ) ) {
		this.hooks.render.pre.push( hookFunction );
	}

	public HooksRenderAddPost( hookFunction: ( ( dataCurrent: any, dataPrevious: any ) => void ) ) {
		this.hooks.render.post.push( hookFunction );
	}

	public render() {
		this.timer = null;
		const htmlExisting = document.querySelector<Element>( this.selector );
		if( null != htmlExisting ) {
			let countFL = this.hooks.render.pre.length;
			for( let indexFL = 0; indexFL < countFL; indexFL++ ) {
				this.hooks.render.pre[ indexFL ]( this.dataCurrent, this.dataPrevious );
			}
			const parser = new DOMParser();
			let tmpValue = parser.parseFromString( this.template( this.dataCurrent ), 'text/html' );
			if( tmpValue.head && tmpValue.head.childNodes && tmpValue.head.childNodes.length ) {
				Array.from( tmpValue.head.childNodes ).reverse().forEach( function( node ) { tmpValue.body.insertBefore( node, tmpValue.body.firstChild );} );
			}
			const htmlTemplate = ( tmpValue && tmpValue.body ) ? tmpValue.body : document.createElement( 'body' );
			this.DiffNode( htmlTemplate, htmlExisting );
			countFL = this.hooks.render.post.length;
			for( let indexFL = 0; indexFL < countFL; indexFL++ ) {
				this.hooks.render.post[ indexFL ]( this.dataCurrent, this.dataPrevious );
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
			if( null != this.timer ) {
				clearTimeout( this.timer );
			}
			this.timer = setTimeout( () => this.render(), this.timeout );
		}
	}

	// before render e after render
}