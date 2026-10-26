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

## Built-in Developer Commands (Jishaku / `jsk` Inspired)

| Name          | Aliases              | Description                                                                                  |
| ------------- | -------------------- | -------------------------------------------------------------------------------------------- |
| xc!           | jsk, jishaku, status | Displays bot, process memory/PID, shard, cache, intent, and framework runtime information.   |
| evaluate      | eval, ev, js, ts, py | Evaluates JS/TS code with `_`, `message`, `client`, `guild`, `channel`, `Discord` in scope.  |
| shell         | sh                   | Executes a shell command and returns stdout/stderr.                                          |
| git           |                      | Shortcut for running `git` commands in the workspace shell (`jsk git`).                      |
| source        | src                  | Displays the source code of a registered bot command or JS expression (`jsk source`).        |
| haste         | cat, tree            | Lists directory trees or reads/uploads file source to a Hastebin service (`jsk cat`).        |
| ping          | rtt                  | Displays WebSocket, API, and round-trip latency (`jsk rtt`).                                 |
| debug         | dbg                  | Executes a command, timing its duration (`ms`) and catching thrown stack traces (`jsk dbg`). |
| repeat        |                      | Repeats a command `<count>` times sequentially (`jsk repeat`).                               |
| su            | sudo, in             | Runs a command as another user (`su`), in another channel (`in`), or via `sudo`.             |
| transpile     | t, tr                | Pipes code into a specified language/engine runtime.                                         |
| documentation | docs                 | Queries the Xernerx Developer Documentation catalog.                                         |
