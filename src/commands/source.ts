/** @format */

import { MessageCommandBuilder } from '@xernerx/framework';
import type { Message } from 'discord.js';
import { source } from '../models/source.js';

/**
 * Built-in `source` (alias: `src`) message command that displays the source code for a registered bot command
 * or JavaScript expression.
 */
export class SourceCommand extends MessageCommandBuilder {
	/**
	 * Creates a new {@link SourceCommand} instance.
	 */
	constructor() {
		super('source', {
			name: 'source',
			alias: ['src'],
			strict: {
				owner: true,
			},
			description: 'Displays the source code for a command or JavaScript expression (inspired by Jishaku jsk source).',
			category: 'XernerxCommand',
		});
	}

	/**
	 * Executes the `source` inspection command.
	 *
	 * @param message - The triggering Discord message.
	 * @param rawArgs - Optional command name or JavaScript expression arguments, or structured `{ args: { code } }` object.
	 * @returns A promise that resolves to the sent reply message, or `undefined` if the caller is not an owner.
	 */
	override async exec(message: Message, rawArgs?: string[] | { args?: { code?: string } }) {
		const owners = (message.client.settings?.owners as string[]) || [];
		if (this.strict?.owner && owners.length > 0 && !owners.includes(message.author.id)) return;

		const target = Array.isArray(rawArgs) ? rawArgs.join(' ') : rawArgs && typeof rawArgs === 'object' && 'args' in rawArgs ? rawArgs.args?.code || '' : message.util?.args?.join(' ') || '';

		return await source(message, [target]);
	}
}
