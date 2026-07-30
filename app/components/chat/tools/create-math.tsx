import {
  BlockNoteSchema,
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

      const mathFieldRef = useClickAway(() => {
        setTrue();
      });
      return (
        <div
          className="inline-flex items-center"
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
            className={cn("w-fit")}
            style={{ display: "inline" }}
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
              const value = (e.target as any).formula;
              props.updateInlineContent({
                props: { latex: value },
                type: "math-inline",
              });
            }}
          >
            $${props.inlineContent.props.latex}$$
          </math-field>
        </div>
      );
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

      const mathFieldRef = useClickAway(() => {
        setTrue();
      });

      return (
        <div
          className="w-full flex max-w-full items-center"
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
            className={cn("mx-auto max-w-full w-full")}
            placeholder="\text{Enter a formula}"
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
              const value = (e.target as any).formula;
              props.editor.updateBlock(props.block, {
                props: { latex: value },
              });
            }}
          >
            $$ {props.block.props.latex} $$
          </math-field>
        </div>
      );
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
