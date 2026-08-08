import { JSXGraph } from "jsxgraph";
import { useEffect, useRef } from "react";
import ExpressionsList from "./expressions-list";

const FunctionGraph = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<ReturnType<typeof JSXGraph.initBoard> | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const board = JSXGraph.initBoard(container, {
      boundingbox: [-10, 10, 10, -10],
      axis: true,
      keepaspectratio: true,
      pan: {
        enabled: true,
        needShift: false,
      },
      zoom: {
        wheel: true,
        needShift: false,
        pinchHorizontal: true,
        pinchVertical: true,
      },
      showCopyright: false,
    });

    boardRef.current = board;
    const a = board.create("slider", [
      [-5, -5],
      [5, -5],
      [-10, 1, 10],
    ]);
    const graph = board.create("functiongraph", [
      (x: number) => a.Value() * x * x,
    ]);

    return () => {
      JSXGraph.freeBoard(board);
      boardRef.current = null;
    };
  }, []);

  return (
    <div className="flex-1 min-h-0 size-full overflow-hidden relative">
      <div className="absolute top-0 right-0 z-50">
        <ExpressionsList />
      </div>
      <div
        ref={containerRef}
        className="border w-full h-full absolute top-0"
      ></div>
    </div>
  );
};

export default FunctionGraph;
