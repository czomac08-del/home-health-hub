/**
 * Lightweight EXIF date extractor for JPEG files.
 * Reads only DateTimeOriginal (tag 0x9003) from APP1/Exif segment.
 * Returns ISO string or null. No external deps.
 */
export async function extractExifDate(file: File): Promise<string | null> {
  if (!file.type.startsWith("image/jpeg") && !file.type.startsWith("image/jpg")) return null;
  try {
    const buf = await file.arrayBuffer();
    const view = new DataView(buf);
    if (view.getUint16(0) !== 0xffd8) return null; // not JPEG

    let offset = 2;
    const len = view.byteLength;
    while (offset < len) {
      if (view.getUint8(offset) !== 0xff) return null;
      const marker = view.getUint8(offset + 1);
      const segLen = view.getUint16(offset + 2);
      if (marker === 0xe1) {
        // APP1 — Exif
        const exifStart = offset + 4;
        // "Exif\0\0"
        if (view.getUint32(exifStart) !== 0x45786966) return null;
        const tiff = exifStart + 6;
        const little = view.getUint16(tiff) === 0x4949;
        const get16 = (o: number) => view.getUint16(o, little);
        const get32 = (o: number) => view.getUint32(o, little);
        const ifd0 = tiff + get32(tiff + 4);
        const numEntries = get16(ifd0);
        for (let i = 0; i < numEntries; i++) {
          const entry = ifd0 + 2 + i * 12;
          const tag = get16(entry);
          // 0x8769 = ExifIFDPointer — follow it
          if (tag === 0x8769) {
            const exifIfd = tiff + get32(entry + 8);
            const n2 = get16(exifIfd);
            for (let j = 0; j < n2; j++) {
              const e2 = exifIfd + 2 + j * 12;
              const t2 = get16(e2);
              if (t2 === 0x9003) {
                // DateTimeOriginal (ASCII, 20 bytes incl null)
                const valOffset = tiff + get32(e2 + 8);
                let str = "";
                for (let k = 0; k < 19; k++) {
                  const c = view.getUint8(valOffset + k);
                  if (c === 0) break;
                  str += String.fromCharCode(c);
                }
                // Format: "YYYY:MM:DD HH:MM:SS"
                const m = str.match(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
                if (m) {
                  return new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}`).toISOString();
                }
                return null;
              }
            }
          }
        }
        return null;
      }
      offset += 2 + segLen;
    }
    return null;
  } catch {
    return null;
  }
}

/** True when EXIF date and claimed date are within 24h. */
export function exifMatchesClaim(exifIso: string | null, claimedDate: string): boolean {
  if (!exifIso) return false;
  const exif = new Date(exifIso).getTime();
  const claim = new Date(claimedDate).getTime();
  return Math.abs(exif - claim) <= 24 * 60 * 60 * 1000;
}