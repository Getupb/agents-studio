import { readFileSync } from 'node:fs'
import { zstdDecompressSync } from 'node:zlib'

const buffer = readFileSync(process.argv[2])
let offset = 0
const frames = []
while (offset < buffer.length) {
  const start = offset
  offset += 4
  const d = buffer.readUInt8(offset); offset += 1
  const fcs = d >>> 6
  const single = (d & 0x20) !== 0
  const ck = (d & 0x04) !== 0
  const df = d & 0x03
  offset += (single ? 0 : 1) + (df === 3 ? 4 : df) + (fcs === 0 ? (single ? 1 : 0) : 1 << fcs)
  for (;;) {
    const bh = buffer.readUIntLE(offset, 3); offset += 3
    const last = (bh & 1) !== 0
    const bt = (bh >>> 1) & 0x03
    const bs = bh >>> 3
    offset += bt === 1 ? 1 : bs
    if (last) break
  }
  if (ck) offset += 4
  frames.push({ start, end: offset })
}
const first = zstdDecompressSync(buffer.subarray(frames[0].start, frames[0].end)).toString('utf8')
console.log(first.slice(0, 1200))
