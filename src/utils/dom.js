import {openFile} from '../utils/file.js';

/**
 * @param {string} selector
 * @param {(el: HTMLElement) => void} callback
 */
export function query(selector, callback) {
    Array.from(document.querySelectorAll(selector)).forEach(callback);
}

/**
 * @param {string} tag
 * @returns {HTMLElement}
 */
function createHTMLElement(tag) {
    return document.createElement(tag);
}

const SVGNS = 'http://www.w3.org/2000/svg';

/**
 * @param {string} tag
 * @returns {SVGElement}
 */
function createSVGElement(tag) {
    return document.createElementNS(SVGNS, tag);
}

/**
 * @template {Element} T
 * @param {(tag: string) => T} creator
 * @param {string} tag
 * @param {{[attr: string]: any} | Node | string} attrsOrChild
 * @param {(Node | string)[]} children
 * @returns {T}
 */
function buildDOM(creator, tag, attrsOrChild, children) {
    /** @type {{[attr: string]: string}} */
    let attrs;
    if (typeof attrsOrChild === 'string' || attrsOrChild instanceof Node) {
        children.unshift(attrsOrChild);
        attrs = {};
    } else {
        attrs = attrsOrChild;
    }

    const el = creator(tag);
    Object.entries(attrs).forEach(([attr, val]) => el.setAttribute(attr, String(val)));

    const fragment = document.createDocumentFragment();
    children
        .filter((c) => c != null)
        .forEach((c) => {
            const child = typeof c === 'string' ? document.createTextNode(c) : c;
            fragment.append(child);
        });

    if (el instanceof HTMLTemplateElement) {
        el.content.appendChild(fragment);
    } else {
        el.append(fragment);
    }

    return el;
}

/**
 * @param {string} tag
 * @param {{[attr: string]: any} | Node | string} attrsOrChild
 * @param  {...Node | string} children
 * @returns {HTMLElement}
 */
export function html(tag, attrsOrChild = {}, ...children) {
    return buildDOM(createHTMLElement, tag, attrsOrChild, children);
}

/**
 * @param {string} tag
 * @param {{[attr: string]: any} | Node | string} attrsOrChild
 * @param  {...Node | string} children
 * @returns {SVGElement}
 */
export function svg(tag, attrsOrChild = {}, ...children) {
    return buildDOM(createSVGElement, tag, attrsOrChild, children);
}

const indent = ' '.repeat(4);

/**
 * @param {{[selector: string]: {[prop: string]: string}}} rules
 * @returns {string}
 */
export function style(rules) {
    return Object.entries(rules).map(([selector, declarations]) => {
        const ruleText = Object.entries(declarations).map(([prop, value]) => {
            return `${indent}${prop}: ${value};`;
        }).join('\n');
        return `${selector} {\n${ruleText}\n}`;
    }).join('\n');
}

export async function loadWebComponent(htmlURL, cssURL, tag, constructor) {
    const [html, css] = await Promise.all([
        openFile(htmlURL),
        openFile(cssURL),
    ]);
    const template = new DOMParser().parseFromString(html, 'text/html').querySelector('template');
    const style = document.createElement('style');
    style.textContent = css;
    template.content.prepend(style);
    constructor.template = template;
    customElements.define(tag, constructor);
}
