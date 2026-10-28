/** @format */

import { exec } from 'node:child_process';
import { inspect, promisify } from 'node:util';
import type { Message } from 'discord.js';
import { reply } from './reply.js';

const execAsync = promisify(exec);

/**
 * Executes a shell command in a child process and replies to the triggering Discord message
 * with its stdout/stderr output or inspected error via {@link reply}.
 *
 * @param message - The Discord message to reply to.
 * @param args - Shell command tokens array or an object containing a `code` string.
 * @returns A promise that resolves to the sent reply message.
 */
export function shell(message: Message, args: { code?: string } | string[]) {
	const code = Array.isArray(args) ? args.join(' ') : args?.code || '';
	return execAsync(code)
		.then(({ stdout, stderr }) => reply(message, stdout || stderr))
		.catch((error) => reply(message, inspect(error)));
}
