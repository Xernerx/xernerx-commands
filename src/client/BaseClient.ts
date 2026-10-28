/** @format */

/**
 * Configuration options for {@link BaseClient}.
 */
export interface BaseClientOptions {
	/**
	 * Custom base URL for the Xernerx Suite API.
	 * Defaults to `process.env.API_URL`, `https://api.canary.xernerx.com` when `ENVIRONMENT=CANARY`, or `https://api.xernerx.com`.
	 */
	url?: string;
	/**
	 * When `true`, connects to the local development API server (`http://localhost:4001`) unless {@link BaseClientOptions.url | url} is explicitly set.
	 * @defaultValue false
	 */
	dev?: boolean;
}

/**
 * Base HTTP client for communicating with the Xernerx Suite API.
 */
export class BaseClient {
	/**
	 * Bearer authentication token used for requests to the Xernerx Suite API.
	 */
	public readonly token: string;

	/**
	 * Resolved base URL (without trailing slash) for the Xernerx Suite API.
	 */
	public readonly url: string;

	/**
	 * Creates a new {@link BaseClient} instance.
	 *
	 * @param token - Xernerx Suite API authentication token.
	 * @param options - Base client configuration options.
	 */
	constructor(token = '', options: BaseClientOptions = {}) {
		this.token = token;
		const envUrl =
			typeof process !== 'undefined' && process.env?.API_URL
				? process.env.API_URL
				: typeof process !== 'undefined' && process.env?.ENVIRONMENT?.toUpperCase() === 'CANARY'
					? 'https://api.canary.xernerx.com'
					: 'https://api.xernerx.com';
		this.url = (options.url ?? (options.dev ? 'http://localhost:4001' : envUrl)).replace(/\/$/, '');
	}
}
