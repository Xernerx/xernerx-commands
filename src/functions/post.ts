/** @format */

import type { ContextCommandBuilder, MessageCommandBuilder, SlashCommandBuilder, XernerxClient } from '@xernerx/framework';

export interface CommandOptionBody {
	name: string;
	description?: string;
	type?: number | string;
	required?: boolean;
	choices?: Array<{ name: string; value: string | number; name_localizations?: Record<string, string> }>;
	options?: CommandOptionBody[];
	autocomplete?: boolean;
	[key: string]: any;
}

export interface CommandBody {
	id?: string;
	name: string;
	description?: string;
	type?: number;
	options?: CommandOptionBody[];
	[key: string]: any;
}

export type CommandInput = CommandBody | SlashCommandBuilder | ContextCommandBuilder | MessageCommandBuilder | Record<string, any>;

export interface CommandsPayload {
	id?: string;
	commands: CommandInput[];
}

export function serializeCommand(command: CommandInput): CommandBody {
	if (!command || typeof command !== 'object') {
		throw new Error('Invalid command object provided.');
	}

	const rawData = typeof (command as any).data?.toJSON === 'function' ? (command as any).data.toJSON() : typeof (command as any).toJSON === 'function' ? (command as any).toJSON() : command;

	const inferredType = rawData.type ?? (command as any).type ?? ((command as any).filetype === 'XernerxContextCommand' ? ((command as any).type ?? 2) : 1);

	return {
		...rawData,
		name: rawData.name ?? (command as any).name,
		description: rawData.description || (command as any).description || '',
		type: typeof inferredType === 'number' ? inferredType : 1,
	};
}

export function extractClientCommands(client: XernerxClient | any): CommandBody[] {
	const collected: CommandBody[] = [];

	if (client?.commands) {
		if (client.commands.slash && typeof client.commands.slash.values === 'function') {
			for (const cmd of client.commands.slash.values()) {
				collected.push(serializeCommand(cmd));
			}
		}

		if (client.commands.context && typeof client.commands.context.values === 'function') {
			for (const cmd of client.commands.context.values()) {
				collected.push(serializeCommand(cmd));
			}
		}

		if (Array.isArray(client.commands)) {
			for (const cmd of client.commands) {
				collected.push(serializeCommand(cmd));
			}
		}
	}

	return collected.filter((cmd) => Boolean(cmd?.name));
}

export async function post(data: CommandsPayload, token: string, baseUrl = 'https://api.xernerx.com') {
	const { id, commands } = data;

	if (!id) {
		throw new Error('Bot ID is required to post commands.');
	}

	if (!Array.isArray(commands)) {
		throw new Error('Commands array is required to post commands.');
	}

	const payload = commands.map((cmd) => serializeCommand(cmd)).filter((cmd) => Boolean(cmd.name));
	const endpoint = `${baseUrl.replace(/\/$/, '')}/v1/bots/${encodeURIComponent(id)}/commands`;

	const response = await fetch(endpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`,
		},
		body: JSON.stringify(payload),
	});

	const body: any = await response.json().catch(() => null);

	if (!response.ok) {
		throw new Error(body?.error || body?.message || `Failed to post commands (HTTP ${response.status})`);
	}

	return body;
}
