/**
 * Entry point for `@xernerx/commands`, exporting the framework extension, standalone API client,
 * built-in developer message commands, and helper utilities.
 *
 * @module @xernerx/commands
 * @format
 */

import { BaseClient, BaseClientOptions } from './client/BaseClient.js';
import { CommandsClient, CommandsClientOptions, CommandRecord } from './client/CommandsClient.js';
import { XernerxCommands, XernerxCommandsOptions, NormalizedXernerxCommandsOptions, CommandName } from './client/XernerxCommands.js';
import { post, serializeCommand, extractClientCommands, CommandBody, CommandOptionBody, CommandInput, CommandsPayload } from './functions/post.js';
import { DocumentationCommand } from './commands/documentation.js';
import { DebugCommand } from './commands/debug.js';
import { EvaluateCommand } from './commands/evaluate.js';
import { GitCommand } from './commands/git.js';
import { XernerxCommandsHasteCommand } from './commands/haste.js';
import { MainCommand, XC_VERSION as version } from './commands/main.js';
import { PingCommand } from './commands/ping.js';
import { RepeatCommand } from './commands/repeat.js';
import { XernerxCommandsShellCommand } from './commands/shell.js';
import { SourceCommand } from './commands/source.js';
import { SudoCommand } from './commands/sudo.js';
import { TranspileCommand } from './commands/transpile.js';
import { embedify } from './models/embedify.js';
import { haste, HasteOptions } from './models/haste.js';
import { reply } from './models/reply.js';
import { shell } from './models/shell.js';
import { source, resolveCommandSource } from './models/source.js';

export {
	XernerxCommands,
	CommandsClient,
	BaseClient,
	post,
	serializeCommand,
	extractClientCommands,
	DocumentationCommand,
	DebugCommand,
	EvaluateCommand,
	GitCommand,
	XernerxCommandsHasteCommand,
	MainCommand,
	PingCommand,
	RepeatCommand,
	XernerxCommandsShellCommand,
	SourceCommand,
	SudoCommand,
	TranspileCommand,
	embedify,
	haste,
	reply,
	shell,
	source,
	resolveCommandSource,
	version,
};

export type {
	XernerxCommandsOptions,
	NormalizedXernerxCommandsOptions,
	CommandName,
	CommandsClientOptions,
	CommandRecord,
	BaseClientOptions,
	CommandBody,
	CommandOptionBody,
	CommandInput,
	CommandsPayload,
	HasteOptions,
};
