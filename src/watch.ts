import type { Config } from "./config.js";
import { progress } from "./utils.js";
import { build } from "./build.js";
import { createServer } from "vite";
import fs from "fs/promises";

export interface WatchOptions {
  inDir: string;
  outDir: string;
  builderName: string;
  config?: Config;
}

export async function watch(options: WatchOptions) {
  let reloadResolvers: any[] = [];
  const triggerBuild = async () => {
    try {
      await build({
        inDir: options.inDir,
        outDir: options.outDir,
        builderName: options.builderName,
        config: options.config,
      });

      for (const resolve of reloadResolvers) {
        resolve();
      }
      reloadResolvers = [];
    } catch (e) {
      console.error(`failed to build: ${(e as any).stack}`);
    }
  };

  await triggerBuild();
  watchFiles(triggerBuild, options.inDir, options.outDir).catch(console.error);

  const previewServer = await createServer({
    configFile: false,
    root: options.outDir,
    server: {
      port: 1337,
    },
  });
  await previewServer.listen();

  progress("started preview server");
  previewServer.printUrls();
  previewServer.bindCLIShortcuts({ print: true });
}

function shouldReload(filePath: string) {
  return (
    filePath.endsWith(".md") ||
    filePath.endsWith(".ts") ||
    filePath.endsWith(".css") ||
    filePath.endsWith(".jsx")
  );
}

async function watchFiles(
  triggerBuild: () => Promise<void>,
  inDir: string,
  outDir: string,
) {
  for await (const ev of fs.watch(inDir, { recursive: true })) {
    if (
      !ev.filename ||
      !shouldReload(ev.filename) ||
      ev.filename.startsWith(outDir)
    ) {
      continue;
    }

    progress(`File changed: ${ev.filename}`);
    await triggerBuild();
  }
}
