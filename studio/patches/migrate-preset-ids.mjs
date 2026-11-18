/**
 * 把会话文件里记录的旧 preset id 统一迁到 default（逐帧版本）。
 *
 * 会话日志是「多个 zstd 帧拼接」的容器：header 一帧，之后每批事件一帧。
 * 因此不能把整个文件当成一帧解压/重压，必须按帧扫描后逐帧处理再拼回去。
 *
 * 用法：node studio/patches/migrate-preset-ids.mjs [项目根]
 * 行为：逐帧解压 -> 替换 agentPreset 旧 id -> 逐帧重压（带 checksum）-> 拼接；
 *       原文件先备份为 .bak-presetids。
 */
import { readdirSync, statSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { constants, zstdCompressSync, zstdDecompressSync } from 'node:zlib'

const MAGIC = 0xFD2FB528
const OLD = ['pet', 'zero', 'standard', 'ptc', 'minimal', 'cordis']
const ROOT = process.argv[2] ?? join(import.meta.dirname, '..', '..')
const SESSIONS = join(ROOT, '.dsh-home', 'sessions')

/** 扫描拼接 zstd 容器里的完整帧边界。 */
function scanFrames(buffer) {
  const frames = []
  let offset = 0
  while (offset < buffer.length) {
    const start = offset
    if (buffer.length - offset < 4 || buffer.readUInt32LE(offset) !== MAGIC) {
      throw new Error(`invalid frame magic at byte ${offset}`)
    }
    offset += 4
    const descriptor = buffer.readUInt8(offset)
    offset += 1
    const contentSizeFlag = descriptor >>> 6
    const singleSegment = (descriptor & 0x20) !== 0
    const checksum = (descriptor & 0x04) !== 0
    const dictionaryFlag = descriptor & 0x03
    const dictionaryBytes = dictionaryFlag === 3 ? 4 : dictionaryFlag
    const contentSizeBytes = contentSizeFlag === 0
      ? (singleSegment ? 1 : 0)
      : 1 << contentSizeFlag
    offset += (singleSegment ? 0 : 1) + dictionaryBytes + contentSizeBytes
    for (;;) {
      const blockHeader = buffer.readUIntLE(offset, 3)
      offset += 3
      const lastBlock = (blockHeader & 1) !== 0
      const blockType = (blockHeader >>> 1) & 0x03
      const blockSize = blockHeader >>> 3
      const payloadBytes = blockType === 0x01 ? 1 : blockSize
      offset += payloadBytes
      if (lastBlock) break
    }
    if (checksum) offset += 4
    frames.push({ start, end: offset })
  }
  return frames
}

/** 递归收集会话文件。 */
function walk(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    const stat = statSync(path)
    if (stat.isDirectory()) out.push(...walk(path))
    else if (name === 'session.v4.jsonl.zstd') out.push(path)
  }
  return out
}

if (!existsSync(SESSIONS)) {
  console.error(`找不到会话目录：${SESSIONS}`)
  process.exit(1)
}

let files = 0
let changedFiles = 0
let changedFrames = 0
for (const file of walk(SESSIONS)) {
  const raw = readFileSync(file)
  const frames = scanFrames(raw)
  const rebuilt = []
  let touched = false
  for (const frame of frames) {
    const plain = zstdDecompressSync(raw.subarray(frame.start, frame.end)).toString('utf8')
    let next = plain
    for (const id of OLD) {
      next = next.replaceAll(`"agentPreset":"${id}"`, '"agentPreset":"default"')
      next = next.replaceAll(`"agentPreset": "${id}"`, '"agentPreset": "default"')
    }
    if (next !== plain) {
      touched = true
      changedFrames += 1
      rebuilt.push(zstdCompressSync(Buffer.from(next, 'utf8'), {
        params: { [constants.ZSTD_c_checksumFlag]: 1 },
      }))
    } else {
      rebuilt.push(raw.subarray(frame.start, frame.end))
    }
  }
  files += 1
  if (!touched) continue
  writeFileSync(`${file}.bak-presetids`, raw)
  writeFileSync(file, Buffer.concat(rebuilt))
  changedFiles += 1
  console.log(`已迁移 ${file}`)
}

console.log(`扫描 ${files} 个会话文件，改写 ${changedFiles} 个（${changedFrames} 帧）`)
