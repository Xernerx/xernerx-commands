/** @format */

import { exec } from 'node:child_process';
import { inspect, promisify } from 'node:util';
import { MessageCommandBuilder } from '@xernerx/framework';
import * as Discord from 'discord.js';
import type { Message } from 'discord.js';
import { embedify } from '../models/embedify.js';
import { source } from '../models/source.js';

const execAsync = promisify(exec);

const SUPPORTED_MODES = ['js', 'ts', 'py', 'sh', 'shell', 'git', 'source', 'src'] as const;

let lastResult: unknown = undefined;

/**
 * Built-in `evaluate` (aliases: `eval`, `ev`, `js`, `ts`, `py`) message command that evaluates JavaScript/TypeScript code
 * with Discord context variables (`message`, `client`, `guild`, `channel`, `Discord`, `_`) in scope, or delegates to
 * `shell`, `git`, and `source` sub-modes.
 */
export class EvaluateCommand extends MessageCommandBuilder {
	/**
	 * Creates a new {@link EvaluateCommand} instance.
	 */
	constructor() {
		super('evaluate', {
			name: 'evaluate',
			alias: ['eval', 'ev', 'js', 'ts', 'py'],
			strict: {
				owner: true,
			},
			description: 'A command that has a multifunctional use for evaluating, shell command, sourcing and git. (JavaScript take on the famous Python extension Jishaku)',
			info: "Run the command to see it's options.",
			category: 'XernerxCommand',
			prefix: [],
		});
	}

	/**
	 * Executes the `evaluate` command in the requested mode (`js`, `ts`, `py`, `sh`/`shell`, `git`, or `source`/`src`).
	 *
	 * @param message - The triggering Discord message.
	 * @param rawArgs - Optional command arguments or structured `{ args: { option, code } }` object.
	 * @returns A promise that resolves to the sent reply message, or `undefined` if the caller is not an owner.
	 */
	override async exec(message: Message, rawArgs?: string[] | { args?: { option?: string; code?: string } }) {
		const owners = (message.client.settings?.owners as string[]) || [];
		if (this.strict?.owner && owners.length > 0 && !owners.includes(message.author.id)) return;

		const replyFn = message.util ? message.util.reply.bind(message.util) : message.reply.bind(message);
		const invokedAlias = message.util?.parsed?.alias?.toLowerCase();

		let option: string | undefined;
		let code: string | undefined;

		const tokens = Array.isArray(rawArgs)
			? rawArgs
			: rawArgs && typeof rawArgs === 'object' && 'args' in rawArgs
				? [rawArgs.args?.option, rawArgs.args?.code].filter((x): x is string => Boolean(x))
				: message.util?.args || [];

		if (tokens.length > 0) {
			const [first, ...rest] = tokens;
			if (first && SUPPORTED_MODES.includes(first.toLowerCase() as any) && rest.length > 0) {
				option = first.toLowerCase();
				code = rest.join(' ');
			} else if (first && SUPPORTED_MODES.includes(first.toLowerCase() as any) && rest.length === 0) {
				option = first.toLowerCase();
				code = '';
			} else {
				option = invokedAlias === 'ts' ? 'ts' : 'js';
				code = tokens.join(' ');
			}
		} else if (invokedAlias === 'js' || invokedAlias === 'ts' || invokedAlias === 'py') {
			option = invokedAlias === 'ts' ? 'ts' : 'js';
		}

		if (!option) {
			return await replyFn({ content: `Specify a mode or code to evaluate. Modes: \`${SUPPORTED_MODES.join('`, `')}\`` });
		}

		code = (code || '').replace(/^```\w*\n?|```$/gi, '').trim();

		if (option === 'sh' || option === 'shell') {
			if (!code) return await replyFn({ content: 'Specify a shell command to execute.' });
			return execAsync(code)
				.then(async ({ stdout, stderr }) => await embedify(message, `\`\`\`ps\n${stdout || stderr || 'Completed with no output.'}\`\`\``, 'Shell', true))
				.catch(async (error) => await embedify(message, `\`\`\`ps\n${inspect(error)}\`\`\``, 'Shell', false));
		}

		if (option === 'git') {
			const gitCmd = code ? `git ${code}` : 'git status --short --branch';
			return execAsync(gitCmd)
				.then(async ({ stdout, stderr }) => await embedify(message, `\`\`\`sh\n${stdout || stderr || 'Completed with no output.'}\`\`\``, 'Git', true))
				.catch(async (error) => await embedify(message, `\`\`\`sh\n${inspect(error)}\`\`\``, 'Git', false));
		}

		if (option === 'source' || option === 'src') {
			return await source(message, [code]);
		}

		if (!code) return await replyFn({ content: 'No code was given to evaluate.' });

		try {
			const user = message.user || message.author,
				author = user,
				member = message.member,
				guild = message.guild,
				channel = message.channel,
				client = message.client,
				bot = client,
				msg = message,
				_ = lastResult;

			const lang = option === 'ts' ? 'ts' : 'js';
			const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor as new (...args: string[]) => (...fnArgs: unknown[]) => Promise<unknown>;

			const paramNames = ['message', 'msg', 'user', 'author', 'member', 'guild', 'channel', 'client', 'bot', 'Discord', '_'];
			const paramValues = [message, msg, user, author, member, guild, channel, client, bot, Discord, _];

			let fn: (...fnArgs: unknown[]) => Promise<unknown>;
			try {
				fn = new AsyncFunction(...paramNames, `return (${code});`);
			} catch {
				fn = new AsyncFunction(...paramNames, code);
			}

			const response = await fn(...paramValues);
			if (response !== undefined) {
				lastResult = response;
			}

			return await embedify(message, `\`\`\`${lang}\n${inspect(response, { depth: 2 })}\`\`\``, 'Evaluate', true);
		} catch (error) {
			return await embedify(message, `\`\`\`ts\n${inspect(error)}\`\`\``, 'Evaluate', false);
		}
	}
}
