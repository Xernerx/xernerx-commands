/** @format */

import { inspect } from 'node:util';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Message } from 'discord.js';
import type { XernerxClient } from '@xernerx/framework';
import { haste } from './haste.js';

/**
 * Formats and replies to a Discord message with a styled embed (or plain text fallback),
 * an owner-only delete button (`xc-delete-msg`), and a Hastebin "View in browser" link button.
 *
 * @param message - The Discord message to reply to.
 * @param content - The text or markdown content to display and upload to Hastebin.
 * @param type - The embed title indicating the command/output type (e.g., `'Evaluate'`, `'Shell'`, `'Git'`).
 * @param success - Whether the operation succeeded (`'Purple'` embed color when `true`, `'Red'` when `false`).
 * @returns A promise that resolves to the sent reply message.
 */
export async function embedify(message: Message, content: string, type: string, success = true) {
	const options = ((message.client as XernerxClient as any).config as any)?.xc;
	const user = message.user || message.author;
	const owners = (message.client?.settings?.owners as string[]) || [];
	const userId = user?.id || owners[0];

	const hash = await haste(content, {
		userId,
		title: type,
		token: options?.token,
	});
	const isValidUrl = /^https?:\/\//i.test(hash);

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setCustomId('xc-delete-msg').setEmoji('✖️').setStyle(ButtonStyle.Danger));

	if (isValidUrl) {
		row.addComponents(new ButtonBuilder().setLabel('View in browser').setURL(hash).setStyle(ButtonStyle.Link));
	}

	const replyFn = message.util ? message.util.reply.bind(message.util) : message.reply.bind(message);
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
