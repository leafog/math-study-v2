import { useMemo, useState } from "react";
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";
import { ToolContainer } from "./tool-container";
import { executeEpsil } from "@cortex-js/compute-engine/epsil";
import { ComputeEngine } from "@cortex-js/compute-engine";
import MathResBlock from "~/components/math/math-res-block";
import { highlightEpsil } from "~/lib/highlight/epsil-highlight";

// 与 tool-invoke-cortex 相同的资源上限,防止卡死主线程
const PRECISION = 20;
const ITERATION_LIMIT = 100_000;
const RECURSION_LIMIT = 1_000;
const MAX_COLLECTION_SIZE = 10_000;
const TIME_LIMIT_MS = 1000;

// 模块级单例,复用词法状态
// (highlighter 与 token 样式由 ~/lib/highlight/epsil-highlight 提供,样式已在 root.tsx 注入一次)

const EpsliPanel = () => {
  const [source, setSource] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [latex, setLatex] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [running, setRunning] = useState(false);

  const engine = useMemo(() => {
    const ce = new ComputeEngine({ precision: PRECISION });
    ce.iterationLimit = ITERATION_LIMIT;
    ce.recursionLimit = RECURSION_LIMIT;
    ce.maxCollectionSize = MAX_COLLECTION_SIZE;
    return ce;
  }, []);

  // 实时高亮预览
  const highlightedHtml = useMemo(() => highlightEpsil(source), [source]);

  const run = () => {
    setRunning(true);
    setError("");
    setLatex("");
    setResult("");
    try {
      // withTimeLimit 要求回调同步,executeEpsil 恰好同步
      const res = engine.withTimeLimit(
        { ms: TIME_LIMIT_MS, label: "epsli-demo" },
        () => executeEpsil(engine, source),
      );
      setResult(res.value.toString());
      setLatex(res.value.latex);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
    }
  };

  return (
    <ToolContainer className="gap-2 p-2">
      {highlightedHtml && (
        <div className="max-h-56 overflow-y-auto rounded-md border">
          <div dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
        </div>
      )}
      <Textarea
        value={source}
        onChange={(e) => setSource(e.target.value)}
        placeholder={"例: Solve(x^2 + x - 6 == 0, x)  或   N(Pi, 20)"}
        rows={6}
      />
      <div>
        <Button onClick={run} disabled={running || !source.trim()}>
          {running ? "运行中..." : "运行"}
        </Button>
      </div>
      {latex && (
        <div className="rounded-md border bg-muted/40 p-3">
          <MathResBlock>{latex}</MathResBlock>
        </div>
      )}
      {result && (
        <pre className="rounded-md border bg-muted/40 p-3 font-mono text-sm whitespace-pre-wrap">
          {result}
        </pre>
      )}
      {error && (
        <pre className="rounded-md border border-red-500/40 bg-red-500/10 p-3 font-mono text-sm text-red-500 whitespace-pre-wrap">
          {error}
        </pre>
      )}
    </ToolContainer>
  );
};

export default EpsliPanel;
