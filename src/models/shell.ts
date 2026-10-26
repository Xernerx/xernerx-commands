/** @format */

import { exec } from 'node:child_process';
import { inspect, promisify } from 'node:util';
import type { Message } from 'discord.js';
import { reply } from './reply.js';

const execAsync = promisify(exec);

export function shell(message: Message, args: { code?: string } | string[]) {
	const code = Array.isArray(args) ? args.join(' ') : args?.code || '';
	return execAsync(code)
		.then(({ stdout, stderr }) => reply(message, stdout || stderr))
		.catch((error) => reply(message, inspect(error)));
}
