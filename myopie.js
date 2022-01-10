"use strict";
class myopie {
    constructor(selector, template, inputToPath = [], timeout = 1000) {
        this.timer = null;
        this.dataCurrent = {};
        this.dataPrevious = null;
        this.hooks = { pre: [], post: [] };
        this.selector = selector;
        this.template = template;
        this.timeout = timeout;
        this.inputToPath = inputToPath;
        document.addEventListener('input', (e) => {
            const event = e;
            const countFL = this.inputToPath.length;
            let found = false;
            for (let indexFL = 0; !found && indexFL < countFL; indexFL++) {
                if (event && event.target && event.target.matches(this.inputToPath[indexFL][0])) {
                    switch (event.target.type) {
                        case 'checkbox': {
                            this.set(this.inputToPath[indexFL][1], event.target.checked, false);
                            break;
                        }
                        case 'radio': {
                            this.set(this.inputToPath[indexFL][1], event.target.checked, false);
                            break;
                        }
                        default: {
                            this.set(this.inputToPath[indexFL][1], event.target.value, false);
                        }
                    }
                }
            }
        });
    }
    static Create(selector, template, inputToPath = [], timeout = 1000) {
        return new myopie(selector, template, inputToPath, timeout);
    }
    static SameNode(node1, node2) {
        return ((node1.nodeType === node2.nodeType) &&
            (node1.tagName === node2.tagName) &&
            (node1.id === node2.id) &&
            (node1.src === node2.src));
    }
    DiffNode(nodeTemplate, nodeExisting) {
        const nodesTemplate = nodeTemplate.childNodes;
        const nodesExisting = nodeExisting.childNodes;
        for (let indexFL = 0; indexFL < nodesTemplate.length; indexFL++) {
            const tmpItem = nodesTemplate[indexFL];
            if ('undefined' === typeof nodesExisting[indexFL]) {
                nodeExisting.appendChild(tmpItem);
            }
            else {
                let skip = false;
                if (!myopie.SameNode(tmpItem, nodesExisting[indexFL])) {
                    let ahead = Array.from(nodesExisting).slice(indexFL + 1).find((branch) => myopie.SameNode(tmpItem, branch));
                    if (!ahead) {
                        nodesExisting[indexFL].before(tmpItem);
                        skip = true;
                    }
                    else {
                        nodesExisting[indexFL].before(ahead);
                    }
                }
                if (!skip) {
                    const templateContent = (tmpItem.childNodes && tmpItem.childNodes.length) ? null : tmpItem.textContent;
                    const existingContent = (nodesExisting[indexFL].childNodes && nodesExisting[indexFL].childNodes.length) ? null : nodesExisting[indexFL].textContent;
                    if (templateContent != existingContent) {
                        nodesExisting[indexFL].textContent = templateContent;
                    }
                    if (1 === tmpItem.nodeType) {
                        const attributesTemplate = tmpItem.attributes;
                        const attributesExistings = nodesExisting[indexFL].attributes;
                        for (let { name, value } of attributesTemplate) {
                            if (name.startsWith('dataCurrent-myopie-default-') && (12 < name.length)) {
                                const realName = name.substr(12);
                                if (null === attributesExistings.getNamedItem(realName)) {
                                    nodesExisting[indexFL].setAttribute(realName, value);
                                }
                            }
                            else {
                                if ((-1 === ['input', 'option', 'textarea'].indexOf(nodesExisting[indexFL].tagName)) ||
                                    (-1 === ['value', 'selected', 'checked'].indexOf(name)) ||
                                    (null === attributesExistings.getNamedItem(name))) {
                                    nodesExisting[indexFL].setAttribute(name, value);
                                }
                            }
                        }
                        for (let { name } of attributesExistings) {
                            if (null === attributesTemplate.getNamedItem(name)) {
                                nodesExisting[indexFL].removeAttribute(name);
                            }
                        }
                    }
                    if (!tmpItem.childNodes.length && nodesExisting[indexFL].childNodes.length) {
                        nodesExisting[indexFL].innerHTML = '';
                    }
                    else if (!nodesExisting[indexFL].childNodes.length && tmpItem.childNodes.length) {
                        let fragment = document.createDocumentFragment();
                        this.DiffNode(tmpItem, fragment);
                    }
                    else {
                        this.DiffNode(tmpItem, nodesExisting[indexFL]);
                    }
                }
            }
        }
    }
    HookAddPre(hookFunction) {
        this.hooks.pre.push(hookFunction);
    }
    HookAddPost(hookFunction) {
        this.hooks.post.push(hookFunction);
    }
    render() {
        this.timer = null;
        const htmlExisting = document.querySelector(this.selector);
        if (null != htmlExisting) {
            let countFL = this.hooks.pre.length;
            for (let indexFL = 0; indexFL < countFL; indexFL++) {
                this.hooks.pre[indexFL](this.dataCurrent, this.dataPrevious);
            }
            const parser = new DOMParser();
            let tmpValue = parser.parseFromString(this.template(this.dataCurrent), 'text/html');
            if (tmpValue.head && tmpValue.head.childNodes && tmpValue.head.childNodes.length) {
                Array.from(tmpValue.head.childNodes).reverse().forEach(function (node) { tmpValue.body.insertBefore(node, tmpValue.body.firstChild); });
            }
            const htmlTemplate = (tmpValue && tmpValue.body) ? tmpValue.body : document.createElement('body');
            this.DiffNode(htmlTemplate, htmlExisting);
            countFL = this.hooks.post.length;
            for (let indexFL = 0; indexFL < countFL; indexFL++) {
                this.hooks.post[indexFL](this.dataCurrent, this.dataPrevious);
            }
            this.dataPrevious = null;
        }
        else {
        }
    }
    get(path) {
        let returnValue = this.dataCurrent;
        if (null != path) {
            let components = path.split(/(?<!(?<!\\)\\)\//);
            const lenFL = components.length;
            for (let indexFL = 0; ((indexFL < lenFL) && ('undefined' !== typeof returnValue)); indexFL++) {
                if (Array.isArray(returnValue) || ('object' === typeof (returnValue))) {
                    const elem = components[indexFL];
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
        if (null === this.dataPrevious) {
            this.dataPrevious = Object.assign({}, this.dataCurrent);
        }
        let tmpValue = this.dataCurrent;
        let components = path.split(/(?<!(?<!\\)\\)\//);
        const lenFL = components.length;
        for (let indexFL = 0; indexFL < lenFL - 1; indexFL++) {
            let tmpPath = components[indexFL];
            if ('undefined' === typeof tmpValue[tmpPath]) {
                tmpValue[tmpPath] = {};
            }
            tmpValue = tmpValue[tmpPath];
        }
        tmpValue[components[lenFL - 1]] = value;
        if (render) {
            if (null != this.timer) {
                clearTimeout(this.timer);
            }
            this.timer = setTimeout(() => this.render(), this.timeout);
        }
    }
}
