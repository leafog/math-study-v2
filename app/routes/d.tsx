import { ComputeEngine, executeCortex } from "@cortex-js/compute-engine/cortex";
import { useEffect } from "react";
import { MathfieldElement } from "mathlive";

const ce = new ComputeEngine();
const D = () => {
  const { value, diagnostics } = executeCortex(ce, "1 + 2");

  useEffect(() => {
    console.log(value, diagnostics);
  }, [value]);
  return (
    <div className="w-full">
      <math-field read-only={true}>e=m^2c</math-field>
      <div className="pt-20"> 123</div>
    </div>
  );
};

export default D;
