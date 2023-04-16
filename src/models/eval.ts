import { inspect } from 'util';
import { MessagePayload } from 'xernerx';
import { XernerxMessage } from 'xernerx/dist/types/extenders.js';
import reply from './reply.js';

export default async function ev(message: XernerxMessage, args: any) {
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

        return reply(message, inspect(response));
    } catch (error) {
        return reply(message, inspect(error));
    }
}
