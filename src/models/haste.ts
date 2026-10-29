/** @format */

/**
 * Uploads code or text to a Hastebin-compatible service and returns its document URL
 * (or a fallback message if all mirrors are unreachable).
 *
 * @param code - The raw text or source code to upload.
 * @returns A promise that resolves to the Hastebin document URL or a fallback message string.
 */
export async function haste(code: string): Promise<string> {
	for (const url of ['https://haste.xernerx.com', 'https://hst.sh', 'https://hastebin.com', 'https://haste.clicksminuteper.net', 'https://haste.tyman.tech']) {
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
