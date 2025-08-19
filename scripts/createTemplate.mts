#!/usr/bin/env -S node --import=tsx
import inquirer from "inquirer";
import degit from "degit";
import axios from "axios";
// import { execSync } from "node:child_process";

const REPO_URL = "github.com/Ngoo-Lam-Khing/monorepo";
const GITHUB_API_URL =
  "https://api.github.com/repos/Ngoo-Lam-Khing/monorepo/contents/packages";
const BRANCH = "main";

async function getTemplates(): Promise<string[]> {
  try {
    // Fetch the contents of the packages folder using GitHub API
    const response = await axios.get(GITHUB_API_URL, {
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
    });
    const templates = response.data
      .filter((item: Record<string, string>) => item.type === "dir")
      .map((item: Record<string, string>) => item.name);
    return templates;
  } catch (error) {
    console.error("Error fetching templates:", error);
    // Fallback to default templates
    return [];
  }
}

async function main() {
  // 🔍 讀取遠端 packages 底下有哪些資料夾
  const templates = await getTemplates();

  if (templates.length === 0) {
    console.error("❌ 沒有找到任何模板資料夾");
    process.exit(1);
  }

  // 讓使用者選 template
  const { template } = await inquirer.prompt([
    {
      type: "list",
      name: "template",
      message: "請選擇要建立的模板：",
      choices: templates as string[],
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
  const emitter = degit(`${REPO_URL}/packages/${template}#${BRANCH}`, {
    cache: false,
    force: true,
  });

  try {
    console.log(`🚀 正在下載模板 ${template} ...`);
    await emitter.clone(dest);
    console.log("🎉 一切搞定！開始開發吧！");
  } catch (error) {
    console.error("Error cloning template:", error);
    process.exit(1);
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
