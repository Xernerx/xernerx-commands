/** @format */

import { MessageCommandBuilder } from '@xernerx/framework';
import type { Message } from 'discord.js';
import { embedify } from '../models/embedify.js';

export class PingCommand extends MessageCommandBuilder {
	constructor() {
		super('ping', {
			name: 'ping',
			strict: {
				owner: true,
			},
			description: 'A ping command that keeps track of all pings.',
			category: 'XernerxCommand',
		});
	}

	override async exec(message: Message) {
		const owners = (message.client.settings?.owners as string[]) || [];
		if (this.strict?.owner && owners.length > 0 && !owners.includes(message.author.id)) return;

		const start = Number(Date.now());
		const bot = message.client.ws.ping;
		const api = Number(Date.now()) - message.createdTimestamp;

		return await embedify(message, `>>> **Bot**: \`${bot}ms.\`\n**API**: \`${api}ms.\`\n**Time**: \`${Number(Date.now()) - start}ms.\``, '🏓 PONG!');
	}
}
