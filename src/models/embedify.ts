import { inspect } from 'util';
import XernerxClient, { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, XernerxMessage } from 'xernerx';
import haste from './haste.js';

export default async function embedify(message: XernerxMessage, content: string, type: string, success: boolean = true) {
    const hash = await haste(content);

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('xc-delete-msg').setEmoji('✖️').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setLabel('View in browser').setURL(hash).setStyle(ButtonStyle.Link)
    );

    const options = ((message.client as XernerxClient).config as any)?.xc;

    if (inspect(content).length > 1950) {
        return await message.util.reply({ content: `Code is too big to display in discord. View in browser instead.`, components: [row as never], embeds: [] });
    } else if (message.guild?.members?.me?.permissions.has('EmbedLinks') && options.useEmbeds) {
        const embed = new EmbedBuilder()
            .setColor(success ? 'Purple' : 'Red')
            .setTitle(type)
            .setTimestamp()
            .setFooter({ text: message.user.username, iconURL: message.user.displayAvatarURL() })
            .setDescription(content);

        return await message.util.reply({ embeds: [embed], components: [row as never], content: null });
    } else {
        return await message.util.reply({ content, components: [row as never], embeds: [] });
    }
}
