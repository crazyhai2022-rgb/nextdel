import fs from "node:fs";
import { Readable } from "node:stream";
import { mimeFromKey, statFile } from "@/lib/storage";

/** Serves PUBLIC uploads (thumbnails, banners, gallery, preview videos) with HTTP Range support. */
export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const key = path.join("/");
  let file: Awaited<ReturnType<typeof statFile>>;
  try {
    file = await statFile("public", key);
  } catch {
    return new Response("Not found", { status: 404 });
  }
  if (!file) return new Response("Not found", { status: 404 });
  const type = mimeFromKey(key);
  const base = { "Content-Type": type, "Cache-Control": "public, max-age=31536000, immutable", "Accept-Ranges": "bytes", "X-Content-Type-Options": "nosniff" };

  const range = req.headers.get("range");
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    if (m) {
      const start = m[1] ? parseInt(m[1], 10) : Math.max(0, file.size - parseInt(m[2], 10));
      const end = m[1] && m[2] ? Math.min(parseInt(m[2], 10), file.size - 1) : file.size - 1;
      if (start >= file.size || start > end) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${file.size}` } });
      const stream = Readable.toWeb(fs.createReadStream(file.full, { start, end })) as ReadableStream;
      return new Response(stream, { status: 206, headers: { ...base, "Content-Range": `bytes ${start}-${end}/${file.size}`, "Content-Length": String(end - start + 1) } });
    }
  }
  const stream = Readable.toWeb(fs.createReadStream(file.full)) as ReadableStream;
  return new Response(stream, { headers: { ...base, "Content-Length": String(file.size) } });
}
