<!-- @format -->

# @xernerx/commands

## 0.2.8

### Patch Changes

- Pass `userId`, `title`, `language`, and optional `token` metadata from `embedify` and `reply` to `haste()` so `haste.xernerx.com` receives the required registered user ID and structured paste payload.

## 0.2.7

### Patch Changes

- Added in-house pastebin url

## 0.2.6

### Patch Changes

- Extend `ExtensionBuilder` from `@xernerx/extension-builder@^0.1.0` in `XernerxCommands`.

## 0.2.5

### Patch Changes

- Simplify `CommandsClient` and `XernerxCommands` API methods to direct keywords (`get`, `post`, `sync`, `update`, `delete`, `clear`), add class-based `this.*` JSDoc `@example` blocks using `Terminal`, and update `README.md` with the official Xernerx banner, structured sections, and `docs.xernerx.com` reference links.

## 0.2.4

### Patch Changes

- Support leading bot mentions (`@Bot xc!`, `@Bot xc! <command>`) when `MessageContent` intent is disabled or when mentioning the bot, and ensure reliable command & alias dispatch alongside `@xernerx/framework`.

## 0.2.3

### Patch Changes

- Expand Jishaku (`jsk`)-inspired developer commands (`git`, `source`/`src`, `debug`/`dbg`, `repeat`, `su`/`sudo`/`in`, `cat`/`tree` aliases on `haste`, `rtt` alias on `ping`, `_` last-result variable and sub-modes in `evaluate`, and process memory/PID summary in `xc!`).

## 0.2.2

### Patch Changes

- Migrate `@xernerx/commands` to `@xernerx/framework` and `@xernerx/terminal`, standardize named exports and TypeDoc configuration, and add `CommandsClient` and `post` for syncing Discord bot command bodies to the Xernerx Suite API.

## 0.2.1

### Patch Changes

- Migrate `@xernerx/commands` to `@xernerx/framework`, `@xernerx/terminal`, pnpm, tsup, TypeDoc, and Changesets, and add `CommandsClient` and `post` for syncing Discord bot commands to `/v1/bots/:id/commands` on the Xernerx Suite API.
