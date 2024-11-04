import type { FeedOptions } from "feed";
import type { Page } from "./layout.js";

export interface Config {
  website: {
    title: string;
  }
  globalCssPath?: string;
  feedOptions?: FeedOptions;
  baseUrl?: string;
  callbacks?: {
    filterFeed: (page: Page) => boolean;
  };
}
