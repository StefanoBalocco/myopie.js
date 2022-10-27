interface NodeWithChilds {
    childNodes: NodeListOf<ChildNode>;
    appendChild(node: ChildNode): void;
}
declare class myopie {
    private readonly selector;
    private readonly template;
    private readonly timeout;
    private readonly inputToPath;
    private timer;
    private dataCurrent;
    private dataPrevious;
    private inited;
    private hooks;
    static Create(selector: string, template: (data: any) => string, initialData: any, inputToPath: string[][] | undefined, timeoutRender: number | undefined, timeoutResize: 0): myopie;
    private constructor();
    static DeepClone(obj: any): any;
    static SimilarNode(node1: Element, node2: Element): string | boolean;
    private DiffNode;
    HooksInitAddPre(hookFunction: ((dataCurrent: any) => void)): void;
    HooksInitAddPost(hookFunction: ((dataCurrent: any) => void)): void;
    HooksRenderAddPre(hookFunction: ((dataCurrent: any, dataPrevious: any) => void)): void;
    HooksRenderAddPost(hookFunction: ((dataCurrent: any, dataPrevious: any) => void)): void;
    resize(): void;
    render(): void;
    get(path: (string | null)): any;
    set(path: string, value: any, render?: boolean): void;
}
