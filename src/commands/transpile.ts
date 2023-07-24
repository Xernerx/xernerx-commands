import { exec } from 'child_process';
import { promisify } from 'util';
import { XernerxMessageCommand, MessagePayload } from 'xernerx';
import { XernerxMessage } from 'xernerx/dist/types/extenders.js';
import { MessageCommandArguments } from 'xernerx/dist/types/interfaces.js';

const shell = promisify(exec);

export default class TranspileCommand extends XernerxMessageCommand {
    constructor() {
        super('transpile', {
            name: 'transpile',
            aliases: ['t', 'tr'],
            description: 'A command that will run any language given to it.',
            category: 'XernerxCommand',
            strict: {
                owner: true,
            },
            args: [
                {
                    type: 'string',
                    name: 'language',
                },
                {
                    type: 'rest',
                    name: 'code',
                },
            ],
        });
    }

    async exec(message: XernerxMessage, a: MessageCommandArguments): Promise<any> {
        const args = a.args;

        if (!args?.language) return this.reply(message, `You need to specify a language | engine.`);

        if (!args?.code) return this.reply(message, `You need to specify code to run.`);

        return shell(`echo ${args.code} | ${args.language}`)
            .then(({ stdout, stderr }) => this.reply(message, `\`\`\`${(args.language as string)?.replace(`node`, 'js')}\n${stdout || stderr}\`\`\``))
            .catch((error) => this.reply(message, `\`\`\`ts\n${error}\`\`\``));
    }

    reply(message: XernerxMessage, msg: string) {
        return message.util.reply({ content: msg } as unknown as MessagePayload);
    }
}
