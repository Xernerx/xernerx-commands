/** @format */

import { EventBuilder, MessageCommandBuilder, XernerxClient, XernerxShardClient } from '@xernerx/framework';
import { Interaction, Message, Options as DiscordOptions } from 'discord.js';
import { terminal } from '@xernerx/terminal';

import { BaseClient, BaseClientOptions } from './BaseClient.js';
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

export type CommandName = 'xc!' | 'documentation' | 'evaluate' | 'haste' | 'ping' | 'shell' | 'transpile' | 'git' | 'source' | 'debug' | 'repeat' | 'su';

export interface XernerxCommandsOptions extends BaseClientOptions {
	token?: string;
	interval?: number;
	include?: Array<CommandName> | null;
	exclude?: Array<CommandName> | null;
	prefix?: string | Array<string> | null;
	cache?: {
		messages?: number;
	};
	useEmbeds?: boolean;
	registerCommands?: boolean;
}

export interface NormalizedXernerxCommandsOptions {
	token: string;
	url?: string;
	dev?: boolean;
	interval?: number;
	include: Array<CommandName> | null;
	exclude: Array<CommandName> | null;
	prefix: Array<string>;
	cache: {
		messages: number;
	};
	useEmbeds: boolean;
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

export class XernerxCommands extends BaseClient {
	public readonly id = 'XernerxCommands';
	public readonly filetype = 'XernerxExtension' as const;
	public readonly options: NormalizedXernerxCommandsOptions;
	private _client!: XernerxClient | XernerxShardClient;
	private initialized = false;
	private postedOnce = false;

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

	public get client(): XernerxClient | XernerxShardClient {
		return this._client;
	}

	public set client(value: XernerxClient | XernerxShardClient) {
		this._client = value;
		if (value && !this.initialized) {
			this.initialized = true;
			void this.main(value);
		}
	}

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

				client.commands.message.set(command.id, command);

				for (const alias of command.alias || []) {
					if (!client.commands.message.has(alias)) {
						client.commands.message.set(alias, command);
					}
				}
			} catch (error) {
				t.error((error as Error)?.message || String(error));
			}
		}

		if (!client.events.has('XernerxMessageCreateEvent')) {
			this.attachFallbackMessageListener(client);
		}
	}

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
			if (client.events.has('XernerxMessageCreateEvent')) return;
			if (!message.content || message.author.bot || message.system) return;

			const content = message.content.trim();
			const matchedPrefix = this.options.prefix.find((p) => content.toLowerCase().startsWith(p.toLowerCase()));
			if (!matchedPrefix) return;

			const withoutPrefix = content.slice(matchedPrefix.length).trim();
			const [rawCmdName, ...args] = withoutPrefix ? withoutPrefix.split(/\s+/) : ['xc!'];
			const cmdName = (rawCmdName || 'xc!').toLowerCase();

			const command = client.commands.message.get(cmdName) || client.commands.message.find((cmd) => cmd.name.toLowerCase() === cmdName || cmd.alias?.some((a) => a.toLowerCase() === cmdName));

			if (!command) return;

			if (!message.util) {
				(message as any).util = {
					message,
					args,
					parsed: {
						command: command.name,
						alias: cmdName,
						mention: false,
						prefix: matchedPrefix,
					},
					send: (opts: any) => (message.channel as any).send(opts),
					reply: (opts: any) => message.reply(opts),
				};
			}

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

	public async postCommands(commands?: CommandInput[], botId?: string): Promise<any> {
		if (!this.token) {
			throw new Error('API token is required to post commands to the Xernerx Suite API.');
		}

		const client = this._client as any;
		const resolvedId = botId || client?.user?.id || (await client?.fetchClientValues?.('user.id')?.catch(() => []))?.[0];

		if (!resolvedId) {
			throw new Error('Bot ID could not be resolved from client.');
		}

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

	public async syncCommands(commands?: CommandInput[], botId?: string): Promise<any> {
		return this.postCommands(commands, botId);
	}

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

			await this.postCommands(undefined, id)
				.then(() => t.log('Successfully posted commands.'))
				.catch((err) => t.error(err?.message || String(err)));

			if (this.options.interval && this.options.interval > 0) {
				setInterval(async () => {
					await this.postCommands(undefined, id)
						.then(() => t.log('Successfully posted commands.'))
						.catch((err) => t.error(err?.message || String(err)));
				}, this.options.interval);
			}
		}, 5000);
	}
}
