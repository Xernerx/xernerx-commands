import { EmbedBuilder, MessagePayload } from 'xernerx';
import { XernerxMessage } from 'xernerx/dist/types/extenders.js';

export default async function reply(message: XernerxMessage, msg: string, cb: boolean = true) {
    try {
        const url = await haste(msg),
            embed = new EmbedBuilder()
                .setTitle('Evaluate')
                .setDescription((cb ? '```ts\n' : '') + msg.slice(0, 4000) + (cb ? '```' : ''))
                .setURL(url)
                .setTimestamp()
                .setFooter({ text: `${msg.length} characters` });

        if (msg.length <= 4000 && message.guild && message.guild?.members.me?.permissions.has('EmbedLinks')) return message.util.reply({ embeds: [embed] } as unknown as MessagePayload);
        else if (msg.length <= 1980) return message.util.reply({ content: (cb ? '```ts\n' : '') + msg + (cb ? '```' : '') + `\n\nView in browser: ${url}` } as unknown as MessagePayload);
        else return message.util.reply({ content: `Code is ${msg.length} characters, view in browser: ${url}` } as unknown as MessagePayload);
    } catch (error) {
        console.error(error);
    }
}

async function haste(code: string) {
    for (const url of ['https://hst.sh', 'https://hastebin.com', 'https://haste.clicksminuteper.net', 'https://haste.tyman.tech']) {
        try {
            const resp = await (
                await fetch(url + '/documents', {
                    body: code,
                    method: 'POST',
                })
            ).json();
            return `${url}/${resp.key}`;
        } catch (error) {
            console.error(error);
            continue;
        }
    }
    return `Can't haste code anywhere.`;
}
