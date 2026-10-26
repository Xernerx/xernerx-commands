<!-- @format -->

# @xernerx/commands

Xernerx Commands is an extension for `@xernerx/framework` containing developer utility commands (`xc!`, `evaluate`, `ping`, `shell`, `transpile`, `haste`, `documentation`) and the official SDK to sync and manage Discord bot commands on `https://api.xernerx.com/v1/bots/:id/commands`.

## Install

```bash
pnpm add @xernerx/commands
```

## Usage with `@xernerx/framework`

```ts
import { XernerxClient } from '@xernerx/framework';
import { XernerxCommands } from '@xernerx/commands';

const client = new XernerxClient({
	intents: ['Guilds', 'GuildMessages', 'MessageContent'],
	token: process.env.DISCORD_BOT_TOKEN!,
	owners: ['YOUR_USER_ID'],
});

// Register developer message commands and automatically sync slash/context command bodies to the Xernerx Suite API
client.modules.extensionHandler.loadExtensions(
	new XernerxCommands(client, {
		token: process.env.XERNERX_TOKEN!,
		prefix: 'xc!',
		useEmbeds: true,
	})
);
```

## Standalone API Client (`CommandsClient`)

```ts
import { CommandsClient } from '@xernerx/commands';

const commands = new CommandsClient({
	botId: 'YOUR_BOT_ID',
	token: process.env.XERNERX_API_TOKEN!,
});

// Sync / post commands body to Xernerx Suite API
await commands.postCommands([
	{
		name: 'ping',
		description: 'Replies with Pong!',
		type: 1,
	},
]);

// Fetch commands from Xernerx Suite API
const currentCommands = await commands.getCommands();

// Delete a specific command or clear all commands
await commands.deleteCommands('ping');
await commands.clearCommands();
```

## Options

| Name             | Type                              | Default | Required | Description                                                                  |
| ---------------- | --------------------------------- | ------- | -------- | ---------------------------------------------------------------------------- |
| token            | string                            | `""`    | false    | Xernerx Suite API token to automatically post/sync commands body on startup. |
| url              | string                            | auto    | false    | Custom Xernerx Suite API base URL (`https://api.xernerx.com` by default).    |
| dev              | boolean                           | `false` | false    | Use local development API URL (`http://localhost:4001`).                     |
| interval         | number                            | —       | false    | Optional interval in ms to periodically re-sync commands body.               |
| include          | Array\<CommandName\> \| null      | `null`  | false    | Only load the specified built-in developer commands.                         |
| exclude          | Array\<CommandName\> \| null      | `null`  | false    | Exclude the specified built-in developer commands.                           |
| prefix           | Array\<string\> \| string \| null | `'xc!'` | false    | Prefix(es) for the built-in developer message commands.                      |
| useEmbeds        | boolean                           | `true`  | false    | Whether command responses should use Discord embeds when permitted.          |
| registerCommands | boolean                           | `true`  | false    | Whether to register the built-in developer message commands on the client.   |

## Built-in Developer Commands

| Name          | Aliases  | Description                                                            |
| ------------- | -------- | ---------------------------------------------------------------------- |
| xc!           |          | Displays bot, shard, cache, intent, and framework runtime information. |
| evaluate      | eval, ev | Evaluates JavaScript/TypeScript code (inspired by Jishaku).            |
| ping          |          | Displays websocket, API, and round-trip latency.                       |
| shell         | sh       | Executes a shell command and returns stdout/stderr.                    |
| transpile     | t, tr    | Pipes code into a specified language/engine runtime.                   |
| haste         |          | Lists directory contents or uploads file source to a Hastebin service. |
| documentation | docs     | Queries the Xernerx Developer Documentation catalog.                   |
