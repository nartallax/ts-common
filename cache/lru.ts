import {Async} from "util/types";
import {AsyncRectifyingQueue} from "structures/async_rectifying_queue";
import {SetQueue} from "structures/set_queue";

export type LruCacheItemKey = number | string;

export interface LRUCacheOptions<A, V> {
	size: number;
	argsToKey(args: A): LruCacheItemKey;
	fetch(args: A): Async<V>;
}

export interface LRUCacheItem<V> {
	key: LruCacheItemKey;
	value: V;
}

interface CacheItemWaiter<V>{
	ok(v: V): void;
	bad(err: Error): void;
}

/* LeastRecentlyUsed cache
Guarantees that requests will be fulfilled in order they are submitted (that is, one slow request could clog the cache)
A for fetch Arguments, V for cached Value
 */
export class LRUCache<A, V> {

	protected readonly opts: LRUCacheOptions<A, V>;
	protected readonly requestWaiters = new Map<LruCacheItemKey, CacheItemWaiter<V>[]>();
	protected requestQueue: AsyncRectifyingQueue<V> = new AsyncRectifyingQueue((res, err, key) => this.onRequestDone(res, err, key));
	protected cacheQueue: SetQueue<LRUCacheItem<V>> = new SetQueue(x => x.key);

	constructor(opts: LRUCacheOptions<A, V>){
		this.opts = opts;
	}

	get(args: A): Promise<V> {
		return new Promise(async (ok, bad) => {
			try {
				let key = this.opts.argsToKey(args);

				// если значение уже есть в кеше - забираем, ставим вперед
				if(this.hasCachedItem(key)){
					let old = this.cacheQueue.getByKey(key);
					this.cacheQueue.removeByKey(key);
					this.cacheQueue.enqueue(old);
					ok(old.value);
					return;
				}

				// если нет - создаем запрос, заталкиваем в очередь на ожидание результата
				// а она уже разберется, дубликат это или нет, и подождет
				if(!this.requestWaiters.has(key))
					this.requestWaiters.set(key, []);
				(this.requestWaiters.get(key) as CacheItemWaiter<V>[]).push({ ok, bad});
				this.requestQueue.enqueue(() => this.opts.fetch(args), key);
			} catch(e){ bad(e) }
		})
	}

	/** Выкинуть все кешированные значения
	 *  Если какие-то значения находятся в процессе запроса, они не будут выкинуты; запросы не будут прерваны.
	 */
	clear(){
		this.cacheQueue.clear();
	}

	/** Дождаться окончания всех запросов
	 * В момент возврата Promise очередь запросов пуста. 
	 * Это может нарушаться только в случае поступления запроса после вызова ok у Promise
	 */
	waitRequestsFinished(): Promise<void>{
		return this.requestQueue.waitEmpty();
	}

	get havePendingRequests(): boolean {
		return this.requestQueue.size > 0
	}

	protected hasCachedItem(key: LruCacheItemKey): boolean {
		return this.cacheQueue.hasKey(key)
	}

	protected onRequestDone(res: V | undefined, err: Error | undefined, key: LruCacheItemKey){
		let waiters = this.requestWaiters.get(key) || [];
		if(err){
			waiters.forEach(x => x.bad(err))
		} else {
			this.addItem(key, res as V);
			waiters.forEach(x => x.ok(res as V))
		}
	}

	protected addItem(key: LruCacheItemKey, value: V){
		this.cacheQueue.enqueue({ key, value });
		while(this.cacheQueue.size > this.opts.size){
			this.removeItem(this.cacheQueue.peek().key)
		}
	}

	protected removeItem(key: LruCacheItemKey){
		if(this.cacheQueue.hasKey(key))
			this.cacheQueue.removeByKey(key);
	}

}


/* ===== TESTING ===== */


export class Supplier {

	private readonly expectedPattern: number[];
	private readonly resultPattern: number[] = [];
	private readonly timeout: number;

	constructor(supplyPattern: number[], timeout: number = 100){
		this.expectedPattern = supplyPattern;
		this.timeout = timeout;
	}

	async supply(result: number): Promise<number>{
		this.resultPattern.push(result)
		await new Promise(ok => setTimeout(ok, this.timeout));
		return result;
	}

	done(){
		let exp = this.expectedPattern.join(",")
		let res = this.resultPattern.join(",")
		if(exp !== res)
			throw new Error("Expected different request pattern for LRU cache: expected " + exp + ", got " + res);
	}
}

async function aassert(cond: () => Async<boolean>){
	if(!(await cond()))
		throw new Error("Test failed: " + cond);
}

export async function testLruCache(){
	{
		let s = new Supplier([1,2,3]);
		let c = new LRUCache<number, number>({
			argsToKey: x => x * 10,
			fetch: x => s.supply(x),
			size: 3
		});

		await aassert(async () => (await c.get(1)) === 1);
		await aassert(async () => (await c.get(1)) === 1);
		await aassert(async () => (await c.get(2)) === 2);
		await aassert(async () => (await c.get(2)) === 2);
		await aassert(async () => (await c.get(3)) === 3);
		await aassert(async () => (await c.get(3)) === 3);
		await aassert(async () => (await c.get(1)) === 1);
		await aassert(async () => (await c.get(2)) === 2);
		await aassert(async () => (await c.get(3)) === 3);
		await aassert(async () => (await c.get(2)) === 2);
		await aassert(async () => (await c.get(1)) === 1);
		s.done();
	}

	{
		let s = new Supplier([1,2,3,4,5,2,1]);
		let c = new LRUCache<number, number>({
			argsToKey: x => x * 10,
			fetch: x => s.supply(x),
			size: 3
		});

		await aassert(async () => (await c.get(1)) === 1);
		await aassert(async () => (await c.get(2)) === 2);
		await aassert(async () => (await c.get(3)) === 3);
		await aassert(async () => (await c.get(4)) === 4);
		await aassert(async () => (await c.get(5)) === 5);
		await aassert(async () => (await c.get(2)) === 2);
		await aassert(async () => (await c.get(1)) === 1);
		await aassert(async () => (await c.get(5)) === 5);
		await aassert(async () => (await c.get(2)) === 2);
		await aassert(async () => (await c.get(1)) === 1);
		s.done();
	}

	console.error("LRU cache tests passed successfully.");
}