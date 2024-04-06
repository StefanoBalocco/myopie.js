export declare class myopie {
    private readonly selector;
    private readonly template;
    private readonly timeout;
    private readonly inputToPath;
    private timer;
    private dataCurrent;
    private dataPrevious;
    private inited;
    private hooks;
    static Create(selector: string, template: (data: any) => string, initialData?: any, inputToPath?: string[][], timeout?: number): myopie;
    private constructor();
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
