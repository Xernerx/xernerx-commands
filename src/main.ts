import * as fs from 'node:fs';
import path from 'node:path';
import XernerxClient, { XernerxExtension, Options as DiscordOptions, XernerxLog } from 'xernerx';

const version = JSON.parse(fs.readFileSync('./node_modules/xernerx-commands/package.json', 'utf-8')).version;

new XernerxLog(true).update(version, 'https://raw.githubusercontent.com/xernerx/xernerx-commands/main/package.json');

export default class XernerxCommands extends XernerxExtension {
    public readonly client;
    public readonly options;

    constructor(client: XernerxClient, options?: Options) {
        super('XernerxCommands');

        this.client = client;

        this.options = {
            prefix: options?.prefix || null,
            include: options?.include || null,
            exclude: options?.exclude || null,
            cache: {
                messages: options?.cache?.messages || 1000,
            },
        };
    }

    async main(client: XernerxClient) {
        this.client.options.makeCache = DiscordOptions.cacheWithLimits({ MessageManager: this.options.cache.messages });

        const dir = path.resolve('./node_modules/xernerx-commands/dist/commands');
        const files = fs.readdirSync(dir).filter((file) => file.endsWith('.js'));

        for (const file of files) {
            try {
                let command = (await import(`file://${dir}/${file}`)).default;

                if (command.default) command = command.default;

                command = new command();

                command.client = this.client;

                command.filetype = 'MessageCommand';

                command.filepath = `${dir}\\${file}`;

                command.file = file;

                if (this.options.exclude && this.options.exclude.includes(command.name)) return;

                if (this.options.include && !this.options.include.includes(command.name)) return;

                if (this.options.prefix) {
                    if (typeof this.options.prefix === 'string') this.options.prefix = [this.options.prefix];

                    command.prefix = this.options.prefix;
                }

                this.client.commands.message.set(command?.name || command?.name, command);
            } catch (error) {
                console.error(error);
            }
        }
    }
}

type Command = 'documentation' | 'evaluate' | 'ping' | 'transpile';

interface Options {
    include?: Array<Command> | null; // An array with command names to include.
    exclude?: Array<Command> | null; // An array with command names to exclude.
    prefix?: string | Array<string> | null; // An array of strings for prefixes to listen to.
    cache?: {
        messages?: number;
    };
}

export { version };
