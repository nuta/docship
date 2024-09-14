import { type Root } from 'hast';
import { visit } from 'unist-util-visit';

const LANG_WITH_TITLE = /^(?<lang>language-[a-z_0-9-]+):(?<title>.+)$/;

export function rehypeCodeTitles(): (tree: Root) => void {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (parent?.type !== 'element' || index === undefined) {
        return;
      }

      // Is this a code block?
      if (node.tagName !== 'code' || parent.tagName !== 'pre') {
        return;
      }

      const classNames = node.properties?.className as string[] | undefined;
      if (!classNames || !classNames.length) {
        return;
      }

      // Does it have a language class?
      const m = classNames[0].match(LANG_WITH_TITLE);
      if (!m) {
        return;
      }

      const otherClassNames = classNames.filter((className) => className != m[0]);
      node.properties = { className: [...otherClassNames, m.groups?.lang!] }

      parent.children.splice(index, 0, {
        type: 'element',
        tagName: 'div',
        properties: {
          className: ['code-block-title'],
        },
        children: [
          {
            type: 'text',
            value: m.groups?.title!,
          },
        ],
      });
    })
  }
}
