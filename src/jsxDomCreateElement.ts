function DOMParseElement(
	element: string,
	properties: { [k: string]: any } | null,
	children: Array<Node | string>): HTMLElement {
	const el = document.createElement(element);
	if (properties) {
		Object.keys(properties).forEach(k => {
			el[k] = properties[k];
		});
	}
	children.map(c => typeof c === 'string' ? document.createTextNode(c) : c).forEach(c => {
		el.appendChild(c);
	});
	return el;
}

export function DOMCreateElement(
	element: ((...args: unknown[]) => HTMLElement) | string,
	properties: { [k: string]: any } | null,
	...children: Array<Node | string>): HTMLElement {
	if (typeof element === 'function') {
		return element({
			...(properties ? properties : {}),
			children
		});
	}
	else {
		return DOMParseElement(element, properties, children);
	}
}
