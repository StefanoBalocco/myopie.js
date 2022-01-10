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
    private hooks;
    static Create(selector: string, template: (data: any) => string, inputToPath?: string[][], timeout?: number): myopie;
    private constructor();
    static SameNode(node1: Element, node2: Element): boolean;
    private DiffNode;
    HookAddPre(hookFunction: ((dataCurrent: any, dataPrevious: any) => void)): void;
    HookAddPost(hookFunction: ((dataCurrent: any, dataPrevious: any) => void)): void;
    render(): void;
    get(path: (string | null)): any;
    set(path: string, value: any, render?: boolean): void;
}
