#!/usr/bin/env node
import inquirer from "inquirer";
import degit from "degit";
import { execSync } from "node:child_process";

const repo = "https://github.com/Ngoo-Lam-Khing/monorepo"; // 你的 GitLab repo (改掉這個)
const branch = "main"; // 預設 branch

async function getTemplates() {
  // ⚠️ 如果是 GitHub: https://api.github.com/repos/<user>/<repo>/contents/packages
  // ⚠️ 如果是 GitLab，要用 raw API: https://gitlab.com/api/v4/projects/:id/repository/tree?path=packages
  // 這邊我先示範 GitHub 的寫法
  const res = await fetch(
    `https://api.github.com/repos/Ngoo-Lam-Khing/monorepo/contents/packages?ref=${branch}`,
  );
  const data = await res.json();

  if (!Array.isArray(data)) {
    throw new Error(
      "無法讀取 templates，請確認 repo 是否公開或 API token 設定正確。",
    );
  }

  return data.filter((item) => item.type === "dir").map((item) => item.name);
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

  await emitter.clone(dest);

  console.log(`✅ 專案建立完成：${dest}`);

  // 問要不要安裝依賴
  const { installDeps } = await inquirer.prompt([
    {
      type: "confirm",
      name: "installDeps",
      message: "要馬上安裝依賴嗎？",
      default: true,
    },
  ]);

  if (installDeps) {
    console.log("📦 安裝依賴中...");
    execSync("yarn install", { cwd: dest, stdio: "inherit" });
  }

  console.log("🎉 一切搞定！開始開發吧！");
}

main();
