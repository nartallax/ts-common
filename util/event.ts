import {Async} from "./types";

export type Listener<T> = (arg: T) => Async<void>;

export class CompositeEventError<T> extends Error {
	public readonly nested: Error[];
	public readonly event: IEvent<T>;
	public readonly eventArgs: T;
	constructor(nested: Error[], event: IEvent<T>, eventArgs: T){
		super(nested.length + " error(s) happened during execution of listeners of event" + (event.name? " " + event.name: "") + ".")
		this.event = event;
		this.eventArgs = eventArgs;
		this.nested = nested;
	}
}

export class BareEvent<T> {
	public readonly name: string;
	private listeners = new Set<Listener<T>>();

	constructor(name?: string){
		this.name = name || "";
	}

	listen(listener: Listener<T>): void { this.listeners.add(listener) }
	unlisten(listener: Listener<T>): void { this.listeners.delete(listener) }
	hasListeners(): boolean { return this.listeners.size > 0 }

	async fire(arg: T): Promise<void> {
		let errors = (await Promise.all([...this.listeners].map(async listener => {
			try {
				await Promise.resolve(listener(arg));
				return null;
			} catch(e){
				return e as Error
			}
		}))).filter(x => !!x) as Error[];

		if(errors.length > 0){
			throw new CompositeEventError(errors, (this as any) as IEvent<T>, arg);
		}
	}
}

export type IEvent<T = void> = BareEvent<T> & ((listener: (args: T) => void) => void);

export function Event<T = void>(name?: string): IEvent<T> {
	let fn = function(newListener: Listener<T>): void {
		fnn.listen(newListener);
	}
	let fnn: IEvent<T> = Object.assign(fn, new BareEvent<T>(name), BareEvent.prototype);
	return fnn;
};