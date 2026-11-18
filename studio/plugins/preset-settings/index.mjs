/**
 * 宿主半侧：给「设置 → Agent 预设」页提供读写默认模式配置的接口。
 *
 * 页面不直接碰文件；配置写进 studio/profile/preset-settings.json，再重跑
 * studio/patches/build-zero-preset.mjs 生成 default-preset.yml 与 preset-catalog.json。
 * 预设插件在进程启动时加载，所以保存后需要重启工作台才生效（页面提供一键重启）。
 */

import { execFile, spawn } from 'node:child_process'
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { promisify } from 'node:util'

export const name = 'studio-preset-settings'
export const inject = ['webServer']

const execFileAsync = promisify(execFile)
const PREFIX = '/studio-preset'

/** 项目根：DSH_HOME 的上一级（与 dsh-pet 的 petWorkspaceRoot 一致）。 */
function projectRoot() {
  const home = process.env.DSH_HOME
  if (typeof home === 'string' && home.trim() !== '') return resolve(home, '..')
  return process.cwd()
}

function paths() {
  const root = projectRoot()
  const profile = join(root, 'studio', 'profile')
  return {
    root,
    settings: join(profile, 'preset-settings.json'),
    catalog: join(profile, 'preset-catalog.json'),
    generator: join(root, 'studio', 'patches', 'build-zero-preset.mjs'),
    restart: join(root, 'restart-studio.cmd'),
  }
}

function readJson(file, fallback) {
  try {
    if (!existsSync(file)) return fallback
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    return fallback
  }
}

/** 读请求体（只接受 JSON）。 */
async function readBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const text = Buffer.concat(chunks).toString('utf8')
  if (text.trim() === '') return {}
  return JSON.parse(text)
}

function sendJson(res, status, obj) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  res.end(JSON.stringify(obj))
}

/** 只保留允许写入的字段，避免前端把整份 profile 覆盖掉。 */
function sanitize(input) {
  const out = {}
  if (typeof input.name === 'string') out.name = input.name.slice(0, 40)
  if (typeof input.description === 'string') out.description = input.description.slice(0, 200)
  if (typeof input.persona === 'string') out.persona = input.persona.slice(0, 20000)
  if (Array.isArray(input.disabledTools)) {
    out.disabledTools = input.disabledTools.filter((id) => typeof id === 'string').slice(0, 200)
  }
  if (input.channels && typeof input.channels === 'object') {
    const wechat = input.channels.wechat
    if (wechat && typeof wechat === 'object') {
      out.channels = {
        wechat: {
          mode: wechat.mode === 'custom' ? 'custom' : 'inherit',
          disabledTools: Array.isArray(wechat.disabledTools)
            ? wechat.disabledTools.filter((id) => typeof id === 'string').slice(0, 200)
            : [],
        },
      }
    }
  }
  return out
}

/** 保存配置并重建预设；返回重建日志。 */
async function regenerate() {
  const p = paths()
  const { stdout, stderr } = await execFileAsync(process.execPath, [p.generator], {
    cwd: join(p.root, 'dsh'),
    env: process.env,
    timeout: 120000,
    windowsHide: true,
  })
  return `${stdout}${stderr}`.trim()
}

/**
 * @param {import('@deepseek-ai/cordis').Context} ctx
 */
export function apply(ctx) {
  console.log('[studio-preset-settings] plugin loaded — 设置 → Agent 预设可配置')
  ctx.effect(() =>
    ctx.webServer.register({
      kind: 'prefix',
      path: PREFIX,
      handler: async (req, res) => {
        const p = paths()
        const rest = (req.url ?? '/').split('?')[0].slice(PREFIX.length).replace(/\/+$/, '') || '/'
        try {
          if (req.method === 'GET' && rest === '/config') {
            const settings = readJson(p.settings, {})
            const catalog = readJson(p.catalog, { entries: [], persona: settings.persona ?? '', name: '默认模式', description: '' })
            sendJson(res, 200, {
              name: settings.name ?? catalog.name ?? '默认模式',
              description: settings.description ?? catalog.description ?? '',
              persona: settings.persona ?? catalog.persona ?? '',
              entries: Array.isArray(catalog.entries) ? catalog.entries : [],
              disabledTools: Array.isArray(settings.disabledTools) ? settings.disabledTools : [],
              channels: settings.channels ?? { wechat: { mode: 'inherit', disabledTools: [] } },
              generatedAt: catalog.generatedAt ?? null,
            })
            return
          }
          if (req.method === 'POST' && rest === '/config') {
            const body = sanitize(await readBody(req))
            const current = readJson(p.settings, {})
            const next = { ...current, ...body }
            const tmp = `${p.settings}.tmp`
            writeFileSync(tmp, `${JSON.stringify(next, null, 2)}\n`, 'utf8')
            renameSync(tmp, p.settings)
            let log = ''
            try {
              log = await regenerate()
            } catch (error) {
              sendJson(res, 500, { ok: false, message: `配置已保存，但重建预设失败：${error?.message ?? error}` })
              return
            }
            sendJson(res, 200, { ok: true, restartRequired: true, log })
            return
          }
          if (req.method === 'POST' && rest === '/restart') {
            sendJson(res, 200, { ok: true, restarting: true })
            setTimeout(() => {
              try {
                const child = spawn('cmd', ['/c', p.restart], { detached: true, stdio: 'ignore', windowsHide: true })
                child.unref()
              } catch (error) {
                ctx.logger?.warn?.(`[studio-preset-settings] restart failed: ${String(error)}`)
              }
            }, 300)
            return
          }
          sendJson(res, 404, { ok: false, message: 'not found' })
        } catch (error) {
          ctx.logger?.warn?.(`[studio-preset-settings] route failed: ${String(error)}`)
          if (!res.writableEnded) sendJson(res, 500, { ok: false, message: String(error?.message ?? error) })
        }
      },
    }),
  'studio-preset-settings: config route')
}
