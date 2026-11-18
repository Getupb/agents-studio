/**
 * 停机前请桌面 Helper 优雅退出。
 *
 * stop-studio.cmd 原来直接 taskkill /T /F：Windows 上这是 TerminateProcess，
 * Electron 收不到 before-quit，托盘的 Shell_NotifyIcon 没注销，通知区就会留下「幽灵图标」。
 * 这里从 Helper 自己的日志里取最新的回调端口，POST /quit，让 Helper 先 tray.destroy() 再退出。
 *
 * 用法：node stop-helper.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// 从脚本自身位置推项目根，避免 cmd 引号/结尾反斜杠把参数吃掉。
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** 从日志尾部找最新的 bridge callback 地址；只读最近 300 行，避免大日志拖慢停机。 */
function latestCallbackUrl() {
  const files = [
    join(root, '.dsh-home', 'dsh-pet-only', 'logs.txt'),
    join(root, 'studio.log'),
  ];
  for (const file of files) {
    if (!existsSync(file)) continue;
    const tail = readFileSync(file, 'utf8').split(/\r?\n/).slice(-300).join('\n');
    const matches = [...tail.matchAll(/bridge callback: (http:\/\/127\.0\.0\.1:\d+\/respond)/g)];
    const url = matches.at(-1)?.[1];
    if (url) return url;
  }
  return undefined;
}

const callback = latestCallbackUrl();
if (callback === undefined) {
  console.log('[stop-studio] 没有找到 Helper 回调地址，跳过优雅退出');
  process.exit(0);
}

try {
  const res = await fetch(callback.replace(/\/respond$/, '/quit'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}',
    signal: AbortSignal.timeout(2000),
  });
  console.log(`[stop-studio] Helper 托盘已销毁（HTTP ${res.status}）`);
  // /quit 只销毁托盘，不退出进程：紧接着 stop-studio.cmd 会强杀宿主进程树。
  // 只留 100ms 让 Shell_NotifyIcon 的注销消息走完。
  await new Promise((resolve) => setTimeout(resolve, 100));
} catch (error) {
  console.log(`[stop-studio] Helper 优雅退出请求失败：${error instanceof Error ? error.message : String(error)}`);
}
