import { createHash } from "node:crypto";
import { existsSync, mkdirSync, renameSync, rmSync } from "node:fs";
import { join } from "node:path";

type XiaolaiManifest = {
  packageVersion: string;
  files: Record<string, { bytes: number; sha256: string }>;
};

export const createXiaolaiFontServer = async (
  resourcesDir: string,
  dataDir: string,
) => {
  const manifest = (await Bun.file(
    join(resourcesDir, "xiaolai-manifest.json"),
  ).json()) as XiaolaiManifest;
  const cacheDir = join(
    dataDir,
    "fonts",
    `excalidraw-${manifest.packageVersion}`,
    "Xiaolai",
  );
  const downloads = new Map<string, Promise<string | null>>();
  const prefix = "/fonts/Xiaolai/";
  mkdirSync(cacheDir, { recursive: true });

  const verify = async (
    path: string,
    expected: { bytes: number; sha256: string },
  ) => {
    const contents = await Bun.file(path).arrayBuffer();
    const digest = createHash("sha256")
      .update(Buffer.from(contents))
      .digest("hex");
    return contents.byteLength === expected.bytes && digest === expected.sha256;
  };

  const download = async (
    fileName: string,
    expected: { bytes: number; sha256: string },
    cachedPath: string,
  ): Promise<string | null> => {
    const source =
      `https://cdn.jsdelivr.net/npm/@excalidraw/excalidraw@${manifest.packageVersion}` +
      `/dist/prod/fonts/Xiaolai/${fileName}`;
    try {
      const response = await fetch(source, {
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) return null;
      const contents = await response.arrayBuffer();
      const digest = createHash("sha256")
        .update(Buffer.from(contents))
        .digest("hex");
      if (contents.byteLength !== expected.bytes || digest !== expected.sha256) {
        console.warn(`[fonts] Rejected invalid Xiaolai subset: ${fileName}`);
        return null;
      }
      const temporaryPath = `${cachedPath}.${process.pid}.tmp`;
      await Bun.write(temporaryPath, contents);
      renameSync(temporaryPath, cachedPath);
      return cachedPath;
    } catch (error) {
      console.warn("[fonts] Xiaolai unavailable; using system fallback", error);
      return null;
    }
  };

  return async (pathname: string): Promise<Response | null> => {
    if (!pathname.startsWith(prefix)) return null;
    const fileName = pathname.slice(prefix.length);
    const expected = manifest.files[fileName];
    if (!expected) return new Response(null, { status: 404 });

    const cachedPath = join(cacheDir, fileName);
    let pending = downloads.get(fileName);
    if (!pending) {
      pending = (async () => {
        if (existsSync(cachedPath)) {
          if (await verify(cachedPath, expected)) return cachedPath;
          rmSync(cachedPath, { force: true });
        }
        return download(fileName, expected, cachedPath);
      })().finally(() => downloads.delete(fileName));
      downloads.set(fileName, pending);
    }

    const fontPath = await pending;
    if (!fontPath) return new Response(null, { status: 404 });
    return new Response(Bun.file(fontPath), {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": "font/woff2",
      },
    });
  };
};
