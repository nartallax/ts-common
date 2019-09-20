function twoDigits(n: number): string{
	return n > 9? n + '': '0' + n;
}
function threeDigits(n: number): string {
	return n > 99? n + '': '0' + twoDigits(n);
}

export type DateFormat = (d: Date) => string
function dateFmt(inner: DateFormat): DateFormat {
	return d => (d && (d instanceof Date))? inner(d): "";
}

export const utcDate = dateFmt((d: Date) => d.getUTCFullYear() + '.' + twoDigits(d.getUTCMonth() + 1) + '.' + twoDigits(d.getUTCDate()))
export const utcTimeHours = dateFmt((d: Date) => twoDigits(d.getUTCHours()))
export const utcTimeMinutes = dateFmt((d: Date) => utcTimeHours(d) + ':' + twoDigits(d.getUTCMinutes()))
export const utcTimeSeconds = dateFmt((d: Date) => utcTimeMinutes(d) + ':' + twoDigits(d.getUTCSeconds()))
export const utcTimeMilliseconds = dateFmt((d: Date) => utcTimeSeconds(d) + ':' + threeDigits(d.getUTCMilliseconds()))

export const utcTimeToHours = dateFmt((d: Date) => utcDate(d) + " " + utcTimeHours(d))
export const utcTimeToMinutes = dateFmt((d: Date) => utcDate(d) + " " + utcTimeMinutes(d))
export const utcTimeToSeconds = dateFmt((d: Date) => utcDate(d) + " " + utcTimeSeconds(d))
export const utcTimeToMilliseconds = dateFmt((d: Date) => utcDate(d) + " " + utcTimeMilliseconds(d))

export const localDate = dateFmt((d: Date) => d.getFullYear() + '.' + twoDigits(d.getMonth() + 1) + '.' + twoDigits(d.getDate()))
export const localTimeHours = dateFmt((d: Date) => twoDigits(d.getHours()))
export const localTimeMinutes = dateFmt((d: Date) => localTimeHours(d) + ':' + twoDigits(d.getMinutes()))
export const localTimeSeconds = dateFmt((d: Date) => localTimeMinutes(d) + ':' + twoDigits(d.getSeconds()))
export const localTimeMilliseconds = dateFmt((d: Date) => localTimeSeconds(d) + ':' + threeDigits(d.getMilliseconds()))

export const localTimeToHours = dateFmt((d: Date) => localDate(d) + " " + localTimeHours(d))
export const localTimeToMinutes = dateFmt((d: Date) => localDate(d) + " " + localTimeMinutes(d))
export const localTimeToSeconds = dateFmt((d: Date) => localDate(d) + " " + localTimeSeconds(d))
export const localTimeToMilliseconds = dateFmt((d: Date) => localDate(d) + " " + localTimeMilliseconds(d))

export const timeSpan = (seconds: number): string => {
	let result = "";
	let resultPrefix = ""

	if(seconds < 0){
		resultPrefix = "-"
		seconds = -seconds;
	}
	let time = Math.round(seconds);
	
	result = twoDigits(time % 60) + result;
	time = Math.floor(time / 60);
	result = (time > 60? twoDigits(time % 60): time) + ":" + result;
	time = Math.floor(time / 60);
	if(time > 0){
		result = (time % 24) + ":" + result;
		time = Math.floor(time / 24);

		if(time > 0){
			result = time + " " + (time === 1? "день": time < 5? "дня": "дней") + ", " + result
		}
	}	

	
	return resultPrefix + result;
}

const hexDigits: ReadonlyArray<string> = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];
export function number52ToHex(number: number): string {
	let result = "";
	for(let i = 0; i < 52 / 4; i++){
		result = hexDigits[number & 0xf] + result;
		number = Math.floor(number / 0x10);
	}
	return result;
}