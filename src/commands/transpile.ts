/** @format */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { MessageCommandBuilder } from '@xernerx/framework';
import type { Message } from 'discord.js';
import { embedify } from '../models/embedify.js';

const shell = promisify(exec);

export class TranspileCommand extends MessageCommandBuilder {
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

	reply(message: Message, msg: string, success = true) {
		return embedify(message, msg, 'Transpile', success);
	}
}
