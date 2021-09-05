interface NodeWithChilds {
    childNodes: NodeListOf<ChildNode>;
    appendChild(node: ChildNode): void;
}
declare class myopie {
    private selector;
    private template;
    private timer;
    private timeout;
    private data;
    private inputToPath;
    constructor(selector: string, template: (data: any) => string, inputToPath?: string[][], timeout?: number);
    private SameNode;
    private DiffNode;
    render(): void;
    get(path: (string | null)): any;
    set(path: string, value: any, render?: boolean): void;
}
