/** @format */

/**
 * Uploads code or text to a hastebin-compatible service and returns its URL.
 */
export async function haste(code: string): Promise<string> {
	for (const url of ['https://hst.sh', 'https://hastebin.com', 'https://haste.clicksminuteper.net', 'https://haste.tyman.tech']) {
		try {
			const response = await fetch(`${url}/documents`, {
				body: code,
				method: 'POST',
				signal: AbortSignal.timeout(3000),
			});

			if (!response.ok) continue;

			const resp: any = await response.json();
			if (resp?.key) {
				return `${url}/${resp.key}`;
			}
		} catch {
			continue;
		}
	}

	return `Can't haste code anywhere.`;
}
