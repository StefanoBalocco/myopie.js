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
    constructor(selector: string, template: (data: any) => string, initialData?: any, inputToPath?: string[][], timeout?: number);
    static DeepClone(obj: any): any;
    static SimilarNode(node1: Element, node2: Element): boolean;
    private DiffNode;
    HooksInitAddPre(hookFunction: ((dataCurrent: any) => void)): void;
    HooksInitAddPost(hookFunction: ((dataCurrent: any) => void)): void;
    HooksRenderAddPre(hookFunction: ((dataCurrent: any, dataPrevious: any) => void)): void;
    HooksRenderAddPost(hookFunction: ((dataCurrent: any, dataPrevious: any) => void)): void;
    render(): void;
    get(path: (string | null)): any;
    set(path: string, value: any, render?: boolean): void;
}
