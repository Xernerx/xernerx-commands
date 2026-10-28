/** @format */

import * as os from 'node:os';
import { MessageCommandBuilder } from '@xernerx/framework';
import { version as djsVersion, type Message } from 'discord.js';
import { embedify } from '../models/embedify.js';

/**
 * Current version string of the `@xernerx/commands` extension displayed by {@link MainCommand}.
 */
export const XC_VERSION = '0.2.1';

/**
 * Built-in `xc!` (aliases: `jsk`, `jishaku`, `status`) message command that displays bot runtime,
 * memory usage, shard/cluster info, cache limits, gateway intents, and WebSocket latency.
 */
export class MainCommand extends MessageCommandBuilder {
	private readonly moduleLoadedUnix = Math.round(Date.now() / 1000);

	/**
	 * Creates a new {@link MainCommand} instance.
	 */
	constructor() {
		super('xc!', {
			name: 'xc!',
			alias: ['jsk', 'jishaku', 'status'],
			strict: {
				owner: true,
			},
			description: 'Displays bot runtime, memory, shard, cache, intent, and gateway summary (inspired by Jishaku).',
			category: 'XernerxCommand',
		});
	}

	/**
	 * Executes the `xc!` status summary command.
	 *
	 * @param message - The triggering Discord message.
	 * @returns A promise that resolves to the sent reply message, or `undefined` if the caller is not an owner.
	 */
	override async exec(message: Message) {
		const owners = (message.client.settings?.owners as string[]) || [];
		if (this.strict?.owner && owners.length > 0 && !owners.includes(message.author.id)) return;

		const guilds = message.client.guilds.cache;
		const userCount = guilds.map((guild) => guild.memberCount || 0).reduce((a, b) => a + b, 0) || message.client.users.cache.size;

		const hasIntent = (intent: any) => (message.client.options.intents.has(intent) ? 'enabled' : 'disabled');
		const readyUnix = Math.round((message.client.readyTimestamp || Date.now()) / 1000);
		const processStartUnix = Math.round(Date.now() / 1000 - process.uptime());

		const mem = process.memoryUsage();
		const rssMiB = (mem.rss / 1048576).toFixed(2);
		const heapMiB = (mem.heapUsed / 1048576).toFixed(2);
		const totalMemMiB = (os.totalmem() / 1048576).toFixed(0);
		const memPercent = ((mem.rss / os.totalmem()) * 100).toFixed(2);

		const shardStatus = !message.client.sharded ? 'not sharded' : `on shard ${message.client.cluster?.id ?? message.client.shardId ?? 0}`;

		const localGuildIds = Array.isArray(message.client.settings?.guildId) ? message.client.settings.guildId : message.client.settings?.guildId ? [message.client.settings.guildId] : [];

		const localGuildNames =
			localGuildIds.length > 0
				? (
						await Promise.all(
							localGuildIds.map(async (id) => {
								const g = await message.client.guilds.fetch(id).catch(() => null);
								return g?.name || id;
							})
						)
					).join(', ')
				: 'None';

		const ownerTags =
			owners.length > 0
				? (
						await Promise.all(
							owners.map(async (o) => {
								const u = await message.client.users.fetch(o).catch(() => null);
								return u ? `${u}` : o;
							})
						)
					).join(', ')
				: 'None';

		const maxCacheSize = (message.channel as any)?.messages?.cache?.maxSize ?? ((message.client as any).config?.xc?.cache?.messages || 1000);

		const summary = [
			`XernerxCommands \`v${XC_VERSION}\`, Discord.js \`v${djsVersion}\`, \`Node ${process.version}\` on \`${process.platform} (${process.arch})\`.`,
			`Process started <t:${processStartUnix}:R>, modules were loaded <t:${this.moduleLoadedUnix}:R>, handlers were loaded <t:${readyUnix}:R>.`,
			`Using \`${rssMiB} MiB\` physical memory (\`${heapMiB} MiB\` heap, \`${memPercent}%\` of \`${totalMemMiB} MiB\`) under PID \`${process.pid}\`.`,
			'',
			`This bot is ${shardStatus} and can see ${guilds.size} guild${guilds.size !== 1 ? 's' : ''} and ${userCount} user${userCount !== 1 ? 's' : ''}. Using \`${localGuildNames}\` as local guild with owners ${ownerTags}.`,
			`Message cache capped at ${maxCacheSize}, presences intent is ${hasIntent('GuildPresences')}, members intent is ${hasIntent('GuildMembers')}, and message content intent is ${hasIntent('MessageContent')}.`,
			`Average websocket latency: \`${message.client.ws.ping}ms\`.`,
		].join('\n');

		return await embedify(message, summary, 'Xernerx');
	}
}
