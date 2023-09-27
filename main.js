#!/usr/bin/env node
// import pkg from "./package.json" assert { type: "json" };
import { program } from "commander";
import path from "path";
import fs from "fs-extra";
import inquirer from "inquirer";
import chalk from "chalk";
import symbols from "log-symbols";
import handlebars from "handlebars";
import url from "node:url";
import ora from "ora";
import download from "download-git-repo";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

program.command("version").action(() => {
  //   console.log(`version is ${pkg.version}`);
  console.log(`version is 1.0.7`);
});
program
  .command("create <name>")
  .description("初始化模板")
  .action(async (name) => {
    // 判断用户是否输入应用名称，如果没有设置为 myApp
    const projectName = name || "my-app";
    // 获取 template 文件夹路径
    const sourceProjectPath = __dirname + "/template/";
    // 获取命令所在文件夹路径
    // path.resolve(name) == process.cwd() + '/' + name
    const targetProjectPath = path.resolve(projectName);

    // 判断文件夹是否存在及其后续逻辑
    if (fs.existsSync(targetProjectPath)) {
      console.log(symbols.info, chalk.red(`文件夹 ${projectName} 已经存在！`));
      try {
        const { isCover } = await inquirer.prompt([
          {
            name: "isCover",
            message: "是否要覆盖当前文件夹的内容",
            type: "confirm",
          },
        ]);
        if (!isCover) {
          return;
        }
      } catch (error) {
        console.log(symbols.fail, chalk.red("项目初始化失败，已退出!"));

        return;
      }
    }
    // 创建一个空的文件夹
    fs.emptyDirSync(targetProjectPath);

    try {
      // 将模板文件夹中的内容复制到目标文件夹（目标文件夹为命令输入所在文件夹）
      const spinner = ora("开始下载...");
      spinner.start();
      const downloadUrl =
        "https://github.com/lv-saharan/wpa-template-default/archive/refs/heads/main.zip";
      download(
        `direct:${downloadUrl}`,
        targetProjectPath,

        async (err) => {
          if (err) {
            spinner.fail();
            console.log(chalk.red(`下载失败！ ${err}`));
            return;
          }
          // 结束加载图标
          spinner.succeed();
          console.log(chalk.cyan("\n 下载成功!"));

          // 获取项目的描述及作者名称等信息
          const { projectDescription, projectAuthor } = await inquirer.prompt([
            { name: "projectDescription", message: "请输入项目描述:" },
            { name: "projectAuthor", message: "请输入作者:" },
          ]);

          const meta = {
            projectAuthor,
            projectDescription,
            projectName,
          };

          // 获取拷贝后的模板项目中的 `package.json`
          const targetPackageFile = targetProjectPath + "/package.json";
          if (fs.pathExistsSync(targetPackageFile)) {
            // 读取文件，并转换成字符串模板
            const content = fs.readFileSync(targetPackageFile).toString();
            // 利用 handlebars 将需要的内容写入到模板中
            const result = handlebars.compile(content)(meta);
            fs.writeFileSync(targetPackageFile, result);

            console.log(chalk.cyan(`启动项目：`));

            console.log(chalk.cyan(`        cd ${projectName}`));
            console.log(chalk.cyan(`        npm i`));
            console.log(chalk.cyan(`        npm start`));
          } else {
            console.log("package.json 文件不存在：" + targetPackageFile);
          }
        }
      );
    } catch (err) {
      console.error(symbols.fail, chalk.red("项目初始化失败，已退出!"));
      return;
    }
  });

program.parse(process.argv);
