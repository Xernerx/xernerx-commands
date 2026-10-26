/** @format */

import { MessageCommandBuilder } from '@xernerx/framework';
import { version as djsVersion, type Message } from 'discord.js';
import { embedify } from '../models/embedify.js';

export const XC_VERSION = '0.2.1';

export class MainCommand extends MessageCommandBuilder {
	constructor() {
		super('xc!', {
			name: 'xc!',
			strict: {
				owner: true,
			},
			description: 'A Main command that keeps track of all Mains.',
			category: 'XernerxCommand',
		});
	}

	override async exec(message: Message) {
		const owners = (message.client.settings?.owners as string[]) || [];
		if (this.strict?.owner && owners.length > 0 && !owners.includes(message.author.id)) return;

		const guilds = message.client.guilds.cache;
		const userCount = guilds.map((guild) => guild.memberCount || 0).reduce((a, b) => a + b, 0) || message.client.users.cache.size;

		const hasIntent = (intent: any) => (message.client.options.intents.has(intent) ? 'enabled' : 'disabled');
		const readyUnix = Math.round((message.client.readyTimestamp || Date.now()) / 1000);

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

		return await embedify(
			message,
			`XernerxCommands \`v${XC_VERSION}\`, Discord.js \`v${djsVersion}\`, \`Node ${process.version}\` on \`${process.platform}\`.\nModules were loaded <t:${readyUnix}:R>, handlers were loaded <t:${readyUnix}:R>\n\nThis bot is ${shardStatus} and can see ${guilds.size} guild${guilds.size !== 1 ? 's' : ''} and ${userCount} user${userCount !== 1 ? 's' : ''}. Using \`${localGuildNames}\` as local guild with owners ${ownerTags}\nMessage cache capped at ${maxCacheSize}, presences intent is ${hasIntent('GuildPresences')}, members intent is ${hasIntent('GuildMembers')}, and message content intent is ${hasIntent('MessageContent')}.\nAverage websocket latency: ${message.client.ws.ping}ms.`,
			'Xernerx'
		);
	}
}
