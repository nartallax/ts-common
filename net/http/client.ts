import {MapObject} from "../../util/types";

export interface Response {
	data: string
}

export class Client {
	constructor(){}
	
	makeRequest(params: {url: string, method: string, headers?: MapObject<string>, body?: string}): Promise<Response> {
		return new Promise((ok, bad) => {
			try {
				let req = new XMLHttpRequest();
				
				req.addEventListener("load", () => ok({data: req.responseText}));
				req.addEventListener("error", x => bad(x));
				req.open(params.method, params.url, true);
				req.setRequestHeader("Content-type", "application/json");
				let headers = params.headers || {}
				Object.keys(headers).forEach(hname => req.setRequestHeader(hname, headers[hname]));
				
				params.body? req.send(params.body): req.send();
			} catch(e){ bad(e) }
		});
	}
}