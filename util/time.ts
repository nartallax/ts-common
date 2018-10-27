export type Milliseconds = Date | number;
export type Unixtime = Date | number;

export function milliseconsToDate(d: Milliseconds): Date | null {
	if(typeof(d) === "number"){
		return new Date(d);
	} else if(d instanceof Date){
		return d
	} else return null;
}
export function unixtimeToDate(d: Unixtime): Date | null {
	return milliseconsToDate(typeof(d) === "number"? d * 1000: d);
}

export function unixtime(d?: Unixtime): number {
	return Math.floor((!d? new Date(): unixtimeToDate(d) || new Date()).getTime() / 1000);
}
export function milliseconds(d?: Milliseconds): number {
	return (milliseconsToDate(d || new Date()) || new Date()).getTime();
}