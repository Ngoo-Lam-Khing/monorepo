#!/usr/bin/env -vS node --import=tsx

import * as childProcess from "node:child_process";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { promisify } from "node:util";

const execFile = promisify(childProcess.execFile);

const homeOrTempDir = os.tmpdir() || os.homedir();
const tempDirectory = path.join(homeOrTempDir, "remote-templates");

// ---------------------- GitHub Repo 配置 ----------------------
const GITHUB_REPO = "username/repo"; // 改成你的 repo
const BRANCH = "main"; // branch

// ---------------------- 模板列表 ----------------------
type TemplateConfig = {
  command: string;
  args: string[];
};

const templates: Record<string, TemplateConfig> = {
  "test-template": {
    command: "npx",
    args: [
      "-y",
      "tiged@rc",
      "-Dv",
      `https://github.com/${GITHUB_REPO}/packages/test-template#${BRANCH}`,
      "example",
    ],
  },
};

// ---------------------- 工具函式 ----------------------
async function runCLI({ command, args }: TemplateConfig, cwd: string) {
  console.log(`執行: ${command} ${args.join(" ")} in ${cwd}`);
  const { stdout, stderr } = await execFile(command, args, {
    cwd,
    shell: true,
  });
  console.log(stdout.trim());
  if (stderr) console.error(stderr.trim());
}

async function createTempDir(templateName: string) {
  const dir = path.join(tempDirectory, templateName);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

// ---------------------- 主流程 ----------------------
async function main() {
  const args = process.argv.slice(2);
  if (!args.length) {
    console.log("請提供模板名稱，例如: vite-template-redux");
    console.log("可用模板:", Object.keys(templates).join(", "));
    process.exit(1);
  }

  for (const templateName of args) {
    const template = templates[templateName];
    if (!template) {
      console.error(`模板 ${templateName} 不存在`);
      continue;
    }

    const dir = await createTempDir(templateName);
    await runCLI(template, dir);

    // 安裝依賴
    const projectDir = path.join(dir, "example");
    await runCLI({ command: "yarn", args: ["install"] }, projectDir);

    console.log(`模板 ${templateName} 初始化完成: ${projectDir}`);
  }
}

await main();
