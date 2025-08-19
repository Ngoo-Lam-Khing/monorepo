#!/usr/bin/env node
import inquirer from "inquirer";
import degit from "degit";
import { execSync } from "node:child_process";
import { exit } from "node:process";

const repo = "https://github.com/Ngoo-Lam-Khing/monorepo"; // 你的 GitLab repo (改掉這個)
const branch = "main"; // 預設 branch

async function getTemplates() {
  try {
    // 使用 Git 命令列出遠端儲存庫的 packages 資料夾內容
    const templates = execSync(`git ls-remote --heads ${repo} packages/*`)
      .toString()
      .split("\n")
      .filter((line) => line.includes("packages/"))
      .map((line) => line.split("packages/")[1])
      .filter((name) => name);

    return templates;
  } catch (error) {
    console.error("Error fetching templates:", error);
    return [];
  }
}

async function main() {
  // 🔍 讀取遠端 packages 底下有哪些資料夾
  const templates = await getTemplates();

  if (templates.length === 0) {
    console.error("❌ 沒有找到任何模板資料夾");
    exit(1);
  }

  // 讓使用者選 template
  const { template } = await inquirer.prompt([
    {
      type: "list",
      name: "template",
      message: "請選擇要建立的模板：",
      choices: templates,
    },
  ]);

  // 讓使用者輸入專案名稱
  const { projectName } = await inquirer.prompt([
    {
      type: "input",
      name: "projectName",
      message: "請輸入專案名稱：",
      default: "my-app",
    },
  ]);

  const dest = projectName;
  console.log(`🚀 正在下載模板 ${template} ...`);

  // 用 degit 抓對應的資料夾
  const emitter = degit(`${repo}/packages/${template}#${branch}`, {
    cache: false,
    force: true,
  });

  try {
    console.log(`🚀 正在下載模板 ${template} ...`);
    await emitter.clone(dest);
    console.log("🎉 一切搞定！開始開發吧！");
  } catch (error) {
    console.error("Error cloning template:", error);
    exit(1);
  }

  console.log(`✅ 專案建立完成：${dest}`);

  // 問要不要安裝依賴
  // const { installDeps } = await inquirer.prompt([
  //   {
  //     type: "confirm",
  //     name: "installDeps",
  //     message: "要馬上安裝依賴嗎？",
  //     default: true,
  //   },
  // ]);

  // if (installDeps) {
  //   console.log("📦 安裝依賴中...");
  //   execSync("yarn install", { cwd: dest, stdio: "inherit" });
  // }

  // console.log("🎉 一切搞定！開始開發吧！");
}

main();
