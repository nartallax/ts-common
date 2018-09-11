import {Async} from "./types";

export type Listener = (unlock: () => void) => void;

export class Lock {
	private locked: boolean = false;
	private listeners: Listener[] | null = null;

	private lock(){ 
		this.locked = true  
	}

	private unlock(){
		this.locked = false;
		let lsers = this.listeners || [];
		
		while(lsers.length){
			let lser = lsers.shift() as Listener;
			lser.call(null);
			if(this.locked) return;
		}
		
		delete this.listeners;
	}
	
	public get acquired(): boolean { 
		return this.locked 
	}
	
	public wait(listener: Listener){
		(this.listeners || (this.listeners = [])).push(listener);
			
		if(!this.locked){
			this.lock();
			setTimeout(() => this.unlock(), 0);
		}
	}
	
	public acquire(listener: Listener){
		this.wait(() => {
			this.lock();
			listener(() => this.unlock());
		});
	}
	
	public with<T>(body: () => Async<T>): Promise<T> {
		return new Promise((ok, bad) => {
			this.wait(async () => {
				this.lock();
				try {
					ok(await Promise.resolve(body()));
				} catch(e) {
					bad(e)
				} finally{
					this.unlock();
				}
			});
		});
	}
}