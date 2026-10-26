/** @format */

import { inspect } from 'node:util';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Message } from 'discord.js';
import type { XernerxClient } from '@xernerx/framework';
import { haste } from './haste.js';

export async function embedify(message: Message, content: string, type: string, success = true) {
	const hash = await haste(content);
	const isValidUrl = /^https?:\/\//i.test(hash);

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setCustomId('xc-delete-msg').setEmoji('✖️').setStyle(ButtonStyle.Danger));

	if (isValidUrl) {
		row.addComponents(new ButtonBuilder().setLabel('View in browser').setURL(hash).setStyle(ButtonStyle.Link));
	}

	const options = ((message.client as XernerxClient as any).config as any)?.xc;
	const replyFn = message.util ? message.util.reply.bind(message.util) : message.reply.bind(message);
	const user = message.user || message.author;
	const canEmbed = (!message.guild || message.guild.members?.me?.permissions?.has('EmbedLinks')) && (options?.useEmbeds ?? true);

	if (inspect(content).length > 1950) {
		return await replyFn({
			content: isValidUrl ? `Code is too big to display in Discord. View in browser instead.` : `${content.slice(0, 1900)}...`,
			components: [row],
			embeds: [],
		});
	} else if (canEmbed) {
		const embed = new EmbedBuilder()
			.setColor(success ? 'Purple' : 'Red')
			.setTitle(type)
			.setTimestamp()
			.setFooter({ text: user.username, iconURL: user.displayAvatarURL() })
			.setDescription(content);

		return await replyFn({ embeds: [embed], components: [row], content: undefined });
	} else {
		return await replyFn({ content, components: [row], embeds: [] });
	}
}
