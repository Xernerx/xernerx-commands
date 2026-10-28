/** @format */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { MessageCommandBuilder } from '@xernerx/framework';
import type { Message } from 'discord.js';
import { embedify } from '../models/embedify.js';

const shell = promisify(exec);

/**
 * Built-in `transpile` (aliases: `t`, `tr`) message command that pipes code into a specified language/engine runtime.
 */
export class TranspileCommand extends MessageCommandBuilder {
	/**
	 * Creates a new {@link TranspileCommand} instance.
	 */
	constructor() {
		super('transpile', {
			name: 'transpile',
			alias: ['t', 'tr'],
			description: 'A command that will run any language given to it.',
			category: 'XernerxCommand',
			strict: {
				owner: true,
			},
		});
	}

	/**
	 * Executes the `transpile` command by piping the provided code into the specified language binary.
	 *
	 * @param message - The triggering Discord message.
	 * @param rawArgs - Optional command arguments (`[language, ...code]`) or structured `{ args: { language, code } }` object.
	 * @returns A promise that resolves to the sent reply message, or `undefined` if the caller is not an owner.
	 */
	override async exec(message: Message, rawArgs?: string[] | { args?: { language?: string; code?: string } }): Promise<any> {
		const owners = (message.client.settings?.owners as string[]) || [];
		if (this.strict?.owner && owners.length > 0 && !owners.includes(message.author.id)) return;

		let language: string | undefined;
		let code: string | undefined;

		if (Array.isArray(rawArgs)) {
			language = rawArgs[0];
			code = rawArgs.slice(1).join(' ');
		} else if (rawArgs && typeof rawArgs === 'object' && 'args' in rawArgs) {
			language = rawArgs.args?.language;
			code = rawArgs.args?.code;
		} else if (message.util?.args?.length) {
			language = message.util.args[0];
			code = message.util.args.slice(1).join(' ');
		}

		if (!language) return this.reply(message, 'You need to specify a language | engine.', false);
		if (!code) return this.reply(message, 'You need to specify code to run.', false);

		return shell(`echo ${code} | ${language}`)
			.then(({ stdout, stderr }) => this.reply(message, `\`\`\`${language.replace('node', 'js')}\n${stdout || stderr}\`\`\``, true))
			.catch((error) => this.reply(message, `\`\`\`ts\n${error}\`\`\``, false));
	}

	/**
	 * Sends a formatted embed/text response for the `transpile` command via {@link embedify}.
	 *
	 * @param message - The triggering Discord message.
	 * @param msg - The response body to send.
	 * @param success - Whether the execution succeeded (controls embed color).
	 * @returns A promise that resolves to the sent reply message.
	 */
	reply(message: Message, msg: string, success = true) {
		return embedify(message, msg, 'Transpile', success);
	}
}
