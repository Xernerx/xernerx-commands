/** @format */

import { performance } from 'node:perf_hooks';
import { inspect } from 'node:util';
import { MessageCommandBuilder } from '@xernerx/framework';
import type { Message } from 'discord.js';
import { embedify } from '../models/embedify.js';

/**
 * Built-in `debug` (alias: `dbg`) message command that executes a target command and reports its
 * execution duration in milliseconds or any thrown error stack trace.
 */
export class DebugCommand extends MessageCommandBuilder {
	/**
	 * Creates a new {@link DebugCommand} instance.
	 */
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

	/**
	 * Executes the `debug` command against the specified message command.
	 *
	 * @param message - The triggering Discord message.
	 * @param rawArgs - Optional command arguments where the first item is the target command name and the remainder are its arguments.
	 * @returns A promise that resolves to the sent reply message, or `undefined` if the caller is not an owner.
	 */
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
