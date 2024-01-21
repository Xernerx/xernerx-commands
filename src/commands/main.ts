import { XernerxMessageCommand, version, Discord, XernerxMessage } from 'xernerx';
import { version as XCVersion } from '../main.js';
import embedify from '../models/embedify.js';

export default class MainCommand extends XernerxMessageCommand {
    constructor() {
        super('xc!', {
            name: 'xc!',
            regex: new RegExp(`^xc!\\B`, 'gim'),
            strict: {
                owner: true,
            },
            description: 'A Main command that keeps track of all Mains.',
            category: 'XernerxCommand',
        });
    }

    async exec(message: any) {
        const guilds = await message.client.guilds.cache,
            userCount =
                ((await Promise.all(guilds.map(async (guild: Record<'fetch', Function>) => (await guild.fetch())?.memberCount))) as Record<'reduce', Function>)?.reduce(
                    (a: number, b: number) => (a += b)
                ) || message.client.users.cache.size,
            hasIntent = (intent: string) => (message.client.options.intents.has(intent) ? 'enabled' : 'disabled');

        return await embedify(
            message,
            `XernerxCommands \`v${XCVersion}\`, Xernerx \`v${version}\`, Discord.js \`v${Discord.version}\`, \`Node ${process.version}\` on \`${
                process.platform
            }\`.\nModules were loaded <t:${Math.round(message.client.readyTimestamp / 1000)}:R>, handlers were loaded <t:${Math.round(message.client.readyTimestamp / 1000)}:R>\n\nThis bot is ${
                message.client.options.shardCount === 0 ? 'not sharded' : `on shard ${message.client.options.shards[0]}`
            } and can see ${guilds.size} guild${guilds.size > 1 ? 's' : ''} and ${userCount} user${userCount > 1 ? 's' : ''}. Using \`${await message.client.guilds.fetch(
                message.client.settings.local
            )}\` as local guild with owners ${(await Promise.all(message.client.settings.ownerId.map(async (o: any) => await message.client.users.fetch(o)))).join(', ')}\nMessage cache capped at ${
                message.channel.messages.cache.maxSize
            }, presences intent is ${hasIntent('GuildPresences')}, members intent is ${hasIntent('GuildMembers')}, and message content intent is ${hasIntent(
                'MessageContent'
            )}.\nAverage websocket latency: ${message.client.ws.ping}ms.`,
            'Xernerx'
        );
    }
}
