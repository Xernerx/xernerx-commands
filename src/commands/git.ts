/** @format */

import { exec } from 'node:child_process';
import { inspect, promisify } from 'node:util';
import { MessageCommandBuilder } from '@xernerx/framework';
import type { Message } from 'discord.js';
import { embedify } from '../models/embedify.js';

const execAsync = promisify(exec);

export class GitCommand extends MessageCommandBuilder {
	constructor() {
		super('git', {
			name: 'git',
			strict: {
				owner: true,
			},
			description: 'Shortcut for running git commands in the workspace shell (inspired by Jishaku jsk git).',
			category: 'XernerxCommand',
		});
	}

	override async exec(message: Message, rawArgs?: string[] | { args?: { code?: string } }) {
		const owners = (message.client.settings?.owners as string[]) || [];
		if (this.strict?.owner && owners.length > 0 && !owners.includes(message.author.id)) return;

		const sub = Array.isArray(rawArgs) ? rawArgs.join(' ') : rawArgs && typeof rawArgs === 'object' && 'args' in rawArgs ? rawArgs.args?.code || '' : message.util?.args?.join(' ') || '';

		const cmd = sub.trim() ? `git ${sub.trim()}` : 'git status --short --branch';

		return execAsync(cmd)
			.then(async ({ stdout, stderr }) => await embedify(message, `\`\`\`sh\n${stdout || stderr || 'Completed with no output.'}\`\`\``, 'Git', true))
			.catch(async (error) => await embedify(message, `\`\`\`sh\n${inspect(error)}\`\`\``, 'Git', false));
	}
}
