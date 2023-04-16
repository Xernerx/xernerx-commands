import { inspect } from 'util';
import { XernerxMessage } from 'xernerx/dist/types/extenders.js';
import reply from './reply.js';

export default function source(message: XernerxMessage, args: any) {
    try {
        let response = eval(args.code);

        if (typeof response == 'object') response = inspect(response);

        return reply(message, response);
    } catch (error) {
        return reply(message, inspect(error));
    }
}
