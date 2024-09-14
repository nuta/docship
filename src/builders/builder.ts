export interface Builder {
  tailwindContentDir: () => string;
  writeStaticFile: (staticPath: string, body: string | Buffer) => Promise<void>;
  copyStaticFile: (staticPath: string, sourcePath: string) => Promise<void>;
  finish: () => Promise<void>;
}
