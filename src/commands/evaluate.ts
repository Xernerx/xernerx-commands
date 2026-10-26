/** @format */

import { inspect } from 'node:util';
import { MessageCommandBuilder } from '@xernerx/framework';
import type { Message } from 'discord.js';
import { embedify } from '../models/embedify.js';

const SUPPORTED_LANGUAGES = ['js', 'ts'] as const;

export class EvaluateCommand extends MessageCommandBuilder {
	constructor() {
		super('evaluate', {
			name: 'evaluate',
			alias: ['eval', 'ev'],
			strict: {
				owner: true,
			},
			description: 'A command that has a multifunctional use for evaluating, shell command, sourcing and git. (JavaScript take on the famous Python extension Jishaku)',
			info: "Run the command to see it's options.",
			category: 'XernerxCommand',
			prefix: [],
		});
	}

	override async exec(message: Message, rawArgs?: string[] | { args?: { option?: string; code?: string } }) {
		const owners = (message.client.settings?.owners as string[]) || [];
		if (this.strict?.owner && owners.length > 0 && !owners.includes(message.author.id)) return;

		const replyFn = message.util ? message.util.reply.bind(message.util) : message.reply.bind(message);

		let option: string | undefined;
		let code: string | undefined;

		if (Array.isArray(rawArgs)) {
			const [first, ...rest] = rawArgs;
			if (first && SUPPORTED_LANGUAGES.includes(first.toLowerCase() as any)) {
				option = first.toLowerCase();
				code = rest.join(' ');
			} else if (first) {
				option = undefined;
				code = rawArgs.join(' ');
			}
		} else if (rawArgs && typeof rawArgs === 'object' && 'args' in rawArgs) {
			option = rawArgs.args?.option;
			code = rawArgs.args?.code;
		} else if (message.util?.args?.length) {
			const [first, ...rest] = message.util.args;
			if (first && SUPPORTED_LANGUAGES.includes(first.toLowerCase() as any)) {
				option = first.toLowerCase();
				code = rest.join(' ');
			}
		}

		if (!option) {
			return await replyFn({ content: `Type a language, supported: ${SUPPORTED_LANGUAGES.join(', ')}` });
		}

		try {
			const user = message.user || message.author,
				member = message.member,
				guild = message.guild,
				channel = message.channel,
				client = message.client;

			void user;
			void member;
			void guild;
			void channel;
			void client;

			let response: any;

			if (!code) return await replyFn({ content: 'No code was given to evaluate.' });

			code = code.replace(/```\w*\n|```/gi, '');

			if (option === 'js' || option === 'ts') {
				const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor as new (...args: string[]) => (...fnArgs: unknown[]) => Promise<unknown>;

				let fn: (...fnArgs: unknown[]) => Promise<unknown>;
				try {
					fn = new AsyncFunction('message', 'user', 'member', 'guild', 'channel', 'client', `return (${code});`);
				} catch {
					fn = new AsyncFunction('message', 'user', 'member', 'guild', 'channel', 'client', code);
				}

				response = await fn(message, user, member, guild, channel, client);
			}

			if (!code) response = "'No code to be evaluated!'";

			return await embedify(message, `\`\`\`${option}\n${inspect(response)}\`\`\``, 'Evaluate', true);
		} catch (error) {
			return await embedify(message, `\`\`\`${option}\n${inspect(error)}\`\`\``, 'Evaluate', false);
		}
	}
}
