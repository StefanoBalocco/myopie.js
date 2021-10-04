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
    private data;
    constructor(selector: string, template: (data: any) => string, inputToPath?: string[][], timeout?: number);
    private SameNode;
    private DiffNode;
    render(): void;
    get(path: (string | null)): any;
    set(path: string, value: any, render?: boolean): void;
}
