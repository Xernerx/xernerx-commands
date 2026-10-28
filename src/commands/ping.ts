/** @format */

import { MessageCommandBuilder } from '@xernerx/framework';
import type { Message } from 'discord.js';
import { embedify } from '../models/embedify.js';

/**
 * Built-in `ping` (alias: `rtt`) message command that measures gateway WebSocket, API, and round-trip latency.
 */
export class PingCommand extends MessageCommandBuilder {
	/**
	 * Creates a new {@link PingCommand} instance.
	 */
	constructor() {
		super('ping', {
			name: 'ping',
			alias: ['rtt'],
			strict: {
				owner: true,
			},
			description: 'Measures gateway WebSocket, API, and round-trip latency (inspired by Jishaku jsk rtt).',
			category: 'XernerxCommand',
		});
	}

	/**
	 * Executes the `ping` latency check command.
	 *
	 * @param message - The triggering Discord message.
	 * @returns A promise that resolves to the sent reply message, or `undefined` if the caller is not an owner.
	 */
	override async exec(message: Message) {
		const owners = (message.client.settings?.owners as string[]) || [];
		if (this.strict?.owner && owners.length > 0 && !owners.includes(message.author.id)) return;

		const start = Number(Date.now());
		const bot = message.client.ws.ping;
		const api = Number(Date.now()) - message.createdTimestamp;

		return await embedify(message, `>>> **Bot**: \`${bot}ms.\`\n**API**: \`${api}ms.\`\n**Time**: \`${Number(Date.now()) - start}ms.\``, '🏓 PONG!');
	}
}
