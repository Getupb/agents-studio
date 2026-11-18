#!/usr/bin/env node
/**
 * 微信渠道管理工具：扫码登录 / 查状态 / 断开。
 *
 * 用法（项目根目录）：
 *   node studio/scripts/wechat.mjs status
 *   node studio/scripts/wechat.mjs login          # 打印二维码链接，然后每 3s 自动查状态
 *   node studio/scripts/wechat.mjs login 123456   # 服务端要配对码时带上
 *   node studio/scripts/wechat.mjs logout
 *
 * token 从 studio.log 的 URL 里读；不会打印 bot_token 明文。
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const LOG = join(ROOT, 'studio.log');
const BASE = 'http://127.0.0.1:3099/dsh-pet-7340';

/** 从 studio.log 的 `dsh web: http://127.0.0.1:3099/?token=...` 行里取 token。 */
function readToken() {
  const text = readFileSync(LOG, 'utf8');
  const found = [...text.matchAll(/token=([A-Za-z0-9_-]+)/g)].pop();
  if (found === undefined) throw new Error('studio.log 里找不到 token，请先启动 studio');
  return found[1];
}

const token = readToken();
const headers = { 'x-dsh-token': token, 'content-type': 'application/json' };

/** 调插件路由，返回 JSON。 */
async function api(path, method = 'GET') {
  const res = await fetch(BASE + path, { method, headers });
  const json = await res.json();
  if (!res.ok || (json && json.ok === false)) throw new Error(json?.message ?? `HTTP ${res.status}`);
  return json;
}

/** 把二维码 URL 转成终端可扫的链接（不依赖 qrcode-terminal，避免额外依赖）。 */
function printQr(url) {
  console.log('\n用手机微信扫描这个链接里的二维码：');
  console.log(url);
  console.log('（如果链接打不开，确认 studio 还在运行）\n');
}

const [cmd, arg] = process.argv.slice(2);

try {
  if (cmd === 'status') {
    console.log(JSON.stringify(await api('/wechat/status'), null, 2));
  } else if (cmd === 'login') {
    const started = await api('/wechat/login', 'POST');
    printQr(started.qrcodeUrl);
    console.log('等待扫码确认（每 3 秒查一次，Ctrl+C 退出）…');
    for (;;) {
      const suffix = arg === undefined || arg === '' ? '' : `?verifyCode=${encodeURIComponent(arg)}`;
      const status = await api(`/wechat/login/status${suffix}`);
      if (status.status === 'confirmed') {
        console.log('✓ 已连接微信渠道，宠物 agent 开始接收消息。');
        break;
      }
      if (status.status === 'expired' || status.status === 'none') {
        console.log('二维码已失效，请重新运行 login。');
        process.exitCode = 1;
        break;
      }
      if (status.status === 'need_verifycode') {
        console.log('微信要求配对码：请看手机上的数字，然后运行 login <配对码>。');
        break;
      }
      process.stdout.write('.');
      await new Promise((r) => setTimeout(r, 3000));
    }
  } else if (cmd === 'logout') {
    await api('/wechat/logout', 'POST');
    console.log('✓ 微信渠道已断开');
  } else {
    console.log('用法: node studio/scripts/wechat.mjs {status|login [配对码]|logout}');
    process.exitCode = 2;
  }
} catch (e) {
  console.error('失败：' + (e instanceof Error ? e.message : String(e)));
  process.exitCode = 1;
}
