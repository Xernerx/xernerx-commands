/** @format */

import { exec } from 'child_process';
import readline from 'readline';
import { promisify } from 'node:util';

const shell = promisify(exec);

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

rl.question('Commit message: ', (message) => {
	shell(`git commit -m "${message}"`);
	rl.close();
});
