import postcss from "postcss";
import tailwindcss from "tailwindcss";
import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import autoprefixer from "autoprefixer";
import { fileURLToPath } from "node:url";

export async function generateCss(tailwindContentDir: string): Promise<string> {

  let globalCss = `
    @tailwind base;
    @tailwind components;
    @tailwind utilities;
  `;

  const dirname = path.dirname(fileURLToPath(import.meta.url));
  globalCss += await fs.readFile(path.join(dirname, "default.css"), "utf-8");

	const starryNightUrl =
		"https://raw.githubusercontent.com/wooorm/starry-night/f0b488090d0a57ef67650237e96a5c87dbce6370/style/both.css";
	const starryNightPath = path.join(os.homedir(), ".cache", "docship.starry-night.css");
	let starryNightCss;
	try {
		starryNightCss = await fs.readFile(starryNightPath);
	} catch (err) {
		const resp = await fetch(starryNightUrl);
		starryNightCss = await resp.text();
		await fs.mkdir(path.dirname(starryNightPath), { recursive: true });
		await fs.writeFile(starryNightPath, starryNightCss);
	}
  globalCss += starryNightCss;

	const result = await postcss([
		tailwindcss({
			content: [path.join(tailwindContentDir, "**/*.html")],
			theme: {
				extend: {},
			},
			plugins: [],
		}),
    autoprefixer(),
	]).process(globalCss, {
		// We don't need source maps.
		from: undefined,
	});

	return result.css;
}
