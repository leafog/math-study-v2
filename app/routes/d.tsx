import { useState } from "react";
import { evaluate, simplify, parse } from "@cortex-js/compute-engine";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

const D = () => {
  const [expression, setExpression] = useState("2 + 3 * 4");
  const [result, setResult] = useState<string>("");

  const calculate = () => {
    if (!expression.trim()) {
      setResult("");
      return;
    }
    try {
      const a = String.raw`\mathrm{Expand}((a+b)^5)`;
      const expr = parse(expression);
      setResult(String(expr.evaluate()));
    } catch (e) {
      setResult(`错误：${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md space-y-4 p-6">
      <div className="space-y-2">
        <label htmlFor="expr" className="text-sm font-medium">
          表达式
        </label>
        <Input
          id="expr"
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && calculate()}
          placeholder="例如：2 + 3 * 4、sqrt(9)、2^10"
        />
      </div>

      <Button onClick={calculate}>计算</Button>

      <div className="space-y-2">
        <label className="text-sm font-medium">计算结果</label>
        <div className="rounded-md border border-input bg-muted/50 px-3 py-2 font-mono text-lg">
          {result || "—"}
        </div>
      </div>
    </div>
  );
};

export default D;
