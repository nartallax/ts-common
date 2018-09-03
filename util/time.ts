export type Milliseconds = Date | number;
export type Unixtime = Date | number;

export function milliseconsToDate(d: Milliseconds): Date | null {
	return typeof(d) === "number"? new Date(d): d && (d instanceof Date)? d: null;
}
export function unixtimeToDate(d: Unixtime): Date | null {
	return milliseconsToDate(typeof(d) === "number"? d * 1000: d);
}

export function unixtime(d?: Unixtime): number {
	return Math.floor((unixtimeToDate(d) || new Date()).getTime() / 1000);
}
export function milliseconds(d?: Milliseconds): number {
	return milliseconsToDate(d).getTime();
}