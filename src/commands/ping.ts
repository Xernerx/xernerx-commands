import { MessageCommandBuilder } from 'xernerx';

export default class PingCommand extends MessageCommandBuilder {
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
    //e
    async exec(message: any) {
        const start = await Number(Date.now());
        const bot = message.client.ws.ping,
            api = Number(Date.now()) - message.createdTimestamp;

        return await message.util.reply(`**PONG**\n>>> **Bot**: \`${bot}ms.\`\n**API**: \`${api}ms.\`\n**Time**: \`${start - (await Number(Date.now()))}ms.\``);
    }
}
