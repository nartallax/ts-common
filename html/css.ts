import {MapObject} from "../util/types";

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

export function render(code: CssCodeable): HTMLStyleElement {
	let css = classesOf(code);
	var child = document.createElement("style");
	child.setAttribute("type", "text/css");
	child.appendChild(document.createTextNode(css))
	return child;
}

export function activate(element: HTMLStyleElement){
	document.head.appendChild(element);
}

export function deactivate(element: HTMLStyleElement){
	element.parentNode && element.parentNode.removeChild(element);
}

export function create(code: CssCodeable): HTMLStyleElement {
	let el = render(code);
	activate(el);
	return el;
}

export function createOnce(code: CssCodeable): () => HTMLStyleElement {
	let el: HTMLStyleElement | null = null;
	return () => el || (el = create(code));
}