/** @format */

import { inspect } from 'node:util';
import { MessageCommandBuilder } from '@xernerx/framework';
import type { Message } from 'discord.js';
import { embedify } from '../models/embedify.js';

export class SudoCommand extends MessageCommandBuilder {
	constructor() {
		super('su', {
			name: 'su',
			alias: ['sudo', 'in'],
			strict: {
				owner: true,
			},
			description: 'Runs a command as another user, in another channel, or bypassing restrictions (inspired by Jishaku jsk su / in / sudo).',
			category: 'XernerxCommand',
		});
	}

	override async exec(message: Message, rawArgs?: string[]) {
		const owners = (message.client.settings?.owners as string[]) || [];
		if (this.strict?.owner && owners.length > 0 && !owners.includes(message.author.id)) return;

		const args = Array.isArray(rawArgs) ? rawArgs : message.util?.args || [];
		const alias = message.util?.parsed?.alias?.toLowerCase() || 'su';

		if (args.length === 0) {
			return await embedify(message, 'Usage: `xc! su <@user> <command...>`, `xc! in <#channel> <command...>`, or `xc! sudo <command...>`', 'Sudo', false);
		}

		const clonedMessage = Object.create(message) as Message;
		let cmdTokens = args;

		if (alias === 'su' && args.length >= 2) {
			const targetId = args[0]!.replace(/[<@!>]/g, '');
			const targetUser = await message.client.users.fetch(targetId).catch(() => null);
			if (targetUser) {
				Object.defineProperty(clonedMessage, 'author', { value: targetUser, configurable: true });
				Object.defineProperty(clonedMessage, 'user', { value: targetUser, configurable: true });
				if (message.guild) {
					const targetMember = await message.guild.members.fetch(targetId).catch(() => null);
					if (targetMember) {
						Object.defineProperty(clonedMessage, 'member', { value: targetMember, configurable: true });
					}
				}
				cmdTokens = args.slice(1);
			}
		} else if (alias === 'in' && args.length >= 2) {
			const channelId = args[0]!.replace(/[<#>]/g, '');
			const targetChannel = await message.client.channels.fetch(channelId).catch(() => null);
			if (targetChannel && targetChannel.isTextBased()) {
				Object.defineProperty(clonedMessage, 'channel', { value: targetChannel, configurable: true });
				Object.defineProperty(clonedMessage, 'channelId', { value: targetChannel.id, configurable: true });
				cmdTokens = args.slice(1);
			}
		}

		const [targetName, ...cmdArgs] = cmdTokens;
		if (!targetName) {
			return await embedify(message, 'Specify a command to execute.', 'Sudo', false);
		}

		const lower = targetName.toLowerCase();
		const command = message.client.commands?.message?.get(lower) || message.client.commands?.message?.find((c) => c.name.toLowerCase() === lower || c.alias?.some((a) => a.toLowerCase() === lower));

		if (!command) {
			return await embedify(message, `Command \`${targetName}\` not found.`, 'Sudo', false);
		}

		if (clonedMessage.util) {
			(clonedMessage as any).util = {
				...clonedMessage.util,
				args: cmdArgs,
			};
		}

		try {
			return await command.exec(clonedMessage, cmdArgs);
		} catch (error) {
			return await embedify(message, `\`\`\`ts\n${inspect(error)}\`\`\``, 'Sudo', false);
		}
	}
}
