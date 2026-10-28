/** @format */

import { BaseClient, BaseClientOptions } from './BaseClient.js';
import { CommandBody, CommandInput, post } from '../functions/post.js';

/**
 * Configuration options for {@link CommandsClient}.
 */
export interface CommandsClientOptions extends BaseClientOptions {
	/**
	 * Discord bot / application Snowflake ID whose commands are being managed.
	 */
	botId: string;
	/**
	 * Xernerx Suite API authentication token (`Bearer` token).
	 */
	token: string;
}

/**
 * Stored command record returned by the Xernerx Suite API (`GET /v1/bots/:id/commands`).
 */
export interface CommandRecord {
	/**
	 * Internal database document ID.
	 */
	_id: string;
	/**
	 * Discord bot / application Snowflake ID that owns this command.
	 */
	botId: string;
	/**
	 * Unique identifier or command name key for this command record.
	 */
	commandId: string;
	/**
	 * Command name.
	 */
	name: string;
	/**
	 * Command description, if present.
	 */
	description?: string;
	/**
	 * Discord application command type (`1` = ChatInput, `2` = User, `3` = Message).
	 */
	type: number;
	/**
	 * Raw serialized Discord application command body.
	 */
	body: CommandBody;
	/**
	 * ISO-8601 creation timestamp.
	 */
	createdAt?: string;
	/**
	 * ISO-8601 last update timestamp.
	 */
	updatedAt?: string;
}

/**
 * Standalone HTTP client for fetching, posting, syncing, and deleting Discord bot commands
 * on the Xernerx Suite API (`/v1/bots/:id/commands`).
 *
 * @example
 * ```ts
 * import { CommandsClient } from '@xernerx/commands';
 * import { Terminal } from '@xernerx/terminal';
 *
 * export class Commands extends CommandsClient {
 * 	private readonly console = new Terminal({ scope: 'XC' });
 *
 * 	constructor() {
 * 		super({
 * 			botId: 'YOUR_BOT_ID',
 * 			token: process.env.XERNERX_API_TOKEN!,
 * 		});
 * 	}
 *
 * 	async run() {
 * 		await this.post([{ name: 'ping', description: 'Replies with Pong!', type: 1 }]);
 * 		await this.sync([{ name: 'ping', description: 'Replies with Pong!', type: 1 }]);
 * 		const list = await this.get();
 * 		this.console.info(`Synced ${list.length} commands`);
 * 		await this.delete('ping');
 * 		await this.clear();
 * 	}
 * }
 *
 * new Commands();
 * ```
 */
export class CommandsClient extends BaseClient {
	/**
	 * Default Discord bot / application Snowflake ID used for API operations.
	 */
	public readonly botId: string;

	/**
	 * Creates a new {@link CommandsClient} instance.
	 *
	 * @param options - Configuration options including `botId`, `token`, and optional `url` / `dev` settings.
	 */
	constructor(options: CommandsClientOptions) {
		super(options.token, { url: options.url, dev: options.dev });
		this.botId = options.botId;
	}

	/**
	 * Builds the full API endpoint URL for a bot's commands resource.
	 *
	 * @param botId - Target Discord bot ID.
	 * @param commandId - Optional command ID or name to filter on delete requests.
	 * @returns Resolved endpoint URL string.
	 */
	private getEndpoint(botId = this.botId, commandId?: string): string {
		const base = `${this.url}/v1/bots/${encodeURIComponent(botId)}/commands`;
		return commandId ? `${base}?commandId=${encodeURIComponent(commandId)}` : base;
	}

	/**
	 * Fetches all registered command records for the specified bot from the Xernerx Suite API.
	 *
	 * @param botId - Discord bot ID to fetch commands for (defaults to {@link CommandsClient.botId | this.botId}).
	 * @returns A promise that resolves to an array of {@link CommandRecord} objects.
	 */
	public async get(botId = this.botId): Promise<CommandRecord[]> {
		const response = await fetch(this.getEndpoint(botId), {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${this.token}`,
			},
		});

		const body: any = await response.json().catch(() => null);

		if (!response.ok) {
			throw new Error(body?.error || body?.message || `Failed to fetch commands (HTTP ${response.status})`);
		}

		return body as CommandRecord[];
	}

	/**
	 * Posts and synchronizes an array of commands for the specified bot to the Xernerx Suite API.
	 *
	 * @param commands - Array of command builders or raw command body objects to post.
	 * @param botId - Discord bot ID to post commands for (defaults to {@link CommandsClient.botId | this.botId}).
	 * @returns A promise that resolves to the parsed JSON API response.
	 */
	public async post(commands: CommandInput[], botId = this.botId) {
		return post({ id: botId, commands }, this.token, this.url);
	}

	/**
	 * Alias for {@link CommandsClient.post | post} that synchronizes the bot's commands with the Xernerx Suite API.
	 *
	 * @param commands - Array of command builders or raw command body objects to synchronize.
	 * @param botId - Discord bot ID to synchronize commands for (defaults to {@link CommandsClient.botId | this.botId}).
	 * @returns A promise that resolves to the parsed JSON API response.
	 */
	public async sync(commands: CommandInput[], botId = this.botId) {
		return post({ id: botId, commands }, this.token, this.url);
	}

	/**
	 * Alias for {@link CommandsClient.post | post} that updates the bot's commands on the Xernerx Suite API.
	 *
	 * @param commands - Array of command builders or raw command body objects to update.
	 * @param botId - Discord bot ID to update commands for (defaults to {@link CommandsClient.botId | this.botId}).
	 * @returns A promise that resolves to the parsed JSON API response.
	 */
	public async update(commands: CommandInput[], botId = this.botId) {
		return post({ id: botId, commands }, this.token, this.url);
	}

	/**
	 * Deletes a specific command (when `commandId` is provided) or all commands for the bot from the Xernerx Suite API.
	 *
	 * @param commandId - Optional command ID or command name to delete. When omitted, all commands for the bot are deleted.
	 * @param botId - Discord bot ID whose command(s) should be deleted (defaults to {@link CommandsClient.botId | this.botId}).
	 * @returns A promise that resolves to the parsed JSON API response.
	 */
	public async delete(commandId?: string, botId = this.botId) {
		const response = await fetch(this.getEndpoint(botId, commandId), {
			method: 'DELETE',
			headers: {
				Authorization: `Bearer ${this.token}`,
			},
		});

		const body: any = await response.json().catch(() => null);

		if (!response.ok) {
			throw new Error(body?.error || body?.message || `Failed to delete commands (HTTP ${response.status})`);
		}

		return body;
	}

	/**
	 * Clears all commands stored for the specified bot on the Xernerx Suite API.
	 *
	 * @param botId - Discord bot ID whose commands should be cleared (defaults to {@link CommandsClient.botId | this.botId}).
	 * @returns A promise that resolves to the parsed JSON API response.
	 */
	public async clear(botId = this.botId) {
		return this.delete(undefined, botId);
	}
}
