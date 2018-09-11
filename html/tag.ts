import {MapObject} from "../util/types";

export type EventMapObject = { /*keyof(DocumentEventMap)*/ [k: string]: (<T extends Event = Event>(this: HTMLElement, e: T) => void) | null | undefined }

export interface TagDescription {
	tagName?: string;
	class?: string | string[];
	style?: MapObject<string>;
	parent?: HTMLElement;
	text?: string;
	children?: (HTMLElement | TagDescription | null | undefined)[];
	value?: any;
	attrs?: MapObject<string>,
	events?: EventMapObject
}

export function tag(params?: TagDescription): HTMLElement {
	params = params || {};
	let el = document.createElement(params.tagName || "div");

	if(params.class)
		el.className = Array.isArray(params.class) ? params.class.filter(x => !!x).join(" ") : params.class;

	if(params.style) {
		let m = params.style;
		Object.keys(m).forEach(k => {
			if(!(k in el.style)){
				console.warn("Unkown style property: " + k);
			} else {
				(el.style as any)[k] = m[k];
			}
		})
	}

	if(params.text)
		el.textContent = params.text;
	
	if(params.children)
		params.children
			.filter(x => !!x)
			.forEach(x => el.appendChild(x instanceof HTMLElement? x: tag(x as TagDescription)));

	if("value" in params) {
		if(el instanceof HTMLInputElement)
			el.value = params.value;
		else if(el instanceof HTMLTextAreaElement)
			el.value = params.value;
		else
			throw new Error("\"Value\" parameter is only allowed for input-like elements.")
	}

	if(params.attrs){
		let a = params.attrs as MapObject<string>;
		Object.keys(a).forEach(attrName => el.setAttribute(attrName, a[attrName]))
	}
		

	if(params.events){
		let e = params.events as EventMapObject;
		Object.keys(e).forEach(eName => {
			let handler = e[eName];
			if(handler)
				el.addEventListener(eName, handler)
		});
	}
		
	if(params.parent){
		params.parent.appendChild(el);
	}
	
	return el;
}