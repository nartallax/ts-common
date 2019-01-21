import {MapObject} from "../../util/types";

export interface Response {
	data: string;
	code: number;
}

export interface BinaryResponse {
	data: ArrayBuffer;
	code: number;
}

export interface RequestParams {
	url: string;
	method: string;
	headers?: MapObject<string>;
	body?: string | ArrayBuffer;
}

export class Client {
	constructor(){}
	
	async makeRequest(params: RequestParams): Promise<Response> {
		let res = await this.innerMakeRequest(params, false)
		return {data: res.responseText, code: res.status}
	}

	async makeBinaryRequest(params: RequestParams): Promise<BinaryResponse> {
		let res = await this.innerMakeRequest(params, true)
		return {data: res.response, code: res.status}
	}

	private innerMakeRequest(params: RequestParams, binary: boolean): Promise<XMLHttpRequest> {
		return new Promise((ok, bad) => {
			try {
				let req = new XMLHttpRequest();
				
				req.addEventListener("load", () => ok(req));
				req.addEventListener("error", x => bad(x));
				req.open(params.method, params.url, true);
				
				if(binary)
					req.responseType = "arraybuffer";
				else
					req.setRequestHeader("Content-type", "application/json");

				let headers = params.headers || {}
				Object.keys(headers).forEach(hname => req.setRequestHeader(hname, headers[hname]));
				
				params.body? req.send(params.body): req.send();
			} catch(e){ bad(e) }
		});
	}
}