'use strict';
export default class Myopie {
    static _document = document;
    static _objectToString = Object.prototype.toString;
    static _nodeTypeElement = Node.ELEMENT_NODE;
    static _nodeTypeText = Node.TEXT_NODE;
    static _regexpPathSplit = /(?<!(?<!\\)\\)\//;
    static _comparators = {
        input: (node1, node2) => {
            const tmpItem1 = node1;
            const tmpItem2 = node2;
            return ((tmpItem1.type === tmpItem2.type) &&
                (tmpItem1.name === tmpItem2.name));
        },
        img: (node1, node2) => {
            const tmpItem1 = node1;
            const tmpItem2 = node2;
            return (!!tmpItem1.src && (tmpItem1.src === tmpItem2.src));
        },
        script: (node1, node2) => {
            const tmpItem1 = node1;
            const tmpItem2 = node2;
            return (!!tmpItem1.src && (tmpItem1.src === tmpItem2.src));
        },
        a: (node1, node2) => {
            const tmpItem1 = node1;
            const tmpItem2 = node2;
            return (!!tmpItem1.href && (tmpItem1.href === tmpItem2.href));
        },
        link: (node1, node2) => {
            const tmpItem1 = node1;
            const tmpItem2 = node2;
            return (!!tmpItem1.href && (tmpItem1.href === tmpItem2.href));
        }
    };
    static _extractors = {
        input: (element) => {
            const input = element;
            let returnValue;
            switch (input.type) {
                case 'checkbox':
                case 'radio': {
                    if (input.checked) {
                        returnValue = input.value;
                    }
                    break;
                }
                default: {
                    returnValue = input.value;
                }
            }
            return returnValue;
        },
        select: (element) => element.value,
        textarea: (element) => element.value
    };
    static _navigators = {
        Array: (container, path, create = false) => {
            const returnValue = [false, undefined];
            const index = Number(path);
            if (!isNaN(index)) {
                if (create) {
                    if (undefined === container[index]) {
                        container[index] = {};
                        returnValue[0] = true;
                    }
                }
                returnValue[1] = container[index];
            }
            return returnValue;
        },
        Map: (container, path, create = false) => {
            const returnValue = [false, undefined];
            if (create) {
                if (!container.has(path)) {
                    returnValue[0] = true;
                    container.set(path, {});
                }
            }
            returnValue[1] = container.get(path);
            return returnValue;
        },
        Object: (container, path, create = false) => {
            const returnValue = [false, undefined];
            if (create) {
                if (undefined === container[path]) {
                    returnValue[0] = true;
                    container[path] = {};
                }
            }
            returnValue[1] = container[path];
            return returnValue;
        },
        Set: (container, path, _create = false) => {
            const returnValue = [false, undefined];
            const index = Number(path);
            if (!isNaN(index)) {
                const tmpValue = Array.from(container);
                if (undefined !== tmpValue[index]) {
                    returnValue[1] = tmpValue[index];
                }
            }
            return returnValue;
        }
    };
    _inputToPath = [];
    _selector;
    _template;
    _templateElement;
    _timeout;
    _onInput;
    _handlersPermanent = new Map();
    _dataCurrent;
    _dataPrevious;
    _inited = false;
    _lastRendering;
    _timer;
    _hooks = { init: { pre: [], post: [] }, render: { pre: [], post: [] } };
    constructor(selector, template, initialData = {}, inputToPath = [], timeout = 100, renderOnInput = true) {
        this._selector = selector;
        this._template = template;
        this._timeout = timeout;
        this._dataCurrent = Myopie._deepClone(initialData);
        this._templateElement = document.createElement('template');
        if (Array.isArray(inputToPath) && (0 < inputToPath.length)) {
            this._inputToPath = inputToPath;
            this._onInput = (event) => {
                const target = event?.target;
                if (target instanceof HTMLElement) {
                    const tagName = target.tagName.toLowerCase();
                    if (Myopie._extractors[tagName]) {
                        this._inputToPath.some(([selector, path]) => {
                            let returnValue = false;
                            if (target.matches(selector)) {
                                returnValue = true;
                                this.set(path, Myopie._extractors[tagName](target), renderOnInput);
                            }
                            return returnValue;
                        });
                    }
                }
            };
            Myopie._document.addEventListener('input', this._onInput);
        }
    }
    static _deepClone(element) {
        let returnValue = element;
        const type = Myopie._objectToString.call(element).slice(8, -1);
        switch (type) {
            case 'Array':
            case 'Object': {
                returnValue = Array.isArray(element) ? [] : {};
                for (const key in element) {
                    const value = element[key];
                    returnValue[key] = Myopie._deepClone(value);
                }
                break;
            }
            case 'Date': {
                returnValue = new Date(element.getTime());
                break;
            }
            case 'RegExp': {
                returnValue = RegExp(element.source, element.flags);
                break;
            }
            case 'Set': {
                returnValue = new Set();
                for (const value of element) {
                    returnValue.add(Myopie._deepClone(value));
                }
                break;
            }
            case 'Map': {
                returnValue = new Map();
                for (const [key, value] of element) {
                    returnValue.set(key, Myopie._deepClone(value));
                }
                break;
            }
        }
        return returnValue;
    }
    static _removeEventListeners(items, handlers) {
        if (items.length && handlers.length) {
            for (const item of items) {
                for (const { event: event, listener: listener } of handlers) {
                    item.removeEventListener(event, listener);
                }
            }
        }
    }
    static _attributesFilter(attribute) {
        return attribute.name.startsWith('data-') && !attribute.name.startsWith('data-myopie-');
    }
    static _attributesMap(attribute) {
        return [attribute.name, attribute.value].join(String.fromCharCode(0));
    }
    static _nodeSimilar(node1, node2) {
        let returnValue = (node1.nodeType === Myopie._nodeTypeElement) && (node1.nodeType === node2.nodeType) && (node1.tagName === node2.tagName) && (node1.id === node2.id);
        if (!node1.id && returnValue) {
            const tagName = node1.tagName.toLowerCase();
            if (tagName && Myopie._comparators[tagName]) {
                returnValue = Myopie._comparators[tagName](node1, node2);
            }
            else {
                const attributes1 = Array.from(node1.attributes).filter(Myopie._attributesFilter);
                const attributes2 = Array.from(node2.attributes).filter(Myopie._attributesFilter);
                if (attributes1.length || attributes2.length) {
                    const tmpValue1 = attributes1.map(Myopie._attributesMap).sort().join(String.fromCharCode(0));
                    const tmpValue2 = attributes2.map(Myopie._attributesMap).sort().join(String.fromCharCode(0));
                    returnValue = (tmpValue1 === tmpValue2);
                }
                else {
                    if (node1.classList.length && node2.classList.length) {
                        returnValue = (Array.from(node1.classList).sort().join(' ') === Array.from(node2.classList).sort().join(' '));
                    }
                    else {
                        returnValue = (node1.childElementCount === node2.childElementCount);
                    }
                }
            }
        }
        return returnValue;
    }
    static _nodeDiff(nodeTemplate, nodeExisting, ignore) {
        const nodesTemplate = nodeTemplate.childNodes;
        const nodesExisting = nodeExisting.childNodes;
        const nodesExistingArray = Array.from(nodesExisting);
        const cL1 = nodesTemplate.length;
        for (let iL1 = 0; iL1 < cL1; iL1++) {
            const tmpItem = nodesTemplate[iL1];
            if (nodesExisting.length <= iL1) {
                switch (tmpItem.nodeType) {
                    case Myopie._nodeTypeElement: {
                        nodeExisting.append(tmpItem.cloneNode(true));
                        break;
                    }
                    case Myopie._nodeTypeText: {
                        nodeExisting.append(tmpItem.nodeValue);
                        break;
                    }
                }
            }
            else {
                let currentItem = nodesExisting[iL1];
                if (!currentItem.isEqualNode(tmpItem)) {
                    const similar = Myopie._nodeSimilar(tmpItem, currentItem);
                    const ahead = (similar ? undefined : nodesExistingArray.slice(iL1 + 1).find((branch) => Myopie._nodeSimilar(tmpItem, branch)));
                    if (!similar) {
                        currentItem = nodeExisting.insertBefore((ahead ?? tmpItem.cloneNode(true)), ((iL1 < nodesExisting.length) ? currentItem : null));
                    }
                    if (similar || ahead) {
                        const templateContent = ((tmpItem.childNodes.length) ? null : tmpItem.textContent);
                        const existingContent = ((currentItem.childNodes.length) ? null : currentItem.textContent);
                        if (templateContent != existingContent) {
                            currentItem.textContent = templateContent;
                        }
                        if (Myopie._nodeTypeElement === tmpItem.nodeType) {
                            const attributesTemplate = tmpItem.attributes;
                            const attributesExistings = currentItem.attributes;
                            const addedDefault = [];
                            if ('true' === attributesTemplate.getNamedItem('data-myopie-ignore-content')?.value) {
                                ignore.content = true;
                            }
                            if ('true' === attributesTemplate.getNamedItem('data-myopie-ignore-style')?.value) {
                                ignore.style = true;
                            }
                            for (let { name, value } of attributesTemplate) {
                                if (name.startsWith('data-myopie-default-') && (20 < name.length)) {
                                    const realName = name.substring(20);
                                    if (null === attributesExistings.getNamedItem(realName)) {
                                        addedDefault.push(realName);
                                        currentItem.setAttribute(realName, value);
                                    }
                                }
                                else if (!name.startsWith('data-myopie-')) {
                                    const protectedStyle = ignore?.style && ('style' === name);
                                    const protectedAttribute = (['input', 'option', 'textarea'].includes(currentItem.tagName) && ['value', 'selected', 'checked'].includes(name));
                                    const existingAttribute = attributesExistings.getNamedItem(name);
                                    if (((existingAttribute?.value !== value) && !protectedStyle && !protectedAttribute) || (null === existingAttribute)) {
                                        currentItem.setAttribute(name, value);
                                    }
                                }
                            }
                            for (let { name } of attributesExistings) {
                                if (null === attributesTemplate.getNamedItem(name) && !addedDefault.includes(name)) {
                                    if (!ignore?.style || (name !== 'style')) {
                                        currentItem.removeAttribute(name);
                                    }
                                }
                            }
                            if (!ignore.content) {
                                if (!tmpItem.childNodes.length && currentItem.childNodes.length) {
                                    currentItem.innerHTML = '';
                                }
                                else {
                                    Myopie._nodeDiff(tmpItem, currentItem, { ...ignore });
                                }
                            }
                        }
                    }
                }
            }
        }
        for (let iL1 = (nodesExisting.length - 1); iL1 >= cL1; iL1--) {
            nodesExisting[iL1].remove();
        }
    }
    renderDebounce() {
        if (this._timeout > 0) {
            if (undefined !== this._timer) {
                clearTimeout(this._timer);
            }
            this._timer = setTimeout(() => this.render(), this._timeout);
        }
        else {
            this.render();
        }
    }
    destroy() {
        if (undefined !== this._timer) {
            clearTimeout(this._timer);
            this._timer = undefined;
        }
        if (this._onInput) {
            Myopie._document.removeEventListener('input', this._onInput);
        }
        for (const [selector, handlers] of this._handlersPermanent) {
            const items = Myopie._document.querySelectorAll(selector);
            Myopie._removeEventListeners(items, handlers);
        }
    }
    hooksInitAddPre(hookFunction) {
        this._hooks.init.pre.push(hookFunction);
    }
    hooksInitAddPost(hookFunction) {
        this._hooks.init.post.push(hookFunction);
    }
    hooksRenderAddPre(hookFunction) {
        this._hooks.render.pre.push(hookFunction);
    }
    hooksRenderAddPost(hookFunction) {
        this._hooks.render.post.push(hookFunction);
    }
    handlersPermanentAdd(selector, event, listener) {
        const items = this._handlersPermanent.get(selector) ?? [];
        let returnValue = !items.some((item) => (event === item.event && listener === item.listener));
        if (returnValue) {
            this._handlersPermanent.set(selector, [...items, { event: event, listener: listener }]);
        }
        return returnValue;
    }
    handlersPermanentDel(selector, event, listener) {
        let returnValue = false;
        let handlers = this._handlersPermanent.get(selector) ?? [];
        if (0 < handlers.length) {
            if (event) {
                const itemsToKeep = handlers.filter((item) => !(item.event === event && (!listener || listener === item.listener)));
                if (itemsToKeep.length < handlers.length) {
                    if (itemsToKeep.length) {
                        handlers = handlers.filter((item) => !itemsToKeep.includes(item));
                        this._handlersPermanent.set(selector, itemsToKeep);
                    }
                    else {
                        this._handlersPermanent.delete(selector);
                    }
                    returnValue = true;
                }
            }
            else {
                this._handlersPermanent.delete(selector);
                returnValue = true;
            }
            const items = Myopie._document.querySelectorAll(selector);
            Myopie._removeEventListeners(items, handlers);
        }
        return returnValue;
    }
    render() {
        let returnValue = true;
        clearTimeout(this._timer);
        this._timer = undefined;
        const htmlExisting = Myopie._document.querySelector(this._selector);
        if (null != htmlExisting) {
            const tmpValue = this._template(this._dataCurrent);
            if (tmpValue !== this._lastRendering) {
                this._lastRendering = tmpValue;
                this._templateElement.innerHTML = tmpValue;
                for (const [selector, handlers] of this._handlersPermanent) {
                    const items = Myopie._document.querySelectorAll(selector);
                    Myopie._removeEventListeners(items, handlers);
                }
                if (!this._inited) {
                    this._hooks.init.pre.forEach((hook) => hook(this._dataCurrent));
                }
                else {
                    this._hooks.render.pre.forEach((hook) => hook(this._dataCurrent, this._dataPrevious));
                }
                Myopie._nodeDiff(this._templateElement.content, htmlExisting, { content: false, style: false });
                htmlExisting.querySelectorAll('*').forEach((item) => Array.from(item.attributes).forEach((attr) => {
                    if (attr.name.startsWith('data-myopie-')) {
                        item.removeAttribute(attr.name);
                    }
                }));
                if (!this._inited) {
                    this._hooks.init.post.forEach((hook) => hook(this._dataCurrent));
                    this._inited = true;
                }
                else {
                    this._hooks.render.post.forEach((hook) => hook(this._dataCurrent, this._dataPrevious));
                }
                for (const [selector, handlers] of this._handlersPermanent) {
                    const items = Myopie._document.querySelectorAll(selector);
                    if (items.length && handlers.length) {
                        for (const item of items) {
                            for (const { event: event, listener: listener } of handlers) {
                                item.addEventListener(event, listener);
                            }
                        }
                    }
                }
            }
            this._dataPrevious = undefined;
        }
        else {
            returnValue = false;
        }
        return returnValue;
    }
    get(path) {
        let returnValue;
        if (null != path) {
            const components = path.split(Myopie._regexpPathSplit);
            const cL1 = components.length;
            if (0 < cL1) {
                returnValue = components.reduce((current, component) => {
                    if (undefined !== current) {
                        const tag = Myopie._objectToString.call(current).slice(8, -1);
                        const tmpValue = Myopie._navigators[tag] ? Myopie._navigators[tag](current, component, false) : [false, undefined];
                        current = tmpValue[1];
                    }
                    return current;
                }, this._dataCurrent);
            }
        }
        if ('function' === typeof returnValue) {
            returnValue = returnValue();
        }
        return returnValue;
    }
    set(path, value, render = true) {
        let returnValue = false;
        let resetPrevious = false;
        if (!this._dataPrevious) {
            resetPrevious = true;
            this._dataPrevious = Myopie._deepClone(this._dataCurrent);
        }
        let changed = false;
        const components = path.split(Myopie._regexpPathSplit);
        const lastComponentIndex = components.length - 1;
        const target = components.slice(0, lastComponentIndex).reduce((current, component) => {
            if (undefined !== current) {
                const tag = Myopie._objectToString.call(current).slice(8, -1);
                let result;
                [result, current] = Myopie._navigators[tag] ? Myopie._navigators[tag](current, component, true) : [false, undefined];
                changed ||= result;
            }
            return current;
        }, this._dataCurrent);
        if (undefined !== target) {
            returnValue = true;
            const lastComponent = components[lastComponentIndex];
            const currentValue = target[lastComponent];
            if (currentValue !== value) {
                changed = true;
                if (undefined !== value) {
                    target[lastComponent] = value;
                }
                else {
                    delete target[lastComponent];
                }
            }
            if (changed) {
                if (render) {
                    this.renderDebounce();
                }
            }
            else if (resetPrevious) {
                this._dataPrevious = undefined;
            }
        }
        return returnValue;
    }
}
