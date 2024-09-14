import { Feed } from "feed";
import type { Page } from "./layout.js";
import type { Config } from "./config.js";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function parseDate(page: Page): Date {
  if (typeof page.meta.date !== "string") {
    throw new Error(
      `${page.sourcePath}: Missing "date" field in the front matter`,
    );
  }

  if (!page.meta.date.match(DATE_REGEX)) {
    throw new Error(
      `${page.sourcePath}: Invalid "date" value - must be YYYY-MM-DD`,
    );
  }

  return new Date(page.meta.date);
}

export function generateFeed(
  config: Config | undefined,
  allPages: Page[],
): string {
  const filterFeed = config?.callbacks?.filterFeed;
  if (!filterFeed) {
    throw new Error(
      `Invalid docship.config.js: "callbacks.filterFeed" is required to generate feed`,
    );
  }

  const feed = new Feed(config?.feedOptions as any);
  const pages = allPages.filter(filterFeed);

  const sortedPages = pages.sort((a, b) => {
    const dateA = parseDate(a);
    const dateB = parseDate(b);

    return dateA.getTime() - dateB.getTime();
  });

  if (!config?.baseUrl) {
    throw new Error(
      `Invalid docship.config.js: "baseUrl" is required to generate feed`,
    );
  }

  for (const page of sortedPages) {
    const date = parseDate(page);
    const title = page.meta.title;
    const link = `${config.baseUrl}${page.href}`;

    if (typeof title !== "string") {
      throw new Error(`${page.sourcePath}: Missing "title" field`);
    }

    console.log(`${title} - ${link}`);
    feed.addItem({
      title,
      link,
      date,
    });
  }

  return feed.atom1();
}
