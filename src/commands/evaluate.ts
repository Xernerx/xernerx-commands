import { MessageCommand, version, Discord } from "xernerx";
import got from 'got';

import { inspect, promisify } from "node:util";
import * as fs from "node:fs";
import { exec } from "child_process";

import { version as XCVersion } from "../main.js";

const shell = promisify(exec);

export default class EvaluateCommand extends MessageCommand {
    constructor() {
        super("evaluate", {
            name: "evaluate",
            aliases: ["eval", "ev"],
            owner: true,
            description: "A command that has a multifunctional use for evaluating, shell command, sourcing and git. (JavaScript take on the famous Python extension Jishaku)",
            info: "Run the command to see it's options.",
            category: "XernerxCommand",
            prefix: [],
            args: [{
                type: "option",
                name: "option",
                content: ["js", "sh", "src", "haste"]
            }, {
                type: 'rest',
                name: 'code'
            }]
        })
    }

    async exec(message: any, args: any) {
        if (!args.option) {
            await message.channel.sendTyping()
            const
                guilds = await message.client.guilds.fetch(),
                userCount = (await Promise.all(guilds.map(async (guild: Record<"fetch", Function>) => (await guild.fetch())?.memberCount)) as Record<"reduce", Function>)?.reduce((a: number, b: number) => a += b) || message.client.users.cache.size,
                hasIntent = (intent: string) => message.client.options.intents.has(intent) ? "enabled" : "disabled";

            return await message.util.reply(`XernerxCommands \`v${XCVersion}\`, Xernerx \`v${version}\`, Discord.js \`v${Discord.version}\`, \`Node ${process.version}\` on \`${process.platform}\`.\nModules were loaded <t:${Math.round(message.client.readyTimestamp / 1000)}:R>, handlers were loaded <t:${Math.round(message.client.readyTimestamp / 1000)}:R>\n\nThis bot is ${!message.client.shard ? "not sharded" : `on ${message.client.shardCount} shard${message.client.shardCount > 1 ? "s" : ""}`} and can see ${guilds.size} guild${guilds.size > 1 ? "s" : ""} and ${userCount} user${userCount > 1 ? "s" : ""}.\nMessage cache capped at ${message.channel.messages.cache.maxSize}, presences intent is ${hasIntent("GuildPresences")}, members intent is ${hasIntent("GuildMembers")}, and message content intent is ${hasIntent("MessageContent")}.\nAverage websocket latency: ${message.client.ws.ping}ms.`)

        }

        if (args.option === "js") {
            try {
                let response;

                args.code = args.code?.replace(/```\w*\n|```/gi, "");

                if (args.option === 'js') response = inspect(await eval(`(async () => { ${args.code} })()`));

                if (!args.code) response = "'No code to be evaluated!'";

                return this.#reply(message, (response as string));
            }
            catch (error) {
                return this.#reply(message, (error as string));
            }
        }

        if (args.option === "haste") {
            try {
                const curDir = fs.readdirSync(`./${args.code || ""}`);
                const curPath = fs.realpathSync(`./${args.code || ""}`);

                if (Array.isArray(curDir)) {
                    return this.#reply(message, `Your current location.\n\`${curPath}\`\n${curDir.map((dir, i) => {
                        let type = ""

                        i + 1 == curDir.length ? type += "└─ " : type += "├─ ";

                        try {
                            fs.readdirSync(`${curPath}/${dir}`);

                            type += "📁";
                        }
                        catch {
                            type += "📄";
                        }

                        return `${type} \`${dir}\``;
                    }).join('\n')}`);
                }
            }
            catch {
                try {
                    const src = fs.readFileSync(`./${args.code || ""}`, { encoding: "utf-8" });

                    return this.#reply(message, src);
                }
                catch {
                    const curPath = fs.realpathSync(`./${args.code || ""}`);

                    return this.#reply(message, `\`${curPath}\` is not a valid path.`);
                }
            }
        }

        if (args.option === "sh") {
            let response;

            try {
                response = shell(args.code);
            }
            catch (error) {
                response = error
            }

            return this.#reply(message, inspect(await response));
        }

        if (args.option === "src") {
            let response;

            try {
                response = await eval(args.code);

                if (typeof response == "object") response = inspect(response);

                response = response.toString();
            }
            catch {
                response = "Variable not found!";
            }

            return this.#reply(message, response.replace(/"|'/gi, ""));
        }
    }

    async #haste(code: string) {
        const hasteURLs = [
            "https://hst.sh",
            "https://hastebin.com",
            "https://haste.clicksminuteper.net",
            "https://haste.tyman.tech"
        ];

        for (const url of hasteURLs) {
            try {
                const resp: any = await got.post(url + "/documents", {
                    body: code
                }).json()
                return `${url}/${resp.key}`;
            } catch (e) {
                console.error(e);
                continue;
            }
        }
        throw new Error("Haste failure");
    }

    async #reply(message: any, content: string) {
        content = content.replaceAll(message.client.token, "Token has been hidden.");

        const haste = await this.#haste(content);

        if (content.length > 1950) return await message.util.reply(`Code is over 2000 characters, you can view it in browser here: ${haste}.`);

        else return await message.util.reply("```js\n" + content + "\n```" + `\nView in browser: ${haste}`);
    }
}