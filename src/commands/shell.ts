import { exec } from 'child_process';
import { inspect, promisify } from 'util';
import { XernerxMessageCommand } from 'xernerx';

const shell = promisify(exec);

export default class XernerxCommandsShellCommand extends XernerxMessageCommand {
    constructor() {
        super('shell', {
            name: 'shell',
            aliases: ['sh'],
            strict: {
                owner: true,
            },
            args: [
                {
                    type: 'rest',
                    name: 'code',
                },
            ],
        });
    }

    async exec(message: any, { args }: any) {
        if (!args.code) return message.util.reply({ content: `Specify a command.` });

        return shell(args.code)
            .then(async ({ stdout, stderr }) => await message.util.reply({ content: stdout || stderr }))
            .catch(async (error) => await message.util.reply({ content: inspect(error) }));
    }
}
