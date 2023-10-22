import * as fs from 'fs';
import { XernerxMessageCommand } from 'xernerx';

export default class XernerxCommandsHasteCommand extends XernerxMessageCommand {
    constructor() {
        super('haste', {
            name: 'haste',
            strict: {
                owner: true,
            },
            args: [
                {
                    type: 'rest',
                    name: 'rest',
                },
            ],
        });
    }

    public async exec(message: any, { args }: any) {
        try {
            const curDir = fs.readdirSync(`./${args.rest || ''}`);
            const curPath = fs.realpathSync(`./${args.rest || ''}`);

            if (Array.isArray(curDir)) {
                return await message.util.reply({
                    content: `Your current location.\n\`${curPath}\`\n${curDir
                        .map((dir, i) => {
                            let type = '';

                            i + 1 == curDir.length ? (type += '└─ ') : (type += '├─ ');

                            try {
                                fs.readdirSync(`${curPath}/${dir}`);

                                type += '📁';
                            } catch {
                                type += '📄';
                            }

                            return `${type} \`${dir}\``;
                        })
                        .join('\n')}`,
                });
            }
        } catch {
            try {
                const src = fs.readFileSync(`./${args.rest || ''}`, { encoding: 'utf-8' });

                return await message.util.reply({ content: `\`\`\`${args.rest.split('.')[args.rest.split('.').length - 1]}\n${src}\`\`\`` });
            } catch {
                const curPath = fs.realpathSync(`./`) + `\\${args.rest.replace(`/`, '\\')}` || '';

                return await message.util.reply({ content: `\`${curPath}\` is not a valid path.` });
            }
        }
    }
}
