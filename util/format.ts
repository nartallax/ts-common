function twoDigits(n: number): string{
	return n > 9? n + '': '0' + n;
}
function threeDigits(n: number): string {
	return n > 99? n + '': '0' + twoDigits(n);
}

export type DateFormat = (d: Date) => string
function dateFmt(inner: DateFormat): DateFormat {
	return d => d && (d instanceof Date)? inner(d): "";
}

export const date = dateFmt((d: Date) => d.getFullYear() + '.' + twoDigits(d.getMonth() + 1) + '.' + twoDigits(d.getDate()))
export const timeHours = dateFmt((d: Date) => twoDigits(d.getHours()))
export const timeMinutes = dateFmt((d: Date) => timeHours(d) + ':' + twoDigits(d.getMinutes()))
export const timeSeconds = dateFmt((d: Date) => timeMinutes(d) + ':' + twoDigits(d.getSeconds()))
export const timeMilliseconds = dateFmt((d: Date) => timeSeconds(d) + ':' + threeDigits(d.getMilliseconds()))

export const timeToHours = dateFmt((d: Date) => date(d) + " " + timeHours(d))
export const timeToMinutes = dateFmt((d: Date) => date(d) + " " + timeMinutes(d))
export const timeToSeconds = dateFmt((d: Date) => date(d) + " " + timeSeconds(d))
export const timeToMilliseconds = dateFmt((d: Date) => date(d) + " " + timeMilliseconds(d))