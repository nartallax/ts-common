import {MapObject} from "../util/types";
import {murmurHash52} from "util/murmur";
import {number52ToHex} from "util/format";

export type CssRuleable = string | MapObject<string>;
export type CssCodeable = string | CssRuleable[] | MapObject<CssRuleable>;

function rulesOf(x: CssRuleable): string {
	if(!x)
		return "";
	if(typeof (x) === "object")
		return Object.keys(x).map(k => k + ": " + x[k]).join(";\n\t") + ";"
	return x.replace(/\n/g, "\n\t");
}

function classesOf(x: CssCodeable): string {
	if(typeof(x) === "string")
		return x;
	if(Array.isArray(x))
		return x.map(rulesOf).join("\n\n");
	else 
		return Object.keys(x).map(k => k + " {\n\t" + rulesOf(x[k]) + "\n}").join("\n\n");
};

export function render(css: string): HTMLStyleElement {
	var child = document.createElement("style");
	child.setAttribute("type", "text/css");
	child.setAttribute(hashAttrName, number52ToHex(murmurHash52(css)));
	child.appendChild(document.createTextNode(css))
	return child;
}

export function activate(element: HTMLStyleElement){
	if(document.head)
		document.head.appendChild(element);
	else
		throw new Error("No document head! Could not append element.");
}

export function deactivate(element: HTMLStyleElement){
	element.parentNode && element.parentNode.removeChild(element);
}

export function create(code: string): HTMLStyleElement {
	let el = render(code);
	activate(el);
	return el;
}

const hashAttrName = "data-content-hash";
export function findDefinedStyle(code: string): HTMLStyleElement | null {
	let hash = number52ToHex(murmurHash52(code));
	let old = document.querySelector(`style[${hashAttrName}="${hash}"]`);
	return old as HTMLStyleElement || null
}

export function createOnce(code: CssCodeable): () => HTMLStyleElement {
	let css = classesOf(code);
	let el: HTMLStyleElement | null = findDefinedStyle(css);
	return () => el || (el = create(css));
}