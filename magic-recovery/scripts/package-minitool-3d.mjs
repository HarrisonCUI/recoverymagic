#!/usr/bin/env node
import {
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "dist", "minitool");
const assetsDir = path.join(output, "assets");
const publicModels = path.join(root, "public", "models");
const chunkBytes = 72 * 1024;
const chunksPerFile = 14;

mkdirSync(assetsDir, { recursive: true });

const generated = readdirSync(assetsDir);
const generatedJs = generated.filter((name) => /^index-.*\.js$/.test(name));
const generatedCss = generated.filter((name) => /^index-.*\.css$/.test(name));
if (generatedJs.length !== 1 || generatedCss.length !== 1) {
  throw new Error("Expected one Vite JS bundle and one CSS bundle");
}

renameSync(path.join(assetsDir, generatedJs[0]), path.join(assetsDir, "app.js"));
renameSync(path.join(assetsDir, generatedCss[0]), path.join(assetsDir, "style.css"));

const tableInit = "window.__MAGIC_3D__=window.__MAGIC_3D__||{};";
const legsMeta = JSON.parse(readFileSync(path.join(publicModels, "legs.json"), "utf8"));
const massageHand = JSON.parse(readFileSync(path.join(publicModels, "massage-hand.json"), "utf8"));
const hand = JSON.parse(readFileSync(path.join(publicModels, "hand.json"), "utf8"));
writeFileSync(
  path.join(assetsDir, "model-meta.js"),
  `${tableInit}window.__MAGIC_3D__.legsMeta=${JSON.stringify(legsMeta)};window.__MAGIC_3D__.hand=${JSON.stringify(hand)};window.__MAGIC_3D__.massageHand=${JSON.stringify(massageHand)};\n`,
);

function writeBinaryAsset(key, source, prefix) {
  const data = readFileSync(source);
  const chunks = [];
  for (let offset = 0; offset < data.length; offset += chunkBytes) {
    chunks.push(data.subarray(offset, Math.min(data.length, offset + chunkBytes)).toString("base64"));
  }
  const files = [];
  for (let offset = 0; offset < chunks.length; offset += chunksPerFile) {
    const index = String(files.length + 1).padStart(2, "0");
    const file = `${prefix}-${index}.js`;
    const values = chunks.slice(offset, offset + chunksPerFile).map(JSON.stringify).join(",");
    writeFileSync(
      path.join(assetsDir, file),
      `${tableInit}window.__MAGIC_3D__.${key}=window.__MAGIC_3D__.${key}||[];window.__MAGIC_3D__.${key}.push(${values});\n`,
    );
    files.push(file);
  }
  return files;
}

const dataScripts = ["model-meta.js"];
dataScripts.push(...writeBinaryAsset("legsBuffer", path.join(publicModels, "legs.bin"), "model-legs"));
dataScripts.push(...writeBinaryAsset("rigBuffer", path.join(publicModels, "rigged", "atlas-recovery.glb"), "model-rig"));

const guard = `(function(){
window.__magicOfflineFetch=function(){return Promise.reject(new Error("小工具离线包禁止网络请求"));};
function flexGap(){var f=document.createElement("div");f.style.position="absolute";f.style.visibility="hidden";f.style.display="flex";f.style.flexDirection="column";f.style.rowGap="1px";f.appendChild(document.createElement("div"));f.appendChild(document.createElement("div"));document.body.appendChild(f);var ok=f.scrollHeight===1;f.parentNode.removeChild(f);return ok;}
document.documentElement.classList.add(flexGap()?"supports-flex-gap":"no-flex-gap");
}());\n`;
writeFileSync(path.join(assetsDir, "offline-guard.js"), guard);

const appPath = path.join(assetsDir, "app.js");
let app = readFileSync(appPath, "utf8");
app = app.replace(/\bfetch\s*\(/g, "window.__magicOfflineFetch(");
writeFileSync(appPath, app);

const stylePath = path.join(assetsDir, "style.css");
let style = readFileSync(stylePath, "utf8");
style += "\nhtml.no-flex-gap .share-actions>*+*,html.no-flex-gap .journal-export-actions>*+*,html.no-flex-gap .duration-picker>*+*,html.no-flex-gap .session-settings>*+*,html.no-flex-gap .guided-duration>*+*{margin-left:8px}\n";
writeFileSync(stylePath, style);

const htmlPath = path.join(output, "index.html");
let html = readFileSync(htmlPath, "utf8");
html = html.replace(
  /content="width=device-width, initial-scale=1\.0"/,
  'content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"',
);
html = html.replace(/<link rel="stylesheet" crossorigin href="\.\/assets\/[^"]+\.css">/, '<link rel="stylesheet" href="./assets/style.css">');
const scripts = ["offline-guard.js", ...dataScripts, "app.js"]
  .map((name) => `<script defer src="./assets/${name}"></script>`)
  .join("\n  ");
html = html.replace(/<script type="module" crossorigin src="\.\/assets\/[^"]+\.js"><\/script>/, scripts);
writeFileSync(htmlPath, html);

console.log(`Prepared full 3D mini-tool build with ${dataScripts.length} packed model scripts.`);
