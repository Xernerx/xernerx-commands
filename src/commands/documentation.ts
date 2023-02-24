import { MessageCommandBuilder } from 'xernerx';

export default class DocumentationCommand extends MessageCommandBuilder {
    constructor() {
        super('documentation', {
            name: 'documentation',
            aliases: ['docs'],
            strict: {
                owner: true,
            },
            description: 'A command to read the documentation of Discord.js or xernerx.',
            category: 'XernerxCommand',
            prefix: [],
            args: [
                {
                    name: 'option',
                    type: 'option',
                    content: ['x', 'xernerx', 'djs', 'discord.js'],
                },
                {
                    name: 'rest',
                    type: 'rest',
                },
            ],
        });
    }

    async exec(message: any, args: any) {
        message.util.reply('Soon:tm:');
    }
}
