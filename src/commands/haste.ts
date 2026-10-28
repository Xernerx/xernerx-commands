/** @format */

import * as fs from 'node:fs';
import { MessageCommandBuilder } from '@xernerx/framework';
import type { Message } from 'discord.js';
import { embedify } from '../models/embedify.js';

/**
 * Built-in `haste` (aliases: `cat`, `tree`) message command that lists directory trees or reads/uploads
 * file contents to a Hastebin-compatible service.
 */
export class XernerxCommandsHasteCommand extends MessageCommandBuilder {
	/**
	 * Creates a new {@link XernerxCommandsHasteCommand} instance.
	 */
	constructor() {
		super('haste', {
			name: 'haste',
			alias: ['cat', 'tree'],
			strict: {
				owner: true,
			},
			description: 'Browse directories or haste file contents (inspired by Jishaku jsk cat).',
			category: 'XernerxCommand',
		});
	}

	/**
	 * Executes the `haste` command to display a directory tree or file contents.
	 *
	 * @param message - The triggering Discord message.
	 * @param rawArgs - Optional relative path arguments or structured `{ args: { rest } }` object.
	 * @returns A promise that resolves to the sent reply message, or `undefined` if the caller is not an owner.
	 */
	public override async exec(message: Message, rawArgs?: string[] | { args?: { rest?: string } }) {
		const owners = (message.client.settings?.owners as string[]) || [];
		if (this.strict?.owner && owners.length > 0 && !owners.includes(message.author.id)) return;

		const rest = Array.isArray(rawArgs) ? rawArgs.join(' ') : rawArgs && typeof rawArgs === 'object' && 'args' in rawArgs ? rawArgs.args?.rest || '' : message.util?.args?.join(' ') || '';

		try {
			const curDir = fs.readdirSync(`./${rest || ''}`);
			const curPath = fs.realpathSync(`./${rest || ''}`);

			if (Array.isArray(curDir)) {
				return await embedify(
					message,
					`Your current location.\n\`${curPath}\`\n${curDir
						.map((dir, i) => {
							let type = '';

							i + 1 === curDir.length ? (type += '└─ ') : (type += '├─ ');

							try {
								fs.readdirSync(`${curPath}/${dir}`);

								type += '📁';
							} catch {
								type += '📄';
							}

							return `${type} \`${dir}\``;
						})
						.join('\n')}`,
					'Haste'
				);
			}
		} catch {
			try {
				const src = fs.readFileSync(`./${rest || ''}`, { encoding: 'utf-8' });
				const ext = rest.includes('.') ? rest.split('.')[rest.split('.').length - 1] : 'txt';

				return await embedify(message, `\`\`\`${ext}\n${src}\`\`\``, 'Haste');
			} catch {
				const curPath = `${fs.realpathSync('./')}\\${rest.replace('/', '\\')}`;

				return await embedify(message, `\`${curPath}\` is not a valid path.`, 'Haste', false);
			}
		}
	}
}
