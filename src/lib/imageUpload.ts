import heic2any from "heic2any";

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB

export class ImageTooLargeError extends Error {
  constructor(public sizeBytes: number) {
    super(
      `Photo is ${(sizeBytes / 1024 / 1024).toFixed(1)}MB. Please use a photo under 10MB — try lowering your camera resolution or take a new photo.`
    );
    this.name = "ImageTooLargeError";
  }
}

/**
 * Normalize a user-selected image File:
 *  - Convert HEIC/HEIF to JPEG (iOS gallery uploads)
 *  - Reject files over MAX_IMAGE_BYTES
 */
export async function normalizeImageFile(file: File): Promise<File> {
  let out = file;
  const isHeic =
    /heic|heif/i.test(file.type) ||
    /\.(heic|heif)$/i.test(file.name);

  if (isHeic) {
    try {
      const blob = (await heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: 0.9,
      })) as Blob;
      const newName = file.name.replace(/\.(heic|heif)$/i, ".jpg") || "photo.jpg";
      out = new File([blob], newName, { type: "image/jpeg" });
    } catch (e) {
      console.error("HEIC conversion failed:", e);
      throw new Error("This iPhone HEIC photo couldn't be converted. Please use a JPEG or PNG instead.");
    }
  }

  if (out.size > MAX_IMAGE_BYTES) {
    throw new ImageTooLargeError(out.size);
  }

  return out;
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = (ev) => resolve(ev.target?.result as string);
    r.onerror = () => reject(r.error || new Error("Failed to read file"));
    r.readAsDataURL(file);
  });
}