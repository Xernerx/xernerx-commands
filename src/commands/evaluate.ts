import { inspect } from 'util';
import { XernerxMessageCommand, Discord } from 'xernerx';
import haste from '../models/haste.js';

export default class EvaluateCommand extends XernerxMessageCommand {
    constructor() {
        super('evaluate', {
            name: 'evaluate',
            aliases: ['eval', 'ev'],
            strict: {
                owner: true,
            },
            description: 'A command that has a multifunctional use for evaluating, shell command, sourcing and git. (JavaScript take on the famous Python extension Jishaku)',
            info: "Run the command to see it's options.",
            category: 'XernerxCommand',
            prefix: [],
            args: [
                {
                    type: 'option',
                    name: 'option',
                    match: ['js', 'ts'],
                },
                {
                    type: 'rest',
                    name: 'code',
                },
            ],
        });
    }

    async exec(message: any, { args }: any) {
        if (!args.option) return await message.util.reply({ content: `Type a language, supported: ${(this.args?.at(0)?.match as Array<string>)?.join(', ')}` });

        try {
            const user = message.user,
                member = message.member,
                guild = message.guild,
                channel = message.channel,
                client = message.client;

            let response;

            args.code = args.code?.replace(/```\w*\n|```/gi, '');

            if (args.option === 'js') response = await eval(`(async () => { ${args.code} })()`);

            if (!args.code) response = "'No code to be evaluated!'";

            if (inspect(response).length >= 2000)
                return await message.util.reply({ content: `Response is too big to view in discord, you can view it here instead: <${await haste(inspect(response))}>` });
            else return await message.util.reply({ content: `\`\`\`${args.option}\n${inspect(response)}\`\`\`` });
        } catch (error) {
            return await message.util.reply({ content: `\`\`\`${args.option}\n${inspect(error)}\`\`\`` });
        }
    }
}
