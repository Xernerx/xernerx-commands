<!-- @format -->

# @xernerx/commands

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
