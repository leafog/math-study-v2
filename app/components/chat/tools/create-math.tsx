import {
  BlockNoteSchema,
  createExtension,
  insertOrUpdateBlockForSlashMenu,
} from "@blocknote/core";
import {
  createReactBlockSpec,
  getDefaultReactSlashMenuItems,
  useCreateBlockNote,
  type DefaultReactSuggestionItem,
} from "@blocknote/react";
import { Highlighter } from "lucide-react";
import { MathfieldElement } from "mathlive";
import { useEffect, useRef } from "react";
import { createReactInlineContentSpec } from "@blocknote/react";

import { useBoolean } from "usehooks-ts";
import { useClickAway } from "@uidotdev/usehooks";

import { cn } from "~/lib/utils";
import { withRef } from "~/lib/ref-utils";
import "./math-live.css";
import { Button } from "~/components/ui/button";
import { useTheme } from "next-themes";

MathfieldElement.fontsDirectory = "/fonts";

const customMLStyle = `
                /* 默认（没有 placeholder 时）应用 margin: auto */
                .ML__latex {
                  margin: auto !important;
                }

                /* 当 .ML__content 内存在 .ML__content-placeholder 时，取消 margin: auto */
                .ML__content:has(.ML__content-placeholder) .ML__latex:first-of-type  {
                  margin: 0 !important;
                }
                .ML__content:has(.ML__content-placeholder) .ML__content-placeholder {
                  margin: auto !important;
                }
                .ML__content.ML__focused .ML__latex:first-of-type  {
                   margin: auto !important;
                }
                .ML__content.ML__focused .ML__content-placeholder {
                   margin: 0 !important;
                   display:none !important; 
                }
                .ML__content::focus{
                 margin: auto !important;
                }
 
              `;
const applyStyle = (el: MathfieldElement) => {
  if (!el?.shadowRoot) {
    return;
  }
  if (el.shadowRoot.querySelector("#custom-style")) {
    return;
  }
  const style = document.createElement("style");

  style.id = "custom-style";
  style.textContent = customMLStyle;
  el.shadowRoot.appendChild(style);
};
export const createInline = createReactInlineContentSpec(
  {
    type: "math-inline",
    content: "none",
    propSchema: {
      latex: { type: "string", default: "" },
    },
  },
  {
    render: (props) => {
      const mathRef = useRef<MathfieldElement & EventTarget>(null);
      const { value, setFalse, setTrue } = useBoolean(true);
      const { theme } = useTheme();

      const noLatex = props.inlineContent.props.latex.length === 0;
      useEffect(() => {
        if (noLatex) {
          withRef(mathRef, (it) => {
            it.focus();
          });
        }
      }, [noLatex, mathRef]);
      return (
        <div
          className={cn("inline-flex items-center", noLatex ? "border-2 " : "")}
          onClickCapture={() => {
            setFalse();
          }}
          onFocusCapture={() => {
            setFalse();
          }}
          onBlurCapture={() => {
            setTrue();
            // mathLive 虚拟键盘打开时不删除（失焦可能是临时操作）
            if (noLatex && !(window as any).mathVirtualKeyboard?.visible) {
              props.editor._tiptapEditor.commands.command(({ tr, state }) => {
                const { from } = tr.selection;
                const $pos = state.doc.resolve(from);
                const node = $pos.nodeBefore ?? $pos.nodeAfter;
                if (node?.type.name === "math-inline") {
                  const start = $pos.nodeBefore ? from - node.nodeSize : from;
                  tr.delete(start, start + node.nodeSize);
                  return true;
                }
                return false;
              });
            }
          }}
        >
          <math-field
            className={cn("w-fit min-w-10")}
            style={
              {
                display: "inline",
                backgroundColor: "var(--bn-colors-editor-background)",
                colorScheme: theme === "dark" ? "dark" : "light",
              } as any
            }
            ref={(el) => {
              if (el === null) {
                return;
              }
              props.contentRef(el);
              mathRef.current = el;
              applyStyle(el);
            }}
            aria-multiline
            virtual-keyboard-mode="onfocus"
            read-only={value}

            onInput={(e) => {
              const value = (e.target as any).value;
              props.updateInlineContent({
                props: { latex: value },
                type: "math-inline",
              });
            }}
          >
            {props.inlineContent.props.latex}
          </math-field>
        </div>
      );
    },
    // 复制到外部时输出纯文本 LaTeX，确保粘贴板内容包含公式
    toExternalHTML: (props) => {
      return <span>{`$$ ${props.inlineContent.props.latex} $$`}</span>;
    },
  },
);

export const createMath = createReactBlockSpec(
  {
    type: "math",
    content: "none",
    propSchema: {
      latex: {
        type: "string",
        default: "",
      },
    },
  },
  {
    render: (props) => {
      const mathRef = useRef<MathfieldElement & EventTarget>(null);
      const { value, setFalse, setTrue } = useBoolean(true);
      const { theme } = useTheme();
      const mathFieldRef = useClickAway(() => {
        setTrue();
      });
      const divRef = useRef<HTMLDivElement>(null);
      const noLatex = props.block.props.latex.length === 0;

      return (
        <div
          ref={divRef}
          className={cn(
            "w-full flex max-w-full items-center",

            noLatex ? "border-2 " : "",
          )}
          onClickCapture={() => {
            setFalse();
          }}
          onFocusCapture={() => {
            setFalse();
          }}
          onBlurCapture={() => {
            setTrue();
          }}
        >
          <math-field
            className={cn("mx-auto max-w-full w-full light")}
            placeholder="\text{Enter a formula}"
            style={
              {
                "color-scheme": theme === "dark" ? "dark" : "light",
                backgroundColor: "var(--bn-colors-editor-background)",
              } as any
            }
            ref={(el) => {
              if (el === null) {
                return;
              }
              mathRef.current = el;
              mathFieldRef.current = el;
              applyStyle(el);
            }}
            aria-multiline
            virtual-keyboard-mode="onfocus"
            read-only={value}
            onInput={(e) => {
              const value = (e.target as any).value;
              props.editor.updateBlock(props.block, {
                props: { latex: value },
              });
            }}
          >
            {props.block.props.latex}
          </math-field>
        </div>
      );
    },
    // 复制到外部时输出纯文本 LaTeX，确保粘贴板内容包含公式
    toExternalHTML: (props) => {
      return <div>{`\n$$\n${props.block.props.latex}\n$$\n`}</div>;
    },
  },
);

export const schema = BlockNoteSchema.create().extend({
  blockSpecs: {
    // Creates an instance of the Alert block and adds it to the schema.
    math: createMath(),
  },
  inlineContentSpecs: {
    "math-inline": createInline,
  },
});
export const useCreateMathBlockNote = () => useCreateBlockNote({ schema });
export type MathEditor = ReturnType<typeof useCreateMathBlockNote>;
// List containing all default Slash Menu Items, as well as our custom one.

const insertMathLiveItem = (editor: MathEditor) => ({
  title: "Insert Hello World",
  onItemClick: () =>
    insertOrUpdateBlockForSlashMenu(editor, {
      type: "math",
      props: {
        latex: "",
      },
    }),
  aliases: ["math"],
  group: "Math",
  icon: <Highlighter size={18} />,
  subtext: "math",
});
const insertInlineMathLiveItem = (editor: MathEditor) => ({
  title: "Insert Inline math",
  onItemClick: () => {
    editor.insertInlineContent([{ type: "math-inline", props: { latex: "" } }]);
  },
  aliases: ["math"],
  group: "Math",
  icon: <Highlighter size={18} />,
  subtext: "math inline",
});

export const getCustomSlashMenuItems = (
  editor: MathEditor,
): DefaultReactSuggestionItem[] => [
  ...getDefaultReactSlashMenuItems(editor),
  insertMathLiveItem(editor),
  insertInlineMathLiveItem(editor),
];

export const getMathSlashMenuItems = (
  editor: MathEditor,
): DefaultReactSuggestionItem[] => [
  insertMathLiveItem(editor),
  insertInlineMathLiveItem(editor),
];
export const mathFieldExtension = createExtension({
  key: "math-field",
  inputRules: [
    {
      find: /^\$\$\s?$/,
      replace: () => ({
        type: "math",
        props: { latex: "" },
      }),
    },
  ],
});

/**
 * 获取选区文本，包含 math-inline 和 math block 的 LaTeX 内容。
 */
export function getSelectedTextWithMath(editor: MathEditor): string {
  const { state } = editor._tiptapEditor;
  const { from, to } = state.selection;
  if (from === to) return "";

  return state.doc.textBetween(from, to, "\n", (node) => {
    if (node.type.name === "math-inline") {
      return `$${node.attrs.latex}$`;
    }
    if (node.type.name === "math") {
      return `\n$$\n${node.attrs.latex}\n$$\n`;
    }
    return "";
  });
}

/**
 * 获取 block 的文本内容，直接用 ProseMirror textBetween，保留默认行为，只覆盖 math 节点。
 */
export function getBlockTextWithMath(
  editor: MathEditor,
  blockId: string,
): string {
  const { state } = editor._tiptapEditor;

  // 在文档中查找该 block 的 ProseMirror 节点和位置
  let foundPos = -1;
  let foundNode: ReturnType<typeof state.doc.nodeAt> = null;
  state.doc.descendants((node, pos) => {
    if (node.attrs.id === blockId && node.type.isInGroup?.("bnBlock")) {
      foundNode = node;
      foundPos = pos;
      return false;
    }
  });

  if (!foundNode || foundPos < 0) return "";

  const from = foundPos + 1;
  const to = foundPos + foundNode - 1;

  return state.doc
    .textBetween(from, to, "\n", (leafNode) => {
      if (leafNode.type.name === "math-inline") {
        return `$${leafNode.attrs.latex}$`;
      }
      if (leafNode.type.name === "math") {
        return `\n$$\n${leafNode.attrs.latex}\n$$\n`;
      }
      // 其他叶子节点（image 等）返回空跳过
      return "";
    })
    .trim();
}

/**
 * 把多个 block 的内容合并（用 textBetween 逐个处理）。
 */
export function getBlocksTextWithMath(
  editor: MathEditor,
  blockIds: string[],
): string {
  return blockIds
    .map((id) => getBlockTextWithMath(editor, id))
    .filter(Boolean)
    .join("\n");
}
