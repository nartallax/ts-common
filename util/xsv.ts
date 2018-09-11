import {MapObject} from "./types";

export type WriteOp = (data: string, encoding: string) => void;
export type Writer = { write: WriteOp } | WriteOp;

/** Общий класс для _sv-форматов */
export abstract class SeparatedWriterBase {
	private headers: string[] | null = null;
	private headersFlushed = false;
	private readonly write: WriteOp;
	private encoding: string = "utf8";

	constructor(writer: Writer, headers?: string[] | null, encoding?: string | null){
		this.write = typeof(writer) === "function"? writer: (d, e) => writer.write(d, e);
		if(headers)
			this.headers = headers;
		if(encoding)
			this.encoding = encoding;
	}
	
	private tryWriteHeaders(firstLine: MapObject<any> | any[]){
		if(this.headersFlushed)
			return;
		this.headersFlushed = true;
		if(!this.headers && !Array.isArray(firstLine)) // cannot extract headers from array
			this.headers = Object.keys(firstLine);
		if(this.headers)
			this.writeLine(this.headers);
	}
	
	protected cellToString(x: any): string {
		switch(typeof(x)){
			case "string": return x;
			case "boolean": return x? "true": "false";
			case "number": return Number.isNaN(x)? "NaN": x + "";
			case "object": return x === null? "null": Array.isArray(x)? "[Array]": "[Object]";
			default: return "";
		}
	}

	protected abstract lineToString(line: any[]): string;

	writeLine(line: MapObject<any> | any[]){
		if(Array.isArray(line)){
			this.write(this.lineToString(line), this.encoding);
		} else if(typeof(line) === "object" && line){
			this.tryWriteHeaders(line);
			if(!this.headers)
				throw new Error("Never gonna happen: failed to extract headers from object")
			this.writeLine(this.headers.map(h => line[h]));
		} else throw new Error("Expected line to write into CSV to be array or non-null object, got neither.");
	}
	
}

export class CsvWriter extends SeparatedWriterBase {
	protected lineToString(lineArr: any[]): string{
		return "\"" 
			+ lineArr.map(x => this.cellToString(x).replace(/"/g, "\"\"").replace(/\n/g, " ")).join("\",\"") 
			+ "\"\n"
	}
}

export class TsvWriter extends SeparatedWriterBase {
	protected lineToString(lineArr: any[]): string{
		return "\"" 
			+ lineArr.map(x => this.cellToString(x).replace(/[\t\n\r]/g, " ")).join("\t")
			+ "\"\n"
	}
}