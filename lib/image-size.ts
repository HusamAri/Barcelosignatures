/** Reads width/height from GIF, PNG, JPEG and WebP headers without any native dependency. */
export interface ImageInfo {
  width: number;
  height: number;
  mime: "image/gif" | "image/png" | "image/jpeg" | "image/webp";
}

export function readImageInfo(buf: Uint8Array): ImageInfo | null {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const ascii = (start: number, len: number) => String.fromCharCode(...buf.subarray(start, start + len));

  // GIF87a / GIF89a: little-endian 16-bit width/height at offset 6.
  if (buf.length >= 10 && ascii(0, 3) === "GIF") {
    return { width: view.getUint16(6, true), height: view.getUint16(8, true), mime: "image/gif" };
  }
  // PNG: IHDR chunk, big-endian 32-bit width/height at offset 16.
  if (buf.length >= 24 && buf[0] === 0x89 && ascii(1, 3) === "PNG") {
    return { width: view.getUint32(16), height: view.getUint32(20), mime: "image/png" };
  }
  // WebP (VP8 / VP8L / VP8X).
  if (buf.length >= 30 && ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") {
    const chunk = ascii(12, 4);
    if (chunk === "VP8 ") return { width: view.getUint16(26, true) & 0x3fff, height: view.getUint16(28, true) & 0x3fff, mime: "image/webp" };
    if (chunk === "VP8L") {
      const b0 = buf[21]!, b1 = buf[22]!, b2 = buf[23]!, b3 = buf[24]!;
      return { width: 1 + (((b1 & 0x3f) << 8) | b0), height: 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)), mime: "image/webp" };
    }
    if (chunk === "VP8X") {
      const w = 1 + (buf[24]! | (buf[25]! << 8) | (buf[26]! << 16));
      const h = 1 + (buf[27]! | (buf[28]! << 8) | (buf[29]! << 16));
      return { width: w, height: h, mime: "image/webp" };
    }
  }
  // JPEG: walk segments until a SOFn marker.
  if (buf.length >= 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let off = 2;
    while (off + 9 < buf.length) {
      if (buf[off] !== 0xff) { off++; continue; }
      const marker = buf[off + 1]!;
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { off += 2; continue; }
      const len = view.getUint16(off + 2);
      const isSOF = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
      if (isSOF) return { height: view.getUint16(off + 5), width: view.getUint16(off + 7), mime: "image/jpeg" };
      off += 2 + len;
    }
  }
  return null;
}
