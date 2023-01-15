import { inspect } from "node:util";

export default class EvaluateCommand {
    id: string;
    name: string;
    owner: boolean;
    description: string;
    category: string;
    prefix: Array<string>;
    args: unknown;
    aliases: Array<string>;

    constructor() {
        this.id = "evaluate";

        this.name = "evaluate";

        this.aliases = ["eval", "ev"];

        this.owner = true;

        this.description = "An evaluation command to evaluate code on the spot.";

        this.category = "XernerxCommand";

        this.prefix = [];

        this.args = [{
            type: "option",
            name: "option",
            content: ["js", "sh", "git", "src"]
        }, {
            type: 'rest',
            name: 'code'
        }]
    }

    async exec(message: any, args: any) {
        const options = ((this.args as Array<Record<string, string | Array<string>>>)[0].content as Array<string>);

        const toEmbed = message.guild.members.me.permissions.has("Embed_Links");

        if (!args.option || !options.includes(args.option)) return message.util.reply(`You didn't provide an option.\n\nOptions\n>>> ${options.map(o => `- \`${o}\``).join('\n')}`)

        if (args.option === "js") {
            try {
                let response;

                args.code = args.code?.replace(/```\w*\n|```/gi, "");

                if (args.option === 'js') response = inspect(await eval(`(async () => { ${args.code} })()`));

                if (!args.code) response = "'No code to be evaluated!'";

                response = response?.replaceAll(message.client.token, "Bot token has been hidden for security reasons.");

                message.util.reply("```js\n" + ((response as string)?.length > 2000 ? "Code is too long to be shown in discord." : response) + "```");
            }
            catch (error) {
                message.util.reply("```js\n" + error + "```");
            }
        }
    }
}