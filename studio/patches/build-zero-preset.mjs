/**
 * 生成工作台唯一的「默认模式」预设（studio/profile/default-preset.yml）。
 *
 * 做法：跑一次 `dsh --profile studio --dump-config`，把官方 `preset-standard`
 * 的工具清单原样取出，改造成 id=default 的新 preset，并把 agent-preset-registry
 * 的默认值指向它；再并入 PTC 批量执行器与创造模式的插件编写工具。
 *
 * 用户在「设置 → Agent 预设」页改的内容保存在 studio/profile/preset-settings.json：
 * - persona：默认模式的人设；
 * - name / description：显示名与描述；
 * - disabledTools：关掉的工具或工具组；
 * - channels.wechat：微信渠道是否复用默认模式，以及额外关掉的工具。
 *
 * 同时写一份 studio/profile/preset-catalog.json 给设置页渲染开关（工具 id / 名称 / 启用状态）。
 *
 * 用法：node studio/patches/build-zero-preset.mjs
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '../..')
const repo = join(root, 'dsh')
const home = join(root, '.dsh-home')
const outFile = join(root, 'studio/profile/default-preset.yml')
const settingsFile = join(root, 'studio/profile/preset-settings.json')
const catalogFile = join(root, 'studio/profile/preset-catalog.json')

const bin = join(repo, 'apps/cli/lib/bin.js')
if (!existsSync(bin)) {
  console.error(`[zero] 找不到 CLI 产物：${bin}（先跑 pnpm run build）`)
  process.exit(1)
}

const settings = existsSync(settingsFile)
  ? JSON.parse(readFileSync(settingsFile, 'utf8'))
  : {}

const dump = execFileSync(process.execPath, [bin, '--profile', 'studio', '--dump-config'], {
  cwd: repo,
  encoding: 'utf8',
  env: { ...process.env, DSH_HOME: home },
  maxBuffer: 32 * 1024 * 1024,
})

const lines = dump.split('\n')
const start = lines.findIndex((l) => l === '- id: preset-standard')
if (start < 0) {
  console.error('[zero] dump 中没有 preset-standard，上游结构可能已变化')
  process.exit(2)
}
let end = lines.findIndex((l, i) => i > start && /^- id: /.test(l))
if (end < 0) end = lines.length
while (end > start && lines[end - 1].trim() === '') end -= 1

const block = lines.slice(start, end)
block[0] = '- id: preset-default'

// 上游把 preset-standard 停用后，dump 里会带上该 preset 自己的 `disabled: true`；
// 复制时必须去掉，否则我们生成的唯一预设也会被禁用、注册表为空。
for (let i = block.length - 1; i >= 0; i -= 1) {
  if (block[i] === '  disabled: true') block.splice(i, 1)
}

/** 默认人设：没在设置页保存过时使用。 */
const DEFAULT_PERSONA = [
  '你是工作台的主智能体，运行在 {{model}} 上。',
  '你跨项目、跨会话工作：每次开工先读全局约定与记忆索引（$DSH_HOME/AGENTS.md',
  '里写了位置和用法），再决定从哪一步开始；做完把结论写回记忆。',
  '用户用「许愿」的方式提需求——只说要什么结果，不给实现步骤。你的工作循环是：',
  '复述愿望与验收标准 -> 列 3-6 步计划 -> 逐步执行、每步用工具验证 -> 交付可运行的结果。',
  '需要并行或专门能力时派 subagent（可为它指定 provider 与 model）。',
  '不确定时只问一个最关键的问题，不要连着追问。',
]
const personaText = typeof settings.persona === 'string' && settings.persona.trim() !== ''
  ? settings.persona.trim()
  : DEFAULT_PERSONA.join('\n')
const persona = personaText.split('\n').map((line) => `            ${line}`)

let replaced = false
for (let i = 0; i < block.length; i += 1) {
  if (/^\s+prefix: .*\{\{model\}\}/.test(block[i])) {
    block.splice(i, 1, '          prefix: >-', ...persona)
    replaced = true
    break
  }
}
if (!replaced) {
  console.error('[default] 没有找到 persona prefix 行，未生成文件')
  process.exit(3)
}

// 最大工具能力：把 PTC 的批量执行器与创造模式的插件编写工具也并进这一个 preset。
const maxTools = [
  '      - id: tool-executor-ptc',
  "        name: '@deepseek-ai/dsh-tool-executor-ptc'",
  '      - id: tool-cordis',
  "        name: '@deepseek-ai/dsh-tool-cordis'",
]
const presentAt = block.findIndex((line) => line.trim() === '- id: present')
if (presentAt < 0) {
  console.error('[default] 没有找到 present 行，无法并入额外工具')
  process.exit(4)
}
if (process.env.STUDIO_PRESET_MAX_TOOLS !== '0') block.splice(presentAt, 0, ...maxTools)

// 把 standard 改成 default：id 字段、展示名称、排序
const displayName = typeof settings.name === 'string' && settings.name.trim() !== '' ? settings.name : '默认模式'
const displayDescription = typeof settings.description === 'string' && settings.description.trim() !== ''
  ? settings.description
  : '跨项目、跨会话，可派 subagent；面向许愿式编程。'
const out = []
for (const line of block) {
  if (line === '    id: standard') {
    out.push('    id: default')
    out.push(`    name: '${displayName.replaceAll("'", "''")}'`)
    out.push(`    description: ${displayDescription}`)
    continue
  }
  if (line === '    order: 1') {
    out.push('    order: 0')
    continue
  }
  out.push(line)
}

const indented = out.map((l) => (l === '' ? '' : `    ${l}`))

// 取出 config.plugins 下的顶层条目：每条从 `          - id: <id>` 开始，到下一个同级条目或列表结束。
function parseEntries(allLines) {
  const anchors = []
  for (let i = 0; i < allLines.length; i += 1) {
    if (/^          - id: \S+$/.test(allLines[i])) anchors.push(i)
  }
  const entries = []
  for (let k = 0; k < anchors.length; k += 1) {
    const from = anchors[k]
    const next = anchors[k + 1]
    let to = next === undefined ? allLines.length : next
    if (next === undefined) {
      for (let j = from + 1; j < allLines.length; j += 1) {
        const text = allLines[j]
        if (text.trim() !== '' && /^ {0,8}\S/.test(text)) { to = j; break }
      }
    }
    const blockLines = allLines.slice(from, to)
    while (blockLines.length > 0 && blockLines[blockLines.length - 1].trim() === '') blockLines.pop()
    const id = allLines[from].trim().replace(/^- id: /, '')
    const nameLine = blockLines.find((l) => /^            name:/.test(l))
    const name = nameLine === undefined ? '' : nameLine.trim().replace(/^name: ['"]?/, '').replace(/['"]?$/, '')
    entries.push({ id, name, from, to, block: blockLines })
  }
  return entries
}

const disabled = new Set(Array.isArray(settings.disabledTools) ? settings.disabledTools : [])
const entries = parseEntries(indented)
const presentIds = new Set(entries.map((entry) => entry.id))

/** 把条目按启用集合重建整份 YAML 行。 */
function rebuild(allLines, entriesToKeep) {
  const removed = new Set()
  for (const entry of entries) {
    if (!entriesToKeep.has(entry.id)) {
      for (let i = entry.from; i < entry.to; i += 1) removed.add(i)
    }
  }
  return allLines.filter((_, index) => !removed.has(index))
}

// 目录文件：给设置页渲染，记录上游全部顶层条目（含被关掉的）。
writeFileSync(catalogFile, `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  persona: personaText,
  name: displayName,
  description: displayDescription,
  entries: entries.map((entry) => ({
    id: entry.id, name: entry.name, enabled: !disabled.has(entry.id),
  })),
}, null, 2)}\n`, 'utf8')

let definitions = rebuild(indented, presentIds)

const footer = [
  '',
  '# 新会话默认用这个 preset；其余 preset 仍可在界面里切换。',
  '- id: agent-preset-registry',
  '  config:',
  '    default: default',
  '',
]

// 微信渠道自定义：只在明确选择 custom 时生成内部变体（不在设置页列出，只能由微信渠道挂载）。
const wechat = settings.channels?.wechat
let wechatDefinition = null
if (wechat?.mode === 'custom') {
  const extra = new Set(Array.isArray(wechat.disabledTools) ? wechat.disabledTools : [])
  const keep = new Set([...presentIds].filter((id) => !disabled.has(id) && !extra.has(id)))
  const variantEntries = parseEntries(indented)
  const variant = rebuild(indented, keep)
    .map((line) => {
      if (line === '    - id: preset-default') return '    - id: preset-default-wechat'
      if (line === '        id: default') return '        id: default-wechat'
      if (line === `        name: '${displayName}'`) return `        name: '${displayName}（微信渠道）'`
      if (line === '        order: 0') return '        order: 90'
      if (line === `        description: ${displayDescription}`) {
        return `        description: ${displayDescription}（微信渠道内部变体）`
      }
      return line
    })
  wechatDefinition = variant
}

const header = [
  '# 由 studio/patches/build-zero-preset.mjs 生成，请勿手改；改脚本后重跑。',
  '# 内容 = 官方 preset-standard 的工具清单 + 工作台主智能体的人设与默认路由。',
  '',
  '- insert:',
]

const body = wechatDefinition === null
  ? [...header, ...definitions, ...footer]
  : [...header, ...definitions, ...wechatDefinition, ...footer]

mkdirSync(dirname(outFile), { recursive: true })
writeFileSync(outFile, body.join('\n'), 'utf8')
console.log(`[default] 已生成 ${outFile}（${body.length} 行，工具 ${presentIds.size} 项${wechatDefinition === null ? '' : '，另含微信渠道内部变体'}）`)
