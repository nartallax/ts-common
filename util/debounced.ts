export function debounced(timeout: number, action: () => void): () => void {
	let handler: number = 0;

	let wrappedAction = () => {
		handler = 0;
		action();
	}

	return () => {
		if(handler)
			clearTimeout(handler);
		handler = setTimeout(wrappedAction, timeout);
	}


}