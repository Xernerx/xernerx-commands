/** @format */

import { performance } from 'node:perf_hooks';
import { inspect } from 'node:util';
import { MessageCommandBuilder } from '@xernerx/framework';
import type { Message } from 'discord.js';
import { embedify } from '../models/embedify.js';

export class DebugCommand extends MessageCommandBuilder {
	constructor() {
		super('debug', {
			name: 'debug',
			alias: ['dbg'],
			strict: {
				owner: true,
			},
			description: 'Executes a command and reports its execution timing or thrown error stack trace (inspired by Jishaku jsk debug).',
			category: 'XernerxCommand',
		});
	}

	override async exec(message: Message, rawArgs?: string[]) {
		const owners = (message.client.settings?.owners as string[]) || [];
		if (this.strict?.owner && owners.length > 0 && !owners.includes(message.author.id)) return;

		const args = Array.isArray(rawArgs) ? rawArgs : message.util?.args || [];
		const [targetName, ...cmdArgs] = args;

		if (!targetName) {
			return await embedify(message, 'Specify a command to debug, e.g. `xc! debug ping`.', 'Debug', false);
		}

		const lower = targetName.toLowerCase();
		const command = message.client.commands?.message?.get(lower) || message.client.commands?.message?.find((c) => c.name.toLowerCase() === lower || c.alias?.some((a) => a.toLowerCase() === lower));

		if (!command) {
			return await embedify(message, `Command \`${targetName}\` not found.`, 'Debug', false);
		}

		const start = performance.now();
		try {
			await command.exec(message, cmdArgs);
			const elapsed = (performance.now() - start).toFixed(2);
			return await embedify(message, `Command \`${command.name}\` completed in \`${elapsed}ms\`.`, 'Debug', true);
		} catch (error) {
			const elapsed = (performance.now() - start).toFixed(2);
			return await embedify(message, `Command \`${command.name}\` failed after \`${elapsed}ms\`:\n\`\`\`ts\n${inspect(error)}\`\`\``, 'Debug', false);
		}
	}
}
