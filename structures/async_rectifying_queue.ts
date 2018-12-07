import {Async, MapObject} from "util/types";
import {SetQueue, SetQueueKey} from "./set_queue";
import {AlphanumericSequenceGen} from "./sequence_gen";

/** Такая структура данных, которая принимает на вход () => Promise<X>, вызывает их, ждет их и дергает за (x: X) => void
 * Порядок дергания совпадает с порядком запихивания на вход создающих функций
 * Кроме случаев, когда ключи совпадают; в таком случае вызвана будет только первая запихнутая функция, а хендлер дернут в порядке последней
 * (подразумевая, что первая функция все еще не вышла из очереди в момент запихивания последней)
 * Ключ - произвольный идентификатор Promise-а; Promise с одинаковыми ключами считаются полностью равными и ожидается только один из них
 */
export class AsyncRectifyingQueue<T>{
	protected readonly onReady: (value: T | undefined, error: Error | undefined, key: SetQueueKey) => void;
	protected awaitingQueue = new SetQueue<AsyncQueueEl<T>>(x => x.id)
	protected usingKeys: boolean | null = null;
	protected keySeqGen = new AlphanumericSequenceGen();
	protected onEmpty: (() => void)[] = []

	constructor(onReady: (value: T | undefined, error: Error | undefined, key: SetQueueKey) => void){
		this.onReady = onReady;
	}

	async enqueue(makeRequest: () => Async<T>, key?: SetQueueKey){
		if(this.usingKeys === null){
			this.usingKeys = key !== undefined;
		} else {
			if((key === undefined && this.usingKeys) || (key !== undefined && !this.usingKeys))
				throw new Error("You must always or never provide key to rectifying queue.");
		}

		let el: AsyncQueueEl<T> = {
			id: key === undefined? this.keySeqGen.next().join(""): key,
			done: false
		};

		if(this.awaitingQueue.hasKey(el.id)){
			let oldEl = this.awaitingQueue.getByKey(el.id);
			this.awaitingQueue.removeByKey(el.id);
			this.awaitingQueue.enqueue(oldEl);
			this.pingQueue();
			return;
		}

		this.awaitingQueue.enqueue(el);
		try {
			el.result = await Promise.resolve(makeRequest());
		} catch(e){
			el.error = e;
		}
		el.done = true;
		this.pingQueue();
	}

	protected pingQueue(){
		while(this.awaitingQueue.size > 0){
			let head = this.awaitingQueue.peek();
			if(!head.done)
				return;				
			
			this.awaitingQueue.dequeue();
			this.onReady(head.result, head.error, head.id);
		}

		let emptyWaiters = this.onEmpty;
		this.onEmpty = [];
		emptyWaiters.forEach(_ => _());
	}

	waitEmpty(): Promise<void>{
		return new Promise(ok => {
			if(this.awaitingQueue.size < 1)
				ok();
			else
				this.onEmpty.push(ok);
		})
	}

}

export interface AsyncQueueEl<T> {
	id: SetQueueKey;
	done: boolean;
	result?: T
	error?: Error;
}

class Collector {
	private readonly result: number[] = []
	private readonly ethalon: number[];

	push: (result?: number, error?: Error) => void = (result, error) => {
		if(result === undefined)
			throw (error as Error)
		this.result.push(result as number);
	}

	constructor(ethalon: number[]){
		this.ethalon = ethalon;
	}
	
	done(){
		let res = this.result.join(",");
		let eth = this.ethalon.join(",")
		if(res !== eth)
			throw new Error("Test failed: expected " + eth + " , got " + res);
	}
}

async function waitAndReturn(waitFor: number, res: number): Promise<number>{
	await new Promise(ok => setTimeout(ok, waitFor));
	return res;
}

export async function testAsyncRectifyingQueue(){
	{
		let coll = new Collector([1,2,3]);
		let x = new AsyncRectifyingQueue<number>(coll.push);
		x.enqueue(() => 1)
		x.enqueue(() => 2)
		x.enqueue(() => 3)
		await x.waitEmpty();
		coll.done();
	}

	{
		let coll = new Collector([1,2,3]);
		let x = new AsyncRectifyingQueue<number>(coll.push);
		x.enqueue(() => waitAndReturn(100, 1))
		x.enqueue(() => waitAndReturn(300, 2))
		x.enqueue(() => waitAndReturn(200, 3))
		await x.waitEmpty();
		coll.done();
	}

	{
		let coll = new Collector([1,2,3,4,5]);
		let x = new AsyncRectifyingQueue<number>(coll.push);
		x.enqueue(() => waitAndReturn(100, 1))
		x.enqueue(() => waitAndReturn(300, 2))
		x.enqueue(() => waitAndReturn(200, 3))
		await new Promise(ok => setTimeout(ok, 150));
		x.enqueue(() => waitAndReturn(100, 4))
		x.enqueue(() => 5)
		await x.waitEmpty();
		coll.done();
	}

	{
		let fetcherCalled: MapObject<boolean> = {};
		let fetcher = (waitFor: number, res: number) => {
			if(fetcherCalled[res])
				throw new Error("Expected that fetcher for " + res + " will be called exactly once; got call repeat.");
			fetcherCalled[res] = true;
			return waitAndReturn(waitFor, res);
		}

		let coll = new Collector([1,2,3]);
		let x = new AsyncRectifyingQueue<number>(coll.push);
		x.enqueue(() => fetcher(100, 1), 1)
		x.enqueue(() => fetcher(300, 2), 2)
		x.enqueue(() => fetcher(200, 3), 3)
		x.enqueue(() => fetcher(100, 1), 1)
		x.enqueue(() => fetcher(300, 2), 2)
		x.enqueue(() => fetcher(200, 3), 3)
		x.enqueue(() => fetcher(100, 1), 1)
		x.enqueue(() => fetcher(300, 2), 2)
		x.enqueue(() => fetcher(200, 3), 3)
		await x.waitEmpty();
		coll.done();
	}

}