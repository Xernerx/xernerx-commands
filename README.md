# xernerx-commands

## Install

```
npm install xernerx-commands
```

ee

## Setup

```js
import { XernerxCommands } from 'xernerx-commands';
import XernerxClient from 'xernerx';

new (class Client extends XernerxClient {
    constructor() {
        super(discordOptions, clientOptions);

        this.modules.commandHandler.loadMessageCommands(messageCommandOptions);

        this.modules.extensionHandler.loadExtensions({
            extensions: [new XernerxCommands(this, options)],
        });

        this.login('token');
    }
})();
```

## Options

| Name    | Type                              | Default | Required | Description                                                          |
| ------- | --------------------------------- | ------- | -------- | -------------------------------------------------------------------- |
| include | Array\<string\> \| null           | null    | false    | The commands that should be included. (will only load specified)     |
| exclude | Array\<string\> \| null           | null    | false    | The commands that should be excluded. (will only load not specified) |
| prefix  | Array\<string\> \| string \| null | null    | false    | An extra prefix just for these commands.                             |

## Commands

| Name          | aliases  | Description                                                                  |
| ------------- | -------- | ---------------------------------------------------------------------------- |
| evaluate      | eval, ev | A command based on the Jishaku extension for discord.py.                     |
| ping          |          | A ping that will provide you with all pings.                                 |
| documentation | docs     | A command that allows you to get the documentation of Discord.js or Xernerx. |
