import {LRUCacheOptions, LRUCache, LruCacheItemKey, Supplier} from "./lru";
import {SetQueue} from "structures/set_queue";
import {Async} from "util/types";

export interface TimedLRUCacheOptions<A, V> extends LRUCacheOptions<A, V> {
	expirationTime: number; //ms
}

interface TimingPair {
	key: LruCacheItemKey;
	storedAt: number;
}

/** LRUCache that won't supply items that are older than expirationTime
 * (that is, resides in cache for longer than expirationTime)
 */
export class TimedLRUCache<A, V> extends LRUCache<A, V> {
	protected readonly opts: TimedLRUCacheOptions<A, V>;
	protected expirationQueue = new SetQueue<TimingPair>(x => x.key);
	
	constructor(opts: TimedLRUCacheOptions<A, V>){
		super(opts);
		this.opts = opts;
	}

	protected addItem(key: LruCacheItemKey, value: V){
		this.pingExpirationQueue();
		super.addItem(key, value);
		if(this.expirationQueue.hasKey(key)){
			let old = this.expirationQueue.getByKey(key);
			this.expirationQueue.removeByKey(key);
			this.expirationQueue.enqueue(old);
			old.storedAt = Date.now()
		} else {
			this.expirationQueue.enqueue({ storedAt: Date.now(), key })
		}
	}

	protected removeItem(key: LruCacheItemKey){
		super.removeItem(key);
		if(this.expirationQueue.hasKey(key))
			this.expirationQueue.removeByKey(key);
	}

	protected hasCachedItem(key: LruCacheItemKey){
		this.pingExpirationQueue();
		return super.hasCachedItem(key);
	}

	protected pingExpirationQueue(){
		let limitTime = Date.now() - this.opts.expirationTime;
		while(this.expirationQueue.size > 0 && this.expirationQueue.peek().storedAt <= limitTime){
			this.removeItem(this.expirationQueue.peek().key)
		}
	}

}


/* ===== TESTING ===== */

async function aassert(cond: () => Async<boolean>){
	if(!(await cond()))
		throw new Error("Test failed: " + cond);
}

export async function testTimedLRUCache(){
	{
		let s = new Supplier([1,2,3,3,2,1], 0);
		let c = new TimedLRUCache<number, number>({
			argsToKey: x => x,
			expirationTime: 100,
			fetch: x => s.supply(x),
			size: 100
		});

		await aassert(async () => (await c.get(1)) === 1)
		await aassert(async () => (await c.get(2)) === 2)
		await aassert(async () => (await c.get(3)) === 3)
		await new Promise(ok => setTimeout(ok, 50));
		await aassert(async () => (await c.get(2)) === 2)
		await new Promise(ok => setTimeout(ok, 100));
		await aassert(async () => (await c.get(3)) === 3)
		await aassert(async () => (await c.get(2)) === 2)
		await aassert(async () => (await c.get(1)) === 1)
		s.done();
	}

	{
		let s = new Supplier([1, 2, 3, 1, 2, 4, 3], 0);
		let c = new TimedLRUCache<number, number>({
			argsToKey: x => x,
			expirationTime: 100,
			fetch: x => s.supply(x),
			size: 100
		});	

		await aassert(async () => (await c.get(1)) === 1)
		await aassert(async () => (await c.get(2)) === 2)
		await new Promise(ok => setTimeout(ok, 50));
		await aassert(async () => (await c.get(3)) === 3)
		await new Promise(ok => setTimeout(ok, 75));
		await aassert(async () => (await c.get(1)) === 1)
		await aassert(async () => (await c.get(2)) === 2)
		await aassert(async () => (await c.get(4)) === 4)
		await aassert(async () => (await c.get(3)) === 3)
		await aassert(async () => (await c.get(4)) === 4)
		await new Promise(ok => setTimeout(ok, 50));
		await aassert(async () => (await c.get(4)) === 4)
		await aassert(async () => (await c.get(3)) === 3)
		await aassert(async () => (await c.get(4)) === 4)
		s.done();
	}

	console.error("Timed LRU cache tests passed successfully.");
}