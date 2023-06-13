import * as fs from 'node:fs';
import path from 'node:path';
import XernerxClient, { ExtensionBuilder as XernerxExtensionBuilder, Options as DiscordOptions } from 'xernerx';

export default class XernerxCommands extends XernerxExtensionBuilder {
    public readonly client;
    public readonly options;

    constructor(client: XernerxClient, options?: Options) {
        super('XernerxCommands');

        this.client = client;

        this.options = {
            prefix: options?.prefix || null,
            include: options?.include || null,
            exclude: options?.exclude || null,
        };
    }

    async main(client: XernerxClient) {
        this.client.options.makeCache = DiscordOptions.cacheWithLimits({ MessageManager: 1000 });

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
}

const version = '0.0.15';

export { version };
