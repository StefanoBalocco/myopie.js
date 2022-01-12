"use strict";
class myopie {
    constructor(selector, template, initialData = {}, inputToPath = [], timeout = 1000) {
        this.timer = null;
        this.dataCurrent = {};
        this.dataPrevious = null;
        this.hooks = { init: { pre: [], post: [] }, render: { pre: [], post: [] } };
        this.selector = selector;
        this.template = template;
        this.timeout = timeout;
        this.inputToPath = inputToPath;
        this.dataCurrent = myopie.DeepClone(initialData);
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
        let countFL = this.hooks.init.pre.length;
        for (let indexFL = 0; indexFL < countFL; indexFL++) {
            this.hooks.init.post[indexFL](this.dataCurrent, {});
        }
        this.render();
        countFL = this.hooks.init.post.length;
        for (let indexFL = 0; indexFL < countFL; indexFL++) {
            this.hooks.init.post[indexFL](this.dataCurrent, {});
        }
    }
    static Create(selector, template, initialData = {}, inputToPath = [], timeout = 1000) {
        return new myopie(selector, template, initialData, inputToPath, timeout);
    }
    static DeepClone(obj) {
        let returnValue = null;
        if (typeof obj == 'function') {
            returnValue = obj;
        }
        returnValue = Array.isArray(obj) ? [] : {};
        for (var key in obj) {
            var value = obj[key];
            var type = {}.toString.call(value).slice(8, -1);
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
        return returnValue;
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
    HooksInitAddPre(hookFunction) {
        this.hooks.init.pre.push(hookFunction);
    }
    HooksInitAddPost(hookFunction) {
        this.hooks.init.post.push(hookFunction);
    }
    HooksRenderAddPre(hookFunction) {
        this.hooks.render.pre.push(hookFunction);
    }
    HooksRenderAddPost(hookFunction) {
        this.hooks.render.post.push(hookFunction);
    }
    render() {
        this.timer = null;
        const htmlExisting = document.querySelector(this.selector);
        if (null != htmlExisting) {
            let countFL = this.hooks.render.pre.length;
            for (let indexFL = 0; indexFL < countFL; indexFL++) {
                this.hooks.render.pre[indexFL](this.dataCurrent, this.dataPrevious);
            }
            const parser = new DOMParser();
            let tmpValue = parser.parseFromString(this.template(this.dataCurrent), 'text/html');
            if (tmpValue.head && tmpValue.head.childNodes && tmpValue.head.childNodes.length) {
                Array.from(tmpValue.head.childNodes).reverse().forEach(function (node) { tmpValue.body.insertBefore(node, tmpValue.body.firstChild); });
            }
            const htmlTemplate = (tmpValue && tmpValue.body) ? tmpValue.body : document.createElement('body');
            this.DiffNode(htmlTemplate, htmlExisting);
            countFL = this.hooks.render.post.length;
            for (let indexFL = 0; indexFL < countFL; indexFL++) {
                this.hooks.render.post[indexFL](this.dataCurrent, this.dataPrevious);
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
            this.dataPrevious = myopie.DeepClone(this.dataCurrent);
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
