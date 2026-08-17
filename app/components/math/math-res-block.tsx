import { normalizeMathDelimiters } from "~/lib/utils";
import MathRes, { type MathResProps } from "./math-res";

const MathResBlock = ({ children, ...props }: MathResProps) => {
  return <MathRes {...props}>{normalizeMathDelimiters(children)}</MathRes>;
};

export default MathResBlock;
