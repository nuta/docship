import rehypeStringify from "rehype-stringify";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import fs from "node:fs/promises";
import { matter } from "vfile-matter";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeCodeTitles from "rehype-code-titles";
import rehypeStarryNight from "rehype-starry-night";
import rehypeSlug from "rehype-slug";

export type FrontMatter = Record<string, string | boolean | number>;

export interface Generated {
  html: string;
  frontMatter: FrontMatter;
}

export async function markdown2html(mdPath: string): Promise<Generated> {
  const mdText = await fs.readFile(mdPath, "utf-8");
  const processed = await unified()
    .use(remarkParse)
    .use(remarkFrontmatter)
    .use(() => {
      // Parse the YAML in the front matter.
      return (tree, file) => {
        matter(file);
      };
    })
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeCodeTitles)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, {
      behavior: "wrap",
      properties: {
        className: ["anchor"],
      },
    })
    .use(rehypeStarryNight)
    .use(rehypeStringify)
    .process(mdText);

  if (!processed.data.matter) {
    throw new Error(`${mdPath}: front matter not found`);
  }

  const calloutRegex =
    /<blockquote>\n*<p>\[!(?<type>(Note|Warning|Important|Tip))\]<\/p>/gi;
  let html = processed.toString();
  for (const match of html.matchAll(calloutRegex)) {
    const type = match.groups?.type;
    const callout = `<blockquote class="callout callout-${type!.toLowerCase()}">`;
    html = html.replace(match[0], callout);
  }

  return {
    html,
    frontMatter: processed.data.matter as FrontMatter,
  };
}
