export default class myopie {
    _selector;
    _template;
    _timeout = 0;
    _inputToPath;
    _timer = undefined;
    _dataCurrent = {};
    _dataPrevious = null;
    _inited = false;
    _hooks = { init: { pre: [], post: [] }, render: { pre: [], post: [] } };
    static Create(selector, template, initialData = {}, inputToPath = [], timeout = 1000) {
        return new myopie(selector, template, initialData, inputToPath, timeout);
    }
    constructor(selector, template, initialData = {}, inputToPath = [], timeout) {
        this._selector = selector;
        this._template = template;
        this._timeout = timeout;
        this._inputToPath = inputToPath;
        this._dataCurrent = myopie.DeepClone(initialData);
        document.addEventListener('input', (e) => {
            const event = e;
            let found = false;
            for (let iFL = 0, cFL = this._inputToPath.length; !found && iFL < cFL; iFL++) {
                if (event && event.target && event.target.matches(this._inputToPath[iFL][0])) {
                    switch (event.target.type) {
                        case 'checkbox': {
                            this.set(this._inputToPath[iFL][1], event.target.checked, false);
                            break;
                        }
                        case 'radio': {
                            this.set(this._inputToPath[iFL][1], event.target.checked, false);
                            break;
                        }
                        default: {
                            this.set(this._inputToPath[iFL][1], event.target.value, false);
                        }
                    }
                }
            }
        });
    }
    static DeepClone(obj) {
        let returnValue = null;
        const sourceType = (typeof obj);
        switch (sourceType) {
            case 'undefined':
            case 'boolean':
            case 'number':
            case 'bigint':
            case 'string':
            case 'symbol':
            case 'function': {
                returnValue = obj;
                break;
            }
            case 'object': {
                if (null === obj) {
                    returnValue = null;
                }
                else {
                    returnValue = Array.isArray(obj) ? [] : {};
                    for (let key in obj) {
                        let value = obj[key];
                        let type = {}.toString.call(value).slice(8, -1);
                        if (type == 'Array' || type == 'Object') {
                            returnValue[key] = myopie.DeepClone(value);
                        }
                        else if (type == 'Date') {
                            returnValue[key] = new Date(value.getTime());
                        }
                        else if (type == 'RegExp') {
                            let flags = '';
                            if (typeof value.source.flags == 'string') {
                                flags = value.source.flags;
                            }
                            else {
                                let tmpValue = [];
                                value.global && tmpValue.push('g');
                                value.ignoreCase && tmpValue.push('i');
                                value.multiline && tmpValue.push('m');
                                value.sticky && tmpValue.push('y');
                                value.unicode && tmpValue.push('u');
                                flags = tmpValue.join('');
                            }
                            returnValue[key] = RegExp(value.source, flags);
                        }
                        else {
                            returnValue[key] = value;
                        }
                    }
                }
                break;
            }
        }
        return returnValue;
    }
    static SimilarNode(node1, node2) {
        return ((node1.nodeType === node2.nodeType) &&
            (node1.tagName === node2.tagName) &&
            (node1.id === node2.id) &&
            (!!node1.id ||
                (node1.src && (node1.src === node2.src)) ||
                (node1.href && (node1.href === node2.href)) ||
                (node1.className === node2.className) ||
                (node1.childElementCount === node2.childElementCount) ||
                (!node1.src && !node2.src &&
                    !node1.href && !node2.href &&
                    !node1.className && !node2.className)));
    }
    DiffNode(nodeTemplate, nodeExisting, ignore) {
        const nodesTemplate = nodeTemplate.childNodes;
        const nodesExisting = nodeExisting.childNodes;
        const cFL = nodesTemplate.length;
        for (let iFL = 0; iFL < cFL; iFL++) {
            const tmpItem = nodesTemplate[iFL];
            let currentItem;
            if (nodesExisting.length <= iFL) {
                switch (tmpItem.nodeType) {
                    case 1: {
                        nodeExisting.append(tmpItem.cloneNode(true));
                        break;
                    }
                    case 3: {
                        nodeExisting.append(tmpItem.nodeValue);
                        break;
                    }
                }
            }
            else {
                currentItem = nodesExisting[iFL];
                let skip = false;
                if (!currentItem.isEqualNode(tmpItem)) {
                    if (!myopie.SimilarNode(tmpItem, currentItem)) {
                        let ahead = Array.from(nodesExisting).slice(iFL + 1).find((branch) => myopie.SimilarNode(tmpItem, branch));
                        if (!ahead) {
                            currentItem = nodeExisting.insertBefore(tmpItem.cloneNode(true), ((iFL < nodesExisting.length) ? currentItem : null));
                            skip = true;
                        }
                        else {
                            currentItem = nodeExisting.insertBefore(ahead, ((iFL < nodesExisting.length) ? currentItem : null));
                        }
                    }
                    if (!skip) {
                        const templateContent = (tmpItem.childNodes && tmpItem.childNodes.length) ? null : tmpItem.textContent;
                        const existingContent = (currentItem.childNodes && currentItem.childNodes.length) ? null : currentItem.textContent;
                        if (templateContent != existingContent) {
                            currentItem.textContent = templateContent;
                        }
                        if (1 === tmpItem.nodeType) {
                            const attributesTemplate = tmpItem.attributes;
                            const attributesExistings = currentItem.attributes;
                            if ('true' === attributesTemplate.getNamedItem('data-myopie-ignore-content')?.value) {
                                ignore.content = true;
                            }
                            if ('true' === attributesTemplate.getNamedItem('data-myopie-ignore-style')?.value) {
                                ignore.style = true;
                            }
                            for (let { name, value } of attributesTemplate) {
                                if (name.startsWith('data-myopie-default-') && (20 < name.length)) {
                                    const realName = name.substr(20);
                                    if (null === attributesExistings.getNamedItem(realName)) {
                                        currentItem.setAttribute(realName, value);
                                    }
                                }
                                else if (!name.startsWith('data-myopie-')) {
                                    if (((!ignore?.style || 'style' != name) && ((-1 === ['input', 'option', 'textarea'].indexOf(currentItem.tagName)) || (-1 === ['value', 'selected', 'checked'].indexOf(name)))) || (null === attributesExistings.getNamedItem(name))) {
                                        currentItem.setAttribute(name, value);
                                    }
                                }
                            }
                            for (let { name } of attributesExistings) {
                                if (null === attributesTemplate.getNamedItem(name)) {
                                    if (!ignore?.style || (name !== 'style')) {
                                        currentItem.removeAttribute(name);
                                    }
                                }
                            }
                            if (!ignore.content) {
                                if (!tmpItem.childNodes.length && currentItem.childNodes.length) {
                                    currentItem.innerHTML = '';
                                }
                                else if (!currentItem.childNodes.length && tmpItem.childNodes.length) {
                                    this.DiffNode(tmpItem, currentItem, Object.assign({}, ignore));
                                }
                                else {
                                    this.DiffNode(tmpItem, currentItem, Object.assign({}, ignore));
                                }
                            }
                        }
                    }
                }
            }
        }
        for (let iFL = (nodesExisting.length - nodesTemplate.length); iFL > 0; iFL--) {
            nodesExisting[nodesExisting.length - 1].remove();
        }
    }
    HooksInitAddPre(hookFunction) {
        this._hooks.init.pre.push(hookFunction);
    }
    HooksInitAddPost(hookFunction) {
        this._hooks.init.post.push(hookFunction);
    }
    HooksRenderAddPre(hookFunction) {
        this._hooks.render.pre.push(hookFunction);
    }
    HooksRenderAddPost(hookFunction) {
        this._hooks.render.post.push(hookFunction);
    }
    render() {
        this._timer = undefined;
        const htmlExisting = document.querySelector(this._selector);
        if (null != htmlExisting) {
            if (!this._inited) {
                for (let iFL = 0, cFL = this._hooks.init.pre.length; iFL < cFL; iFL++) {
                    this._hooks.init.pre[iFL](this._dataCurrent);
                }
            }
            else {
                for (let iFL = 0, cFL = this._hooks.render.pre.length; iFL < cFL; iFL++) {
                    this._hooks.render.pre[iFL](this._dataCurrent, this._dataPrevious);
                }
            }
            const parser = new DOMParser();
            let tmpValue = parser.parseFromString(this._template(this._dataCurrent), 'text/html');
            if (tmpValue.head && tmpValue.head.childNodes && tmpValue.head.childNodes.length) {
                Array.from(tmpValue.head.childNodes).reverse().forEach(function (node) { tmpValue.body.insertBefore(node, tmpValue.body.firstChild); });
            }
            const htmlTemplate = (tmpValue && tmpValue.body) ? tmpValue.body : document.createElement('body');
            this.DiffNode(htmlTemplate, htmlExisting, { content: false, style: false });
            const items = htmlExisting.querySelectorAll('*');
            for (let iFL = 0, cFL = items.length; iFL < cFL; iFL++) {
                for (let iSL = 0, cSL = items[iFL].attributes?.length; iSL < cSL; iSL++) {
                    if (items[iFL].attributes[iSL].name.startsWith('data-myopie-')) {
                        items[iFL].removeAttribute(items[iFL].attributes[iSL].name);
                        iSL--;
                        cSL--;
                    }
                }
            }
            if (!this._inited) {
                for (let iFL = 0, cFL = this._hooks.init.post.length; iFL < cFL; iFL++) {
                    this._hooks.init.post[iFL](this._dataCurrent);
                }
                this._inited = true;
            }
            else {
                for (let iFL = 0, cFL = this._hooks.render.post.length; iFL < cFL; iFL++) {
                    this._hooks.render.post[iFL](this._dataCurrent, this._dataPrevious);
                }
            }
            this._dataPrevious = null;
        }
        else {
        }
    }
    get(path) {
        let returnValue = this._dataCurrent;
        if (null != path) {
            let components = path.split(/(?<!(?<!\\)\\)\//);
            const lenFL = components.length;
            for (let iFL = 0; ((iFL < lenFL) && ('undefined' !== typeof returnValue)); iFL++) {
                if (Array.isArray(returnValue) || ('object' === typeof (returnValue))) {
                    const elem = components[iFL];
                    if ('undefined' !== typeof returnValue[elem]) {
                        returnValue = returnValue[elem];
                    }
                    else {
                        returnValue = undefined;
                    }
                }
                else {
                    returnValue = undefined;
                }
            }
        }
        return returnValue;
    }
    set(path, value, render = true) {
        if (null === this._dataPrevious) {
            this._dataPrevious = myopie.DeepClone(this._dataCurrent);
        }
        let tmpValue = this._dataCurrent;
        let components = path.split(/(?<!(?<!\\)\\)\//);
        const lenFL = components.length;
        for (let iFL = 0; iFL < lenFL - 1; iFL++) {
            let tmpPath = components[iFL];
            if ('undefined' === typeof tmpValue[tmpPath]) {
                tmpValue[tmpPath] = {};
            }
            tmpValue = tmpValue[tmpPath];
        }
        if ('undefined' !== typeof value) {
            tmpValue[components[lenFL - 1]] = value;
        }
        else if ('undefined' !== typeof tmpValue[components[lenFL - 1]]) {
            delete tmpValue[components[lenFL - 1]];
        }
        if (render) {
            if (this._timeout > 0) {
                if ('undefined' != typeof this._timer) {
                    clearTimeout(this._timer);
                }
                this._timer = setTimeout(() => this.render(), this._timeout);
            }
            else {
                this.render();
            }
        }
    }
}
