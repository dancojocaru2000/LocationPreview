import L from "leaflet";
import { DOMCreateElement } from "./jsxDomCreateElement";

type ButtonControlConstructorOptions = {
	text?: string,
	position?: L.ControlPosition,
	onClick?: () => void,
}

export class ButtonControl extends L.Control {
	text = '';
	onClick: (() => void) | undefined;

	constructor({ text, position, onClick }: ButtonControlConstructorOptions = {}) {
		super({ position: position ?? 'bottomright' });
		this.onClick = onClick;
		if (text) {
			this.text = text;
		}
	}

	getContainer(): HTMLElement {
		const button: HTMLButtonElement = (
			<button>{this.text}</button>
		);
		button.addEventListener('click', this.onClick);
		return button;
	}
}
