import * as fs from 'fs';
import { XernerxMessage } from 'xernerx/dist/types/extenders.js';
import reply from './reply.js';

export default function haste(message: XernerxMessage, args: any) {
    try {
        const curDir = fs.readdirSync(`./${args.code || ''}`);
        const curPath = fs.realpathSync(`./${args.code || ''}`);

        if (Array.isArray(curDir)) {
            return reply(
                message,
                `Your current location.\n\`${curPath}\`\n${curDir
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
                false
            );
        }
    } catch {
        try {
            const src = fs.readFileSync(`./${args.code || ''}`, { encoding: 'utf-8' });

            return reply(message, src);
        } catch {
            const curPath = fs.realpathSync(`./${args.code || ''}`);

            return reply(message, `\`${curPath}\` is not a valid path.`);
        }
    }
}
