/** @format */

import { BaseClient, BaseClientOptions } from './BaseClient.js';
import { CommandBody, CommandInput, post } from '../functions/post.js';

export interface CommandsClientOptions extends BaseClientOptions {
	botId: string;
	token: string;
}

export interface CommandRecord {
	_id: string;
	botId: string;
	commandId: string;
	name: string;
	description?: string;
	type: number;
	body: CommandBody;
	createdAt?: string;
	updatedAt?: string;
}

export class CommandsClient extends BaseClient {
	public readonly botId: string;

	constructor(options: CommandsClientOptions) {
		super(options.token, { url: options.url, dev: options.dev });
		this.botId = options.botId;
	}

	private getEndpoint(botId = this.botId, commandId?: string): string {
		const base = `${this.url}/v1/bots/${encodeURIComponent(botId)}/commands`;
		return commandId ? `${base}?commandId=${encodeURIComponent(commandId)}` : base;
	}

	public async getCommands(botId = this.botId): Promise<CommandRecord[]> {
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

	public async postCommands(commands: CommandInput[], botId = this.botId) {
		return post({ id: botId, commands }, this.token, this.url);
	}

	public async syncCommands(commands: CommandInput[], botId = this.botId) {
		return post({ id: botId, commands }, this.token, this.url);
	}

	public async updateCommands(commands: CommandInput[], botId = this.botId) {
		return post({ id: botId, commands }, this.token, this.url);
	}

	public async deleteCommands(commandId?: string, botId = this.botId) {
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

	public async clearCommands(botId = this.botId) {
		return this.deleteCommands(undefined, botId);
	}
}
