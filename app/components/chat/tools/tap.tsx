import { InputRule, mergeAttributes, Node } from "@tiptap/core";

export const MathBlock = Node.create({
  name: "mathBlock",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      latex: {
        default: "",
      },
    };
  },
  parseHTML() {
    return [{ tag: "math-block" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["math-block", mergeAttributes(HTMLAttributes)];
  },

  addInputRules() {
    return [
      new InputRule({
        find: /\$\$([^$]+)\$\$/,
        handler: ({ range, match, commands }) => {
          const latex = match[1].trim();
          if (!latex) return;
          commands.deleteRange(range);
          commands.insertContent({
            type: "mathBlock",
            attrs: { latex },
          });
        },
      }),
    ];
  },
});
