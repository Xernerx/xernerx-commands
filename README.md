<!-- @format -->

![Xernerx Banner](https://xernerx.com/banner.png)

# @xernerx/commands

Xernerx Commands (`@xernerx/commands`) is the official Jishaku (`jsk`)-inspired developer command extension for [`@xernerx/framework`](https://docs.xernerx.com/packages/@xernerx/framework) and the official SDK for synchronizing and managing Discord bot application commands on the Xernerx Suite API (`https://api.xernerx.com/v1/bots/:id/commands`).

## Features

- **Jishaku (`jsk`)-Inspired Developer Suite**: Built-in owner-restricted commands (`xc!`, `evaluate`, `shell`, `git`, `source`, `haste`, `ping`, `debug`, `repeat`, `su`, `transpile`, `documentation`) with automatic `@mention` prefix stripping and alias support.
- **Stateful JavaScript & TypeScript Evaluation**: Evaluate code in live bot context with `_` (last result), `message` (`msg`), `client` (`bot`), `guild`, `channel`, `user` (`author`), `member`, and `Discord` in scope, plus sub-modes for `sh`, `git`, and `source`.
- **Automatic Suite API Synchronization**: Extracts slash and context menu commands from `XernerxClient` (or across `XernerxShardClient` clusters) and syncs their command bodies to `POST /v1/bots/:id/commands` on startup and optional intervals.
- **Standalone REST SDK (`CommandsClient`)**: Manage bot commands (`get`, `post`, `sync`, `update`, `delete`, `clear`) from any deployment script or service without a running Discord client.
- **Interactive Output Controls**: Every developer command reply is formatted via `embedify()` with an owner-only delete button (`✖️` / `xc-delete-msg`) and automatic Hastebin overflow links (`View in browser`).

## Install

```bash
pnpm add @xernerx/commands
```

## Setup

Extend `XernerxClient` and register `XernerxCommands`:

```ts
import { XernerxClient } from '@xernerx/framework';
import { XernerxCommands } from '@xernerx/commands';

export class Client extends XernerxClient {
	constructor() {
		super({
			intents: ['Guilds', 'GuildMessages', 'MessageContent'],
			token: process.env.DISCORD_BOT_TOKEN!,
			owners: ['YOUR_USER_ID'],
		});

		this.modules.extensionHandler.loadExtensions(
			new XernerxCommands(this, {
				token: process.env.XERNERX_TOKEN!,
				prefix: 'xc!',
				useEmbeds: true,
				cache: {
					messages: 1000,
				},
			})
		);

		this.connect();
	}
}

new Client();
```

## Standalone API Client (`CommandsClient`)

Extend [`CommandsClient`](https://docs.xernerx.com/packages/@xernerx/commands#class-CommandsClient) to fetch, post, sync, update, or delete commands on the Xernerx Suite API:

```ts
import { CommandsClient } from '@xernerx/commands';
import { Terminal } from '@xernerx/terminal';

export class Commands extends CommandsClient {
	private readonly console = new Terminal({ scope: 'XC' });

	constructor() {
		super({
			botId: 'YOUR_BOT_ID',
			token: process.env.XERNERX_API_TOKEN!,
		});
	}

	async run() {
		// Post or sync commands body to Xernerx Suite API
		await this.post([
			{
				name: 'ping',
				description: 'Replies with Pong!',
				type: 1,
			},
		]);

		await this.sync([
			{
				name: 'ping',
				description: 'Replies with Pong!',
				type: 1,
			},
		]);

		// Update stored commands on Xernerx Suite API
		await this.update([
			{
				name: 'ping',
				description: 'Replies with gateway latency!',
				type: 1,
			},
		]);

		// Fetch stored commands from Xernerx Suite API
		const list = await this.get();
		this.console.info(`Loaded ${list.length} commands from Xernerx Suite API`);

		// Delete a specific command by ID/name or clear all commands for the bot
		await this.delete('ping');
		await this.clear();
	}
}

new Commands();
```

## Helper Functions & Models

`@xernerx/commands` exports lower-level utilities and models for custom command pipelines and developer tooling:

````ts
import { XernerxClient } from '@xernerx/framework';
import { Terminal } from '@xernerx/terminal';
import { post, serializeCommand, extractClientCommands, embedify, reply, haste, shell, source, resolveCommandSource, version } from '@xernerx/commands';
import type { Message } from 'discord.js';

export class CustomDeveloperTools extends XernerxClient {
	private readonly console = new Terminal({ scope: 'XC' });

	constructor() {
		super({
			intents: ['Guilds', 'GuildMessages', 'MessageContent'],
			token: process.env.DISCORD_BOT_TOKEN!,
			owners: ['YOUR_USER_ID'],
		});

		this.console.info(`Running @xernerx/commands v${version}`);
	}

	async syncAllCommands() {
		// Extract all slash & context commands from this XernerxClient instance
		const allCommands = extractClientCommands(this);

		// Serialize a single command builder or plain object into a CommandBody
		const firstSerialized = allCommands[0] ? serializeCommand(allCommands[0]) : null;
		if (firstSerialized) {
			this.console.info(`Prepared command: ${firstSerialized.name}`);
		}

		// Directly POST command payloads to https://api.xernerx.com/v1/bots/:id/commands
		await post({ id: this.user!.id, commands: allCommands }, process.env.XERNERX_API_TOKEN!);
	}

	async inspectMessage(message: Message) {
		// Upload text/code to a Hastebin-compatible service
		const hasteUrl = await haste("new Terminal({ scope: 'XC' }).info('Hello Xernerx!');");
		this.console.info(`Uploaded snippet to ${hasteUrl}`);

		// Format a command reply with an embed, Hastebin browser link button, and owner delete button (✖️)
		await embedify(message, '```ts\nconst ok = true;\n```', 'Evaluate', true);

		// Send a code-block reply with automatic Hastebin fallback for large payloads
		await reply(message, 'const x = 42;', true);

		// Execute a shell command or inspect command/expression source directly
		await shell(message, ['git', 'status']);
		await source(message, ['ping']);

		const rawSource = resolveCommandSource(this, 'ping');
		if (rawSource) {
			this.console.info(`Resolved source (${rawSource.length} chars)`);
		}
	}
}
````

## `XernerxCommandsOptions`

| Name               | Type                              | Default | Required | Description                                                                   |
| ------------------ | --------------------------------- | ------- | -------- | ----------------------------------------------------------------------------- |
| `token`            | `string`                          | `""`    | `false`  | Xernerx Suite API token to automatically post/sync commands body on startup.  |
| `url`              | `string`                          | auto    | `false`  | Custom Xernerx Suite API base URL (`https://api.xernerx.com` by default).     |
| `dev`              | `boolean`                         | `false` | `false`  | Use local development API URL (`http://localhost:4001`).                      |
| `interval`         | `number`                          | —       | `false`  | Optional interval in ms to periodically re-sync commands body.                |
| `include`          | `Array<CommandName> \| null`      | `null`  | `false`  | Only load the specified built-in developer commands.                          |
| `exclude`          | `Array<CommandName> \| null`      | `null`  | `false`  | Exclude the specified built-in developer commands.                            |
| `prefix`           | `Array<string> \| string \| null` | `'xc!'` | `false`  | Prefix(es) for the built-in developer message commands.                       |
| `cache.messages`   | `number`                          | `1000`  | `false`  | Maximum number of messages cached per channel in Discord.js `MessageManager`. |
| `useEmbeds`        | `boolean`                         | `true`  | `false`  | Whether command responses should use Discord embeds when permitted.           |
| `registerCommands` | `boolean`                         | `true`  | `false`  | Whether to register the built-in developer message commands on the client.    |

## Built-in Developer Commands (Jishaku / `jsk` Inspired)

All built-in developer commands are owner-restricted (`client.settings.owners`) and reply via [`embedify()`](https://docs.xernerx.com/packages/@xernerx/commands#function-embedify) with interactive controls:

- **Delete Control (`✖️` / `xc-delete-msg`)**: Owner-only danger button attached to every response that deletes the bot's output message on click.
- **Browser Overflow / Hastebin Link (`View in browser`)**: Automatically uploads command output to a Hastebin mirror (`hst.sh`, `hastebin.com`, etc.) and attaches a direct link button; outputs exceeding Discord's character limit automatically fall back to the browser view.

| Name            | Aliases                        | Description                                                                                           |
| --------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `xc!`           | `jsk`, `jishaku`, `status`     | Displays bot, process memory/PID, shard, cache, intent, and framework runtime information.            |
| `evaluate`      | `eval`, `ev`, `js`, `ts`, `py` | Evaluates JS/TS code with `_`, `message`, `client`, `guild`, `channel`, `Discord` in scope.           |
| `shell`         | `sh`                           | Executes a shell command and returns stdout/stderr.                                                   |
| `git`           | —                              | Shortcut for running `git` commands in the workspace shell (`jsk git`).                               |
| `source`        | `src`                          | Displays the source code of a registered bot command or JS expression (`jsk source`).                 |
| `haste`         | `cat`, `tree`                  | Lists directory trees or reads/uploads file source to a Hastebin service (`jsk cat`).                 |
| `ping`          | `rtt`                          | Displays WebSocket, API, and round-trip latency (`jsk rtt`).                                          |
| `debug`         | `dbg`                          | Executes a command, timing its duration (`ms`) and catching thrown stack traces (`jsk dbg`).          |
| `repeat`        | —                              | Repeats a command `<count>` times sequentially (`jsk repeat`, up to 25 times).                        |
| `su`            | `sudo`, `in`                   | Runs a command as another user (`su`), in another channel (`in`), or bypassing restrictions (`sudo`). |
| `transpile`     | `t`, `tr`                      | Pipes code into a specified language/engine runtime.                                                  |
| `documentation` | `docs`                         | Queries the Xernerx Developer Documentation catalog (`https://docs.xernerx.com`).                     |

## Documentation & API Reference

Full API documentation for `@xernerx/commands` is hosted on the **[`@xernerx/commands` Package Reference](https://docs.xernerx.com/packages/@xernerx/commands)**.

### Classes

- [`XernerxCommands`](https://docs.xernerx.com/packages/@xernerx/commands#class-XernerxCommands) — Framework extension that registers developer commands and syncs application command bodies.
- [`CommandsClient`](https://docs.xernerx.com/packages/@xernerx/commands#class-CommandsClient) — Standalone HTTP client (`get`, `post`, `sync`, `update`, `delete`, `clear`) for the Xernerx Suite Commands API.
- [`BaseClient`](https://docs.xernerx.com/packages/@xernerx/commands#class-BaseClient) — Base HTTP client resolving production, canary, and local development Suite API URLs.
- **Built-in Command Classes**:
  - [`MainCommand`](https://docs.xernerx.com/packages/@xernerx/commands#class-MainCommand)
  - [`EvaluateCommand`](https://docs.xernerx.com/packages/@xernerx/commands#class-EvaluateCommand)
  - [`XernerxCommandsShellCommand`](https://docs.xernerx.com/packages/@xernerx/commands#class-XernerxCommandsShellCommand)
  - [`GitCommand`](https://docs.xernerx.com/packages/@xernerx/commands#class-GitCommand)
  - [`SourceCommand`](https://docs.xernerx.com/packages/@xernerx/commands#class-SourceCommand)
  - [`XernerxCommandsHasteCommand`](https://docs.xernerx.com/packages/@xernerx/commands#class-XernerxCommandsHasteCommand)
  - [`PingCommand`](https://docs.xernerx.com/packages/@xernerx/commands#class-PingCommand)
  - [`DebugCommand`](https://docs.xernerx.com/packages/@xernerx/commands#class-DebugCommand)
  - [`RepeatCommand`](https://docs.xernerx.com/packages/@xernerx/commands#class-RepeatCommand)
  - [`SudoCommand`](https://docs.xernerx.com/packages/@xernerx/commands#class-SudoCommand)
  - [`TranspileCommand`](https://docs.xernerx.com/packages/@xernerx/commands#class-TranspileCommand)
  - [`DocumentationCommand`](https://docs.xernerx.com/packages/@xernerx/commands#class-DocumentationCommand)

### Interfaces

- [`XernerxCommandsOptions`](https://docs.xernerx.com/packages/@xernerx/commands#interface-XernerxCommandsOptions)
- [`NormalizedXernerxCommandsOptions`](https://docs.xernerx.com/packages/@xernerx/commands#interface-NormalizedXernerxCommandsOptions)
- [`CommandsClientOptions`](https://docs.xernerx.com/packages/@xernerx/commands#interface-CommandsClientOptions)
- [`BaseClientOptions`](https://docs.xernerx.com/packages/@xernerx/commands#interface-BaseClientOptions)
- [`CommandRecord`](https://docs.xernerx.com/packages/@xernerx/commands#interface-CommandRecord)
- [`CommandBody`](https://docs.xernerx.com/packages/@xernerx/commands#interface-CommandBody)
- [`CommandOptionBody`](https://docs.xernerx.com/packages/@xernerx/commands#interface-CommandOptionBody)
- [`CommandsPayload`](https://docs.xernerx.com/packages/@xernerx/commands#interface-CommandsPayload)

### Functions

- [`post()`](https://docs.xernerx.com/packages/@xernerx/commands#function-post)
- [`serializeCommand()`](https://docs.xernerx.com/packages/@xernerx/commands#function-serializeCommand)
- [`extractClientCommands()`](https://docs.xernerx.com/packages/@xernerx/commands#function-extractClientCommands)
- [`embedify()`](https://docs.xernerx.com/packages/@xernerx/commands#function-embedify)
- [`reply()`](https://docs.xernerx.com/packages/@xernerx/commands#function-reply)
- [`haste()`](https://docs.xernerx.com/packages/@xernerx/commands#function-haste)
- [`shell()`](https://docs.xernerx.com/packages/@xernerx/commands#function-shell)
- [`source()`](https://docs.xernerx.com/packages/@xernerx/commands#function-source)
- [`resolveCommandSource()`](https://docs.xernerx.com/packages/@xernerx/commands#function-resolveCommandSource)

### REST API Endpoints

- [Fetch Bot Commands (`GET /v1/bots/:id/commands`)](https://docs.xernerx.com/api/v1#fetch-bot-commands)
- [Sync Bot Commands (`POST / PUT /v1/bots/:id/commands`)](https://docs.xernerx.com/api/v1#sync-bot-commands)
- [Delete Bot Commands (`DELETE /v1/bots/:id/commands`)](https://docs.xernerx.com/api/v1#delete-bot-commands)
- [API Authentication](https://docs.xernerx.com/api/v1#authentication)

## Links & Support

- [Xernerx Documentation](https://docs.xernerx.com)
- [`@xernerx/commands` Package Reference](https://docs.xernerx.com/packages/@xernerx/commands)
- [All Xernerx Packages](https://docs.xernerx.com/packages)
- [`@xernerx/framework` Documentation](https://docs.xernerx.com/packages/@xernerx/framework)
- [`@xernerx/terminal` Documentation](https://docs.xernerx.com/packages/@xernerx/terminal)
- [Release Changelog](https://info.xernerx.com/changelog#@xernerx/commands)
- [Discord Support Server](https://xernerx.com/discord)
