import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'

function crc32(buf) {
  let c
  const table = crc32.table ?? (crc32.table = (() => {
    const t = new Uint32Array(256)
    for (let n = 0; n < 256; n++) {
      c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      t[n] = c
    }
    return t
  })())
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function makeIcon(size) {
  const bg = hexToRgb('#0f172a')
  const fg = hexToRgb('#22c55e')
  const cx = size / 2
  const cy = size / 2
  const radius = size * 0.34

  const raw = Buffer.alloc((size * 4 + 1) * size)
  let pos = 0
  for (let y = 0; y < size; y++) {
    raw[pos++] = 0 // filter type: none
    for (let x = 0; x < size; x++) {
      const dx = x - cx
      const dy = y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      let r, g, b, a = 255
      if (dist < radius) {
        // draw a simple upward-trending arrow/bars motif using thresholds
        const barW = size * 0.09
        const gap = size * 0.05
        const baseY = cy + radius * 0.55
        const bars = [
          { x: cx - 1.5 * barW - gap, h: radius * 0.5 },
          { x: cx - 0.5 * barW, h: radius * 0.9 },
          { x: cx + 0.5 * barW + gap, h: radius * 1.3 },
        ]
        let isBar = false
        for (const bar of bars) {
          if (x >= bar.x && x <= bar.x + barW && y <= baseY && y >= baseY - bar.h) {
            isBar = true
            break
          }
        }
        if (isBar) {
          ;[r, g, b] = fg
        } else {
          ;[r, g, b] = bg
        }
      } else {
        ;[r, g, b] = bg
      }
      raw[pos++] = r
      raw[pos++] = g
      raw[pos++] = b
      raw[pos++] = a
    }
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const idat = deflateSync(raw)
  const png = Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
  return png
}

writeFileSync(new URL('../public/pwa-192x192.png', import.meta.url), makeIcon(192))
writeFileSync(new URL('../public/pwa-512x512.png', import.meta.url), makeIcon(512))
writeFileSync(new URL('../public/apple-touch-icon.png', import.meta.url), makeIcon(180))
console.log('Icons generated.')
