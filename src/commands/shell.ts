/** @format */

import { exec } from 'node:child_process';
import { inspect, promisify } from 'node:util';
import { MessageCommandBuilder } from '@xernerx/framework';
import type { Message } from 'discord.js';
import { embedify } from '../models/embedify.js';

const shell = promisify(exec);

/**
 * Built-in `shell` (alias: `sh`) message command that executes a shell command and replies with its stdout/stderr output.
 */
export class XernerxCommandsShellCommand extends MessageCommandBuilder {
	/**
	 * Creates a new {@link XernerxCommandsShellCommand} instance.
	 */
	constructor() {
		super('shell', {
			name: 'shell',
			alias: ['sh'],
			strict: {
				owner: true,
			},
			description: 'Execute a shell command.',
			category: 'XernerxCommand',
		});
	}

	/**
	 * Executes the `shell` command in a child process and replies with its output.
	 *
	 * @param message - The triggering Discord message.
	 * @param rawArgs - Optional shell command arguments or structured `{ args: { code } }` object.
	 * @returns A promise that resolves to the sent reply message, or `undefined` if the caller is not an owner.
	 */
	override async exec(message: Message, rawArgs?: string[] | { args?: { code?: string } }) {
		const owners = (message.client.settings?.owners as string[]) || [];
		if (this.strict?.owner && owners.length > 0 && !owners.includes(message.author.id)) return;

		const replyFn = message.util ? message.util.reply.bind(message.util) : message.reply.bind(message);

		const code = Array.isArray(rawArgs) ? rawArgs.join(' ') : rawArgs && typeof rawArgs === 'object' && 'args' in rawArgs ? rawArgs.args?.code || '' : message.util?.args?.join(' ') || '';

		if (!code) return await replyFn({ content: 'Specify a command.' });

		return shell(code)
			.then(async ({ stdout, stderr }) => await embedify(message, `\`\`\`ps\n${stdout || stderr}\`\`\``, 'Shell', true))
			.catch(async (error) => await embedify(message, `\`\`\`ps\n${inspect(error)}\`\`\``, 'Shell', false));
	}
}
