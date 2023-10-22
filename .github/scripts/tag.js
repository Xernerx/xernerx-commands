/** @format */

import { exec } from 'child_process';

import { promisify } from 'node:util';
import pkg from '../../package.json' assert { type: 'json' };

const shell = promisify(exec);

shell(`git tag ${pkg.version}`);
