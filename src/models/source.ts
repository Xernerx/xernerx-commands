/** @format */

import { inspect } from 'node:util';
import type { Message } from 'discord.js';
import { reply } from './reply.js';

export function source(message: Message, args: { code?: string } | string[]) {
	try {
		const code = Array.isArray(args) ? args.join(' ') : args?.code || '';
		let fn: () => unknown;
		try {
			fn = new Function(`return (${code});`) as () => unknown;
		} catch {
			fn = new Function(code) as () => unknown;
		}
		let response: unknown = fn();

		if (typeof response === 'object') response = inspect(response);

		return reply(message, String(response));
	} catch (error) {
		return reply(message, inspect(error));
	}
}
