/** @format */

import { inspect } from 'node:util';
import * as Discord from 'discord.js';
import type { Message } from 'discord.js';
import { embedify } from './embedify.js';

/**
 * Resolves the source code or inspected representation of a registered message, slash, or context command on a client.
 *
 * @param client - The `@xernerx/framework` client containing `commands.message`, `commands.slash`, or `commands.context` collections.
 * @param target - Command name, ID, or alias to look up.
 * @returns The stringified constructor, `exec` method, or inspected command object, or `null` if not found.
 */
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

/**
 * Inspects the source code of a registered command or evaluates a JavaScript expression to display its source
 * and replies to the triggering Discord message via {@link embedify}.
 *
 * @param message - The triggering Discord message.
 * @param args - Command name or JavaScript expression tokens array, or an object containing a `code` string.
 * @returns A promise that resolves to the sent reply message.
 */
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
