/** @format */

import { EmbedBuilder, Message } from 'discord.js';
import { terminal } from '@xernerx/terminal';
import { haste } from './haste.js';

const t = terminal.child({ scope: 'XC' });

/**
 * Replies to a Discord message with code output (wrapped in a TypeScript code block by default)
 * and a Hastebin mirror URL when available.
 *
 * @param message - The Discord message to reply to.
 * @param msg - The text or code output to send.
 * @param cb - Whether to wrap `msg` in a ```` ```ts ```` code block (defaults to `true`).
 * @returns A promise that resolves to the sent reply message, or `undefined` if an error occurs.
 */
export async function reply(message: Message, msg: string, cb = true) {
	try {
		const url = await haste(msg);
		const isValidUrl = /^https?:\/\//i.test(url);
		const replyFn = message.util ? message.util.reply.bind(message.util) : message.reply.bind(message);

		const embed = new EmbedBuilder()
			.setTitle('Evaluate')
			.setDescription((cb ? '```ts\n' : '') + msg.slice(0, 4000) + (cb ? '```' : ''))
			.setTimestamp()
			.setFooter({ text: `${msg.length} characters` });

		if (isValidUrl) {
			embed.setURL(url);
		}

		if (msg.length <= 4000 && message.guild && message.guild.members?.me?.permissions?.has('EmbedLinks')) {
			return await replyFn({ embeds: [embed] });
		} else if (msg.length <= 1980) {
			return await replyFn({
				content: (cb ? '```ts\n' : '') + msg + (cb ? '```' : '') + (isValidUrl ? `\n\nView in browser: ${url}` : ''),
			});
		} else {
			return await replyFn({
				content: isValidUrl ? `Code is ${msg.length} characters, view in browser: ${url}` : `${msg.slice(0, 1950)}...`,
			});
		}
	} catch (error) {
		t.error((error as Error)?.message || String(error));
	}
}
