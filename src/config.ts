import type { FeedOptions } from "feed";
import { Builder } from "./builders/builder.js";
import type { Page } from "./layout.js";

export interface Config {
	feedOptions?: FeedOptions;
	baseUrl?: string;
	callbacks?: {
		filterFeed: (page: Page) => boolean;
	};
}
