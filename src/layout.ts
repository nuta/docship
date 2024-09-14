import * as swc from "@swc/core";
import type { TempDir } from "./tmpdir.js";
import type { FrontMatter } from "./markdown.js";

export type Element =
  | string // "My Site" in "<title>My Site</title>"
  | { type: "html"; html: string }
  | {
      type: "jsx";
      tagName: string;
      props: Record<string, unknown> | null;
      children: (Element | Element[])[];
    };

(globalThis as any).MyJSXElement = function MyJSXElement(
  tagName: string,
  props: Record<string, unknown> | null,
  ...children: (Element | Element[])[]
): Element {
  return { type: "jsx", tagName, props, children };
};

type LayoutFn = (props: Record<string, unknown>) => unknown;

function elem2html(elem: Element | undefined): string {
  if (!elem) {
    return "";
  }

  if (typeof elem === "string") {
    return elem;
  }

  if (elem.type === "html") {
    return elem.html;
  }

  let html = `<${elem.tagName}`;
  if (elem.props) {
    for (let [key, value] of Object.entries(elem.props)) {
      const valueStr = (value as any).toString();
      if (valueStr.includes('"')) {
        throw new Error(`invalid value in HTML prop: ${valueStr}`);
      }

      switch (key) {
        case "className":
          key = "class";
          break;
      }

      html += ` ${key}="${valueStr}"`;
    }
  }
  html += ">";

  if (Array.isArray(elem.children)) {
    for (const child of elem.children) {
      if (Array.isArray(child)) {
        for (const innerChild of child) {
          html += elem2html(innerChild);
        }
      } else if (typeof child != null) {
        // console.log(child)
        html += elem2html(child);
      }
    }
  } else if (typeof elem.children != null) {
    html += elem2html(elem.children);
  }

  if (!["br", "meta"].includes(elem.tagName)) {
    html += `</${elem.tagName}>`;
  }

  return html;
}

export interface Page {
  sourcePath: string;
  href: string;
  html: string;
  meta: FrontMatter;
}

export class Layout {
  #layoutPath: string;
  #layoutFn: LayoutFn;

  constructor(layoutPath: string, layoutFn: LayoutFn) {
    this.#layoutPath = layoutPath;
    this.#layoutFn = layoutFn;
  }

  async render(
    children: Element,
    meta: FrontMatter,
    pages: Page[],
  ): Promise<string> {
    const rootElem = await this.#layoutFn({ children, meta, pages });
    if (typeof rootElem !== "object" || rootElem === null) {
      throw new Error(
        `${this.#layoutPath} returned invalid JSX element: ${rootElem}`,
      );
    }

    if (!("type" in rootElem) || rootElem.type !== "jsx") {
      throw new Error(
        `${this.#layoutPath} returned invalid JSX element: ${rootElem}`,
      );
    }

    const html = `<!DOCTYPE html>\n` + elem2html(rootElem as Element);
    return html;
  }
}

export async function loadLayoutFile(
  layoutPath: string,
  tmpDir: TempDir,
): Promise<Layout> {
  const layoutFn = await importLayoutFile(layoutPath, tmpDir);
  return new Layout(layoutPath, layoutFn);
}

async function importLayoutFile(
  layoutPath: string,
  tmpDir: TempDir,
): Promise<LayoutFn> {
  let source: any;
  try {
    source = await swc.transformFile(layoutPath, {
      filename: layoutPath,
      minify: false,
      jsc: {
        target: "es2022",
        parser: {
          syntax: "ecmascript",
          jsx: true,
        },
        transform: {
          react: {
            // Replace "React.createElement" with "MyJSXElement".
            pragma: "MyJSXElement",
          },
        },
      },
    });
  } catch (e) {
    throw new Error(`failed to transpile ${layoutPath}: ${e}`);
  }

  const transpiledPath = tmpDir.writeFileSync(
    layoutPath.replaceAll("/", ".").replace(/\.jsx$/, ".mjs"),
    source.code,
  );

  if (process.env.DEBUG === "1") {
    console.log(`Transpiled ${layoutPath} to ${transpiledPath}`);
  }

  let module: unknown;
  try {
    module = await import(transpiledPath);
  } catch (e) {
    throw new Error(`failed to import ${layoutPath}: ${e}`);
  }

  if (typeof module !== "object" || module === null) {
    throw new Error(
      `expected ${layoutPath} to be an object, got ${typeof module}`,
    );
  }

  if (!("default" in module)) {
    throw new Error(`expected ${layoutPath} to have a default export`);
  }

  if (typeof module.default !== "function") {
    throw new Error(
      `expected ${layoutPath}.default to be a function, got ${typeof module.default}`,
    );
  }

  return module.default as LayoutFn;
}
