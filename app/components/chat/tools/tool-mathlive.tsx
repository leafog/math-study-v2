import { useRef, useEffect, useState } from "react";

import { Pi } from "lucide-react";
import { MathfieldElement } from "mathlive";
import type { ToolDefinition, ToolPanelProps } from "./types";

declare global {
  namespace React.JSX {
    interface IntrinsicElements {
      "math-field": React.DetailedHTMLProps<
        React.HTMLAttributes<MathfieldElement> & {
          ref?: React.Ref<MathfieldElement>;
          "virtual-keyboard-mode"?: "manual" | "auto" | "onfocus";
          "fonts-directory"?: string;
          class?: string;
          placeholder?: string;
        },
        MathfieldElement
      >;
    }
  }
}

MathfieldElement.fontsDirectory = "/fonts";

const Panel = ({}: ToolPanelProps) => {
  const mfRef = useRef<MathfieldElement>(null);
  const keyboardRef = useRef<HTMLDivElement>(null);

  const [latex, setLatex] = useState("");

  useEffect(() => {
    const el = mfRef.current;
    const container = keyboardRef.current;

    if (!el || !container) return;

    window.mathVirtualKeyboard.container = container;

    const handler = () => {
      setLatex(el.value ?? "");
    };

    el.addEventListener("input", handler);

    return () => {
      el.removeEventListener("input", handler);
    };
  }, []);

  return (
    <div ref={keyboardRef} className="size-full flex flex-col overflow-hidden">
      <div className="p-2 border">
        <div className="my-10">
          <math-field
            ref={mfRef}
            class="w-full min-h-20"
            virtual-keyboard-mode="manual"
            fonts-directory="/fonts"
          />
        </div>

        {latex && (
          <div className="shrink-0 border-t px-3 py-2 text-xs text-muted-foreground font-mono overflow-x-auto">
            {latex}
          </div>
        )}
      </div>
    </div>
  );
};

const mathliveTool: ToolDefinition = {
  kind: "mathlive",
  Icon: Pi,
  Panel,
};

export default mathliveTool;
