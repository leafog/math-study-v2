import { ComputeEngine, executeCortex } from "@cortex-js/compute-engine/cortex";
import { useEffect } from "react";

const ce = new ComputeEngine();
const D = () => {
  const { value, diagnostics } = executeCortex(ce, "1 + 2");

  useEffect(() => {
    console.log(value, diagnostics);
  }, [value]);
  return <div>123</div>;
};

export default D;
