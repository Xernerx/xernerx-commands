/** @format */

import type { ContextCommandBuilder, MessageCommandBuilder, SlashCommandBuilder, XernerxClient } from '@xernerx/framework';

/**
 * Serialized Discord application command option payload.
 */
export interface CommandOptionBody {
	/**
	 * Option name.
	 */
	name: string;
	/**
	 * Option description.
	 */
	description?: string;
	/**
	 * Discord application command option type (`ApplicationCommandOptionType` number or name).
	 */
	type?: number | string;
	/**
	 * Whether this option is required.
	 */
	required?: boolean;
	/**
	 * Predefined choices for string, integer, or number options.
	 */
	choices?: Array<{ name: string; value: string | number; name_localizations?: Record<string, string> }>;
	/**
	 * Nested sub-options for subcommands or subcommand groups.
	 */
	options?: CommandOptionBody[];
	/**
	 * Whether autocomplete interactions are enabled for this option.
	 */
	autocomplete?: boolean;
	/**
	 * Additional Discord API option fields (such as `min_value`, `max_value`, `channel_types`, localizations).
	 */
	[key: string]: any;
}

/**
 * Serialized Discord application command payload sent to the Xernerx Suite API.
 */
export interface CommandBody {
	/**
	 * Optional Discord command Snowflake ID or custom identifier.
	 */
	id?: string;
	/**
	 * Command name.
	 */
	name: string;
	/**
	 * Command description (empty string for User/Message context menu commands).
	 */
	description?: string;
	/**
	 * Discord application command type (`1` = ChatInput, `2` = User, `3` = Message).
	 */
	type?: number;
	/**
	 * Array of command options and subcommands.
	 */
	options?: CommandOptionBody[];
	/**
	 * Additional Discord API command fields (such as `default_member_permissions`, `dm_permission`, `nsfw`, `contexts`, `integration_types`).
	 */
	[key: string]: any;
}

/**
 * Accepted command representations that can be serialized and posted to the Xernerx Suite API.
 */
export type CommandInput = CommandBody | SlashCommandBuilder | ContextCommandBuilder | MessageCommandBuilder | Record<string, any>;

/**
 * Payload accepted by {@link post} for uploading a bot's commands to the Xernerx Suite API.
 */
export interface CommandsPayload {
	/**
	 * Discord bot / application Snowflake ID.
	 */
	id?: string;
	/**
	 * List of command builders or raw command definitions to serialize and upload.
	 */
	commands: CommandInput[];
}

/**
 * Normalizes a `@xernerx/framework` command builder, Discord.js builder, or plain object into a serializable {@link CommandBody}.
 *
 * @param command - The command builder or plain command object to serialize.
 * @returns The normalized {@link CommandBody} object.
 */
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

/**
 * Extracts and serializes all slash and context menu commands currently loaded on a `XernerxClient`.
 *
 * @param client - The `@xernerx/framework` client (or compatible command holder) to extract commands from.
 * @returns An array of serialized {@link CommandBody} objects.
 */
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

/**
 * Posts a bot's serialized application commands to the Xernerx Suite API (`POST /v1/bots/:id/commands`).
 *
 * @param data - Payload containing the target bot `id` and `commands` array.
 * @param token - Xernerx Suite API `Bearer` authentication token.
 * @param baseUrl - Base URL of the Xernerx Suite API (defaults to `'https://api.xernerx.com'`).
 * @returns A promise that resolves to the parsed JSON API response.
 */
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
