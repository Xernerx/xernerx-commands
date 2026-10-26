/** @format */

import { inspect } from 'node:util';
import * as Discord from 'discord.js';
import type { Message } from 'discord.js';
import { embedify } from './embedify.js';

export function resolveCommandSource(client: any, target: string): string | null {
	const clean = target.trim().toLowerCase();
	if (!clean || !client?.commands) return null;

	const findInCollection = (col: any) => {
		if (!col || typeof col.find !== 'function') return null;
		return (
			col.get?.(clean) ||
			col.find((cmd: any) => cmd?.name?.toLowerCase() === clean || cmd?.id?.toLowerCase() === clean || (Array.isArray(cmd?.alias) && cmd.alias.some((a: string) => a.toLowerCase() === clean)))
		);
	};

	const found = findInCollection(client.commands.message) || findInCollection(client.commands.slash) || findInCollection(client.commands.context);

	if (!found) return null;

	if (typeof found.constructor === 'function' && found.constructor.name !== 'Object') {
		return found.constructor.toString();
	}

	if (typeof found.exec === 'function') {
		return found.exec.toString();
	}

	return inspect(found, { depth: 3 });
}

export async function source(message: Message, args: { code?: string } | string[]) {
	try {
		const code = (Array.isArray(args) ? args.join(' ') : args?.code || '').trim();
		if (!code) {
			return await embedify(message, 'Specify a command name or expression to inspect its source.', 'Source', false);
		}

		const cmdSource = resolveCommandSource(message.client, code);
		if (cmdSource) {
			return await embedify(message, `\`\`\`ts\n${cmdSource}\`\`\``, 'Source', true);
		}

		let fn: (...fnArgs: unknown[]) => unknown;
		try {
			fn = new Function('message', 'client', 'Discord', `return (${code});`) as (...fnArgs: unknown[]) => unknown;
		} catch {
			fn = new Function('message', 'client', 'Discord', code) as (...fnArgs: unknown[]) => unknown;
		}

		const resolved = fn(message, message.client, Discord);
		const output = typeof resolved === 'function' ? resolved.toString() : typeof resolved === 'object' ? inspect(resolved, { depth: 3 }) : String(resolved);

		return await embedify(message, `\`\`\`ts\n${output}\`\`\``, 'Source', true);
	} catch (error) {
		return await embedify(message, `\`\`\`ts\n${inspect(error)}\`\`\``, 'Source', false);
	}
}
