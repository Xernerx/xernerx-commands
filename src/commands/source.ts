/** @format */

import { MessageCommandBuilder } from '@xernerx/framework';
import type { Message } from 'discord.js';
import { source } from '../models/source.js';

export class SourceCommand extends MessageCommandBuilder {
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

	override async exec(message: Message, rawArgs?: string[] | { args?: { code?: string } }) {
		const owners = (message.client.settings?.owners as string[]) || [];
		if (this.strict?.owner && owners.length > 0 && !owners.includes(message.author.id)) return;

		const target = Array.isArray(rawArgs) ? rawArgs.join(' ') : rawArgs && typeof rawArgs === 'object' && 'args' in rawArgs ? rawArgs.args?.code || '' : message.util?.args?.join(' ') || '';

		return await source(message, [target]);
	}
}
