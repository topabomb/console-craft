# console-craft

([english](readme.MD)/[简体中文](readme_cn.MD))

简化控制台程序开发，标准化程序参数和日志输出，支持用户交互或者命令行参数方式来启动程序和子命令。

## 介绍

- 支持多个子命令

- 全局参数及子命令参数

- 程序参数可以从环境变量、命令行中获取

- 内置 dotenv 处理，程序参数亦可从 dotenv 中获取

- 参数来源优先级：交互输入>命令行参数>环境变量>dotenv

- 可以通过用户交互来选择子命令和参数

- 可以通过命令行参数来直接启动子命令

- 内置了 log4js 库，通过参数来设置 log 的格式

- 内置了 commander、inquirer、chalk，用于丰富程序的交互及外观

## 演示

- 代码样例，[GitHub - topabomb/console-craft-example](https://github.com/topabomb/console-craft-example)

  > 该程序包括 serve 及 test 两个子命令，serve 中启动一个 http 服务端程序，test 直接调用 mocha 的本地测试。

```typescript
import { execa } from "execa";
import { cli } from "console-craft";
import { service } from "./serve";
const commands = [
  { name: "serve", args: [{ flags: "-p, --port <port>", default: 3000 }] },
  { name: "test", args: ["-r, --round <round>"] },
];
cli.initialize(commands, {
  globalArgs: [
    { flags: "-c, --config <config>", description: "config file" },
    "-log,  --log-level",
  ],
  author: "topabomb(hualei.hb@gmail.com)",
  description: "node console app.",
});
cli.command("serve", async ({ name, args, logger }) => {
  const port = Number(args["port"]);
  await service.start(port);
  logger.level = args["log-level"] ? args["log-level"] : "debug";
  logger.info(`${name} listening : http://localhost:${args["port"]}`);
});
cli.command("test", async ({ name, args, logger }) => {
  await service.start(3000);
  const round = args["round"] ? Number(args["round"]) : 1;
  for (let i = 0; i < round; i++)
    await execa("npm", ["run", "test"]).pipeStdout(process.stdout);
  await service.close();
  logger.log("test complete.");
});
void cli.run();
```

- 交互模式截图

  - serve

  ![](./assets/readme_cn/2023-10-18-11-43-08-1697600584883.png)

  - test

  ![](./assets/readme_cn/2023-10-18-11-44-08-image.png)

- 命令行参数模式截图

  - serve

  ![](./assets/readme_cn/2023-10-18-11-45-14-image.png)

  - test

    ![](./assets/readme_cn/2023-10-18-11-46-24-image.png)

## 安装

```shell
npm install console-craft
```

## 使用说明

### cli

- initialize

  ```typescript
  cli.initialize(commands, {
    globalArgs: [
      { flags: "-c, --config <config>", description: "config file" },
      "-log,  --log-level",
    ],
    author: "topabomb(hualei.hb@gmail.com)",
    description: "node console app.",
  });
  ```

  flags format:

  ```
  -short, --long <name>
  -short, --long [name]
  -short, --long
  -short
  --long
  ```

- command

  ```typescript
  cli.command("serve", async (cmd) => {
    const port = Number(cmd.args["port"]);
    await service.start(port);
    cmd.logger.info(
      `${cmd.name} listening : http://localhost:${cmd.args["port"]}`
    );
  });
  ```

- run

  ```typescript
  void cli.run();
  ```

### inquirer

[GitHub - SBoudrias/Inquirer.js: A collection of common interactive command line user interfaces.](https://github.com/SBoudrias/Inquirer.js)

### chalk

[GitHub - chalk/chalk: 🖍 Terminal string styling done right](https://github.com/chalk/chalk/)

### logger

https://log4js-node.github.io/log4js-node/
