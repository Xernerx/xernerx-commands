export default class PingCommand {
	id: string;
	name: string;
	owner: boolean;
	description: string;
	category: string;
	prefix: Array<string>;
	args: unknown;
	aliases: Array<string>;

	constructor() {
		this.id = 'ping';

		this.name = 'ping';

		this.aliases = [];

		this.owner = true;

		this.description = 'A ping command that keeps track of all pings.';

		this.category = 'XernerxCommand';

		this.prefix = [];
	}

	async exec(message: any) {
		const start = await Number(Date.now());
		const bot = message.client.ws.ping,
			api = Number(Date.now()) - message.createdTimestamp;

		await message.util.reply(`**PONG**\n>>> **Bot**: \`${bot}ms.\`\n**API**: \`${api}ms.\`\n**Time**: \`${start - (await Number(Date.now()))}ms.\``);
	}
}
