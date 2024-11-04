import { it } from "vitest";
import { describe } from "vitest";
import { BUILTINS } from "../src/builtins";
import { Page } from "../src/layout";
import { expect } from "vitest";

describe("docship.toc", () => {
  it("generated TOC properly", () => {
    const input: Page[] = [
      {
        sourcePath: 'example/nested/README.md',
        href: '/nested/index',
        html: '',
        meta: { title: 'nested index' }
      },
      {
        sourcePath: 'example/nested/hello.md',
        href: '/nested/hello',
        html: '',
        meta: {
          title: 'entry in nested',
        }
      },
      {
        sourcePath: 'example/top.md',
        href: '/top',
        html: '',
        meta: {
          title: 'entry in top level',
        }
      },
      {
        sourcePath: 'example/README.md',
        href: '/index',
        html: '',
        meta: {
          title: 'top level index',
        }
      },
    ];

    const toc = BUILTINS.toc(input);
    expect(toc).toMatchInlineSnapshot(`
      {
        "children": [
          {
            "children": [
              {
                "children": [],
                "href": "/nested/hello",
                "title": "entry in nested",
              },
            ],
            "href": "/nested/index",
            "title": "nested index",
          },
          {
            "children": [],
            "href": "/top",
            "title": "entry in top level",
          },
        ],
        "href": "/index",
        "title": "top level index",
      }
    `)
  })
});
