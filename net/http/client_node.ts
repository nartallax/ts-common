import * as http from "http";
import * as https from "https";
import * as URL from "url";
import {MapObject} from "util/types";

export interface HttpResponse {
	body: Buffer;
	headers: MapObject<string | string[]>;
	statusCode: number;
}

export interface HttpParams {
	url: string;
	headers?: MapObject<string>;
	isBadCode?(code: number): boolean;
	method?: "GET" | "POST";
	body?: Buffer | string;
}

export function httpRequest(params: HttpParams): Promise<HttpResponse>{
	let urlParts = URL.parse(params.url);
	let isHttps = (urlParts.protocol || "").toLowerCase().startsWith("https");

	let doRequest = (isHttps? https.request: http.request) as 
		((opts: https.RequestOptions, onResp: (resp: http.IncomingMessage) => void) => http.ClientRequest);

	return new Promise<HttpResponse>((ok, _bad) => {
		let finished = false;
		let bad = (e: Error) => {
			if(finished)
				return;
			finished = true;
			_bad(e)
		}

		try {
			let result = [] as Buffer[];
			

			let req = doRequest({
				headers: Object.assign({
					"User-Agent": " "
				}, params.headers || {}),
				hostname: urlParts.hostname,
				path: urlParts.path,
				port: urlParts.port || (isHttps? 443: 80),
				method: params.method || (params.body? "POST": "GET")
			} as https.RequestOptions, resp => {
				let code = resp.statusCode || 0,
					headers = resp.headers;

				if(params.isBadCode? params.isBadCode(code): (~~(code / 100)) !== 2){
					return bad(new Error("Bad HTTP response code: " + code))
				}
				
				let onData = (buffer: Buffer) => result.push(buffer),
					onEnd = () => {
						if(finished) return; 
						finished = true;
						ok({ 
							body: Buffer.concat(result), 
							headers: headers, 
							statusCode: code
						} as HttpResponse)
					};
				
				resp.on('error', bad);
				resp.on('data', onData);
				resp.on('end', onEnd)
				
			});

			req.on("error", bad);

			if(params.body)
				req.write(params.body, "utf8");

			req.end();
		} catch(e){ return bad(e) }
	})
}