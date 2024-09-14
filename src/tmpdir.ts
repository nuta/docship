import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export class TempDir {
  path: string;

  constructor() {
    this.path = fs.mkdtempSync(path.join(os.tmpdir(), "docship-"));

    if (process.env.DEBUG !== "1") {
      process.on("exit", () => {
        this.cleanup();
      });
    }
  }

  writeFileSync(filename: string, data: string): string {
    if (path.isAbsolute(filename)) {
      throw new Error(`filename must be relative, got ${filename}`);
    }

    if (filename.includes("..")) {
      throw new Error(`filename must not contain "..", got ${filename}`);
    }

    const destPath = path.join(this.path, filename);
    const destDir = path.dirname(destPath);

    fs.mkdirSync(destDir, { recursive: true });
    fs.writeFileSync(destPath, data);
    return destPath;
  }

  cleanup() {
    fs.rmSync(this.path, { recursive: true });
  }
}

export function prepareTempDir(): TempDir {
  return new TempDir();
}
