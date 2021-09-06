/*
 * Partially rip from https://github.com/cferdinandi/reef/
 */

interface NodeWithChilds {
	childNodes: NodeListOf<ChildNode>,

	appendChild( node: ChildNode ): void;
}

class myopie {
	private selector: string;
	private template: ( data: any ) => string;
	private timer: ( number | null ) = null;
	private timeout: number;
	private data: any = {};
	private inputToPath: string[][];

	constructor( selector: string, template: ( data: any ) => string, inputToPath: string[][] = [], timeout: number = 1000 ) {
		this.selector = selector;
		this.template = template;
		this.timeout = timeout;
		this.inputToPath = inputToPath;
		document.addEventListener( 'input', ( e ) => {
			const event = <InputEvent> e;
			const countFL = this.inputToPath.length;
			let found = false;
			for( let indexFL = 0; !found && indexFL < countFL; indexFL++ ) {
				if( event && event.target && ( <Element> event.target ).matches( this.inputToPath[ indexFL ][ 0 ] ) ) {
					switch( (<HTMLInputElement>event.target).type ) {
						case 'checkbox': {
							break;
						}
						case 'radio': {
							break;
						}
						default: {
							// Text, number, password, date, email, ecc
						}
					}
					this.set( this.inputToPath[ indexFL ][ 1 ], ( <HTMLInputElement> event.target ).value, false );
				}
			}
		} );
	}

	private SameNode( node1: Element, node2: Element ) {
		return ( ( node1.nodeType === node2.nodeType ) &&
						 ( node1.tagName === node2.tagName ) &&
						 ( node1.id === node2.id ) &&
						 ( ( <HTMLImageElement> node1 ).src === ( <HTMLImageElement> node2 ).src )
		);
	}

	private DiffNode( nodeTemplate: NodeWithChilds, nodeExisting: NodeWithChilds ) {
		const nodesTemplate = nodeTemplate.childNodes;
		const nodesExisting = nodeExisting.childNodes;
		const countFL = nodesTemplate.length;
		for( let indexFL = 0; indexFL < countFL; indexFL++ ) {
			const tmpItem : any = nodesTemplate[ indexFL ];
			if( 'undefined' === typeof nodesExisting[ indexFL ] ) {
				nodeExisting.appendChild( tmpItem );
			} else {
				let skip: boolean = false;
				if( !this.SameNode( <Element> tmpItem, <Element> nodesExisting[ indexFL ] ) ) {
					let ahead = Array.from( nodesExisting ).slice( indexFL + 1 ).find( ( branch ) => this.SameNode( <Element> tmpItem, <Element> branch ) );
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
							if( ( -1 !== [ 'value', 'checked', 'selected' ].indexOf( name ) ) &&
									( -1 !== [ 'input', 'option', 'textarea' ].indexOf( ( <Element> tmpItem ).tagName.toLowerCase() ) ) ) {
								continue;
							}
							( <Element> nodesExisting[ indexFL ] ).setAttribute( name, value );
						}
						// @ts-ignore
						for( let { name, value } of attributesExistings ) {
							if( null !== attributesTemplate.getNamedItem( name ) ) {
								continue;
							}
							if( ( -1 !== [ 'value', 'checked', 'selected' ].indexOf( name ) ) &&
									( [ 'input', 'option', 'textarea' ].indexOf( ( <Element> nodesExisting[ indexFL ] ).tagName.toLowerCase() ) ) ) {
								continue;
							}
							( <Element> nodesExisting[ indexFL ] ).removeAttribute( name );
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

	public render() {
		this.timer = null;
		const htmlExisting = document.querySelector<Element>( this.selector );
		if( null != htmlExisting ) {
			const parser = new DOMParser();
			let tmpValue = parser.parseFromString( this.template( this.data ), 'text/html' );
			if( tmpValue.head && tmpValue.head.childNodes && tmpValue.head.childNodes.length ) {
				Array.from( tmpValue.head.childNodes ).reverse().forEach( function( node ) { tmpValue.body.insertBefore( node, tmpValue.body.firstChild );} );
			}
			const htmlTemplate = ( tmpValue && tmpValue.body ) ? tmpValue.body : document.createElement( 'body' );
			this.DiffNode( htmlTemplate, htmlExisting );

		} else {
			// Missing target id
		}
	}

	public get( path: ( string | null ) ) {
		let returnValue = this.data;
		if( null != path ) {
			let components = path.split( /(?<!(?<!\\)\\)\// );
			const lenFL = components.length;
			for( let indexFL = 0; ( ( indexFL < lenFL - 1 ) && ( 'undefined' !== typeof returnValue ) ); indexFL++ ) {
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
		let tmpValue = this.data;
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
}