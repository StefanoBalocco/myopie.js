declare module 'jsdom' {
	class JSDOM {
		constructor( html?: string, options?: { url?: string } );
		readonly window: Window & typeof globalThis;
	}
}
