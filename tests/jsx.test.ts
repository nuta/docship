import { describe, it, expect } from "vitest";
import { Layout, loadLayoutFile } from "../src/layout";
import { TempDir } from "../src/tmpdir";
import { onTestFinished } from "vitest";

async function buildLayout(layout: string): Promise<Layout> {
  const tempDir = new TempDir();
  onTestFinished(() => tempDir.cleanup());

  const layoutPath = tempDir.writeFileSync("layout.jsx", layout);
  return await loadLayoutFile(layoutPath);
}

describe("JSX renderer", () => {
  it("should render JSX", async () => {
    const layout = await buildLayout(`
      export default ({ children, meta }) => (
        <html>
          <head>
            <title>{meta.title}</title>
          </head>
          <body>
            {children}
          </body>
        </html>
      )`);

    const html = await layout.render({ title: "title text", pages: [], children: "body text" });
    expect(html).toMatchInlineSnapshot(`
      "<!DOCTYPE html>
      <html><head><title>title text</title></head><body>body text</body></html>"
    `);
  });

  it.only("custom elements", async () => {
    const layout = await buildLayout(`
      const Template = ({ children }) => (
        <b>
          {children}
        </b>
      );

      export default ({ children, meta }) => (
        <Template>
          {children}
        </Template>
      )`);

    const html = await layout.render({ title: "title text", pages: [], children: "body text" });
    expect(html).toMatchInlineSnapshot(`
      "<!DOCTYPE html>
      <b>body text</b>"
    `);
  });
});
