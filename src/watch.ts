import fs from "node:fs/promises";
import http from "node:http";
import type { Config } from "./config.js";
import { progress, srcDir } from "./utils.js";
import { build } from "./build.js";
import { TempDir } from "./tmpdir.js";
import path from "node:path";

export interface WatchOptions {
  inDir: string;
  outDir: string;
  builderName: string;
  config?: Config;
}

const HOT_RELOAD_SCRIPT = `
<script>
  (async () => {
    const resp = await fetch('http://localhost:9911/_reload');
    if (resp.status === 201) {
      window.location.reload();
    }
  })()
</script>
`;

export async function watch(options: WatchOptions) {
  let reloadResolvers: any[] = [];
  const triggerBuild = async () => {
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
  };

  const server = http.createServer(async (req, res) => {
    if (!req.url) {
      res.writeHead(400);
      res.end();
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname === "/_reload") {
      const promise = new Promise<void>((resolve) => {
        reloadResolvers.push(resolve);
      });

      await promise;
      res.writeHead(201);
      res.end("TRIGGERED\n");
      return;
    }

    console.log(`${req.method} ${url.pathname}`);

    let localRelPath;
    if (url.pathname === "/") {
      localRelPath = "/index.html";
    } else {
      localRelPath = url.pathname;
    }

    let localPath = path.join(options.outDir, localRelPath);
    try {
      await fs.access(localPath + ".html", fs.constants.R_OK);
      localPath += ".html";
    } catch (e) {}

    try {
      if ((await fs.stat(localPath)).isDirectory()) {
        localPath = path.join(localPath, "index.html");
      }
    } catch (e) {}

    try {
      await fs.access(localPath, fs.constants.R_OK);
    } catch (e) {
      res.writeHead(404);
      res.end();
      return;
    }

    let body;
    if (path.extname(localPath) === ".html") {
      body = await fs.readFile(localPath, "utf-8");
      res.setHeader("Content-Type", "text/html");
      body = body.replace("</body>", HOT_RELOAD_SCRIPT + "</body>");
    } else {
      body = await fs.readFile(localPath);
    }

    res.writeHead(200);
    res.end(body);
  });
  server.listen(9911, "127.0.0.1");

  await triggerBuild();
  progress("Open http://localhost:9911 to preview your site");
  progress("Watching for changes...");
  Promise.all([
    watchFiles(triggerBuild, options.inDir),
    watchFiles(triggerBuild, srcDir()),
  ]);
}

function shouldReload(filePath: string) {
  return (
    filePath.endsWith(".md") ||
    filePath.endsWith(".ts") ||
    filePath.endsWith(".css") ||
    filePath.endsWith(".jsx")
  );
}

async function watchFiles(triggerBuild: () => Promise<void>, baseDir: string) {
  for await (const ev of fs.watch(baseDir, { recursive: true })) {
    if (!ev.filename || !shouldReload(ev.filename)) {
      continue;
    }

    progress(`File changed: ${ev.filename}`);
    try {
      await triggerBuild();
    } catch (e) {
      console.error(`failed to build: ${(e as any).stack}`);
    }
  }
}
