/** Очередь на двусвязном списке */
export class Queue<V> implements Iterable<V> {

	protected _size: number = 0;
	get size(){ return this._size };

	/** наиболее недавно добавленные */
	protected tail: QueueEl<V> | null = null;
	/** наиболее давно добавленные */
	protected head: QueueEl<V> | null = null;

	enqueue(value: V){
		let newHead: QueueEl<V> = { prev: null, next: this.tail, value: value };

		if(this.tail){
			this.tail.prev = newHead;
		}
		this.tail = newHead;

		if(!this.head){
			this.head = newHead;
		}

		this._size++;
	}

	dequeue(): V {
		if(!this.head)
			throw new Error("Could not dequeue from empty queue.");

		let res = this.head.value;
		this.removeElement(this.head);
		return res;
	}

	peek(): V {
		if(!this.head)
			throw new Error("Could not peek on empty queue.");
		return this.head.value;
	}

	/** Удалить первый элемент списка, соответствующий условию */
	removeFirst(condition: (value: V) => boolean): V | null {
		let current = this.tail;
		while(current){
			if(!condition(current.value)){
				current = current.next;
				continue;
			}

			this.removeElement(current);
			return current.value;
		}

		return null;
	}

	/** Удалить все элементы очереди */
	clear(){
		this._size = 0;
		this.head = this.tail = null;
	}
	
	protected removeElement(el: QueueEl<V>){
		if(el.prev)
			el.prev.next = el.next;
		else
			this.tail = el.next;
		if(el.next)
			el.next.prev = el.prev;
		else
			this.head = el.prev;
		this._size--;
	}

	[Symbol.iterator](): Iterator<V> {
		let current = this.tail;

		return {
			next(){
				if(!current){
					return { done: true, value: undefined as any }
				} else {
					let v = current.value;
					current = current.next;
					return { done: false, value: v }
				}
			}
		}

	}

}

export interface QueueEl<V> {
	/** prev - ближе к хвосту очереди */
	prev: QueueEl<V> | null;
	/** next - ближе к голове очереди */
	next: QueueEl<V> | null;
	value: V;
}

function assert(cond: () => boolean){
	if(!cond())
		throw new Error("Test failed: " + cond);
}

/** Набор тестов для класса Queue */
export function testQueue(){
	let x = new Queue<number>();
	assert(() => x.size === 0)
	x.enqueue(5);
	assert(() => x.size === 1)
	x.enqueue(7);
	assert(() => x.size === 2)
	x.enqueue(9);
	assert(() => x.size === 3)
	assert(() => [...x].join(",") === "9,7,5");
	assert(() => x.dequeue() === 5)
	assert(() => x.size === 2)
	assert(() => x.dequeue() === 7)
	assert(() => x.size === 1)
	assert(() => x.dequeue() === 9)
	assert(() => x.size === 0)
	
	x.enqueue(5)
	x.enqueue(7)
	x.enqueue(9)
	x.enqueue(11)
	x.enqueue(15)
	x.removeFirst(_ => _ === 7)
	assert(() => x.size === 4)
	assert(() => [...x].join(",") === "15,11,9,5");
	x.removeFirst(_ => _ === 5)
	assert(() => x.size === 3)
	assert(() => [...x].join(",") === "15,11,9");
	x.removeFirst(_ => _ === 15)
	assert(() => x.size === 2)
	assert(() => [...x].join(",") === "11,9");
	x.removeFirst(_ => _ === 11)
	x.removeFirst(_ => _ === 9)
	assert(() => x.size === 0)
	assert(() => [...x].join(",") === "");

	console.error("Queue tests passed successfully");
}