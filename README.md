# Docship

A simple static website generator built for your `docs` directory.

## Features

- **Zero config:** Just run `docship` in your `docs` directory. That's it.
- **No intrusive conventions:** No `src/pages` or `_posts` directories.  Put your markdown files as you like.
- **Zero client-side JavaScript:** No bloated JavaScript code in your website by default.
- **JSX-based layouts with Tailwind:** Use [JSX](https://react.dev/learn/writing-markup-with-jsx) to define your page layouts, and [Tailwind](https://tailwindcss.com/docs/utility-first) is also built-in.
- **Watch mode:** Try `docship --watch`.
- **Publish quickly:** Just run `docship && vercel deploy --prebuilt output` to deploy your website to [Vercel](https://vercel.com/products/previews).

## Why yet another static site generator?

- I just want to turn my `docs` into HTMLs in a single command, with good default config.
- I want something intutive for contributors in my projects, even for non-frontend engineers. They just need to remember `docship --watch`.
- I want to write templates in JSX + Tailwind, but without any client-side JavaScript (such as React). My websites are completely static.

## Quickstart

```
npm install -g docship
cd path/to/docs
docship
```

## Directory structure

- `docship` will look for markdown and asset files recursively in the input directory.
- Files and directories starting with `_` are ignored.
- The directory structure is preserved in the output directory. For example, `/blog/why-you-should-visit-kumamoto.md` will be output to `/blog/why-you-should-visit-kumamoto.html`.
- Layouts are defined in the `_layouts` directory. The layout for a page is determined by the `layout` field in the markdown front-matter.

```
├── favicon.ico    -- Static files are copied as-is
├── index.md       -- /index.html
├── docship.mjs    -- Configuration file (optional)
├── _layouts/      -- Layouts directory
│   ├── blog.jsx     -- Layout for "blog" pages
│   └── index.jsx    -- Layout for "index" page
└── blog/                                 -- "blog" directory
   ├── why-you-should-visit-kumamoto.md     -- A public blog post
   ├── best-cappucino-in-rome.md            -- Another post
   └── _lessons-learned-from-my-life.md     -- A draft (ignored) post
```

## Markdown front-matter

Front-matter is a block of YAML at the beginning of a file that specifies metadata about the file. For example:

```md
---
title: Best cappucino in Rome
layout: blog
date: 2024-11-30
---
```

### Fields

Fields can be any valid YAML but the following fields are used by `docship`:


| Name      | Type     | Description |
|-----------|----------|-------------|
| `layout`  | `string` | The layout name in the `_layouts` directory. Required. |
| `title`   | `string` | The title of the page. |
| `date`    | `string` | The date of the page. |

## JSX-based layouts

- Page layouts are defined in JSX files in the `_layouts` directory.
- Tailwind is built-in. You can use Tailwind classes in your JSX files.
- Functions can be `async` to fetch data from external sources. If you're familiar with Next.js, it's somewhat similar to `getStaticProps`.


```jsx
export function Blog({ meta, children }) {
  return (
    <html>
      <head>
        <title>{meta.title}</title>
      </head>
      <body>
        <header>
          <h1>{meta.title}</h1>
          <p>{meta.date}</p>
        </header>
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
```

### Parameters

| Name      | Type     | Description |
|-----------|----------|-------------|
| `meta`    | `Record<string, boolean \| number \| string \| any>` | Front-matter of the markdown file. |
| `children`| `Element` | The content of the markdown file. |
| `pages` | `Page[]` | An array of all pages. Useful for generating an index page. |

### Limitations

- React is not available. We use JSX as a templating language to generate fully static HTML files.
- Importing components is not (yet) supported. You can only use Node.js built-in modules.

## Atom feed

`docship` can generate an Atom feed for your website. To enable the feed, add the following to your `docship.mjs`:

```js
export default {
  baseUrl: "https://seiya.me",
  feedOptions: {
    title: "seiya.me",
    id: "https://seiya.me",
    link: "https://seiya.me",
    author: {
      name: "Seiya Nuta",
    }
  },
  callbacks: {
    filterFeed(page) {
      // Don't include the index page in the feed.
      return page.href != "/index";
    },
  }
}
```

The feed file will be generated at `/feed.xml`.
