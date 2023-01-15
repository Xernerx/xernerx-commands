export default class DocumentationCommand {
    id: string;
    name: string;
    owner: boolean;
    description: string;
    category: string;
    prefix: Array<string>;
    args: unknown;
    aliases: Array<string>;

    constructor() {
        this.id = "documentation";

        this.name = "documentation";

        this.aliases = [];

        this.owner = true;

        this.description = "A command to read the documentation of Discord.js or xernerx.";

        this.category = "XernerxCommand";

        this.prefix = [];
    }

    async exec(message: any) {
    }
}