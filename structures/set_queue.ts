import {Queue, QueueEl, testQueue} from "./queue";

export type SetQueueKey = string | number;

/** Такая очередь, у каждого элемента которой есть ключ
 *  Элементы с одинаковым ключом не могут повторяться в пределах одной очереди
 *  По ключу можно совершать разнообразные операции с элементом
 */
export class SetQueue<V> extends Queue<V>{

	protected elRefs = new Map<SetQueueKey, QueueEl<V>>();
	protected readonly getKey: (el: V) => SetQueueKey;

	constructor(getKey: (el: V) => SetQueueKey){
		super();
		this.getKey = getKey;
	}

	enqueue(el: V){
		let key = this.getKey(el);
		if(this.elRefs.has(key))
			throw new Error("Duplicate SetQueue key: " + key);
		super.enqueue(el);
		this.elRefs.set(key, this.tail as QueueEl<V>);
	}

	protected removeElement(el: QueueEl<V>){
		let key = this.getKey(el.value);
		if(!this.elRefs.delete(key))
			throw new Error("SetQueue demands that element key is stable, but it's not: got unknown key on delete: " + key);
		super.removeElement(el);
	}

	protected elByKey(key: SetQueueKey): QueueEl<V>{
		let el = this.elRefs.get(key);
		if(!el)
			throw new Error("Unknown SetQueue key: " + key);
		return el;
	}

	hasKey(key: SetQueueKey){
		return this.elRefs.has(key);
	}

	getByKey(key: SetQueueKey){
		return this.elByKey(key).value;
	}

	removeByKey(key: SetQueueKey){
		this.removeElement(this.elByKey(key));
	}

}

function assert(cond: () => boolean){
	if(!cond())
		throw new Error("Test failed: " + cond);
}

export function testSetQueue(){
	testQueue();

	let x = new SetQueue<number>(x => x * 2)
	x.enqueue(5);
	x.enqueue(10);
	x.enqueue(15);
	assert(() => [...x].join(",") === "15,10,5");
	assert(() => x.hasKey(10));
	assert(() => x.hasKey(20));
	assert(() => x.hasKey(30));
	x.removeByKey(20);
	assert(() => [...x].join(",") === "15,5");
	assert(() => x.size === 2);
	assert(() => !x.hasKey(20));
	assert(() => x.dequeue() === 5)
	assert(() => !x.hasKey(10));

	console.error("SetQueue tests passed successfully");
}