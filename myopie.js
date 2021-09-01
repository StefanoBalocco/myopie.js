"use strict";
class myopie {
    constructor(id, template, timeout = 1000) {
        this.timer = null;
        this.id = id;
        this.template = template;
        this.timeout = timeout;
    }
    SameNode(node1, node2) {
        return ((node1.nodeType === node2.nodeType) &&
            (node1.tagName === node2.tagName) &&
            (node1.id === node2.id) &&
            (node1.src === node2.src));
    }
    DiffNode(nodeTemplate, nodeExisting) {
        const nodesTemplate = nodeTemplate.childNodes;
        const nodesExisting = nodeExisting.childNodes;
        const countFL = nodesTemplate.length;
        for (let indexFL = 0; indexFL < countFL; indexFL++) {
            const tmpItem = Object.assign({}, nodesTemplate[indexFL]);
            if ('undefined' === typeof nodesExisting[indexFL]) {
                nodeExisting.appendChild(tmpItem);
            }
            else {
                let skip = false;
                if (!this.SameNode(tmpItem, nodesExisting[indexFL])) {
                    let ahead = Array.from(nodesExisting).slice(indexFL + 1).find((branch) => this.SameNode(tmpItem, branch));
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
                            if (['value', 'checked', 'selected'].includes(name) && ['input', 'option', 'textarea'].includes(tmpItem.tagName.toLowerCase())) {
                                continue;
                            }
                            nodesExisting[indexFL].setAttribute(name, value);
                        }
                        for (let { name, value } of attributesExistings) {
                            if (null !== attributesTemplate.getNamedItem(name)) {
                                continue;
                            }
                            if (['value', 'checked', 'selected'].includes(name) && ['input', 'option', 'textarea'].includes(nodesExisting[indexFL].tagName.toLowerCase())) {
                                continue;
                            }
                            nodesExisting[indexFL].removeAttribute(name);
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
    render() {
        this.timer = null;
        const htmlExisting = document.getElementById(this.id);
        if (null != htmlExisting) {
            const parser = new DOMParser();
            let tmpValue = parser.parseFromString(this.template(this.data), 'text/html');
            if (tmpValue.head && tmpValue.head.childNodes && tmpValue.head.childNodes.length) {
                Array.from(tmpValue.head.childNodes).reverse().forEach(function (node) { tmpValue.body.insertBefore(node, tmpValue.body.firstChild); });
            }
            const htmlTemplate = (tmpValue && tmpValue.body) ? tmpValue.body : document.createElement('body');
            this.DiffNode(htmlTemplate, htmlExisting);
        }
        else {
        }
    }
    get(path) {
        let returnValue = this.data;
        if (null != path) {
            let components = path.split(/(?<!(?<!\\)\\)\//);
            const lenFL = components.length;
            for (let indexFL = 0; ((indexFL < lenFL - 1) && ('undefined' !== typeof returnValue)); indexFL++) {
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
    set(path, value, update = true) {
        let tmpValue = this.data;
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
        if (update) {
            if (null != this.timer) {
                clearTimeout(this.timer);
            }
            this.timer = setTimeout(this.render, this.timeout);
        }
    }
}
