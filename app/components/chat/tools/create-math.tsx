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

declare global {
  namespace React.JSX {
    interface IntrinsicElements {
      "math-field": React.DetailedHTMLProps<
        React.HTMLAttributes<MathfieldElement> & {
          ref?: React.Ref<MathfieldElement>;
          "virtual-keyboard-mode"?: "manual" | "auto" | "onfocus";
          "fonts-directory"?: string;
          class?: string;
        },
        MathfieldElement
      >;
    }
  }
}

MathfieldElement.fontsDirectory = "/fonts";
const MathLiveInline = () => {};
export const creata = createReactInlineContentSpec(
  {
    type: "math-inline",
    content: "none",
    propSchema: {
      latex: { type: "string", default: "" },
    },
  },
  {
    render: (props) => {
      const mathRef = useRef<MathfieldElement>(null);
      useEffect(() => {
        mathRef.current?.focus();
      }, []);

      return (
        <div>
          <math-field
            className="w-fit inline-block dark"
            ref={mathRef}
            onInput={(e) => {
              const value = (e.target as any).value;
              props.updateInlineContent({
                type: "math-inline",
                props: {
                  latex: value,
                },
              });
            }}
          >
            {props.inlineContent.props.latex}
          </math-field>
          <div className="hidden" ref={props.contentRef}></div>
        </div>
      );
    },
  },
);
export const createMath = createReactBlockSpec(
  {
    type: "math",
    content: "inline",
    propSchema: {
      latex: {
        type: "string",
        default: "",
      },
    },
  },
  {
    render: (props) => {
      const mathRef = useRef<MathfieldElement>(null);

      useEffect(() => {
        mathRef.current?.focus();
      }, []);

      return (
        <div className="w-full">
          <math-field
            className="w-full inline-block"
            ref={mathRef}
            onInput={(e) => {
              const value = (e.target as any).value;
              props.editor.updateBlock(props.block, {
                type: "math",
                props: {
                  latex: value,
                },
              });
            }}
          >
            {props.block.props.latex}
          </math-field>
          <div className="hidden" ref={props.contentRef}></div>
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

export const getCustomSlashMenuItems = (
  editor: MathEditor,
): DefaultReactSuggestionItem[] => [
  ...getDefaultReactSlashMenuItems(editor),
  insertMathLiveItem(editor),
];
