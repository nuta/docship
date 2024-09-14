import path from "node:path";
import fs from "node:fs/promises";
import { type Layout, loadLayoutFile, type Page } from "./layout.js";
import { markdown2html } from "./markdown.js";
import type { TempDir } from "./tmpdir.js";
import { progress } from "./utils.js";
import type { Builder } from "./builders/builder.js";
import { StaticBuilder } from "./builders/static.js";
import { VercelBuildOutputBuilder } from "./builders/vercel_build.js";
import { generateCss } from "./postcss.js";
import type { Config } from "./config.js";
import { generateFeed } from "./feed.js";
import { spawnSync } from "node:child_process";
import { glob } from "glob";

interface BuildOptions {
	builderName: string;
	inDir: string;
	outDir: string;
	tmpDir: TempDir;
	config?: Config;
}

export async function build(options: BuildOptions) {
	const layouts: Record<string, Layout> = {};
	const layoutsDir = path.join(options.inDir, "_layouts");
	for (const basename of await fs.readdir(layoutsDir)) {
		if (!basename.endsWith(".jsx")) {
			continue;
		}

		const layoutRelPath = path.join(layoutsDir, basename);
		progress(`Loading ${layoutRelPath}`);
		const layout = await loadLayoutFile(layoutRelPath, options.tmpDir);

		const lauoutName = path.basename(layoutRelPath, ".jsx");
		layouts[lauoutName] = layout;
	}

	await fs.rm(options.outDir, { recursive: true, force: true });

	let builder: Builder;
	switch (options.builderName) {
		case "static":
			builder = new StaticBuilder(options.outDir);
			break;
		case "vercel":
			builder = new VercelBuildOutputBuilder(options.outDir);
			break;
		default:
			throw new Error(`unknown builder type: ${options.builderName}`);
	}

	const pagesPaths = await glob(path.join(options.inDir, "**/*.md"));
	const pages: Page[] = [];
	for (const pagePath of pagesPaths) {
		if (pagePath.match(/(^|\/)_/)) {
			continue;
		}

		progress(`Rendering ${pagePath}`);
		const { html, frontMatter } = await markdown2html(pagePath);
		const destPath = path.relative(options.inDir, pagePath);
		const href = `/${destPath.replace(/\.md$/, "")}`;
		pages.push({ sourcePath: pagePath, href, meta: frontMatter, html });
	}

	for (const { href, meta, sourcePath, html } of pages) {
		if (typeof meta.layout !== "string") {
			throw new Error(
				`${sourcePath}: layout must be a string, got ${typeof meta.layout}`,
			);
		}

		if (typeof meta.layout === "undefined") {
			throw new Error(
				`${sourcePath}: layout not specified in the front matter`,
			);
		}

		const layout = layouts[meta.layout];
		if (!layout) {
			throw new Error(
				`${sourcePath}: layout not found: ${meta.layout} (available: ${Object.keys(layouts).join(", ")})`,
			);
		}

		const renderedHtml = await layout.render(
			{ type: "html", html },
			meta,
			pages,
		);

		await builder.writeStaticFile(`${href}.html`, renderedHtml);
	}

	progress("Copying static files");
	const assetPaths = await glob(
		path.join(options.inDir, "**/*.{ico,png,jpg,jpeg,svg,pdf}"),
	);
	for (const assetPath of assetPaths) {
		if (assetPath.match(/(^|\/)_/)) {
			continue;
		}

		const relPath = path.relative(options.inDir, assetPath);
		progress(`Copying ${relPath}`);
		await builder.copyStaticFile(relPath, assetPath);
	}

	progress("Generating CSS");
	const css = await generateCss(builder.tailwindContentDir());
	await builder.writeStaticFile("styles.css", css);

	if (options.config?.feedOptions) {
		progress("Generating atom.xml");
		const atom = generateFeed(options.config, pages);
    await builder.writeStaticFile("atom.xml", atom);
	}
	await builder.finish();

	progress(`Built ${pagesPaths.length} pages in "${options.outDir}"`);
	try {
		spawnSync("tree", ["-a", options.outDir], { stdio: "inherit" });
	} catch (e) {
		// Ignore errors
	}
}
