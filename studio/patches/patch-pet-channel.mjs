/**
 * 一次性补丁：把 dsh-pet 的编译产物改成「微信渠道可选择内部变体预设」。
 * 源码已改，但宿主实际加载的是各处的 lib/*.js；这里把同一段 presetSetup 同步到所有副本。
 * 逻辑：channel=wechat 且 preset-settings.json 的 channels.wechat.mode=custom 时挂
 * default-wechat；变体不存在则回落到 default，避免旧配置把微信打挂。
 */
import { readFileSync, writeFileSync } from 'node:fs'

const files = [
  'studio/vendor/dsh-pet-src/dsh-pet-only/lib/standalone.js',
  'studio/vendor/dsh-pet-src/dsh-pet-only/lib/index.js',
  'studio/vendor/dsh-pet-src/dsh-pet-only/lib/app.js',
  'studio/vendor/dsh-pet-only/lib/index.js',
  'studio/vendor/dsh-pet-only/lib/app.js',
  'studio/vendor/dsh-pet-only/lib/standalone.js',
  '.dsh-home/profiles/studio/node_modules/dsh-pet-only/lib/app.js',
  '.dsh-home/profiles/studio/node_modules/dsh-pet-only/lib/index.js',
  '.dsh-home/profiles/studio/node_modules/dsh-pet-only/lib/standalone.js',
]

const oldText = `\tconst petPreset = "default";
\tconst mountPetPreset = presets === void 0 ? void 0 : (agentCtx, id) => presets.mount(agentCtx, id);
\tconst usePreset = mountPetPreset !== void 0;
\tconst presetSetup = mountPetPreset === void 0 ? void 0 : async (agentCtx) => {
\t\tawait mountPetPreset(agentCtx, petPreset);
\t};`

const newText = `\tconst petPreset = "default";
\tconst mountPetPreset = presets === void 0 ? void 0 : (agentCtx, id) => presets.mount(agentCtx, id);
\tconst usePreset = mountPetPreset !== void 0;
\tconst channelForPreset = input.channel ?? "main";
\tconst presetSetup = mountPetPreset === void 0 ? void 0 : async (agentCtx) => {
\t\tlet id = petPreset;
\t\tif (channelForPreset === "wechat") {
\t\t\ttry {
\t\t\t\tconst cfg = JSON.parse(readFileSync(join(petWorkspaceRoot(), "studio", "profile", "preset-settings.json"), "utf8"));
\t\t\t\tif (cfg.channels?.wechat?.mode === "custom") id = "default-wechat";
\t\t\t} catch {}
\t\t}
\t\ttry {
\t\t\tawait mountPetPreset(agentCtx, id);
\t\t} catch (error) {
\t\t\tif (id === petPreset) throw error;
\t\t\tdefaultLog("warn", \`[dsh-pet] 微信渠道预设 \${id} 不可用，回落到 \${petPreset}：\${String(error)}\`);
\t\t\tawait mountPetPreset(agentCtx, petPreset);
\t\t}
\t};`

for (const file of files) {
  const text = readFileSync(file, 'utf8')
  if (text.includes(newText)) {
    console.log(`skip (already patched): ${file}`)
    continue
  }
  if (!text.includes(oldText)) {
    console.log(`MISS: ${file}`)
    continue
  }
  writeFileSync(file, text.replace(oldText, newText), 'utf8')
  console.log(`patched: ${file}`)
}
