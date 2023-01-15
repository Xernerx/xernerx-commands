# xernerx-commands

## install

```
npm install xernerx-commands
```

## Setup

```js
import { XernerxCommands } from 'xernerx-commands';
import XernerxClient from 'xernerx';

new (class Client extends XernerxClient {
	constructor() {
		super(discordOptions, clientOptions);

		this.modules.commandHandler.loadAllMessageCommands(MessageCommandOptions);

		this.loadExtensions({
			extensions: [new XernerxCommands(this, options)],
		});

		this.login('token');
	}
})();
```

## Options

| name    | type                            | required | default | description                                                          |
| ------- | ------------------------------- | -------- | ------- | -------------------------------------------------------------------- |
| include | Array<string> \| null           | false    | null    | The commands that should be included. (will only load specified)     |
| exclude | Array<string> \| null           | false    | null    | The commands that should be excluded. (will only load not specified) |
| prefix  | Array<string> \| string \| null | false    | null    | An extra prefix just for these commands.                             |
