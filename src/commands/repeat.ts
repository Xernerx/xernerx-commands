/** @format */

import { inspect } from 'node:util';
import { MessageCommandBuilder } from '@xernerx/framework';
import type { Message } from 'discord.js';
import { embedify } from '../models/embedify.js';

export class RepeatCommand extends MessageCommandBuilder {
	constructor() {
		super('repeat', {
			name: 'repeat',
			strict: {
				owner: true,
			},
			description: 'Executes a command multiple times sequentially (inspired by Jishaku jsk repeat).',
			category: 'XernerxCommand',
		});
	}

	override async exec(message: Message, rawArgs?: string[]) {
		const owners = (message.client.settings?.owners as string[]) || [];
		if (this.strict?.owner && owners.length > 0 && !owners.includes(message.author.id)) return;

		const args = Array.isArray(rawArgs) ? rawArgs : message.util?.args || [];
		const [countStr, targetName, ...cmdArgs] = args;
		const count = Math.min(Math.max(Number.parseInt(countStr || '0', 10) || 0, 1), 25);

		if (!countStr || !targetName || Number.isNaN(Number.parseInt(countStr, 10))) {
			return await embedify(message, 'Usage: `xc! repeat <count> <command> [args...]`', 'Repeat', false);
		}

		const lower = targetName.toLowerCase();
		const command = message.client.commands?.message?.get(lower) || message.client.commands?.message?.find((c) => c.name.toLowerCase() === lower || c.alias?.some((a) => a.toLowerCase() === lower));

		if (!command) {
			return await embedify(message, `Command \`${targetName}\` not found.`, 'Repeat', false);
		}

		try {
			for (let i = 0; i < count; i++) {
				await command.exec(message, cmdArgs);
			}
		} catch (error) {
			return await embedify(message, `\`\`\`ts\n${inspect(error)}\`\`\``, 'Repeat', false);
		}
	}
}
