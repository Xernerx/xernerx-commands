/** @format */

import { EventBuilder, MessageCommandBuilder, XernerxClient, XernerxShardClient } from '@xernerx/framework';
import { Interaction, Message, Options as DiscordOptions } from 'discord.js';
import { terminal } from '@xernerx/terminal';

import { BaseClient, BaseClientOptions } from './BaseClient.js';
import type { CommandRecord } from './CommandsClient.js';
import { CommandBody, CommandInput, extractClientCommands, post } from '../functions/post.js';
import { DocumentationCommand } from '../commands/documentation.js';
import { DebugCommand } from '../commands/debug.js';
import { EvaluateCommand } from '../commands/evaluate.js';
import { GitCommand } from '../commands/git.js';
import { XernerxCommandsHasteCommand } from '../commands/haste.js';
import { MainCommand } from '../commands/main.js';
import { PingCommand } from '../commands/ping.js';
import { RepeatCommand } from '../commands/repeat.js';
import { XernerxCommandsShellCommand } from '../commands/shell.js';
import { SourceCommand } from '../commands/source.js';
import { SudoCommand } from '../commands/sudo.js';
import { TranspileCommand } from '../commands/transpile.js';

const t = terminal.child({ scope: 'XC' });

/**
 * Union of all built-in developer command identifiers registered by {@link XernerxCommands}.
 */
export type CommandName = 'xc!' | 'documentation' | 'evaluate' | 'haste' | 'ping' | 'shell' | 'transpile' | 'git' | 'source' | 'debug' | 'repeat' | 'su';

/**
 * Configuration options for the {@link XernerxCommands} extension.
 */
export interface XernerxCommandsOptions extends BaseClientOptions {
	/**
	 * Xernerx Suite API token used to automatically post/sync application commands on startup.
	 */
	token?: string;
	/**
	 * Optional interval in milliseconds to periodically re-sync application commands to the Xernerx Suite API.
	 */
	interval?: number;
	/**
	 * Optional allowlist of built-in developer commands to load. When set, only commands in this list are registered.
	 */
	include?: Array<CommandName> | null;
	/**
	 * Optional blocklist of built-in developer commands to exclude from registration.
	 */
	exclude?: Array<CommandName> | null;
	/**
	 * Prefix or array of prefixes used to invoke built-in developer message commands.
	 * @defaultValue 'xc!'
	 */
	prefix?: string | Array<string> | null;
	/**
	 * Discord.js cache limit overrides applied when initializing the extension.
	 */
	cache?: {
		/**
		 * Maximum number of messages cached per channel in Discord.js `MessageManager`.
		 * @defaultValue 1000
		 */
		messages?: number;
	};
	/**
	 * Whether command responses should be formatted as Discord embeds when the bot has `EmbedLinks` permission.
	 * @defaultValue true
	 */
	useEmbeds?: boolean;
	/**
	 * Whether to register the built-in developer message commands on the client.
	 * @defaultValue true
	 */
	registerCommands?: boolean;
}

/**
 * Normalized configuration options stored on {@link XernerxCommands.options}.
 */
export interface NormalizedXernerxCommandsOptions {
	/**
	 * Xernerx Suite API token (empty string if not provided).
	 */
	token: string;
	/**
	 * Optional custom Xernerx Suite API base URL.
	 */
	url?: string;
	/**
	 * Whether local development API mode (`http://localhost:4001`) is enabled.
	 */
	dev?: boolean;
	/**
	 * Optional interval in milliseconds for periodic command synchronization.
	 */
	interval?: number;
	/**
	 * Allowlist of built-in command names to register, or `null` to include all.
	 */
	include: Array<CommandName> | null;
	/**
	 * Blocklist of built-in command names to skip, or `null` to exclude none.
	 */
	exclude: Array<CommandName> | null;
	/**
	 * Normalized array of command prefixes (defaults to `['xc!']`).
	 */
	prefix: Array<string>;
	/**
	 * Normalized cache configuration.
	 */
	cache: {
		/**
		 * Maximum number of messages cached per channel.
		 */
		messages: number;
	};
	/**
	 * Whether responses use Discord embeds when permitted.
	 */
	useEmbeds: boolean;
	/**
	 * Whether built-in developer message commands are registered on the client.
	 */
	registerCommands: boolean;
}

const BUILTIN_COMMANDS: Array<new () => MessageCommandBuilder> = [
	MainCommand,
	DocumentationCommand,
	EvaluateCommand,
	XernerxCommandsHasteCommand,
	PingCommand,
	XernerxCommandsShellCommand,
	TranspileCommand,
	GitCommand,
	SourceCommand,
	DebugCommand,
	RepeatCommand,
	SudoCommand,
];

/**
 * `@xernerx/framework` extension that registers Jishaku-inspired developer commands (`xc!`, `evaluate`, `shell`, `git`, `source`, `haste`, `ping`, `debug`, `repeat`, `su`, `transpile`, `documentation`)
 * and synchronizes slash/context commands with the Xernerx Suite API.
 *
 * @example
 * ```ts
 * import { XernerxClient } from '@xernerx/framework';
 * import { XernerxCommands } from '@xernerx/commands';
 *
 * export class Client extends XernerxClient {
 * 	constructor() {
 * 		super({
 * 			intents: ['Guilds', 'GuildMessages', 'MessageContent'],
 * 			token: process.env.DISCORD_BOT_TOKEN!,
 * 			owners: ['YOUR_USER_ID'],
 * 		});
 *
 * 		this.modules.extensionHandler.loadExtensions(
 * 			new XernerxCommands(this, {
 * 				token: process.env.XERNERX_TOKEN!,
 * 				prefix: 'xc!',
 * 				useEmbeds: true,
 * 				cache: {
 * 					messages: 1000,
 * 				},
 * 			})
 * 		);
 *
 * 		this.connect();
 * 	}
 * }
 *
 * new Client();
 * ```
 */
export class XernerxCommands extends BaseClient {
	/**
	 * Unique extension identifier recognized by `@xernerx/framework`.
	 */
	public readonly id = 'XernerxCommands';

	/**
	 * Framework module filetype discriminator (`'XernerxExtension'`).
	 */
	public readonly filetype = 'XernerxExtension' as const;

	/**
	 * Normalized configuration options for this extension instance.
	 */
	public readonly options: NormalizedXernerxCommandsOptions;

	private _client!: XernerxClient | XernerxShardClient;
	private initialized = false;
	private listenerAttached = false;
	private postedOnce = false;
	private readonly builtinMap = new Map<string, MessageCommandBuilder>();

	/**
	 * Creates a new {@link XernerxCommands} extension instance.
	 *
	 * @param client - The `@xernerx/framework` `XernerxClient` or `XernerxShardClient` instance.
	 * @param options - Configuration options for command registration and API synchronization.
	 */
	constructor(client: XernerxClient | XernerxShardClient, options: XernerxCommandsOptions = {}) {
		super(options.token || '', { url: options.url, dev: options.dev });

		const normalizedPrefix = options.prefix ? (Array.isArray(options.prefix) ? options.prefix : [options.prefix]) : ['xc!'];

		this.options = {
			token: options.token || '',
			url: options.url,
			dev: options.dev,
			interval: options.interval,
			include: options.include || null,
			exclude: options.exclude || null,
			prefix: normalizedPrefix,
			cache: {
				messages: options.cache?.messages || 1000,
			},
			useEmbeds: options.useEmbeds ?? true,
			registerCommands: options.registerCommands ?? true,
		};

		if (client) {
			this.client = client;
		}
	}

	/**
	 * The attached `@xernerx/framework` client or shard client instance.
	 */
	public get client(): XernerxClient | XernerxShardClient {
		return this._client;
	}

	/**
	 * Sets the `@xernerx/framework` client or shard client instance and triggers initialization on first assignment.
	 *
	 * @param value - The client or shard client to attach.
	 */
	public set client(value: XernerxClient | XernerxShardClient) {
		this._client = value;
		if (value && !this.initialized) {
			this.initialized = true;
			void this.main(value);
		}
	}

	/**
	 * Initializes the extension on the given client, configuring message cache limits, interaction delete button handlers,
	 * built-in developer message commands, and automatic API command synchronization.
	 *
	 * @param client - The client instance to initialize against (defaults to {@link XernerxCommands.client | this.client}).
	 * @returns A promise that resolves once setup has been scheduled.
	 */
	public async main(client: XernerxClient | XernerxShardClient = this._client) {
		if (!client) return;
		this._client = client;

		const isDiscordClient = 'commands' in client && 'on' in client;

		if (isDiscordClient) {
			const djsClient = client as XernerxClient;

			(djsClient as any).config = {
				...((djsClient as any).config || {}),
				xc: this.options,
			};

			if (djsClient.options) {
				djsClient.options.makeCache = DiscordOptions.cacheWithLimits({
					MessageManager: this.options.cache.messages,
				});
			}

			djsClient.on('interactionCreate', async (interaction: Interaction) => {
				if (interaction.isButton() && interaction.customId === 'xc-delete-msg') {
					const owners = djsClient.settings?.owners || [];
					if (owners.length === 0 || owners.includes(interaction.user.id)) {
						await interaction.message.delete().catch(() => null);
					}
				}
			});

			if (this.options.registerCommands) {
				this.registerMessageCommands(djsClient);
			}
		}

		if (this.token) {
			this.scheduleSync(client);
		}
	}

	/**
	 * Instantiates and registers all enabled built-in developer message commands onto the client.
	 *
	 * @param client - The target `XernerxClient`.
	 */
	private registerMessageCommands(client: XernerxClient) {
		if (!client.handler.message.directory && (!client.handler.message.prefix || (Array.isArray(client.handler.message.prefix) && client.handler.message.prefix.length === 0))) {
			client.handler.message = {
				directory: null,
				prefix: this.options.prefix,
				mention: false,
				seperator: ' ',
				handleEdits: false,
				handleDeletions: false,
				ignore: { system: true, bots: true, self: true },
			};
		}

		for (const CommandClass of BUILTIN_COMMANDS) {
			try {
				const command = new CommandClass();

				if (this.options.exclude && this.options.exclude.includes(command.name as CommandName)) continue;
				if (this.options.include && !this.options.include.includes(command.name as CommandName)) continue;

				command.client = client;
				(command as any).prefix = this.options.prefix;

				const originalExec = command.exec.bind(command);
				command.exec = async (message: Message, args?: any) => {
					if ((message as any)._xcDispatched) {
						return await originalExec(message, args);
					}
					const raw = (message.content || '').trim();
					const botId = client.user?.id;
					const stripped = botId ? raw.replace(new RegExp(`^<@!?${botId}>\\s*`), '').trim() : raw;
					const hasPrefix = this.options.prefix.some((p) => stripped.toLowerCase().startsWith(p.toLowerCase()));
					if (!hasPrefix) return;
					(message as any)._xcDispatched = true;
					return await originalExec(message, args);
				};

				this.builtinMap.set(command.id.toLowerCase(), command);
				this.builtinMap.set(command.name.toLowerCase(), command);
				client.commands.message.set(command.id, command);

				for (const alias of command.alias || []) {
					this.builtinMap.set(alias.toLowerCase(), command);
					if (!client.commands.message.has(alias)) {
						client.commands.message.set(alias, command);
					}
				}
			} catch (error) {
				t.error((error as Error)?.message || String(error));
			}
		}

		if (!this.listenerAttached) {
			this.listenerAttached = true;
			this.attachFallbackMessageListener(client);
		}
	}

	/**
	 * Attaches a fallback `messageCreate` listener so built-in developer commands work even when the host bot
	 * has not configured a message command directory.
	 *
	 * @param client - The target `XernerxClient`.
	 */
	private attachFallbackMessageListener(client: XernerxClient) {
		const fallbackEvent = new (class XernerxCommandsMessageEvent extends EventBuilder {
			constructor() {
				super('XernerxCommandsMessageEvent', {
					name: 'messageCreate',
					emitter: 'client',
					once: false,
				});
			}
		})();

		client.events.set(fallbackEvent.id, fallbackEvent);

		client.on('messageCreate', async (message: Message) => {
			if ((message as any)._xcDispatched) return;
			if (!message.content || message.author.bot || message.system) return;

			const rawContent = message.content.trim();
			const botId = client.user?.id;
			const mentionRegex = botId ? new RegExp(`^<@!?${botId}>\\s*`) : null;
			const wasMentioned = mentionRegex ? mentionRegex.test(rawContent) : false;
			const content = mentionRegex ? rawContent.replace(mentionRegex, '').trim() : rawContent;

			const matchedPrefix = this.options.prefix.find((p) => content.toLowerCase().startsWith(p.toLowerCase()));
			if (!matchedPrefix) return;

			const withoutPrefix = content.slice(matchedPrefix.length).trim();
			const [rawCmdName, ...args] = withoutPrefix ? withoutPrefix.split(/\s+/) : ['xc!'];
			const cmdName = (rawCmdName || 'xc!').toLowerCase();

			const command =
				this.builtinMap.get(cmdName) ||
				client.commands.message.get(cmdName) ||
				client.commands.message.find((cmd) => cmd.name.toLowerCase() === cmdName || cmd.alias?.some((a) => a.toLowerCase() === cmdName));

			if (!command) return;

			(message as any)._xcDispatched = true;

			(message as any).util = {
				...(message.util || {}),
				message,
				args,
				parsed: {
					command: command.name,
					alias: cmdName,
					mention: wasMentioned,
					prefix: matchedPrefix,
				},
				send: message.util?.send ? message.util.send.bind(message.util) : (opts: any) => (message.channel as any).send(opts),
				reply: message.util?.reply ? message.util.reply.bind(message.util) : (opts: any) => message.reply(opts),
			};

			if (!message.user) {
				(message as any).user = message.author;
			}

			try {
				await command.exec(message, args);
			} catch (error) {
				t.error((error as Error)?.message || String(error));
			}
		});
	}

	/**
	 * Resolves the target Discord bot ID from the explicit parameter or the attached client.
	 */
	private async resolveBotId(botId?: string): Promise<string> {
		const client = this._client as any;
		const resolvedId = botId || client?.user?.id || (await client?.fetchClientValues?.('user.id')?.catch(() => []))?.[0];
		if (!resolvedId) {
			throw new Error('Bot ID could not be resolved from client.');
		}
		return resolvedId;
	}

	/**
	 * Fetches all registered command records for the bot from the Xernerx Suite API.
	 *
	 * @param botId - Optional Discord bot ID override.
	 * @returns A promise that resolves to an array of {@link CommandRecord} objects.
	 */
	public async get(botId?: string): Promise<CommandRecord[]> {
		const resolvedId = await this.resolveBotId(botId);
		const endpoint = `${this.url}/v1/bots/${encodeURIComponent(resolvedId)}/commands`;
		const response = await fetch(endpoint, {
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
	 * Extracts (or accepts) the bot's application commands and posts them to the Xernerx Suite API.
	 *
	 * @param commands - Optional explicit list of commands to post. When omitted, commands are automatically extracted from the attached client or shard cluster.
	 * @param botId - Optional Discord bot ID override. When omitted, resolved from `client.user.id` or shard values.
	 * @returns A promise that resolves to the parsed JSON API response.
	 */
	public async post(commands?: CommandInput[], botId?: string): Promise<any> {
		if (!this.token) {
			throw new Error('API token is required to post commands to the Xernerx Suite API.');
		}

		const client = this._client as any;
		const resolvedId = await this.resolveBotId(botId);

		let resolvedCommands: CommandInput[] = commands || [];

		if (!commands && client) {
			if ('commands' in client) {
				resolvedCommands = extractClientCommands(client);
			} else if (typeof client.broadcastEval === 'function') {
				const clusterCommands = await client
					.broadcastEval((c: any) => {
						const list: any[] = [];
						if (c.commands?.slash) {
							for (const cmd of c.commands.slash.values()) {
								const json = typeof cmd.data?.toJSON === 'function' ? cmd.data.toJSON() : {};
								list.push({ ...json, name: json.name ?? cmd.name, description: json.description || cmd.description || '', type: json.type ?? 1 });
							}
						}
						if (c.commands?.context) {
							for (const cmd of c.commands.context.values()) {
								const json = typeof cmd.data?.toJSON === 'function' ? cmd.data.toJSON() : {};
								list.push({ ...json, name: json.name ?? cmd.name, description: json.description || cmd.description || '', type: json.type ?? cmd.type ?? 2 });
							}
						}
						return list;
					})
					.catch(() => []);
				resolvedCommands = (clusterCommands?.[0] as CommandBody[]) || [];
			}
		}

		return post({ id: resolvedId, commands: resolvedCommands }, this.token, this.url);
	}

	/**
	 * Alias for {@link XernerxCommands.post | post} that synchronizes the bot's commands with the Xernerx Suite API.
	 *
	 * @param commands - Optional explicit list of commands to synchronize.
	 * @param botId - Optional Discord bot ID override.
	 * @returns A promise that resolves to the parsed JSON API response.
	 */
	public async sync(commands?: CommandInput[], botId?: string): Promise<any> {
		return this.post(commands, botId);
	}

	/**
	 * Alias for {@link XernerxCommands.post | post} that updates the bot's commands on the Xernerx Suite API.
	 *
	 * @param commands - Optional explicit list of commands to update.
	 * @param botId - Optional Discord bot ID override.
	 * @returns A promise that resolves to the parsed JSON API response.
	 */
	public async update(commands?: CommandInput[], botId?: string): Promise<any> {
		return this.post(commands, botId);
	}

	/**
	 * Deletes a specific command (when `commandId` is provided) or all commands for the bot from the Xernerx Suite API.
	 *
	 * @param commandId - Optional command ID or command name to delete. When omitted, all commands for the bot are deleted.
	 * @param botId - Optional Discord bot ID override.
	 * @returns A promise that resolves to the parsed JSON API response.
	 */
	public async delete(commandId?: string, botId?: string): Promise<any> {
		const resolvedId = await this.resolveBotId(botId);
		const base = `${this.url}/v1/bots/${encodeURIComponent(resolvedId)}/commands`;
		const endpoint = commandId ? `${base}?commandId=${encodeURIComponent(commandId)}` : base;

		const response = await fetch(endpoint, {
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
	 * Clears all commands stored for the bot on the Xernerx Suite API.
	 *
	 * @param botId - Optional Discord bot ID override.
	 * @returns A promise that resolves to the parsed JSON API response.
	 */
	public async clear(botId?: string): Promise<any> {
		return this.delete(undefined, botId);
	}

	/**
	 * Schedules the initial command sync once the client's user ID becomes available, and optionally sets up
	 * a recurring sync timer if {@link XernerxCommandsOptions.interval | options.interval} is configured.
	 *
	 * @param client - The attached client or shard client.
	 */
	private scheduleSync(client: XernerxClient | XernerxShardClient | any) {
		if ((client as XernerxClient).sharded && !('totalClusters' in client)) {
			if (client.cluster?.id && client.cluster.id !== 0) return;
		}

		const collector = setInterval(async () => {
			if (this.postedOnce) {
				clearInterval(collector);
				return;
			}

			const id = (client as XernerxClient)?.user?.id || (await client.fetchClientValues?.('user.id')?.catch(() => []))?.[0];

			if (!id) return;

			this.postedOnce = true;
			clearInterval(collector);

			await this.post(undefined, id)
				.then(() => t.log('Successfully posted commands.'))
				.catch((err) => t.error(err?.message || String(err)));

			if (this.options.interval && this.options.interval > 0) {
				setInterval(async () => {
					await this.post(undefined, id)
						.then(() => t.log('Successfully posted commands.'))
						.catch((err) => t.error(err?.message || String(err)));
				}, this.options.interval);
			}
		}, 5000);
	}
}
