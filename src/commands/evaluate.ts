import { inspect } from 'util';
import { XernerxMessageCommand, XernerxMessage, MessageCommandArguments } from 'xernerx';
import haste from '../models/haste.js';
import embedify from '../models/embedify.js';

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

    async exec(message: XernerxMessage, { args }: MessageCommandArguments) {
        if (!args?.option) return await message.util.reply({ content: `Type a language, supported: ${(this.args?.at(0)?.match as Array<string>)?.join(', ')}` });

        try {
            const user = message.user,
                member = message.member,
                guild = message.guild,
                channel = message.channel,
                client = message.client;

            let response;

            if (!args?.code) return await message.util.reply({ content: 'No code was given to evaluate.' });

            args.code = (args?.code as string)?.replace(/```\w*\n|```/gi, '');

            if (args.option === 'js') response = await eval(`(async () => { ${args.code} })()`);

            if (!args.code) response = "'No code to be evaluated!'";

            return await embedify(message, `\`\`\`${args.option}\n${inspect(response)}\`\`\``, 'Evaluate', true);
        } catch (error) {
            return await embedify(message, `\`\`\`${args.option}\n${inspect(error)}\`\`\``, 'Evaluate', false);
        }
    }
}
