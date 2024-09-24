#!/usr/bin/env node
import path from "node:path";
import { build } from "./build.js";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import type { Config } from "./config.js";
import { watch } from "./watch.js";
import { progress } from "./utils.js";

process.on("unhandledRejection", (ev) => {
  console.warn("unhandled rejection:", ev);
});

async function main() {
  const args = yargs(hideBin(process.argv))
    .option("config", {
      describe: "the docship.mjs file",
      type: "string",
    })
    .option("indir", {
      describe: "the docs directory",
      type: "string",
      default: ".",
    })
    .option("outdir", {
      describe: "the output directory",
      type: "string",
      default: "output",
    })
    .option("builder", {
      describe: "the builder type",
      type: "string",
      choices: ["static", "vercel"],
      default: "static",
    })
    .option("watch", {
      describe: "Auto rebuild on file changes",
      type: "boolean",
      default: false,
    })
    .parseSync();

  const configPath = args.config ? path.resolve(args.config) : path.resolve(args.indir, "docship.mjs");
  progress(`Loading config from ${configPath}`);

  let mod: { default: Config } | undefined;
  try {
    mod = await import(configPath);
  } catch (e) {
    if ((e as any).code === "ERR_MODULE_NOT_FOUND") {
      console.error("Missing docship.mjs, using defaults...");
    } else {
      throw Error(`failed to require docship.mjs: ${e}`);
    }
  }

  const buildOptions = {
    inDir: args.indir,
    outDir: args.outdir,
    builderName: args.builder,
    config: mod?.default,
  };

  if (args.watch) {
    await watch(buildOptions);
  } else {
    await build({
      ...buildOptions,
    });
  }
}

main().catch(console.error);
