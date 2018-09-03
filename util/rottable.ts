import {Async} from "./types";

// лениво вычисляемое значение, которое может протухнуть
// потокобезопасно
export class Rottable<T> {
	private readonly fetch: () => Async<T>;
	public readonly rottingTime: number;
	private lastFetchTime: number;
	private stored: T | null = null;
	private valueWaiters = [] as {ok: (value: T) => void, bad: (e: Error) => void}[];

	constructor(rottingTimeMsec: number, fetch: () => Async<T>){
		this.rottingTime = rottingTimeMsec;
		this.lastFetchTime = Date.now() - (rottingTimeMsec + 1);
		this.fetch = fetch;
	}
	
	get(): Promise<T> {
		return new Promise(async (ok, bad) => {
			try {
				if(Date.now() - this.lastFetchTime > this.rottingTime){
					this.valueWaiters.push({ok: ok, bad: bad});
					if(this.valueWaiters.length === 1){
						await this.forceRunFetch();
					}
				} else {
					ok(this.stored);
				}
			} catch(e){ bad(e) }
		});			
	}
	
	private async forceRunFetch(){
		try {
			this.stored = await Promise.resolve(this.fetch.call(null));
		} catch(e){ 
			this.valueWaiters.forEach(x => x.bad(e));
			return;
		}

		this.lastFetchTime = Date.now();
		let waiters = this.valueWaiters;
		this.valueWaiters = [];
		waiters.forEach(x => x.ok(this.stored));
	}
}