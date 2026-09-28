import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const html = readFileSync(new URL("../app/index.html", import.meta.url), "utf8");
const changelog = readFileSync(new URL("../docs/CHANGELOG.md", import.meta.url), "utf8");

if (!/^\d+\.\d+\.\d+$/.test(pkg.version)) {
  throw new Error(`package.json の version が semver ではない: ${pkg.version}`);
}

const shown = html.match(/class="app-version">v([^<]+)</);
if (!shown || shown[1] !== pkg.version) {
  throw new Error(`画面の版（${shown?.[1] ?? "なし"}）と package.json（${pkg.version}）が一致しない`);
}

if (!changelog.includes(`## ${pkg.version} `)) {
  throw new Error(`CHANGELOG に ${pkg.version} の見出しがない`);
}

console.log(`ok version ${pkg.version}`);
