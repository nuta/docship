import fs from "node:fs/promises";
import path from "node:path";

// https://vercel.com/docs/build-output-api/v3
export class StaticBuilder {
  #destDir: string;

  constructor(destDir: string) {
    this.#destDir = destDir;
  }

  tailwindContentDir(): string {
    return this.#destDir;
  }

  async writeStaticFile(relPath: string, body: string | Buffer) {
    const destPath = path.join(this.#destDir, relPath);
    await fs.mkdir(path.dirname(destPath), { recursive: true });
    await fs.writeFile(destPath, body);
  }

  async copyStaticFile(relPath: string, sourcePath: string) {
    const destPath = path.join(this.#destDir, relPath);
    await fs.mkdir(path.dirname(destPath), { recursive: true });
    await fs.copyFile(sourcePath, destPath);
  }

  async finish() {}
}
