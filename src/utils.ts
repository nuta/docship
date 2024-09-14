import path from "path";
import { fileURLToPath } from "url";
import { format, styleText } from "util";

export function progress(...args: any[]) {
  console.log(
    styleText(["blue", "bold"], "==>"),
    styleText(["bold"], format(...args)),
  );
}

export function srcDir(): string {
  return path.dirname(fileURLToPath(import.meta.url));
}
