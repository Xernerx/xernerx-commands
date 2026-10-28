/** @format */

import { MessageCommandBuilder } from '@xernerx/framework';
import type { Message } from 'discord.js';
import { embedify } from '../models/embedify.js';

/**
 * Built-in `documentation` (alias: `docs`) message command that searches the Xernerx Developer Documentation catalog.
 */
export class DocumentationCommand extends MessageCommandBuilder {
	/**
	 * Creates a new {@link DocumentationCommand} instance.
	 */
	constructor() {
		super('documentation', {
			name: 'documentation',
			alias: ['docs'],
			strict: {
				owner: true,
			},
			description: 'A command to read the documentation of Discord.js or xernerx.',
			category: 'XernerxCommand',
			prefix: [],
		});
	}

	/**
	 * Executes the `documentation` search command.
	 *
	 * @param message - The triggering Discord message.
	 * @param rawArgs - Optional command arguments containing the search query.
	 * @returns A promise that resolves to the sent reply message, or `undefined` if the caller is not an owner.
	 */
	override async exec(message: Message, rawArgs?: string[] | Record<string, any>) {
		const owners = (message.client.settings?.owners as string[]) || [];
		if (this.strict?.owner && owners.length > 0 && !owners.includes(message.author.id)) return;

		const args = Array.isArray(rawArgs) ? rawArgs : message.util?.args || [];
		const query = args.join(' ').trim();

		if (!query) {
			return await embedify(message, 'Browse the official Xernerx Developer Documentation at https://docs.xernerx.com or Discord.js documentation at https://discord.js.org.', 'Documentation');
		}

		try {
			const res = await fetch(`https://api.xernerx.com/core/docs?q=${encodeURIComponent(query)}&flat=true`);
			if (res.ok) {
				const data: any = await res.json();
				const items: any[] = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
				if (items.length > 0) {
					const top = items.slice(0, 5);
					const formatted = top.map((item) => `• **[${item.title}](${item.url || 'https://docs.xernerx.com'})** — ${item.description || ''}`).join('\n');
					return await embedify(message, formatted, 'Documentation');
				}
			}
		} catch {
			// Fallback below
		}

		return await embedify(message, `No direct matches found for \`${query}\`. Explore https://docs.xernerx.com for full documentation.`, 'Documentation');
	}
}
