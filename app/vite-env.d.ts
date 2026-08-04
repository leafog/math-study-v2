/// <reference types="vite/client" />
/// <reference types="react" />

declare module "*?worker&format=es" {
  const WorkerFactory: new () => Worker;
  export default WorkerFactory;
}

declare module "*?worker" {
  const WorkerFactory: new () => Worker;
  export default WorkerFactory;
}

import type { MathfieldElement } from "mathlive";
import type * as React from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "math-field": React.DetailedHTMLProps<
        React.HTMLAttributes<MathfieldElement> & {
          ref?: React.Ref<MathfieldElement>;
          "virtual-keyboard-mode"?: "manual" | "auto" | "onfocus";
          placeholder?: string;
          "read-only"?: boolean;
        },
        MathfieldElement
      >;
    }
  }
}
