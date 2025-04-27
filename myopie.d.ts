type Nullable<T> = T | null;
export default class myopie {
    private readonly _selector;
    private readonly _template;
    private readonly _timeout;
    private readonly _inputToPath;
    private _timer;
    private _dataCurrent;
    private _dataPrevious;
    private _inited;
    private _hooks;
    constructor(selector: string, template: (data: any) => string, initialData?: any, inputToPath?: string[][], timeout?: number, renderOnInput?: boolean);
    static _DeepClone(obj: any): any;
    static _SimilarNode(node1: Element, node2: Element): boolean;
    private static _DiffNode;
    HooksInitAddPre(hookFunction: ((dataCurrent: any) => void)): void;
    HooksInitAddPost(hookFunction: ((dataCurrent: any) => void)): void;
    HooksRenderAddPre(hookFunction: ((dataCurrent: any, dataPrevious: any) => void)): void;
    HooksRenderAddPost(hookFunction: ((dataCurrent: any, dataPrevious: any) => void)): void;
    render(): void;
    get(path: Nullable<string>): any;
    set(path: string, value: any, render?: boolean): void;
}
export {};
