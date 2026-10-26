/** @format */

/**
 * Configuration options for {@link BaseClient}.
 */
export interface BaseClientOptions {
	url?: string;
	dev?: boolean;
}

/**
 * Base HTTP client for communicating with the Xernerx Suite API.
 */
export class BaseClient {
	public readonly token: string;
	public readonly url: string;

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
