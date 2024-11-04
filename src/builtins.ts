import { Page } from "./layout.js";

export type TocEntry =
  { title: string, href?: string, children: TocEntry[] }

export interface Toc {
  entries: TocEntry[]
}

function stripIndex(href: string): string {
  return href.replace(/\/index$/, '');
}

function addPageToTree(tree: any, page: Page) {
  const parts = stripIndex(page.href).split('/').slice(1);
  let node = tree;
  for (const part of parts) {
    if (!node[part]) {
      node[part] = {};
    }
    node = node[part];
  }

  node['__page'] = page;
}

function treeIntoToc(tree: any): TocEntry {
  const children: TocEntry[] = [];
  for (const key of Object.keys(tree).sort()) {
    if (key !== '__page') {
      children.push(treeIntoToc(tree[key]));
    }
  }

  return {
    title: tree.__page ? tree.__page.meta.title : '',
    href: tree.__page ? tree.__page.href : '',
    children,
  }
}

function toc(pages: Page[]): TocEntry {
  const tree: any = {};
  for (const page of pages) {
    addPageToTree(tree, page);
  }

  const href2page: Record<string, Page> = {};
  for (const page of pages) {
    href2page[stripIndex(page.href)] = page;
  }

  return treeIntoToc(tree);
}

export const BUILTINS = {
  toc,
}
