export class SequenceGen<T> {
	protected readonly items: T[];
	protected seq: number[];

	constructor(items: T[]){
		this.items = items;
		if(items.length === 0)
			throw new Error("Expected at least 1 item in sequence.");
		this.seq = [0];
	}
	
	inc(): void {
		let i = -1;
		while(++i < this.seq.length){
			if(this.seq[i] === this.items.length - 1){
				this.seq[i] = 0;
				if(i === this.seq.length - 1)
					this.seq.push(0);
				continue;
			} else {
				this.seq[i] = this.seq[i] + 1;
				return;
			}
		}
	}
	
	next(): T[]{
		let result = this.seq.map(x => this.items[x]).reverse();
		this.inc();
		return result;
	}
	
	nextList(count: number): T[][]{
		let res = [];
		while(count-->0)
			res.push(this.next())
		return res;
	}
}

export class AlphanumericSequenceGen extends SequenceGen<string> {
	constructor(){
		super([
			"1","2","3","4","5","6","7","8","9",
			"A","B","C","D","E","F","G","H","I","K","L","M","N","O","P","Q","R","S","T","V","X","Y","Z"
		])
	}
}

export function testSeqGen(){
	let x = new SequenceGen<number>([0, 1, 2]);
	let seqs = x.nextList(10).map(_ => _.join("")).join(",");
	if(seqs !== "0,1,2,10,11,12,20,21,22,100")
		throw new Error("Test failed.");
	console.error("SequenceGen tests passed successfully.");
}