/**
 * 移除「更多」菜单里的「意见反馈」与「登录 / 退出登录」，只保留「设置」。
 *
 * 背景：这三个菜单项由上游客户端插件 @deepseek-ai/dsh-client-ui-settings-account
 * 的 AccountMenu 组件硬编码渲染，没有配置开关；禁用整个客户端插件会连「设置」一起消失。
 * 因此这里直接改它已构建的 lib/client.js（幂等，可重复执行；首次执行会留 .bak 备份）。
 *
 * 用法：node studio/patches/strip-account-menu.mjs
 * 升级 dsh 后重新构建会覆盖该文件，届时再跑一次即可。
 */
import { existsSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const repo = resolve(here, '../../dsh')
const target = join(repo, 'packages/client/ui-settings-account/lib/client.js')

if (!existsSync(target)) {
  console.error(`[strip-account-menu] 找不到目标文件：${target}`)
  process.exit(1)
}

const original = readFileSync(target, 'utf8')

if (original.includes('/* strip-account-menu: patched */')) {
  console.log('[strip-account-menu] 已打过补丁，跳过')
  process.exit(0)
}

const start = original.indexOf('items: [')
const end = original.indexOf('onClose:', start)
if (start < 0 || end < 0) {
  console.error('[strip-account-menu] 未匹配到菜单项数组，可能上游结构已变化')
  process.exit(2)
}

const block = original.slice(start, end)
const settingsItem = block.match(/\{\s*\n\s*id: "settings",[\s\S]*?\n\s*\}/)
if (settingsItem === null) {
  console.error('[strip-account-menu] 未在菜单数组中找到 settings 项')
  process.exit(3)
}

const rebuilt = `items: [\n${settingsItem[0]}\n\t\t\t\t\t\t],\n\t\t\t\t\t\t/* strip-account-menu: patched */\n\t\t\t\t\t\t`

const patched = original.slice(0, start) + rebuilt + original.slice(end)

const backup = `${target}.bak`
if (!existsSync(backup)) {
  copyFileSync(target, backup)
  console.log(`[strip-account-menu] 已备份原始文件：${backup}`)
}

writeFileSync(target, patched, 'utf8')
console.log('[strip-account-menu] 完成：菜单只保留「设置」')
