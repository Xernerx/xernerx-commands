import { MessageCommandBuilder, version, Discord } from 'xernerx';

import { promisify } from 'util';
import { exec } from 'child_process';

import { version as XCVersion } from '../main.js';
import ev from '../models/eval.js';
import haste from '../models/haste.js';
import sh from '../models/shell.js';
import source from '../models/source.js';

export default class EvaluateCommand extends MessageCommandBuilder {
    constructor() {
        super('evaluate', {
            name: 'evaluate',
            aliases: ['eval', 'ev'],
            strict: {
                owner: true,
            },
            description: 'A command that has a multifunctional use for evaluating, shell command, sourcing and git. (JavaScript take on the famous Python extension Jishaku)',
            info: "Run the command to see it's options.",
            category: 'XernerxCommand',
            prefix: [],
            args: [
                {
                    type: 'option',
                    name: 'option',
                    match: ['js', 'sh', 'src', 'haste'],
                },
                {
                    type: 'rest',
                    name: 'code',
                },
            ],
        });
    }

    async exec(message: any, a: any) {
        const args = a.args;

        if (!args.option) {
            await message.channel.sendTyping();
            const guilds = await message.client.guilds.cache,
                userCount =
                    ((await Promise.all(guilds.map(async (guild: Record<'fetch', Function>) => (await guild.fetch())?.memberCount))) as Record<'reduce', Function>)?.reduce(
                        (a: number, b: number) => (a += b)
                    ) || message.client.users.cache.size,
                hasIntent = (intent: string) => (message.client.options.intents.has(intent) ? 'enabled' : 'disabled');

            return await message.util.reply(
                `XernerxCommands \`v${XCVersion}\`, Xernerx \`v${version}\`, Discord.js \`v${Discord.version}\`, \`Node ${process.version}\` on \`${
                    process.platform
                }\`.\nModules were loaded <t:${Math.round(message.client.readyTimestamp / 1000)}:R>, handlers were loaded <t:${Math.round(message.client.readyTimestamp / 1000)}:R>\n\nThis bot is ${
                    !message.client.shard ? 'not sharded' : `on ${message.client.shardCount} shard${message.client.shardCount > 1 ? 's' : ''}`
                } and can see ${guilds.size} guild${guilds.size > 1 ? 's' : ''} and ${userCount} user${userCount > 1 ? 's' : ''}.\nMessage cache capped at ${
                    message.channel.messages.cache.maxSize
                }, presences intent is ${hasIntent('GuildPresences')}, members intent is ${hasIntent('GuildMembers')}, and message content intent is ${hasIntent(
                    'MessageContent'
                )}.\nAverage websocket latency: ${message.client.ws.ping}ms.`
            );
        }

        if (args.option === 'js') return ev(message, args);

        if (args.option === 'haste') return haste(message, args);

        if (args.option === 'sh') return sh(message, args);

        if (args.option === 'src') return source(message, args);
    }
}
