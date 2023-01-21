import * as fs from 'node:fs';
import path from 'node:path';
import pkg from '../package.js';
import { ExtensionBuilder as XernerxExtensionBuilder, DumFunctions } from 'xernerx';

class XernerxCommands extends XernerxExtensionBuilder {
	client: Client;
	options;

	constructor(client: Client, options?: Options) {
		super('XernerxCommands');

		this.client = client;

		this.options = {
			prefix: options?.prefix || null,
			include: options?.include || null,
			exclude: options?.exclude || null,
		};

		if (!this.client.handlerOptions.message) {
			console.error(DumFunctions.Style.log(`Xernerx | Commands | To use this extension you require to setup the message command handler!`, { color: DumFunctions.Style.BackgroundColor.Red }));

			return;
		}

		if (!(this.client.options.intents as Record<'has', Function>).has('GuildMessages')) {
			console.error(DumFunctions.Style.log(`Xernerx | Commands | To use this extension you require the intent 'GuildMessages'!`, { color: DumFunctions.Style.BackgroundColor.Red }));

			return;
		}

		(this.client.handlerOptions.message as HandlerOptions).XernerxCommands = this.options;

		this.#load();
	}

	async #load() {
		const dir = path.resolve('./node_modules/xernerx-commands/dist/commands');
		const files = fs.readdirSync(dir).filter((file) => file.endsWith('.js'));

		for (const file of files) {
			let command = (await import(`file://${dir}/${file}`)).default;

			if (command.default) command = command.default;

			command = new command();

			command.client = this.client;

			command.commandType = 'MessageCommand';

			command.filepath = `${dir}\\${file}`;

			command.file = file;

			if (this.options.exclude && this.options.exclude.includes(command.name)) return;

			if (this.options.include && !this.options.include.includes(command.name)) return;

			if (this.options.prefix) {
				if (typeof this.options.prefix === 'string') this.options.prefix = [this.options.prefix];

				command.prefix = this.options.prefix;
			}

			(this.client.commands.message as Record<'set', Function>).set(command?.name || command?.name, command);
		}
	}
}

interface Client {
	commands: { message: unknown };
	options: { intents: unknown };
	handlerOptions: { message: unknown };
}

interface Options {
	include: Array<string> | null; // An array with command names to include.
	exclude: Array<string> | null; // An array with command names to exclude.
	prefix: string | Array<string> | null; // An array of strings for prefixes to listen to.
}

interface HandlerOptions {
	XernerxCommands: Options;
}

const version = pkg.version;

export { XernerxCommands, version };
