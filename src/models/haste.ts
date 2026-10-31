/** @format */

/**
 * Optional metadata and authentication options when uploading a document to Xernerx Haste (`haste.xernerx.com`) or Hastebin mirrors.
 */
export interface HasteOptions {
	/**
	 * Registered Xernerx/Discord user ID (`15–22` digit snowflake) required by `haste.xernerx.com`.
	 */
	userId?: string;
	/**
	 * Optional document title (up to 120 characters) for `haste.xernerx.com`.
	 */
	title?: string;
	/**
	 * Optional syntax highlighting language identifier (e.g., `'ts'`, `'js'`, `'sh'`, `'json'`).
	 */
	language?: string;
	/**
	 * Optional document visibility on `haste.xernerx.com` (`'public'`, `'limited'`, or `'private'`).
	 * @defaultValue 'limited'
	 */
	privacy?: 'public' | 'limited' | 'private';
	/**
	 * Optional expiration window on `haste.xernerx.com` (`'1h'`, `'24h'`, `'7d'`, `'30d'`, or `'never'`).
	 * @defaultValue '7d'
	 */
	expiresIn?: '1h' | '24h' | '7d' | '30d' | 'never';
	/**
	 * Optional Xernerx Suite API bearer token (`Authorization: Bearer ...`).
	 */
	token?: string;
}

/**
 * Unwraps an outer Markdown code fence (` ```lang ... ``` `) from a string if present.
 */
function unwrapCodeFence(raw: string): { content: string; language?: string } {
	const trimmed = raw.trim();
	const match = trimmed.match(/^```([a-zA-Z0-9_+-]*)\r?\n([\s\S]*?)\r?\n?```$/);
	if (match) {
		return {
			content: match[2] ?? raw,
			language: match[1] ? match[1].trim().toLowerCase() : undefined,
		};
	}
	return { content: raw };
}

/**
 * Uploads code or text to `haste.xernerx.com` (or a Hastebin-compatible fallback mirror) and returns its document URL
 * (or a fallback message if all mirrors are unreachable).
 *
 * @param code - The raw text or source code to upload.
 * @param options - Optional Xernerx/Discord `userId` string or {@link HasteOptions} configuration object.
 * @returns A promise that resolves to the Hastebin document URL or a fallback message string.
 */
export async function haste(code: string, options?: string | HasteOptions): Promise<string> {
	const opts: HasteOptions = typeof options === 'string' ? { userId: options } : options || {};
	const { content, language: detectedLanguage } = unwrapCodeFence(code);
	const resolvedLanguage = opts.language || detectedLanguage;

	for (const url of ['https://haste.xernerx.com', 'https://haste.canary.xernerx.com', 'https://hst.sh', 'https://hastebin.com']) {
		try {
			const isXernerxHaste = url.includes('xernerx.com');
			const endpoint = isXernerxHaste && opts.userId ? `${url}/documents?userId=${encodeURIComponent(opts.userId)}` : `${url}/documents`;

			const headers: Record<string, string> = {};
			let body: string = content;

			if (isXernerxHaste) {
				headers['Content-Type'] = 'application/json';
				if (opts.userId) {
					headers['x-user-id'] = opts.userId;
				}
				if (opts.token) {
					headers['Authorization'] = `Bearer ${opts.token}`;
				}
				body = JSON.stringify({
					content,
					userId: opts.userId,
					title: opts.title,
					language: resolvedLanguage,
					privacy: opts.privacy,
					expiresIn: opts.expiresIn,
				});
			}

			const response = await fetch(endpoint, {
				body,
				headers,
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
