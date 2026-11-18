/**
 * dsh-pet 会话复用补丁（0.4.7）
 *
 * 背景：工作台页面可能已经打开 `session-pet-main-v10` / `session-pet-wechat-v1`，
 * 客户端会持有这间会话的写句柄；dsh-pet 再 create/resume 就会报
 * `SessionAlreadyOwnedError`，微信回合直接失败。
 *
 * 处理：openPetAgent 先查 ctx.agents.get(sessionId)；已有活 agent 就直接复用，
 * 不再申请第二个写句柄。首次/二次打开失败后也再查一次，覆盖并发打开的情况。
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

const oldHead = `async function openPetAgent(input) {
\tconst { agents, agentOptions, presetSetup, petCwd, petPreset, resumeFirst, sessionId, usePreset } = input;
\tconst meta = usePreset ? {`

const newHead = `async function openPetAgent(input) {
\tconst { agents, agentOptions, presetSetup, petCwd, petPreset, resumeFirst, sessionId, usePreset } = input;
\tconst existing = typeof agents.get === "function" ? agents.get(sessionId) : void 0;
\tif (existing !== void 0) {
\t\tdefaultLog("info", \`[dsh-pet] 复用已打开的会话 \${sessionId}\`);
\t\treturn { agent: existing };
\t}
\tconst meta = usePreset ? {`

const oldHeadApp = `async function openPetAgent(input) {
\tconst { agents, agentOptions, presetSetup, petCwd, petPreset, resumeFirst, sessionId, usePreset } = input;
\tconst meta$2 = usePreset ? {`

const newHeadApp = `async function openPetAgent(input) {
\tconst { agents, agentOptions, presetSetup, petCwd, petPreset, resumeFirst, sessionId, usePreset } = input;
\tconst existing = typeof agents.get === "function" ? agents.get(sessionId) : void 0;
\tif (existing !== void 0) {
\t\tdefaultLog("info", \`[dsh-pet] 复用已打开的会话 \${sessionId}\`);
\t\treturn { agent: existing };
\t}
\tconst meta$2 = usePreset ? {`

const oldCatch = `\ttry {
\t\treturn await first();
\t} catch (e) {
\t\tdefaultLog("warn", \`[dsh-pet] 对话会话打开失败（\${resumeFirst ? "resume" : "create"}）：\${msgOf(e)}，改用另一条路径\`);
\t\ttry {
\t\t\treturn await second();
\t\t} catch (e2) {
\t\t\tdefaultLog("warn", \`[dsh-pet] 对话会话两条路径都失败：\${msgOf(e2)}；本轮回落原生单轮（无工具、不写会话记录）\`);
\t\t\tthrow e2;
\t\t}
\t}`

const oldDispose = `async function disposeHandle(handle) {
\tif (handle === void 0) return;
\tconst list = liveHandles();
\tconst index = list.findIndex((item) => item.handle === handle);
\tif (index >= 0) list.splice(index, 1);
\tif (typeof handle.dispose !== "function") return;
\ttry {
\t\tawait handle.dispose();
\t} catch {}
}`

const newDispose = `async function disposeHandle(handle) {
\tif (handle === void 0) return;
\tconst list = liveHandles();
\tconst index = list.findIndex((item) => item.handle === handle);
\tif (typeof handle.dispose !== "function") {
\t\tif (index >= 0) list.splice(index, 1);
\t\treturn;
\t}
\ttry {
\t\tawait handle.dispose();
\t\tif (index >= 0) list.splice(index, 1);
\t} catch {}
}`

const newCatch = `\ttry {
\t\treturn await first();
\t} catch (e) {
\t\tdefaultLog("warn", \`[dsh-pet] 对话会话打开失败（\${resumeFirst ? "resume" : "create"}）：\${msgOf(e)}，改用另一条路径\`);
\t\tconst afterFirst = typeof agents.get === "function" ? agents.get(sessionId) : void 0;
\t\tif (afterFirst !== void 0) {
\t\t\tdefaultLog("info", \`[dsh-pet] 复用已打开的会话 \${sessionId}\`);
\t\t\treturn { agent: afterFirst };
\t\t}
\t\ttry {
\t\t\treturn await second();
\t\t} catch (e2) {
\t\t\tconst afterSecond = typeof agents.get === "function" ? agents.get(sessionId) : void 0;
\t\t\tif (afterSecond !== void 0) {
\t\t\t\tdefaultLog("info", \`[dsh-pet] 复用已打开的会话 \${sessionId}\`);
\t\t\t\treturn { agent: afterSecond };
\t\t\t}
\t\t\tdefaultLog("warn", \`[dsh-pet] 对话会话两条路径都失败：\${msgOf(e2)}；本轮回落原生单轮（无工具、不写会话记录）\`);
\t\t\tthrow e2;
\t\t}
\t}`

for (const file of files) {
  let text = readFileSync(file, 'utf8')
  let changed = false

  const head = text.includes(newHead) || text.includes(newHeadApp)
    ? undefined
    : text.includes(oldHead)
      ? { old: oldHead, next: newHead }
      : text.includes(oldHeadApp)
        ? { old: oldHeadApp, next: newHeadApp }
        : undefined

  if (head !== undefined && text.includes(oldCatch)) {
    text = text.replace(head.old, head.next).replace(oldCatch, newCatch)
    changed = true
  } else if (!text.includes(newCatch)) {
    console.log(`MISS (open): ${file}`)
  }

  if (!text.includes(newDispose)) {
    if (text.includes(oldDispose)) {
      text = text.replace(oldDispose, newDispose)
      changed = true
    } else {
      console.log(`MISS (dispose): ${file}`)
    }
  }

  if (changed) {
    writeFileSync(file, text, 'utf8')
    console.log(`patched: ${file}`)
  } else {
    console.log(`skip (already patched): ${file}`)
  }
}
