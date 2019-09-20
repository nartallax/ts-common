// author: https://github.com/garycourt/murmurhash-js/

export function murmurHash32(key: string, seed: number = 0): number {
	let remainder = key.length & 3; // key.length % 4
	let bytes = key.length - remainder;
	let h1 = seed;
	let c1 = 0xcc9e2d51;
	let c2 = 0x1b873593;
	let i = 0;
	
	let k1: number, h1b: number;

	while (i < bytes) {
	  	k1 = 
	  	  ((key.charCodeAt(i) & 0xff)) |
	  	  ((key.charCodeAt(++i) & 0xff) << 8) |
	  	  ((key.charCodeAt(++i) & 0xff) << 16) |
	  	  ((key.charCodeAt(++i) & 0xff) << 24);
		++i;
		
		k1 = ((((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16))) & 0xffffffff;
		k1 = (k1 << 15) | (k1 >>> 17);
		k1 = ((((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16))) & 0xffffffff;

		h1 ^= k1;
        h1 = (h1 << 13) | (h1 >>> 19);
		h1b = ((((h1 & 0xffff) * 5) + ((((h1 >>> 16) * 5) & 0xffff) << 16))) & 0xffffffff;
		h1 = (((h1b & 0xffff) + 0x6b64) + ((((h1b >>> 16) + 0xe654) & 0xffff) << 16));
	}
	
	k1 = 0;

	if(remainder === 1){
		k1 ^= (key.charCodeAt(i) & 0xff);
	} else if(remainder === 2){
		k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
		k1 ^= (key.charCodeAt(i) & 0xff);
	} else if(remainder === 3){
		k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;
		k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
		k1 ^= (key.charCodeAt(i) & 0xff);
	}

	k1 = (((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
	k1 = (k1 << 15) | (k1 >>> 17);
	k1 = (((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;
	h1 ^= k1;
	
	h1 ^= key.length;

	h1 ^= h1 >>> 16;
	h1 = (((h1 & 0xffff) * 0x85ebca6b) + ((((h1 >>> 16) * 0x85ebca6b) & 0xffff) << 16)) & 0xffffffff;
	h1 ^= h1 >>> 13;
	h1 = ((((h1 & 0xffff) * 0xc2b2ae35) + ((((h1 >>> 16) * 0xc2b2ae35) & 0xffff) << 16))) & 0xffffffff;
	h1 ^= h1 >>> 16;

	return h1 >>> 0;
}

// я бы написал 64, но он не влезет в целое число, так что 52
// это такой тупой способ уменьшить вероятность коллизии хешей
export function murmurHash52(key: string, seed: number = 0){
	let h32 = murmurHash32(key, seed);
	return (h32 * Math.pow(2, (52 - 32))) + murmurHash32(key + h32, seed)
}