import inquirer from "inquirer";
import chalk from "chalk";
import { Command, Option } from "commander";
import json5 from "json5";
//import jsonPackage from '../package.json' assert { type: 'json' };
import log4js from "log4js";
import * as dotenv from "dotenv";
import { readFileSync, existsSync } from "fs";
enum CommonArg {
  log4js = "log4js",
}
interface ArgOption {
  flags: string;
  description?: string;
  default?: unknown;
}
interface CliOption {
  globalArgs?: (string | ArgOption)[];
  name?: string;
  version?: string;
  description?: string;
  author?: string;
}
interface CommandItem {
  name: string;
  default?: boolean;
  args?: (string | ArgOption)[];
}
interface CommandAction {
  name: string;
  args: Record<string, string>;
  logger: log4js.Logger;
}
const program = new Command();
const actions: Record<string, (cmd: CommandAction) => Promise<void>> = {};
const defaultInquirer = "inquirer";
const jsonPackage = existsSync("./package.json")
  ? json5.parse(readFileSync("./package.json", "utf-8"))
  : { name: "cli", version: "0.0.0" };
let cliOpts: CliOption = Object.assign(
  {},
  {
    name: jsonPackage.name,
    version: jsonPackage.version,
    description: jsonPackage.description ? jsonPackage.description : "",
    author: jsonPackage.author ? jsonPackage.author : "topabomb",
  }
);
const configureLogger = (cfgFile: string, category?: string) => {
  if (cfgFile) log4js.configure(json5.parse(readFileSync(cfgFile, "utf-8")));
  const logger = log4js.getLogger(category);
  if (logger.level == "OFF") logger.level = "debug";
  logger.info(`log4js category(${category}),file:${cfgFile}`);
  return logger;
};
const getOptionsFromEnv = (names: string[]) => {
  const options = {} as Record<string, string>;
  for (const key of names) {
    if (key !== "version") {
      if (process.env[key]) {
        options[key] = process.env[key];
      }
    }
  }
  return options;
};
const getMergeObject = (cmd: Command) => {
  //Priority: Interactive Options > Subcommand Parameters > Program Parameters > Environment Variables
  let mergeObject = Object.assign(program.opts(), cmd.opts());
  const names = [
    ...program.options.map((x) => x.name()),
    ...cmd.options.map((x) => x.name()),
  ];
  mergeObject = Object.assign(getOptionsFromEnv(names), mergeObject);
  return mergeObject;
};
const cli = {
  initialize: (cmds: CommandItem[], opts?: CliOption) => {
    if (opts) cliOpts = Object.assign(cliOpts, opts);
    program
      .name(cliOpts.name)
      .description(cliOpts.description)
      .version(cliOpts.version);
    if (!cmds.find((x) => x.name === defaultInquirer)) {
      cmds.push({ name: defaultInquirer, default: true });
    }
    for (const cmd of cmds) {
      const curr = program.command(cmd.name, {
        isDefault: cmd.default,
        hidden: cmd.name === defaultInquirer && cmd.default,
      });
      cmd.args?.forEach((x) => {
        const opt =
          typeof x === "string"
            ? new Option(x)
            : new Option(x.flags, x.description).default(x.default);
        curr.addOption(opt);
      });
    }
    console.log(
      chalk.yellowBright(
        `${cliOpts.name}(${cliOpts.version}),author is ${cliOpts.author}`
      )
    );
    console.log(chalk.greenBright(`${cliOpts.description}`));
    if (cliOpts && cliOpts.globalArgs) {
      for (const arg of cliOpts.globalArgs) {
        const opt =
          typeof arg === "string"
            ? new Option(arg)
            : new Option(arg.flags, arg.description).default(arg.default);
        program.addOption(opt);
      }
    }
    if (!program.options.find((x) => x.name() === CommonArg.log4js))
      program.option(
        `-${CommonArg.log4js[0]}, --${CommonArg.log4js} [${CommonArg.log4js}]`,
        `${CommonArg.log4js} config file`
      );
  },
  command: (name: string, act: (cmd: CommandAction) => Promise<void>) => {
    const cmd = program.commands.find((x) => x.name() === name);
    if (cmd) {
      cmd.action(async (_options, _command: Command) => {
        const mergeObject = getMergeObject(_command);
        const logger = configureLogger(mergeObject[CommonArg.log4js], name);
        logger.debug(
          `exec command(${name}),args:${JSON.stringify(mergeObject)}`
        );
        await act({ name, args: mergeObject, logger });
      });
      actions[cmd.name()] = act;
    } else
      throw chalk.red(
        `exec command(${name}) does not exist in the instance list.`
      );
  },
  run: async () => {
    const defaultCmd = program.commands.find(
      (x) =>
        x.name() === defaultInquirer &&
        x.name() === (program as any)._defaultCommandName
    );
    if (defaultCmd) {
      defaultCmd.action(async () => {
        const answers = await inquirer.prompt([
          {
            type: "list",
            name: "name",
            message: "Select command:",
            choices: program.commands
              .map((x) => x.name())
              .filter((x) => x !== "inquirer"),
          },
        ]);
        console.log(chalk.green("Prompt is:"), JSON.stringify(answers));
        if (answers.name in actions) {
          const cmd = program.commands.find((x) => x.name() == answers.name);
          if (cmd) {
            let mergeObject: Record<string, any> = {};
            const names = [
              ...program.options.map((x) => x.name()),
              ...cmd.options.map((x) => x.name()),
            ];
            for (const key of names)
              key != "version" && (mergeObject[key] = undefined);
            mergeObject = Object.assign(
              mergeObject,
              getMergeObject(
                program.commands.find((x) => x.name() === answers.name)
              )
            );
            for (const key of Object.keys(mergeObject)) {
              const { value } = await inquirer.prompt({
                type: "input",
                name: "value",
                message: `Set option(${key}) value:`,
                default: mergeObject[key],
              });
              mergeObject[key] = value;
            }
            const confirm = await inquirer.prompt({
              type: "confirm",
              name: "exec",
              message: `Confirm execute:\ncommand(${
                answers.name
              }),args:${JSON.stringify(mergeObject)}`,
              default: true,
            });
            if (confirm.exec) {
              const logger = configureLogger(
                mergeObject[CommonArg.log4js],
                answers.name
              );
              logger.debug(
                `inquirer command(${answers.name}),args:${JSON.stringify(
                  mergeObject
                )}`
              );
              await actions[answers.name]({
                name: answers.name,
                args: mergeObject,
                logger,
              });
            }
          }
        }
      });
    }
    dotenv.config();
    await program.parseAsync();
  },
};
export {
  cli,
  inquirer,
  chalk,
  program as command,
  CliOption,
  CommandItem,
  CommandAction,
};
