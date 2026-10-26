/** @format */

import { BaseClient, BaseClientOptions } from './client/BaseClient.js';
import { CommandsClient, CommandsClientOptions, CommandRecord } from './client/CommandsClient.js';
import { XernerxCommands, XernerxCommandsOptions, NormalizedXernerxCommandsOptions, CommandName } from './client/XernerxCommands.js';
import { post, serializeCommand, extractClientCommands, CommandBody, CommandOptionBody, CommandInput, CommandsPayload } from './functions/post.js';
import { DocumentationCommand } from './commands/documentation.js';
import { EvaluateCommand } from './commands/evaluate.js';
import { XernerxCommandsHasteCommand } from './commands/haste.js';
import { MainCommand, XC_VERSION as version } from './commands/main.js';
import { PingCommand } from './commands/ping.js';
import { XernerxCommandsShellCommand } from './commands/shell.js';
import { TranspileCommand } from './commands/transpile.js';
import { embedify } from './models/embedify.js';
import { haste } from './models/haste.js';
import { reply } from './models/reply.js';
import { shell } from './models/shell.js';
import { source } from './models/source.js';

export {
	XernerxCommands,
	CommandsClient,
	BaseClient,
	post,
	serializeCommand,
	extractClientCommands,
	DocumentationCommand,
	EvaluateCommand,
	XernerxCommandsHasteCommand,
	MainCommand,
	PingCommand,
	XernerxCommandsShellCommand,
	TranspileCommand,
	embedify,
	haste,
	reply,
	shell,
	source,
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
};
