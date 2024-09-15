import { describe, it, expect } from "vitest";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { rehypeCodeTitles } from "../src/rehype-plugins/code-titles.js";

async function md2html(md: string): Promise<string> {
  const processed = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeCodeTitles)
    .use(rehypeStringify)
    .process(md);

  return processed.toString();
}

describe("rehype-code-titles", () => {
  it("should add titles to code blocks", async () => {
    const md = [
      "# Example",
      "",
      "```rust:example.rs",
      "fn main() {",
      '  println!("Hello, world!");',
      "}",
      "```",
    ].join("\n");

    const html = await md2html(md);

    expect(html).toMatchInlineSnapshot(`
      "<h1>Example</h1>
      <pre><div class="code-block-title">example.rs</div><code class="language-rust">fn main() {
        println!("Hello, world!");
      }
      </code></pre>"
    `);
  });
});
