import fs from "node:fs/promises";
import path from "node:path";

// https://vercel.com/docs/build-output-api/v3
//
// $ npm install -g vercel
// $ docship --builder vercel --outdir output
// $ cd output && vercel deploy --prebuilt .
//
export class VercelBuildOutputBuilder {
  #vcOutputDir: string;
  #vercelJsonPath: string;

  constructor(destDir: string) {
    this.#vcOutputDir = path.join(destDir, ".vercel", "output");
    this.#vercelJsonPath = path.join(destDir, "vercel.json");
  }

  tailwindContentDir(): string {
    return this.#vcOutputDir;
  }

  async writeStaticFile(staticPath: string, body: string | Buffer) {
    const destPath = path.join(this.#vcOutputDir, "static", staticPath);
    await fs.mkdir(path.dirname(destPath), { recursive: true });
    await fs.writeFile(destPath, body);
  }

  async copyStaticFile(staticPath: string, sourcePath: string) {
    const destPath = path.join(this.#vcOutputDir, "static", staticPath);
    await fs.mkdir(path.dirname(destPath), { recursive: true });
    await fs.copyFile(sourcePath, destPath);
  }

  async finish() {
    // https://vercel.com/docs/projects/project-configuration#configuring-projects-with-vercel.json
    await fs.writeFile(
      this.#vercelJsonPath,
      JSON.stringify({
        cleanUrls: true,
      }),
    );

    // https://vercel.com/docs/build-output-api/v3/configuration#build-output-configuration
    await fs.writeFile(
      path.join(this.#vcOutputDir, "config.json"),
      JSON.stringify({
        version: 3,
      }),
    );
  }
}
