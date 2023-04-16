import { exec } from 'child_process';
import { inspect, promisify } from 'util';
import { XernerxMessage } from 'xernerx/dist/types/extenders.js';
import reply from './reply.js';

const shell = promisify(exec);

export default function sh(message: XernerxMessage, args: any) {
    return shell(args.code)
        .then(({ stdout, stderr }) => reply(message, stdout || stderr))
        .catch((error) => reply(message, inspect(error)));
}
