import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { storageDir } from "./env";
import { HttpError } from "./http";

export type Visibility = "public" | "private";

type Kind = "image" | "video" | "pdf" | "document";

const SIGNATURES: { kind: Kind; mime: string; ext: string; test: (b: Buffer) => boolean }[] = [
  { kind: "image", mime: "image/jpeg", ext: "jpg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { kind: "image", mime: "image/png", ext: "png", test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { kind: "image", mime: "image/webp", ext: "webp", test: (b) => b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP" },
  { kind: "image", mime: "image/gif", ext: "gif", test: (b) => b.toString("ascii", 0, 4) === "GIF8" },
  { kind: "pdf", mime: "application/pdf", ext: "pdf", test: (b) => b.toString("ascii", 0, 5) === "%PDF-" },
  { kind: "video", mime: "video/mp4", ext: "mp4", test: (b) => b.toString("ascii", 4, 8) === "ftyp" },
  { kind: "video", mime: "video/webm", ext: "webm", test: (b) => b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3 },
  { kind: "document", mime: "application/zip", ext: "zip", test: (b) => b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04 },
];

export const UPLOAD_LIMITS: Record<Kind, number> = {
  image: 10 * 1024 * 1024,
  video: 300 * 1024 * 1024,
  pdf: 300 * 1024 * 1024,
  document: 500 * 1024 * 1024,
};

export function detectFile(buf: Buffer) {
  return SIGNATURES.find((s) => s.test(buf)) ?? null;
}

function resolveInside(visibility: Visibility, key: string): string {
  if (!/^[a-z0-9][a-z0-9/_.-]*$/i.test(key) || key.includes("..")) throw new HttpError(400, "Invalid file key");
  const base = path.join(storageDir(), visibility);
  const full = path.join(base, key);
  if (!full.startsWith(base + path.sep)) throw new HttpError(400, "Invalid file key");
  return full;
}

export async function saveUpload(
  file: File,
  visibility: Visibility,
  allowed: Kind[],
): Promise<{ key: string; url: string | null; mime: string; size: number; originalName: string }> {
  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length === 0) throw new HttpError(400, "Empty file");
  const sig = detectFile(buf);
  if (!sig || !allowed.includes(sig.kind)) {
    throw new HttpError(415, `Unsupported file type. Allowed: ${allowed.join(", ")}`);
  }
  if (buf.length > UPLOAD_LIMITS[sig.kind]) {
    throw new HttpError(413, `File too large (max ${Math.round(UPLOAD_LIMITS[sig.kind] / 1024 / 1024)} MB)`);
  }
  const now = new Date();
  const dir = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const key = `${dir}/${crypto.randomBytes(16).toString("hex")}.${sig.ext}`;
  const full = resolveInside(visibility, key);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, buf, { mode: 0o640 });
  const originalName = (file.name || `file.${sig.ext}`).replace(/[^\w.\- ]+/g, "_").slice(0, 200);
  return { key, url: visibility === "public" ? `/media/${key}` : null, mime: sig.mime, size: buf.length, originalName };
}

export async function statFile(visibility: Visibility, key: string) {
  const full = resolveInside(visibility, key);
  const st = await fs.stat(full).catch(() => null);
  return st && st.isFile() ? { full, size: st.size } : null;
}

export async function deleteFile(visibility: Visibility, key: string) {
  try {
    await fs.unlink(resolveInside(visibility, key));
  } catch {}
}

export function mimeFromKey(key: string): string {
  const ext = key.split(".").pop()?.toLowerCase();
  return (
    { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", mp4: "video/mp4", webm: "video/webm", pdf: "application/pdf", zip: "application/zip" }[
      ext ?? ""
    ] ?? "application/octet-stream"
  );
}

export async function storageUsage() {
  async function walk(dir: string): Promise<{ files: number; bytes: number }> {
    let files = 0;
    let bytes = 0;
    const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) {
        const r = await walk(p);
        files += r.files;
        bytes += r.bytes;
      } else if (e.isFile() && e.name !== ".gitkeep") {
        files++;
        bytes += (await fs.stat(p)).size;
      }
    }
    return { files, bytes };
  }
  const base = storageDir();
  return { dir: base, public: await walk(path.join(base, "public")), private: await walk(path.join(base, "private")) };
}
