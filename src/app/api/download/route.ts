import fs from "node:fs";
import { Readable } from "node:stream";
import { prisma } from "@/lib/db";
import { verifyDownloadSignature } from "@/lib/crypto";
import { statFile } from "@/lib/storage";
import { clientIp, jsonError } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** Signed, time-limited download of a private product file for a PAID order. */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const orderId = u.searchParams.get("o") ?? "";
  const downloadId = u.searchParams.get("d") ?? "";
  const exp = Number(u.searchParams.get("e"));
  const sig = u.searchParams.get("s") ?? "";
  try {
    rateLimit(`dl:${clientIp(req)}`, 30, 60_000);
  } catch {
    return jsonError("Too many downloads. Please wait a minute.", 429);
  }
  if (!verifyDownloadSignature(orderId, downloadId, exp, sig)) {
    return new Response("This download link has expired. Open your order page again (link in your email) to get a fresh one.", { status: 403 });
  }
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true, items: { select: { productId: true } } } });
  if (!order || order.status !== "PAID") return new Response("Not available", { status: 403 });
  const dl = await prisma.productDownload.findUnique({ where: { id: downloadId } });
  if (!dl || !order.items.some((i) => i.productId === dl.productId)) return new Response("Not found", { status: 404 });
  const file = await statFile("private", dl.storageKey);
  if (!file) return new Response("File missing — please contact support.", { status: 404 });

  await prisma.downloadLog.create({ data: { orderId, downloadId, ip: clientIp(req) } }).catch(() => {});
  const stream = Readable.toWeb(fs.createReadStream(file.full)) as ReadableStream;
  return new Response(stream, {
    headers: {
      "Content-Type": dl.mimeType,
      "Content-Length": String(file.size),
      "Content-Disposition": `attachment; filename="${dl.fileName.replace(/"/g, "")}"; filename*=UTF-8''${encodeURIComponent(dl.fileName)}`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
