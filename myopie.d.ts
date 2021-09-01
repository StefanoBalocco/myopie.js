interface ChildNodes {
    childNodes: NodeListOf<ChildNode>;
    append(node: ChildNode): void;
}
declare class myopie {
    private id;
    private template;
    private timer;
    private timeout;
    private data;
    constructor(id: string, template: (data: any) => string, timeout?: number);
    private SameNode;
    private DiffNode;
    render(): void;
    get(path: (string | null)): any;
    set(path: string, value: any, update?: boolean): void;
}
